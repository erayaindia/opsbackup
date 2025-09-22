import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  RotateCcw,
} from 'lucide-react';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskDrawer } from '@/components/tasks/TaskDrawer';
import { useTasks } from '@/hooks/useTasks';
import { useTaskSubmissions } from '@/hooks/useTaskSubmissions';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/components/ui/use-toast';
import {
  TaskWithDetails,
  TaskStatus,
  TaskPriority,
  TaskFilters,
} from '@/types/tasks';

export default function MyTasks() {
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('daily');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { toast } = useToast();
  const { profile } = useUserProfile();
  const { startTask, submitTaskEvidence, addTaskNote, loading: submissionLoading } = useTaskSubmissions();

  // Get current user ID from profile
  const currentUserId = profile?.appUser?.id;

  const filters: TaskFilters = useMemo(() => ({
    search: searchTerm,
    type: selectedTab === 'daily' ? 'daily' : selectedTab === 'other' ? 'one-off' : 'all',
    priority: priorityFilter === 'all' ? undefined : priorityFilter as any,
    status: statusFilter === 'all' ? undefined : statusFilter as any,
    assignee: currentUserId,
  }), [searchTerm, selectedTab, priorityFilter, statusFilter, currentUserId]);

  const { tasks, loading, error, refetch } = useTasks(filters);

  // Separate tasks by type and date
  const { dailyTasks, otherTasks, historyTasks } = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    const daily = tasks.filter(task =>
      task.task_type === 'daily' && task.due_date === today
    );

    const other = tasks.filter(task =>
      task.task_type === 'one-off' &&
      !['approved', 'rejected', 'done_auto_approved'].includes(task.status)
    );

    const history = tasks.filter(task =>
      (task.task_type === 'daily' && task.due_date !== today) ||
      (task.task_type === 'one-off' && ['approved', 'rejected', 'done_auto_approved'].includes(task.status))
    );

    return { dailyTasks: daily, otherTasks: other, historyTasks: history };
  }, [tasks]);

  // Calculate progress for today
  const todayProgress = useMemo(() => {
    const total = dailyTasks.length;
    const completed = dailyTasks.filter(task =>
      ['approved', 'done_auto_approved'].includes(task.status)
    ).length;

    return { total, completed, percentage: total > 0 ? (completed / total) * 100 : 0 };
  }, [dailyTasks]);

  const handleTaskStart = async (task: TaskWithDetails) => {
    const success = await startTask(task.id);
    if (success) {
      refetch(); // Refresh tasks to show updated status
    }
  };

  const handleTaskMarkDone = async (task: TaskWithDetails) => {
    const submissionData = {
      type: 'completion' as const,
      notes: `Task completed on ${new Date().toLocaleString()}`,
    };

    const submission = await submitTaskEvidence(task, submissionData);
    if (submission) {
      refetch(); // Refresh tasks to show updated status
    }
  };

  const handleTaskSubmitForReview = async (task: TaskWithDetails) => {
    const submissionData = {
      type: 'completion' as const,
      notes: `Task submitted for review on ${new Date().toLocaleString()}`,
    };

    const submission = await submitTaskEvidence(task, submissionData);
    if (submission) {
      refetch(); // Refresh tasks to show updated status
    }
  };

  const handleTaskView = (task: TaskWithDetails) => {
    setSelectedTask(task);
    setDrawerOpen(true);
  };

  const handleEvidenceSubmit = async (task: TaskWithDetails, evidenceData: any) => {
    const submission = await submitTaskEvidence(task, evidenceData);
    if (submission) {
      refetch(); // Refresh tasks to show updated status
      setDrawerOpen(false); // Close the drawer
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setPriorityFilter('all');
    setStatusFilter('all');
  };

  const renderDailyTasks = () => (
    <div className="space-y-4">
      {/* Progress header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Today's Progress</h3>
            <Badge variant={todayProgress.percentage === 100 ? 'default' : 'secondary'}>
              {todayProgress.completed}/{todayProgress.total} Complete
            </Badge>
          </div>
          <Progress value={todayProgress.percentage} className="mb-2" />
          <p className="text-sm text-muted-foreground">
            {todayProgress.percentage === 100
              ? "🎉 All daily tasks completed!"
              : `${Math.round(todayProgress.percentage)}% complete`
            }
          </p>
        </CardContent>
      </Card>

      {/* Task list */}
      <div className="space-y-3">
        {dailyTasks.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <h3 className="text-lg font-semibold mb-2">You're all set for today! 🎉</h3>
              <p className="text-muted-foreground">
                No daily tasks assigned. Check back tomorrow or see your other tasks.
              </p>
            </CardContent>
          </Card>
        ) : (
          dailyTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStart={handleTaskStart}
              onMarkDone={handleTaskMarkDone}
              onView={handleTaskView}
              compact
            />
          ))
        )}
      </div>
    </div>
  );

  const renderOtherTasks = () => (
    <div className="space-y-4">
      {otherTasks.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No pending tasks</h3>
            <p className="text-muted-foreground">
              All your one-off tasks are complete. New tasks will appear here when assigned.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {otherTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStart={handleTaskStart}
              onSubmitForReview={handleTaskSubmitForReview}
              onView={handleTaskView}
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-4">
      {historyTasks.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No history yet</h3>
            <p className="text-muted-foreground">
              Completed and past tasks will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {historyTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onView={handleTaskView}
              showActions={false}
              compact
            />
          ))}
        </div>
      )}
    </div>
  );

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-500" />
            <h3 className="text-lg font-semibold mb-2">Error loading tasks</h3>
            <p className="text-muted-foreground mb-4">{error.message}</p>
            <Button onClick={refetch}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Tasks</h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Quick stats */}
        <div className="flex gap-2">
          <Card className="px-3 py-2">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {todayProgress.completed}
              </div>
              <div className="text-xs text-muted-foreground">Done Today</div>
            </div>
          </Card>
          <Card className="px-3 py-2">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {otherTasks.length}
              </div>
              <div className="text-xs text-muted-foreground">Pending</div>
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
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="submitted_for_review">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={clearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Daily ({dailyTasks.length})
          </TabsTrigger>
          <TabsTrigger value="other" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Other ({otherTasks.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            History ({historyTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-6">
          {renderDailyTasks()}
        </TabsContent>

        <TabsContent value="other" className="mt-6">
          {renderOtherTasks()}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {renderHistory()}
        </TabsContent>
      </Tabs>

      {/* Task details drawer */}
      <TaskDrawer
        task={selectedTask}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onStart={handleTaskStart}
        onMarkDone={handleTaskMarkDone}
        onSubmitForReview={handleTaskSubmitForReview}
      />
    </div>
  );
}