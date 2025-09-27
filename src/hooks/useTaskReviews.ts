import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  TaskReview,
  TaskReviewInsert,
  TaskWithDetails,
  ReviewStatusValue,
  TaskStatus,
} from '@/types/tasks';

export function useTaskReviews() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { profile } = useUserProfile();

  const submitReview = useCallback(async (
    task: TaskWithDetails,
    status: ReviewStatusValue,
    notes?: string
  ): Promise<TaskReview | null> => {
    if (!profile?.appUser?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return null;
    }

    // Check if user is authorized to review this task
    if (task.reviewer_id && task.reviewer_id !== profile.appUser.id) {
      toast({
        title: "Error",
        description: "You are not authorized to review this task",
        variant: "destructive",
      });
      return null;
    }

    try {
      setLoading(true);

      // Create review record
      const reviewInsert: TaskReviewInsert = {
        task_id: task.id,
        reviewer_id: profile.appUser.id,
        status,
        review_notes: notes || null,
      };

      const { data: review, error: reviewError } = await supabase
        .from('task_reviews')
        .insert(reviewInsert)
        .select()
        .single();

      if (reviewError) {
        throw new Error(reviewError.message);
      }

      // Update task status based on review
      const newTaskStatus = status === 'approved' ? TaskStatus.APPROVED : TaskStatus.INCOMPLETE;

      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          status: newTaskStatus,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (updateError) {
        console.error('Error updating task status:', updateError);
        // Don't throw here, review was successful
      }

      toast({
        title: "Success",
        description: `Task ${status} successfully`,
      });

      return review;
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit review",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [profile, toast]);

  const bulkReview = useCallback(async (
    taskIds: string[],
    status: ReviewStatusValue,
    notes?: string
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

      // Create review records for all tasks
      const reviewInserts: TaskReviewInsert[] = taskIds.map(taskId => ({
        task_id: taskId,
        reviewer_id: profile.appUser.id,
        status,
        review_notes: notes || null,
      }));

      const { error: reviewError } = await supabase
        .from('task_reviews')
        .insert(reviewInserts);

      if (reviewError) {
        throw new Error(reviewError.message);
      }

      // Update all task statuses
      const newTaskStatus = status === 'approved' ? TaskStatus.APPROVED : TaskStatus.INCOMPLETE;
      const timestamp = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          status: newTaskStatus,
          reviewed_at: timestamp,
          updated_at: timestamp
        })
        .in('id', taskIds);

      if (updateError) {
        console.error('Error updating task statuses:', updateError);
        // Don't throw here, reviews were successful
      }

      toast({
        title: "Success",
        description: `${taskIds.length} tasks ${status} successfully`,
      });

      return true;
    } catch (error) {
      console.error('Error submitting bulk review:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit bulk review",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [profile, toast]);

  const requestReview = useCallback(async (taskId: string): Promise<boolean> => {
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
          status: TaskStatus.SUBMITTED_FOR_REVIEW,
          submitted_for_review_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('assigned_to', profile.appUser.id); // Only allow user to submit their own tasks

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Success",
        description: "Task submitted for review",
      });

      return true;
    } catch (error) {
      console.error('Error requesting review:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit for review",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [profile, toast]);

  const getReviewStats = useCallback(async (reviewerId?: string) => {
    try {
      const userId = reviewerId || profile?.appUser?.id;
      if (!userId) return null;

      // Get review statistics
      const { data, error } = await supabase
        .from('task_reviews')
        .select(`
          status,
          reviewed_at,
          task:tasks(
            task_type,
            priority,
            assigned_user:app_users!tasks_assigned_to_fkey(full_name, department)
          )
        `)
        .eq('reviewer_id', userId)
        .gte('reviewed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      if (error) {
        throw new Error(error.message);
      }

      const stats = {
        total: data.length,
        approved: data.filter(r => r.status === 'approved').length,
        rejected: data.filter(r => r.status === 'rejected').length,
        approvalRate: data.length > 0 ? (data.filter(r => r.status === 'approved').length / data.length) * 100 : 0,
        dailyTasks: data.filter(r => r.task?.task_type === 'daily').length,
        oneOffTasks: data.filter(r => r.task?.task_type === 'one-off').length,
      };

      return stats;
    } catch (error) {
      console.error('Error getting review stats:', error);
      return null;
    }
  }, [profile]);

  return {
    loading,
    submitReview,
    bulkReview,
    requestReview,
    getReviewStats,
  };
}