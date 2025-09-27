import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle, FileText, Camera, Link as LinkIcon, User, Award } from 'lucide-react';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';

interface TaskHistoryItem {
  id: string;
  title: string;
  description?: string;
  task_type: string;
  status: string;
  priority: string;
  completed_at?: string;
  updated_at: string;
  instance_date?: string;
  due_date?: string;
  assigned_by_user?: {
    full_name: string;
  };
  reviewer?: {
    full_name: string;
  };
  submissions?: Array<{
    id: string;
    evidence_type: string;
    file_url?: string;
    link_url?: string;
    file_name?: string;
  }>;
  reviews?: Array<{
    id: string;
    status: string;
    reviewer: {
      full_name: string;
    };
  }>;
}

interface TaskHistoryProps {
  onClose: () => void;
}

const TaskHistory: React.FC<TaskHistoryProps> = ({ onClose }) => {
  const { profile } = useUserProfile();
  const [history, setHistory] = useState<TaskHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'daily' | 'one-off'>('all');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'all'>('all');

  useEffect(() => {
    fetchTaskHistory();
  }, [profile?.appUser?.id, filter, timeRange]);

  const fetchTaskHistory = async () => {
    if (!profile?.appUser?.id) return;

    setLoading(true);
    try {
      // Calculate date range
      const now = new Date();
      let fromDate: string | undefined;

      switch (timeRange) {
        case 'week':
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'month':
          fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'quarter':
          fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        default:
          fromDate = undefined;
      }

      let query = supabase
        .from('tasks')
        .select(`
          id, title, description, task_type, status, priority, due_date, instance_date,
          completed_at, updated_at,
          assigned_by_user:app_users!tasks_assigned_by_fkey(full_name),
          reviewer:app_users!tasks_reviewer_id_fkey(full_name),
          submissions:task_submissions(id, evidence_type, file_url, link_url, file_name),
          reviews:task_reviews(id, status, reviewer:app_users(full_name))
        `)
        .eq('assigned_to', profile.appUser.id)
        // Temporarily remove status filter to see all tasks for debugging
        // .in('status', ['done', 'approved', 'done_auto_approved', 'completed', 'finished'])
        .order('updated_at', { ascending: false });

      // Apply task type filter
      if (filter !== 'all') {
        query = query.eq('task_type', filter === 'daily' ? 'daily' : 'one-off');
      }

      // Apply date range filter
      if (fromDate) {
        query = query.gte('updated_at', fromDate);
      }

      const { data, error } = await query.limit(100);

      if (error) {
        console.error('❌ Error fetching task history:', error);
        return;
      }

      console.log('📊 Task history data received:', {
        totalTasks: data?.length || 0,
        statuses: data?.map(t => t.status) || [],
        taskTypes: data?.map(t => t.task_type) || [],
        filter,
        timeRange,
        fromDate
      });

      setHistory(data || []);
    } catch (error) {
      console.error('Exception fetching task history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM dd, yyyy');
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'done':
      case 'completed':
      case 'finished':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'done_auto_approved':
      case 'auto_approved':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
      case 'in progress':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'submitted_for_review':
      case 'under_review':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'Approved';
      case 'done':
      case 'completed':
      case 'finished':
        return 'Completed';
      case 'done_auto_approved':
      case 'auto_approved':
        return 'Auto-Approved';
      case 'pending':
        return 'Pending';
      case 'in_progress':
      case 'in progress':
        return 'In Progress';
      case 'submitted_for_review':
      case 'under_review':
        return 'Under Review';
      case 'rejected':
        return 'Rejected';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTaskTypeIcon = (taskType: string) => {
    if (taskType === 'daily') {
      return (
        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Award className="h-6 w-6 text-blue-600" />
            Task Completion History
          </h2>
          <p className="text-muted-foreground mt-1">
            View your completed tasks and achievements
          </p>
        </div>
        <Button onClick={onClose} variant="outline">
          Close
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            {/* Task Type Filter */}
            <div className="flex gap-2">
              <span className="text-sm font-medium text-muted-foreground">Type:</span>
              {(['all', 'daily', 'one-off'] as const).map((type) => (
                <Button
                  key={type}
                  variant={filter === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(type)}
                >
                  {type === 'all' ? 'All Tasks' : type === 'daily' ? 'Daily Tasks' : 'One-off Tasks'}
                </Button>
              ))}
            </div>

            {/* Time Range Filter */}
            <div className="flex gap-2">
              <span className="text-sm font-medium text-muted-foreground">Period:</span>
              {(['week', 'month', 'quarter', 'all'] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                >
                  {range === 'week' ? 'Last Week' : range === 'month' ? 'Last Month' : range === 'quarter' ? 'Last 3 Months' : 'All Time'}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">Loading task history...</div>
            </CardContent>
          </Card>
        ) : history.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                No completed tasks found for the selected filters.
              </div>
            </CardContent>
          </Card>
        ) : (
          history.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Task Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getTaskTypeIcon(task.task_type)}
                        <h3 className="font-semibold text-foreground">{task.title}</h3>
                        <Badge variant="outline" className={getStatusColor(task.status)}>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {getStatusLabel(task.status)}
                        </Badge>
                        <Badge variant="outline" className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Task Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {task.instance_date ? (
                        <span>Instance: {formatDate(task.instance_date)}</span>
                      ) : task.due_date ? (
                        <span>Due: {formatDate(task.due_date)}</span>
                      ) : (
                        <span>No due date</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Completed: {formatDate(task.updated_at)} at {formatTime(task.updated_at)}</span>
                    </div>
                    {task.assigned_by_user && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span>Assigned by: {task.assigned_by_user.full_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Evidence Submissions */}
                  {task.submissions && task.submissions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-foreground">Evidence Submitted:</h4>
                      <div className="flex flex-wrap gap-2">
                        {task.submissions.map((submission) => (
                          <div key={submission.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded border text-sm">
                            {submission.evidence_type === 'photo' && <Camera className="w-4 h-4 text-blue-600" />}
                            {submission.evidence_type === 'file' && <FileText className="w-4 h-4 text-green-600" />}
                            {submission.evidence_type === 'link' && <LinkIcon className="w-4 h-4 text-purple-600" />}
                            <span>{submission.file_name || `${submission.evidence_type} evidence`}</span>
                            <span className="text-muted-foreground">
                              (Evidence submitted)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reviews */}
                  {task.reviews && task.reviews.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-foreground">Review:</h4>
                      {task.reviews.map((review) => (
                        <div key={review.id} className="p-3 bg-muted/20 rounded border">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className={getStatusColor(review.status)}>
                              {getStatusLabel(review.status)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              by {review.reviewer.full_name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskHistory;