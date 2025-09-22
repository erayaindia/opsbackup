import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  List,
  LayoutGrid,
  Calendar,
  Download,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  FileText,
  Inbox,
} from 'lucide-react';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskDrawer } from '@/components/tasks/TaskDrawer';
import { CreateTaskForm } from '@/components/tasks/CreateTaskForm';
import { useTasks } from '@/hooks/useTasks';
import { useTaskCreation } from '@/hooks/useTaskCreation';
import { useTaskReviews } from '@/hooks/useTaskReviews';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/components/ui/use-toast';
import {
  TaskWithDetails,
  TaskFilters,
  TaskViewMode,
  BulkTaskAction,
  TaskStatus,
  TaskPriority,
} from '@/types/tasks';

export default function AdminTasksHub() {
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [viewMode, setViewMode] = useState<TaskViewMode>('list');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<TaskFilters>({});

  const { toast } = useToast();
  const { profile } = useUserProfile();
  const { createTask, createTaskFromTemplate, createDailyTasks, loading: creationLoading } = useTaskCreation();
  const { bulkReview, loading: reviewLoading } = useTaskReviews();

  const { tasks, loading, error, refetch, bulkAction } = useTasks({
    ...filters,
    search: searchTerm,
  });

  // Analytics calculations
  const analytics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => ['approved', 'done_auto_approved'].includes(t.status)).length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const overdue = tasks.filter(t => t.is_late).length;
    const needsReview = tasks.filter(t => t.status === 'submitted_for_review').length;

    return {
      total,
      completed,
      pending,
      overdue,
      needsReview,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }, [tasks]);

  // Group tasks by status for overview
  const tasksByStatus = useMemo(() => {
    return tasks.reduce((acc, task) => {
      if (!acc[task.status]) acc[task.status] = [];
      acc[task.status].push(task);
      return acc;
    }, {} as Record<string, TaskWithDetails[]>);
  }, [tasks]);

  const handleTaskSelect = (task: TaskWithDetails, selected: boolean) => {
    const newSelected = new Set(selectedTasks);
    if (selected) {
      newSelected.add(task.id);
    } else {
      newSelected.delete(task.id);
    }
    setSelectedTasks(newSelected);
  };

  const handleBulkAction = async (actionType: BulkTaskAction['type'], data?: any) => {
    if (selectedTasks.size === 0) {
      toast({
        title: 'No tasks selected',
        description: 'Please select tasks to perform bulk actions',
        variant: 'destructive',
      });
      return;
    }

    const action: BulkTaskAction = {
      type: actionType,
      task_ids: Array.from(selectedTasks),
      data,
    };

    const result = await bulkAction(action);
    if (!result.error) {
      setSelectedTasks(new Set());
    }
  };

  const handleExportCSV = () => {
    // Create CSV content
    const headers = ['ID', 'Title', 'Type', 'Priority', 'Status', 'Assignee', 'Due Date', 'Created'];
    const rows = tasks.map(task => [
      task.id,
      task.title,
      task.task_type,
      task.priority,
      task.status,
      task.assigned_user?.full_name || '',
      task.due_date,
      task.created_at,
    ]);

    const csvContent = [headers, ...rows].map(row =>
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export successful',
      description: 'Tasks exported to CSV file',
    });
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold">{analytics.total}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{analytics.completed}</p>
                <p className="text-xs text-muted-foreground">
                  {analytics.completionRate.toFixed(1)}% completion rate
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Needs Review</p>
                <p className="text-2xl font-bold text-yellow-600">{analytics.needsReview}</p>
              </div>
              <Inbox className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{analytics.overdue}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
          <Card key={status}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span className="capitalize">{status.replace('_', ' ')}</span>
                <Badge variant="outline">{statusTasks.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {statusTasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className="p-2 border rounded cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    setSelectedTask(task);
                    setDrawerOpen(true);
                  }}
                >
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {task.assigned_user?.full_name}
                  </p>
                </div>
              ))}
              {statusTasks.length > 3 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  +{statusTasks.length - 3} more
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderTasksList = () => (
    <div className="space-y-4">
      {/* Bulk actions */}
      {selectedTasks.size > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedTasks.size} task(s) selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('assign')}
                >
                  Assign
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('approve')}
                >
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('change_priority')}
                >
                  Set Priority
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                >
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tasks grid */}
      <div className={viewMode === 'list' ? 'space-y-3' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}>
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onView={() => {
              setSelectedTask(task);
              setDrawerOpen(true);
            }}
            selectable
            selected={selectedTasks.has(task.id)}
            onSelect={handleTaskSelect}
            compact={viewMode === 'list'}
          />
        ))}
      </div>

      {tasks.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
            <p className="text-muted-foreground">
              No tasks match your current filters. Try adjusting your search criteria.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderTemplatesTab = () => (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 text-center">
          <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Task Templates</h3>
          <p className="text-muted-foreground mb-4">
            Create and manage reusable task templates for efficient task creation.
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderApprovalInbox = () => (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 text-center">
          <Inbox className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Approval Inbox</h3>
          <p className="text-muted-foreground mb-4">
            Review and approve tasks that require manual approval.
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{analytics.needsReview}</p>
              <p className="text-sm text-muted-foreground">Needs Review</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{analytics.overdue}</p>
              <p className="text-sm text-muted-foreground">Overdue</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Task Management Hub</h1>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          {selectedTab === 'tasks' && (
            <div className="flex items-center border rounded-lg p-1 bg-muted/50">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-7 px-2"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className="h-7 px-2"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className="h-7 px-2"
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Actions */}
          <Button onClick={() => setCreateTaskOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreHorizontal className="h-4 w-4 mr-2" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Users className="h-4 w-4 mr-2" />
                Bulk Assign
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="h-4 w-4 mr-2" />
                Create Template
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search and filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks by title, assignee, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="one-off">One-off</SelectItem>
                </SelectContent>
              </Select>
              <Select>
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
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main content tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">All Tasks</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          {renderTasksList()}
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          {renderTemplatesTab()}
        </TabsContent>

        <TabsContent value="approvals" className="mt-6">
          {renderApprovalInbox()}
        </TabsContent>
      </Tabs>

      {/* Task details drawer */}
      <TaskDrawer
        task={selectedTask}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        canEdit={true}
      />

      {/* Create task form */}
      <CreateTaskForm
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        onTaskCreated={() => {
          refetch(); // Refresh the tasks list
          toast({
            title: 'Task created successfully',
            description: 'The new task has been created and assigned.',
          });
        }}
      />
    </div>
  );
}