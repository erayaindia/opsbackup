import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { RawFilesService } from "@/services/rawFilesService";
import { UploadProgress, RawFile } from "@/types/rawFiles";
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface RawFilesUploaderProps {
  contentId: string;
  onFilesUploaded: (files: RawFile[]) => void;
  disabled?: boolean;
}

export function RawFilesUploader({ 
  contentId, 
  onFilesUploaded,
  disabled = false 
}: RawFilesUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [disabled, contentId]);

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFiles(files);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Process selected files
  const handleFiles = useCallback(async (files: File[]) => {
    console.log('📁 Processing files:', files.map(f => f.name));

    // Validate files
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    for (const file of files) {
      const validation = RawFilesService.validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        invalidFiles.push(`${file.name}: ${validation.error}`);
      }
    }

    // Show errors for invalid files
    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid Files",
        description: invalidFiles.join('\n'),
        variant: "destructive"
      });
    }

    if (validFiles.length === 0) return;

    // Initialize upload queue
    const initialQueue: UploadProgress[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }));

    setUploadQueue(initialQueue);
    setIsUploading(true);

    // Upload files one by one
    const uploadedFiles: RawFile[] = [];
    
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      
      try {
        console.log(`⬆️ Uploading file ${i + 1}/${validFiles.length}: ${file.name}`);
        
        // Update progress to show starting
        setUploadQueue(prev => prev.map((item, index) => 
          index === i ? { ...item, progress: 10 } : item
        ));

        // Upload the file
        const uploadedFile = await RawFilesService.uploadRawFile(file, contentId);
        
        // Update progress to complete
        setUploadQueue(prev => prev.map((item, index) => 
          index === i ? { 
            ...item, 
            progress: 100, 
            status: 'success',
            id: uploadedFile.id 
          } : item
        ));

        uploadedFiles.push(uploadedFile);
        console.log(`✅ File uploaded successfully: ${file.name}`);

      } catch (error) {
        console.error(`❌ Upload failed for ${file.name}:`, error);
        
        // Update progress to show error
        setUploadQueue(prev => prev.map((item, index) => 
          index === i ? { 
            ...item, 
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed'
          } : item
        ));

        toast({
          title: "Upload Failed",
          description: `Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive"
        });
      }
    }

    setIsUploading(false);

    // Notify parent of successful uploads
    if (uploadedFiles.length > 0) {
      onFilesUploaded(uploadedFiles);
      toast({
        title: "Upload Complete",
        description: `Successfully uploaded ${uploadedFiles.length} file(s)`,
      });
    }

    // Clear queue after a delay
    setTimeout(() => {
      setUploadQueue([]);
    }, 3000);

  }, [contentId, onFilesUploaded, toast]);

  // Remove item from upload queue
  const removeFromQueue = (index: number) => {
    setUploadQueue(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${isDragging 
            ? 'border-primary bg-primary/5 scale-[1.02]' 
            : 'border-muted-foreground/25 hover:border-primary/50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-muted/5'}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className={`p-4 rounded-full ${isDragging ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            <Upload className="h-8 w-8" />
          </div>
          
          <div className="space-y-2">
            <p className="text-lg font-medium">
              {isDragging ? 'Drop files here' : 'Upload Raw Files'}
            </p>
            <p className="text-sm text-muted-foreground">
              Drag & drop files here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supports: Videos (MP4, MOV, AVI) and Images (JPG, PNG, WEBP, GIF)
              <br />
              Maximum file size: 500MB
            </p>
          </div>

          <Button 
            variant="outline" 
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            Select Files
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="video/*,image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* Upload Progress */}
      {uploadQueue.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm">
            Upload Progress ({uploadQueue.filter(u => u.status === 'success').length}/{uploadQueue.length})
          </h4>
          
          {uploadQueue.map((upload, index) => (
            <div 
              key={index}
              className="flex items-center space-x-3 p-3 border rounded-lg bg-card"
            >
              {/* File Icon & Status */}
              <div className="flex-shrink-0">
                {upload.status === 'uploading' && (
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                )}
                {upload.status === 'success' && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {upload.status === 'error' && (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {upload.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(upload.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                
                {/* Progress Bar */}
                {upload.status === 'uploading' && (
                  <Progress value={upload.progress} className="h-1.5 mt-1" />
                )}
                
                {/* Error Message */}
                {upload.status === 'error' && upload.error && (
                  <p className="text-xs text-red-500 mt-1">
                    {upload.error}
                  </p>
                )}
              </div>

              {/* Remove Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFromQueue(index)}
                className="flex-shrink-0 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Summary */}
      {isUploading && (
        <div className="flex items-center justify-center space-x-2 p-4 bg-muted/50 rounded-lg">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">Uploading files...</span>
        </div>
      )}
    </div>
  );
}