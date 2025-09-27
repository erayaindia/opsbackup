import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';
import { MentionsTextarea } from '@/components/ui/mentions-textarea';
import {
  MessageSquare,
  Send,
  Edit,
  Trash2,
  Reply,
  MoreHorizontal,
  Clock,
  User
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

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

interface TaskCommentsProps {
  taskId: string;
  className?: string;
}

interface User {
  id: string;
  full_name: string;
  role: string;
  department?: string;
}

export const TaskComments: React.FC<TaskCommentsProps> = ({ taskId, className = '' }) => {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [mentionedUsers, setMentionedUsers] = useState<Set<string>>(new Set());

  const { toast } = useToast();
  const { profile } = useUserProfile();

  // Load users for mentions
  const loadUsers = useCallback(async () => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');

      const { data, error } = await supabase
        .from('app_users')
        .select('id, full_name, role, department')
        .order('full_name');

      if (error) {
        console.error('Error loading users:', error);
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Exception loading users:', error);
    }
  }, []);

  // Load comments for the task
  const loadComments = useCallback(async () => {
    if (!taskId) return;

    setLoading(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');

      const { data, error } = await supabase
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

      if (error) {
        console.error('Error loading comments:', error);
        toast({
          title: 'Error loading comments',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      // Organize comments into threads (parent comments with replies)
      const parentComments = data?.filter(comment => !comment.parent_comment_id) || [];
      const replies = data?.filter(comment => comment.parent_comment_id) || [];

      const threaded = parentComments.map(parent => ({
        ...parent,
        replies: replies.filter(reply => reply.parent_comment_id === parent.id)
      }));

      setComments(threaded);
    } catch (error) {
      console.error('Exception loading comments:', error);
      toast({
        title: 'Error loading comments',
        description: 'Failed to load task comments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [taskId, toast]);

  // Load comments and users on mount
  useEffect(() => {
    loadComments();
    loadUsers();
  }, [loadComments, loadUsers]);

  // Set up real-time subscription for new comments
  useEffect(() => {
    if (!taskId) return;

    const setupRealtimeSubscription = async () => {
      const { supabase } = await import('@/integrations/supabase/client');

      const subscription = supabase
        .channel(`task_comments_${taskId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'task_comments',
            filter: `task_id=eq.${taskId}`
          },
          (payload) => {
            console.log('Real-time comment update:', payload);

            // Show notification for new comments (not from current user)
            if (payload.eventType === 'INSERT' && payload.new?.author_id !== profile?.appUser?.id) {
              toast({
                title: 'New comment added',
                description: 'Someone added a new comment to this task',
              });
            }

            // Reload comments to get the latest data
            loadComments();
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
  }, [taskId, loadComments, profile?.appUser?.id, toast]);

  // Submit new comment
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !profile?.appUser?.id) return;

    setSubmitting(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');

      const { error } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          author_id: profile.appUser.id,
          content: newComment.trim(),
        });

      if (error) {
        console.error('Error submitting comment:', error);
        toast({
          title: 'Error submitting comment',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      setNewComment('');
      toast({
        title: 'Comment added',
        description: 'Your comment has been added successfully',
      });

      // Reload comments
      await loadComments();
    } catch (error) {
      console.error('Exception submitting comment:', error);
      toast({
        title: 'Error submitting comment',
        description: 'Failed to submit comment',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit reply to comment
  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || !profile?.appUser?.id) return;

    setSubmitting(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');

      const { error } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          author_id: profile.appUser.id,
          content: replyContent.trim(),
          parent_comment_id: parentId,
        });

      if (error) {
        console.error('Error submitting reply:', error);
        toast({
          title: 'Error submitting reply',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      setReplyContent('');
      setReplyingTo(null);
      toast({
        title: 'Reply added',
        description: 'Your reply has been added successfully',
      });

      // Reload comments
      await loadComments();
    } catch (error) {
      console.error('Exception submitting reply:', error);
      toast({
        title: 'Error submitting reply',
        description: 'Failed to submit reply',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Edit comment
  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    setSubmitting(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');

      const { error } = await supabase
        .from('task_comments')
        .update({
          content: editContent.trim(),
        })
        .eq('id', commentId);

      if (error) {
        console.error('Error editing comment:', error);
        toast({
          title: 'Error editing comment',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      setEditingComment(null);
      setEditContent('');
      toast({
        title: 'Comment updated',
        description: 'Your comment has been updated successfully',
      });

      // Reload comments
      await loadComments();
    } catch (error) {
      console.error('Exception editing comment:', error);
      toast({
        title: 'Error editing comment',
        description: 'Failed to edit comment',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    setSubmitting(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');

      const { error } = await supabase
        .from('task_comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('Error deleting comment:', error);
        toast({
          title: 'Error deleting comment',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Comment deleted',
        description: 'Comment has been deleted successfully',
      });

      // Reload comments
      await loadComments();
    } catch (error) {
      console.error('Exception deleting comment:', error);
      toast({
        title: 'Error deleting comment',
        description: 'Failed to delete comment',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Start editing a comment
  const startEditing = (comment: TaskComment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingComment(null);
    setEditContent('');
  };

  // Start replying to a comment
  const startReplying = (commentId: string) => {
    setReplyingTo(commentId);
    setReplyContent('');
  };

  // Cancel replying
  const cancelReplying = () => {
    setReplyingTo(null);
    setReplyContent('');
  };

  // Handle mention in new comment
  const handleMention = (userId: string, userName: string) => {
    setMentionedUsers(prev => new Set([...prev, userId]));
  };

  // Handle mention in reply
  const handleReplyMention = (userId: string, userName: string) => {
    setMentionedUsers(prev => new Set([...prev, userId]));
  };

  // Format comment content with mentions and basic markdown
  const formatCommentContent = (content: string) => {
    // Simple markdown formatting
    let formatted = content
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic text
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code inline
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1 rounded text-sm">$1</code>')
      // Line breaks
      .replace(/\n/g, '<br>');

    // Highlight mentions
    formatted = formatted.replace(/@(\w+(?:\s+\w+)*)/g, (match, name) => {
      return `<span class="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1 rounded font-medium">${match}</span>`;
    });

    return formatted;
  };

  // Get user initials
  const getUserInitials = (fullName: string) => {
    return fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-500';
      case 'admin': return 'bg-blue-500';
      case 'manager': return 'bg-green-500';
      case 'employee': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  // Render a single comment
  const renderComment = (comment: TaskComment, isReply = false) => {
    const isAuthor = comment.author_id === profile?.appUser?.id;
    const isAdmin = profile?.appUser?.role === 'admin' || profile?.appUser?.role === 'super_admin';
    const canEdit = isAuthor;
    const canDelete = isAuthor || isAdmin;

    return (
      <div key={comment.id} className={`${isReply ? 'ml-8 mt-3' : ''} group`}>
        <div className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600/50 transition-colors">
          <Avatar className="h-8 w-8 ring-2 ring-white dark:ring-gray-800">
            <AvatarFallback className={`text-white text-xs font-medium ${getRoleColor(comment.author.role)}`}>
              {getUserInitials(comment.author.full_name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{comment.author.full_name}</span>
              <Badge variant="outline" className="text-xs px-2 py-0.5 bg-gray-50 dark:bg-gray-700/50">
                {comment.author.role.replace('_', ' ')}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                {comment.is_edited && <span className="text-xs opacity-75">(edited)</span>}
              </div>

              {(canEdit || canDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canEdit && (
                      <DropdownMenuItem onClick={() => startEditing(comment)}>
                        <Edit className="h-3 w-3 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {canDelete && (
                      <DropdownMenuItem
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {editingComment === comment.id ? (
              <div className="space-y-3">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <MentionsTextarea
                    value={editContent}
                    onChange={setEditContent}
                    onMention={handleMention}
                    placeholder="Edit your comment..."
                    className="min-h-[60px] border-0 bg-transparent resize-none focus:ring-0 p-0"
                    users={users}
                    disabled={submitting}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleEditComment(comment.id)}
                    disabled={submitting || !editContent.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {submitting ? (
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Save'
                    )}
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEditing}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div
                  className="text-sm leading-relaxed prose prose-sm max-w-none text-gray-800 dark:text-gray-200"
                  dangerouslySetInnerHTML={{ __html: formatCommentContent(comment.content) }}
                />

                {!isReply && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startReplying(comment.id)}
                    className="h-6 text-xs text-muted-foreground hover:text-gray-900 dark:hover:text-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Reply className="h-3 w-3 mr-1" />
                    Reply
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reply form */}
        {replyingTo === comment.id && (
          <div className="ml-12 mt-3">
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <MentionsTextarea
                value={replyContent}
                onChange={setReplyContent}
                onMention={handleReplyMention}
                placeholder="Write a reply..."
                className="min-h-[60px] border-0 bg-transparent resize-none focus:ring-0 p-0"
                users={users}
                disabled={submitting}
              />
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <Button
                  size="sm"
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={submitting || !replyContent.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {submitting ? (
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="h-3 w-3 mr-1" />
                      Reply
                    </>
                  )}
                </Button>
                <Button size="sm" variant="outline" onClick={cancelReplying}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Header skeleton */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
          <div>
            <div className="w-24 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1"></div>
            <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Comment form skeleton */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
          <div className="w-full h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3"></div>
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-12 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ))}
            </div>
            <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Comments skeleton */}
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
              <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="w-12 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
                <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-50 dark:bg-blue-950/20 rounded-full">
            <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Discussion</h3>
            <p className="text-sm text-muted-foreground">
              {comments.length + comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0)} message{(comments.length + comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0)) !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* New comment form */}
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
        <MentionsTextarea
          value={newComment}
          onChange={setNewComment}
          onMention={handleMention}
          placeholder="Share your thoughts..."
          className="min-h-[80px] border-0 bg-transparent resize-none focus:ring-0 p-0"
          users={users}
          disabled={submitting}
        />
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span>@</span>
              <span>mention</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="font-bold">**</span>
              <span>bold</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="italic">*</span>
              <span>italic</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">`</span>
              <span>code</span>
            </span>
          </div>
          <Button
            onClick={handleSubmitComment}
            disabled={submitting || !newComment.trim()}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white border-0"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="h-3 w-3 mr-1" />
                Post
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-6 w-6 text-gray-400" />
          </div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">No comments yet</h4>
          <p className="text-sm text-muted-foreground">Start the conversation by sharing your thoughts above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {comments.map(comment => renderComment(comment))}
        </div>
      )}
    </div>
  );
};