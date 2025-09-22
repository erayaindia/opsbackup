import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import {
  Camera,
  Upload,
  FileText,
  Link,
  X,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  EvidenceTypeValue,
  EvidenceType,
  ChecklistItem,
  EvidenceUpload,
} from '@/types/tasks';
import {
  uploadTaskEvidence,
  uploadTaskPhoto,
  validateTaskFile,
  getFileIcon,
  formatFileSize,
} from '@/lib/taskFileUpload';

interface EvidenceUploaderProps {
  evidenceType: EvidenceTypeValue;
  taskId: string;
  required?: boolean;
  onUpload: (evidence: EvidenceUpload) => void;
  onRemove?: () => void;
  existingEvidence?: EvidenceUpload | null;
  className?: string;
}

export function EvidenceUploader({
  evidenceType,
  taskId,
  required = false,
  onUpload,
  onRemove,
  existingEvidence,
  className = '',
}: EvidenceUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [linkUrl, setLinkUrl] = useState(existingEvidence?.url || '');
  const [notes, setNotes] = useState(existingEvidence?.notes || '');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    existingEvidence?.checklist || []
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = useCallback(
    async (file: File) => {
      const validationError = validateTaskFile(file, evidenceType);
      if (validationError) {
        toast({
          title: 'Invalid File',
          description: validationError,
          variant: 'destructive',
        });
        return;
      }

      try {
        setUploading(true);
        setUploadProgress(0);

        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 100);

        const result = evidenceType === EvidenceType.PHOTO
          ? await uploadTaskPhoto(file, taskId)
          : await uploadTaskEvidence(file, taskId);

        clearInterval(progressInterval);
        setUploadProgress(100);

        const evidence: EvidenceUpload = {
          type: evidenceType,
          file,
          url: result.url,
          notes: notes,
        };

        onUpload(evidence);

        toast({
          title: 'Success',
          description: 'Evidence uploaded successfully',
        });
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: 'Upload Failed',
          description: error instanceof Error ? error.message : 'Failed to upload evidence',
          variant: 'destructive',
        });
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [evidenceType, taskId, notes, onUpload, toast]
  );

  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleLinkSubmit = useCallback(() => {
    if (!linkUrl.trim()) {
      toast({
        title: 'Invalid Link',
        description: 'Please enter a valid URL',
        variant: 'destructive',
      });
      return;
    }

    try {
      new URL(linkUrl);
    } catch {
      toast({
        title: 'Invalid Link',
        description: 'Please enter a valid URL',
        variant: 'destructive',
      });
      return;
    }

    const evidence: EvidenceUpload = {
      type: EvidenceType.LINK,
      url: linkUrl,
      notes: notes,
    };

    onUpload(evidence);
  }, [linkUrl, notes, onUpload, toast]);

  const handleChecklistUpdate = useCallback(
    (updatedChecklist: ChecklistItem[]) => {
      setChecklist(updatedChecklist);

      const evidence: EvidenceUpload = {
        type: EvidenceType.CHECKLIST,
        checklist: updatedChecklist,
        notes: notes,
      };

      onUpload(evidence);
    },
    [notes, onUpload]
  );

  const addChecklistItem = useCallback(() => {
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text: '',
      completed: false,
      required: false,
    };
    handleChecklistUpdate([...checklist, newItem]);
  }, [checklist, handleChecklistUpdate]);

  const updateChecklistItem = useCallback(
    (id: string, updates: Partial<ChecklistItem>) => {
      const updated = checklist.map(item =>
        item.id === id ? { ...item, ...updates } : item
      );
      handleChecklistUpdate(updated);
    },
    [checklist, handleChecklistUpdate]
  );

  const removeChecklistItem = useCallback(
    (id: string) => {
      const updated = checklist.filter(item => item.id !== id);
      handleChecklistUpdate(updated);
    },
    [checklist, handleChecklistUpdate]
  );

  if (evidenceType === EvidenceType.NONE) {
    return null;
  }

  const renderUploadUI = () => {
    switch (evidenceType) {
      case EvidenceType.PHOTO:
        return (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => cameraInputRef.current?.click()}
                disabled={uploading}
                className="flex-1"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4 mr-2" />
                )}
                Take Photo
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex-1"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Upload Image
              </Button>
            </div>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        );

      case EvidenceType.FILE:
        return (
          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Upload File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        );

      case EvidenceType.LINK:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="link-url">Link URL</Label>
              <Input
                id="link-url"
                type="url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </div>
            <Button
              type="button"
              onClick={handleLinkSubmit}
              disabled={!linkUrl.trim()}
              className="w-full"
            >
              <Link className="h-4 w-4 mr-2" />
              Add Link
            </Button>
          </div>
        );

      case EvidenceType.CHECKLIST:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              {checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-2 p-2 border rounded">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={(e) =>
                      updateChecklistItem(item.id, { completed: e.target.checked })
                    }
                    className="rounded"
                  />
                  <Input
                    value={item.text}
                    onChange={(e) =>
                      updateChecklistItem(item.id, { text: e.target.value })
                    }
                    placeholder="Checklist item..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeChecklistItem(item.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={addChecklistItem}
              className="w-full"
            >
              Add Item
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  const renderExistingEvidence = () => {
    if (!existingEvidence) return null;

    return (
      <div className="p-3 border rounded-lg bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Evidence uploaded</span>
          </div>
          {onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {existingEvidence.file && (
          <div className="mt-2 text-sm text-muted-foreground">
            {getFileIcon(existingEvidence.file.name)} {existingEvidence.file.name}
            <span className="ml-1">({formatFileSize(existingEvidence.file.size)})</span>
          </div>
        )}

        {existingEvidence.url && evidenceType === EvidenceType.LINK && (
          <div className="mt-2">
            <a
              href={existingEvidence.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              {existingEvidence.url}
            </a>
          </div>
        )}

        {existingEvidence.checklist && (
          <div className="mt-2 space-y-1">
            {existingEvidence.checklist.map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                {item.completed ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <div className="h-3 w-3 border rounded-sm" />
                )}
                <span className={item.completed ? 'line-through text-muted-foreground' : ''}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">
          Evidence {required && <span className="text-red-500">*</span>}
        </Label>
        {required && (
          <span className="text-xs text-muted-foreground">Required</span>
        )}
      </div>

      {existingEvidence ? renderExistingEvidence() : renderUploadUI()}

      {uploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="w-full" />
          <p className="text-sm text-muted-foreground text-center">
            Uploading... {uploadProgress}%
          </p>
        </div>
      )}

      <div>
        <Label htmlFor="evidence-notes" className="text-sm">
          Notes (optional)
        </Label>
        <Textarea
          id="evidence-notes"
          placeholder="Add any additional notes about the evidence..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
}