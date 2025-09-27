import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';
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

export const TaskComments: React.FC<TaskCommentsProps> = ({ taskId, className = '' }) => {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const { toast } = useToast();
  const { profile } = useUserProfile();

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

  // Load comments on mount and when taskId changes
  useEffect(() => {
    loadComments();
  }, [loadComments]);

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
      <div key={comment.id} className={`${isReply ? 'ml-8 mt-2' : 'mb-4'} p-3 border border-border rounded-lg bg-card`}>
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className={`text-white text-xs ${getRoleColor(comment.author.role)}`}>
              {getUserInitials(comment.author.full_name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{comment.author.full_name}</span>
              <Badge variant="outline" className="text-xs">
                {comment.author.role.replace('_', ' ')}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                {comment.is_edited && <span className="text-xs">(edited)</span>}
              </div>

              {(canEdit || canDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-auto">
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
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Edit your comment..."
                  className="min-h-[60px]"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleEditComment(comment.id)}
                    disabled={submitting || !editContent.trim()}
                  >
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEditing}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>

                {!isReply && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startReplying(comment.id)}
                    className="h-6 text-xs"
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
          <div className="ml-11 mt-3 space-y-2">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="min-h-[60px]"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleSubmitReply(comment.id)}
                disabled={submitting || !replyContent.trim()}
              >
                <Send className="h-3 w-3 mr-1" />
                Reply
              </Button>
              <Button size="sm" variant="outline" onClick={cancelReplying}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-2">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Comments ({comments.length + comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0)})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New comment form */}
        <div className="space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment about this task..."
            className="min-h-[80px]"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmitComment}
              disabled={submitting || !newComment.trim()}
              className="flex items-center gap-2"
            >
              <Send className="h-3 w-3" />
              Comment
            </Button>
          </div>
        </div>

        {/* Comments list */}
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map(comment => renderComment(comment))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};