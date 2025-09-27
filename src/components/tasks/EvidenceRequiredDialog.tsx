import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Upload } from 'lucide-react';
import { EvidenceUploader } from './EvidenceUploader';
import { EvidenceTypeValue, EvidenceUpload, TaskWithDetails } from '@/types/tasks';
import { getEvidenceTypeName } from '@/lib/evidenceValidation';
import { useTaskSubmissions } from '@/hooks/useTaskSubmissions';
import { useToast } from '@/components/ui/use-toast';

interface EvidenceRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskWithDetails;
  onEvidenceUploaded: () => void;
  onProceedWithoutEvidence?: () => void;
  allowProceedWithoutEvidence?: boolean;
}

export function EvidenceRequiredDialog({
  open,
  onOpenChange,
  task,
  onEvidenceUploaded,
  onProceedWithoutEvidence,
  allowProceedWithoutEvidence = false,
}: EvidenceRequiredDialogProps) {
  const [evidenceUpload, setEvidenceUpload] = useState<EvidenceUpload | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { submitTaskEvidence, loading } = useTaskSubmissions();
  const { toast } = useToast();

  const handleEvidenceUpload = (evidence: EvidenceUpload) => {
    setEvidenceUpload(evidence);
    setIsUploading(false);
  };

  const handleSubmitWithEvidence = async () => {
    if (!evidenceUpload) return;

    try {
      setIsUploading(true);

      // Convert EvidenceUpload to SubmissionData format
      const submissionData = {
        type: 'evidence' as const,
        evidenceType: evidenceUpload.type,
        file: evidenceUpload.file,
        url: evidenceUpload.url,
        notes: evidenceUpload.notes || '',
        checklist: evidenceUpload.checklist,
      };

      console.log('🔄 Submitting evidence from modal:', submissionData);

      const success = await submitTaskEvidence(task, submissionData);

      if (success) {
        toast({
          title: "Evidence uploaded",
          description: "Task evidence has been uploaded successfully",
        });
        onEvidenceUploaded();
        onOpenChange(false);
        setEvidenceUpload(null);
      }
    } catch (error) {
      console.error('Error uploading evidence from modal:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload evidence",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleProceedWithout = () => {
    if (onProceedWithoutEvidence) {
      onProceedWithoutEvidence();
      onOpenChange(false);
    }
  };

  const evidenceTypeName = getEvidenceTypeName(task.evidence_required);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Evidence Required
          </DialogTitle>
          <DialogDescription>
            This task requires evidence to be uploaded before it can be completed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Upload className="h-4 w-4" />
            <AlertTitle>Upload Required</AlertTitle>
            <AlertDescription>
              &quot;{task.title}&quot; requires <strong>{evidenceTypeName}</strong> evidence before submission.
            </AlertDescription>
          </Alert>

          <div className="border rounded-lg p-4">
            <EvidenceUploader
              evidenceType={task.evidence_required}
              taskId={task.id}
              required={true}
              onUpload={handleEvidenceUpload}
              existingEvidence={evidenceUpload}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>

          {allowProceedWithoutEvidence && (
            <Button
              variant="destructive"
              onClick={handleProceedWithout}
              className="w-full sm:w-auto"
            >
              Proceed Without Evidence
            </Button>
          )}

          <Button
            onClick={handleSubmitWithEvidence}
            disabled={!evidenceUpload || isUploading || loading}
            className="w-full sm:w-auto"
          >
            {isUploading || loading ? 'Uploading...' : 'Submit with Evidence'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}