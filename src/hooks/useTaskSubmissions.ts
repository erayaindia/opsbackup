import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';
import { uploadTaskEvidence, uploadTaskPhoto, validateTaskFile } from '@/lib/taskFileUpload';
import {
  TaskSubmission,
  TaskSubmissionInsert,
  TaskWithDetails,
  EvidenceTypeValue,
  SubmissionTypeValue,
  TaskStatus,
  ChecklistItem,
} from '@/types/tasks';

export interface SubmissionData {
  type: SubmissionTypeValue;
  evidenceType?: EvidenceTypeValue;
  file?: File;
  url?: string;
  notes?: string;
  checklist?: ChecklistItem[];
}

export function useTaskSubmissions() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { profile } = useUserProfile();

  const submitTaskEvidence = useCallback(async (
    task: TaskWithDetails,
    submissionData: SubmissionData
  ): Promise<TaskSubmission | null> => {
    if (!profile?.appUser?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return null;
    }

    try {
      setLoading(true);

      let fileUrl: string | null = null;
      let filePath: string | null = null;
      let fileName: string | null = null;
      let fileSize: number | null = null;

      // Handle file upload if provided
      if (submissionData.file && submissionData.evidenceType) {
        // Validate file
        const validationError = validateTaskFile(submissionData.file, submissionData.evidenceType);
        if (validationError) {
          throw new Error(validationError);
        }

        try {
          // Upload file
          const uploadResult = submissionData.evidenceType === 'photo'
            ? await uploadTaskPhoto(submissionData.file, task.id)
            : await uploadTaskEvidence(submissionData.file, task.id);

          fileUrl = uploadResult.url;
          filePath = uploadResult.path;
          fileName = uploadResult.name;
          fileSize = uploadResult.size;
        } catch (uploadError) {
          console.error('File upload failed:', uploadError);

          // Try to provide more specific error information
          let errorMessage = 'Unknown upload error';
          if (uploadError instanceof Error) {
            if (uploadError.message.includes('row-level security') || uploadError.message.includes('RLS')) {
              errorMessage = 'Storage permissions need to be configured. Please run the latest database migration.';
            } else if (uploadError.message.includes('bucket')) {
              errorMessage = 'Storage bucket configuration issue. Please check task-evidence bucket settings.';
            } else {
              errorMessage = uploadError.message;
            }
          }

          // Don't create submission record without file data - throw error instead
          throw new Error(`File upload failed: ${errorMessage}`);
        }
      }

      // Create submission record
      const submissionInsert: TaskSubmissionInsert = {
        task_id: task.id,
        submission_type: submissionData.type,
        evidence_type: submissionData.evidenceType || null,
        file_url: fileUrl,
        file_path: filePath,
        file_name: fileName,
        file_size: fileSize,
        link_url: submissionData.url || null,
        notes: submissionData.notes || null,
        checklist_data: submissionData.checklist ? JSON.stringify(submissionData.checklist) : null,
        submitted_by: profile.appUser.id,
      };

      const { data: submission, error: submissionError } = await supabase
        .from('task_submissions')
        .insert(submissionInsert)
        .select()
        .single();

      if (submissionError) {
        throw new Error(submissionError.message);
      }

      // Update task status based on submission type and settings
      let newStatus: string = task.status;

      if (submissionData.type === 'completion') {
        // Check if this is a daily task that can be auto-approved
        if (task.task_type === 'daily') {
          // Get task settings to check auto-approval rules
          const { data: settings } = await supabase
            .from('task_settings')
            .select('auto_approve_daily, auto_approve_cutoff_hours')
            .or(`setting_type.eq.global,and(setting_type.eq.user,target_id.eq.${profile.appUser.id})`)
            .order('setting_type', { ascending: false }) // User settings take precedence
            .limit(1)
            .single();

          const shouldAutoApprove = settings?.auto_approve_daily !== false;
          const cutoffHours = settings?.auto_approve_cutoff_hours || 2;

          // Check if task is within auto-approval time window
          const now = new Date();
          const dueDateTime = new Date(`${task.due_date}T${task.due_time || '23:59'}`);
          const hoursLate = (now.getTime() - dueDateTime.getTime()) / (1000 * 60 * 60);

          if (shouldAutoApprove && hoursLate <= cutoffHours) {
            newStatus = TaskStatus.DONE_AUTO_APPROVED;
          } else {
            newStatus = TaskStatus.SUBMITTED_FOR_REVIEW;
          }
        } else {
          // One-off tasks always need review
          newStatus = TaskStatus.SUBMITTED_FOR_REVIEW;
        }
      }

      // Update task status if needed
      if (newStatus !== task.status) {
        const { error: updateError } = await supabase
          .from('tasks')
          .update({
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', task.id);

        if (updateError) {
          console.error('Error updating task status:', updateError);
          // Don't throw here, submission was successful
        }
      }

      toast({
        title: "Success",
        description: newStatus === TaskStatus.DONE_AUTO_APPROVED
          ? "Task completed and auto-approved!"
          : "Evidence submitted successfully",
      });

      return submission;
    } catch (error) {
      console.error('Error submitting task evidence:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit evidence",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [profile, toast]);

  const startTask = useCallback(async (taskId: string): Promise<boolean> => {
    if (!profile?.appUser?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('tasks')
        .update({
          status: TaskStatus.IN_PROGRESS,
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('assigned_to', profile.appUser.id); // Only allow user to start their own tasks

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Success",
        description: "Task started successfully",
      });

      return true;
    } catch (error) {
      console.error('Error starting task:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start task",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [profile, toast]);

  const addTaskNote = useCallback(async (taskId: string, notes: string): Promise<boolean> => {
    if (!profile?.appUser?.id || !notes.trim()) {
      return false;
    }

    try {
      setLoading(true);

      const submissionInsert: TaskSubmissionInsert = {
        task_id: taskId,
        submission_type: 'note',
        notes: notes.trim(),
        submitted_by: profile.appUser.id,
      };

      const { error } = await supabase
        .from('task_submissions')
        .insert(submissionInsert);

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Success",
        description: "Note added successfully",
      });

      return true;
    } catch (error) {
      console.error('Error adding task note:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add note",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [profile, toast]);

  const deleteTaskSubmission = useCallback(async (
    submissionId: string,
    filePath?: string | null
  ): Promise<boolean> => {
    if (!profile?.appUser?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);

      console.log('Deleting submission:', submissionId, 'File path:', filePath);

      // First, get the submission to verify it exists (any authenticated user can delete)
      const { data: submission, error: fetchError } = await supabase
        .from('task_submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (fetchError) {
        console.error('Error fetching submission:', fetchError);
        console.log('Proceeding with deletion anyway (RLS policies may be blocking fetch)');
        // Don't throw error - try to delete anyway since RLS policies may be blocking the fetch
      }

      if (!submission && !fetchError) {
        throw new Error('Submission not found');
      }

      // Delete file from storage if it exists
      if (filePath) {
        console.log('Deleting file from storage:', filePath);
        const { error: storageError } = await supabase.storage
          .from('task-evidence')
          .remove([filePath]);

        if (storageError) {
          console.error('Error deleting file from storage:', storageError);
          // Continue with database deletion even if storage fails
        } else {
          console.log('File deleted from storage successfully');
        }
      }

      // Delete submission record directly (any authenticated user can delete)
      console.log('🗑️ Deleting submission directly:', submissionId);

      const { data: deletedData, error: deleteError } = await supabase
        .from('task_submissions')
        .delete()
        .eq('id', submissionId)
        .select();

      if (deleteError) {
        console.error('Error deleting from database:', deleteError);
        throw new Error(deleteError.message);
      }

      if (!deletedData || deletedData.length === 0) {
        console.error('No records were deleted');
        throw new Error('Failed to delete submission - no records affected');
      }

      console.log('Submission deleted successfully:', deletedData);

      toast({
        title: "Success",
        description: "Evidence deleted successfully",
      });

      return true;
    } catch (error) {
      console.error('Error deleting task submission:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete evidence",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [profile, toast]);

  return {
    loading,
    submitTaskEvidence,
    startTask,
    addTaskNote,
    deleteTaskSubmission,
  };
}