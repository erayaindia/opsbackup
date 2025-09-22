import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Eye,
  FileText,
  AlertTriangle,
  Users,
} from 'lucide-react';
import {
  StatusBadge,
  PriorityBadge,
  DueBadge,
  TypeBadge,
  LateBadge,
} from '@/components/tasks/TaskBadges';
import { TaskDrawer } from '@/components/tasks/TaskDrawer';
import { useTasks } from '@/hooks/useTasks';
import { useTaskReviews } from '@/hooks/useTaskReviews';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/components/ui/use-toast';
import {
  TaskWithDetails,
  TaskStatus,
  ReviewStatusValue,
  ReviewStatus,
} from '@/types/tasks';

export default function ReviewInbox() {
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewStatus, setReviewStatus] = useState<ReviewStatusValue | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState('needs-review');

  const { toast } = useToast();
  const { profile } = useUserProfile();
  const { submitReview: submitTaskReview, bulkReview, loading: reviewLoading } = useTaskReviews();

  // Get current user ID from profile
  const currentUserId = profile?.appUser?.id;

  const { tasks, loading, error, refetch } = useTasks({
    search: searchTerm,
    reviewer: currentUserId,
  });

  // Filter and categorize tasks
  const { needsReviewTasks, lateReviewTasks, recentlyReviewed } = useMemo(() => {
    const needs = tasks.filter(task => task.status === TaskStatus.SUBMITTED_FOR_REVIEW);
    const late = needs.filter(task => task.is_late);
    const recent = tasks.filter(task =>
      ['approved', 'rejected'].includes(task.status) &&
      task.reviews && task.reviews.length > 0 &&
      new Date(task.reviews[0].reviewed_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
    );

    return {
      needsReviewTasks: needs,
      lateReviewTasks: late,
      recentlyReviewed: recent,
    };
  }, [tasks]);

  const handleReviewTask = (task: TaskWithDetails, status: ReviewStatusValue) => {
    setSelectedTask(task);
    setReviewStatus(status);
    setReviewNotes('');
    setReviewDialogOpen(true);
  };

  const submitReview = async () => {
    if (!selectedTask || !reviewStatus) return;

    if (reviewStatus === ReviewStatus.REJECTED && !reviewNotes.trim()) {
      toast({
        title: 'Review notes required',
        description: 'Please provide notes when rejecting a task',
        variant: 'destructive',
      });
      return;
    }

    const review = await submitTaskReview(
      selectedTask,
      reviewStatus,
      reviewNotes.trim() || undefined
    );

    if (review) {
      setReviewDialogOpen(false);
      setSelectedTask(null);
      setReviewNotes('');
      setReviewStatus('');
      refetch(); // Refresh the tasks list
    }
  };

  const bulkApprove = async (taskIds: string[]) => {
    const success = await bulkReview(taskIds, ReviewStatus.APPROVED);
    if (success) {
      refetch(); // Refresh the tasks list
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const formatDateTime = (date: string, time?: string | null) => {
    const d = new Date(date);
    const dateStr = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    if (time) {
      const timeStr = new Date(`${date}T${time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return `${dateStr} at ${timeStr}`;
    }

    return dateStr;
  };

  const renderTaskRow = (task: TaskWithDetails) => (
    <Card key={task.id} className="mb-3">
      <CardContent className="pt-4">
        <div className="flex items-start gap-4">
          {/* Task info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-sm truncate">{task.title}</h3>
              <div className="flex gap-1">
                <TypeBadge type={task.task_type} />
                <PriorityBadge priority={task.priority} />
                {task.is_late && <LateBadge isLate={task.is_late} />}
              </div>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {task.description}
            </p>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Due: {formatDateTime(task.due_date, task.due_time)}</span>
              </div>

              {task.assigned_user && (
                <div className="flex items-center gap-1">
                  <Avatar className="h-4 w-4">
                    <AvatarFallback className="text-xs">
                      {getInitials(task.assigned_user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{task.assigned_user.full_name}</span>
                </div>
              )}

              {task.submitted_at && (
                <span>
                  Submitted {new Date(task.submitted_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Evidence preview */}
          <div className="w-32">
            {task.latest_submission && (
              <div className="p-2 border rounded text-center">
                <FileText className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Evidence attached</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedTask(task);
                setDrawerOpen(true);
              }}
            >
              <Eye className="h-4 w-4 mr-1" />
              Review
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleReviewTask(task, ReviewStatus.APPROVED)}
              className="text-green-600 hover:text-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleReviewTask(task, ReviewStatus.REJECTED)}
              className="text-red-600 hover:text-red-700"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderNeedsReview = () => (
    <div className="space-y-4">
      {/* Quick actions */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {needsReviewTasks.length} tasks need review
            </span>
            <Button
              onClick={() => bulkApprove(needsReviewTasks.filter(t => !t.is_late).map(t => t.id))}
              disabled={needsReviewTasks.filter(t => !t.is_late).length === 0}
            >
              Bulk Approve On-Time Tasks
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tasks list */}
      {needsReviewTasks.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <h3 className="text-lg font-semibold mb-2">All caught up! 🎉</h3>
            <p className="text-muted-foreground">
              No tasks currently need your review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div>
          {needsReviewTasks.map(renderTaskRow)}
        </div>
      )}
    </div>
  );

  const renderLateReview = () => (
    <div className="space-y-4">
      {lateReviewTasks.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No late submissions</h3>
            <p className="text-muted-foreground">
              All submitted tasks are on time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div>
          {lateReviewTasks.map(renderTaskRow)}
        </div>
      )}
    </div>
  );

  const renderRecentlyReviewed = () => (
    <div className="space-y-4">
      {recentlyReviewed.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No recent reviews</h3>
            <p className="text-muted-foreground">
              Recently reviewed tasks will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {recentlyReviewed.map((task) => (
            <Card key={task.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">{task.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {task.assigned_user?.full_name} •{' '}
                      {task.latest_review &&
                        new Date(task.latest_review.reviewed_at).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Review Inbox</h1>
          <p className="text-muted-foreground">
            Review and approve submitted tasks
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-2">
          <Card className="px-3 py-2">
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-600">
                {needsReviewTasks.length}
              </div>
              <div className="text-xs text-muted-foreground">Needs Review</div>
            </div>
          </Card>
          <Card className="px-3 py-2">
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">
                {lateReviewTasks.length}
              </div>
              <div className="text-xs text-muted-foreground">Late</div>
            </div>
          </Card>
        </div>
      </div>

      {/* Search and filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="fulfillment">Fulfillment</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="needs-review" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Needs Review ({needsReviewTasks.length})
          </TabsTrigger>
          <TabsTrigger value="late" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Late ({lateReviewTasks.length})
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Recent ({recentlyReviewed.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="needs-review" className="mt-6">
          {renderNeedsReview()}
        </TabsContent>

        <TabsContent value="late" className="mt-6">
          {renderLateReview()}
        </TabsContent>

        <TabsContent value="recent" className="mt-6">
          {renderRecentlyReviewed()}
        </TabsContent>
      </Tabs>

      {/* Review dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewStatus === ReviewStatus.APPROVED ? 'Approve' : 'Reject'} Task
            </DialogTitle>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{selectedTask.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Assigned to {selectedTask.assigned_user?.full_name}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">
                  Review Notes
                  {reviewStatus === ReviewStatus.REJECTED && (
                    <span className="text-red-500"> *</span>
                  )}
                </label>
                <Textarea
                  placeholder={
                    reviewStatus === ReviewStatus.APPROVED
                      ? 'Optional feedback...'
                      : 'Please explain why this task is being rejected...'
                  }
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitReview}
              variant={reviewStatus === ReviewStatus.APPROVED ? 'default' : 'destructive'}
            >
              {reviewStatus === ReviewStatus.APPROVED ? 'Approve' : 'Reject'} Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task details drawer */}
      <TaskDrawer
        task={selectedTask}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}