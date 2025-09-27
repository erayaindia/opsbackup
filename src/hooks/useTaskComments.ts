import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  content: string;
  parent_comment_id: string | null;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    full_name: string;
    role: string;
  };
  replies?: TaskComment[];
}

interface CommentCounts {
  [taskId: string]: number;
}

interface UseTaskCommentsResult {
  comments: TaskComment[];
  commentCounts: CommentCounts;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getCommentCount: (taskId: string) => number;
}

export const useTaskComments = (taskIds?: string[]): UseTaskCommentsResult => {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [commentCounts, setCommentCounts] = useState<CommentCounts>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCommentCounts = useCallback(async () => {
    if (!taskIds || taskIds.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      // Get comment counts for all tasks
      const { data, error: countError } = await supabase
        .from('task_comments')
        .select('task_id')
        .in('task_id', taskIds);

      if (countError) {
        throw countError;
      }

      // Count comments per task
      const counts: CommentCounts = {};
      taskIds.forEach(taskId => {
        counts[taskId] = 0;
      });

      data?.forEach(comment => {
        counts[comment.task_id] = (counts[comment.task_id] || 0) + 1;
      });

      setCommentCounts(counts);
    } catch (err) {
      console.error('Error fetching comment counts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch comment counts');
    } finally {
      setLoading(false);
    }
  }, [taskIds]);

  const fetchComments = useCallback(async (taskId: string) => {
    if (!taskId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('task_comments')
        .select(`
          id,
          task_id,
          author_id,
          content,
          parent_comment_id,
          is_edited,
          created_at,
          updated_at,
          author:app_users!task_comments_author_id_fkey(
            id,
            full_name,
            role
          )
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      // Organize comments into threads
      const parentComments = data?.filter(comment => !comment.parent_comment_id) || [];
      const replies = data?.filter(comment => comment.parent_comment_id) || [];

      const threaded = parentComments.map(parent => ({
        ...parent,
        replies: replies.filter(reply => reply.parent_comment_id === parent.id)
      }));

      setComments(threaded);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    if (taskIds && taskIds.length > 0) {
      await fetchCommentCounts();
    }
  }, [fetchCommentCounts]);

  const getCommentCount = useCallback((taskId: string): number => {
    return commentCounts[taskId] || 0;
  }, [commentCounts]);

  useEffect(() => {
    fetchCommentCounts();
  }, [fetchCommentCounts]);

  // Set up real-time subscription for comment count updates
  useEffect(() => {
    if (!taskIds || taskIds.length === 0) return;

    const setupRealtimeSubscription = async () => {
      const subscription = supabase
        .channel('task_comments_count_updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'task_comments',
          },
          (payload) => {
            // Only refetch if the comment is for one of our tracked tasks
            if (payload.new?.task_id && taskIds.includes(payload.new.task_id)) {
              fetchCommentCounts();
            } else if (payload.old?.task_id && taskIds.includes(payload.old.task_id)) {
              fetchCommentCounts();
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    };

    const unsubscribe = setupRealtimeSubscription();

    return () => {
      unsubscribe.then(fn => fn && fn());
    };
  }, [taskIds, fetchCommentCounts]);

  return {
    comments,
    commentCounts,
    loading,
    error,
    refetch,
    getCommentCount,
  };
};

// Hook for single task comments (existing functionality)
export const useTaskCommentsForTask = (taskId: string) => {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    if (!taskId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('task_comments')
        .select(`
          id,
          task_id,
          author_id,
          content,
          parent_comment_id,
          is_edited,
          created_at,
          updated_at,
          author:app_users!task_comments_author_id_fkey(
            id,
            full_name,
            role
          )
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      // Organize comments into threads
      const parentComments = data?.filter(comment => !comment.parent_comment_id) || [];
      const replies = data?.filter(comment => comment.parent_comment_id) || [];

      const threaded = parentComments.map(parent => ({
        ...parent,
        replies: replies.filter(reply => reply.parent_comment_id === parent.id)
      }));

      setComments(threaded);
    } catch (err) {
      console.error('Error loading comments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  return {
    comments,
    loading,
    error,
    refetch: loadComments,
  };
};