import { Upload, File, Image, Video } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (files: File[]) => void;
  accept?: string;
  maxFiles?: number;
  className?: string;
}

// Main file upload component (no external dependencies)
export function FileUpload({ onFileUpload, accept, maxFiles = 10, className = "" }: FileUploadProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      onFileUpload(filesArray.slice(0, maxFiles));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files) {
      const filesArray = Array.from(files);
      onFileUpload(filesArray.slice(0, maxFiles));
    }
  };

  const getIcon = () => {
    if (accept?.includes('image')) return <Image className="h-8 w-8" />;
    if (accept?.includes('video')) return <Video className="h-8 w-8" />;
    return <File className="h-8 w-8" />;
  };

  return (
    <div
      className={`border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-primary/5 ${className}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="space-y-4">
        <div className="flex justify-center text-muted-foreground">
          <Upload className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <p className="text-foreground font-medium">
            Drag & drop files here, or click to select
          </p>
          <p className="text-sm text-muted-foreground">
            {accept ? `Accepts: ${accept}` : 'All file types accepted'}
          </p>
          <p className="text-xs text-muted-foreground">
            Max {maxFiles} files
          </p>
          <input
            type="file"
            onChange={handleFileChange}
            accept={accept}
            multiple
            className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}

// Keep the SimpleFileUpload as an alias for backward compatibility
export function SimpleFileUpload({ onFileUpload, accept, className = "" }: FileUploadProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFileUpload(Array.from(e.target.files));
    }
  };

  return (
    <div className={`border-2 border-dashed border-border rounded-lg p-8 text-center ${className}`}>
      <div className="space-y-4">
        <div className="flex justify-center text-muted-foreground">
          <Upload className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <p className="text-foreground font-medium">Upload files</p>
          <input
            type="file"
            onChange={handleFileChange}
            accept={accept}
            multiple
            className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />
        </div>
      </div>
    </div>
  );
}