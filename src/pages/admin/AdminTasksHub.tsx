import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { renderRichContent } from '@/lib/textUtils';
import { getHierarchicalTaskId } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { DatePicker } from '@/components/ui/date-picker';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  ChevronDown,
  ChevronRight,
  User,
  MessageSquare,
  Check,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  FilterX,
  Upload,
  FileTextIcon,
  CheckSquare,
  ExternalLink,
  Star,
  GitBranch,
  Code,
  RotateCcw,
  Brain,
} from 'lucide-react';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskDrawer } from '@/components/tasks/TaskDrawer';
import { CreateTaskForm } from '@/components/tasks/CreateTaskForm';
import { EvidenceUploader } from '@/components/tasks/EvidenceUploader';
import { TaskComments } from '@/components/tasks/TaskComments';
import { useTasks } from '@/hooks/useTasks';
import { useTaskCreation } from '@/hooks/useTaskCreation';
import { useTaskReviews } from '@/hooks/useTaskReviews';
import { useTaskSubmissions } from '@/hooks/useTaskSubmissions';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUsers } from '@/hooks/useUsers';
import { useTaskComments } from '@/hooks/useTaskComments';
import { useToast } from '@/components/ui/use-toast';
import {
  Task,
  TaskWithDetails,
  TaskFilters,
  TaskViewMode,
  BulkTaskAction,
  EvidenceUpload,
  TaskStatus,
  TaskPriority,
} from '@/types/tasks';

export default function AdminTasksHub() {
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<TaskViewMode>('list');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [assigneePopovers, setAssigneePopovers] = useState<Record<string, boolean>>({});
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<string>('priority');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [groupBy, setGroupBy] = useState<'none' | 'priority' | 'assignee' | 'status'>('assignee');
  const [activeTab, setActiveTab] = useState<'todo' | 'under_review' | 'incomplete' | 'completed' | 'archived' | 'all'>('todo');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => {
    // Load collapsed groups from localStorage on initial load
    try {
      const saved = localStorage.getItem('adminTasksHub_collapsedGroups');
      if (saved) {
        const parsedGroups = JSON.parse(saved);
        return new Set(parsedGroups);
      }
    } catch (error) {
      console.error('Error loading collapsed groups from localStorage:', error);
    }
    return new Set();
  });
  const [advancedFilters, setAdvancedFilters] = useState({
    dateRange: '',
    selectedStatuses: [] as string[],
    selectedPriorities: [] as string[],
    selectedTypes: [] as string[],
    selectedAssignees: [] as string[],
    isOverdue: false,
    hasNoAssignee: false,
    showArchived: false,
  });
  const [deletingSubmissionId, setDeletingSubmissionId] = useState<string | null>(null);
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);
  const [selectedTaskForComments, setSelectedTaskForComments] = useState<TaskWithDetails | null>(null);

  const { toast } = useToast();
  const { profile } = useUserProfile();

  // Load tasks first (highest priority)
  const { tasks, loading, error, refetch, bulkAction, updateTask, deleteTask } = useTasks({
    search: searchTerm,
  });


  // Lazy load users only when needed (when dropdowns are opened)
  const [usersEnabled, setUsersEnabled] = useState(false);
  const { users } = useUsers(usersEnabled);
  const { createTask, createTaskFromTemplate, createDailyTasks, loading: creationLoading } = useTaskCreation();
  const { bulkReview, loading: reviewLoading } = useTaskReviews();
  const { submitTaskEvidence, deleteTaskSubmission, loading: submissionLoading } = useTaskSubmissions();

  // Get comment counts for all tasks
  const taskIds = tasks.map(task => task.id);
  const { getCommentCount, refetch: refetchComments } = useTaskComments(taskIds);



  const handleTaskSelect = (task: TaskWithDetails, selected: boolean) => {
    const newSelected = new Set(selectedTasks);
    if (selected) {
      newSelected.add(task.id);
    } else {
      newSelected.delete(task.id);
    }
    setSelectedTasks(newSelected);
  };

  const toggleRowExpansion = (taskId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleEvidenceUpload = async (task: TaskWithDetails, evidence: EvidenceUpload) => {
    try {
      const submissionData = {
        type: 'evidence' as const,
        evidenceType: evidence.type,
        file: evidence.file,
        url: evidence.url,
        notes: '', // No notes in minimal version
        checklist: evidence.checklist,
      };

      const submission = await submitTaskEvidence(task, submissionData);
      if (submission) {
        // Refetch tasks to show updated submissions
        await refetch();
        toast({
          title: "Success",
          description: "Evidence uploaded successfully",
        });
      }
    } catch (error) {
      console.error('Error uploading evidence:', error);
      toast({
        title: "Error",
        description: "Failed to upload evidence",
        variant: "destructive",
      });
    }
  };

  const handleEvidenceDelete = async (submissionId: string, filePath?: string | null) => {
    try {
      console.log('Starting evidence delete for submission:', submissionId);
      setDeletingSubmissionId(submissionId); // Set which submission is being deleted

      const success = await deleteTaskSubmission(submissionId, filePath);

      if (success) {
        console.log('Delete successful, refetching tasks...');

        // Wait a bit for the database to be consistent
        await new Promise(resolve => setTimeout(resolve, 500));

        await refetch(); // Refresh tasks to show updated submissions
        console.log('Tasks refetched successfully');

        // Force a re-render by updating multiple states
        setSelectedTasks(new Set(selectedTasks));
      } else {
        console.log('Delete was not successful');
      }
    } catch (error) {
      console.error('Error in handleEvidenceDelete:', error);
      await refetch(); // Refresh even on error to ensure UI consistency
    } finally {
      setDeletingSubmissionId(null); // Clear the deleting state
    }
  };

  const handlePriorityChange = async (taskId: string, newPriority: string) => {
    // Validate priority value
    if (!newPriority || !['low', 'medium', 'high'].includes(newPriority)) {
      toast({
        title: 'Invalid priority',
        description: 'Priority must be low, medium, or high',
        variant: 'destructive'
      });
      return;
    }

    try {
      const result = await updateTask(taskId, { priority: newPriority });

      if (!result.error) {
        toast({
          title: 'Priority updated',
          description: `Task priority changed to ${newPriority}`,
        });
      } else {
        toast({
          title: 'Error updating priority',
          description: result.error.message || 'Failed to update task priority',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Priority update error:', error);
      toast({
        title: 'Error updating priority',
        description: 'An unexpected error occurred while updating priority',
        variant: 'destructive'
      });
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    // Validate status value
    const validStatuses = ['pending', 'in_progress', 'submitted_for_review', 'approved', 'rejected', 'done_auto_approved', 'incomplete'];
    if (!newStatus || !validStatuses.includes(newStatus)) {
      toast({
        title: 'Invalid status',
        description: `Status must be one of: ${validStatuses.join(', ')}`,
        variant: 'destructive'
      });
      return;
    }

    try {
      const result = await updateTask(taskId, { status: newStatus });

      if (!result.error) {
        toast({
          title: 'Status updated',
          description: `Task status changed to ${newStatus.replace('_', ' ')}`,
        });
      } else {
        toast({
          title: 'Error updating status',
          description: result.error.message || 'Failed to update task status',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Status update error:', error);
      toast({
        title: 'Error updating status',
        description: 'An unexpected error occurred while updating status',
        variant: 'destructive'
      });
    }
  };


  const handleAssigneeChange = async (taskId: string, newAssigneeId: string) => {
    // Validate assignee ID
    if (!newAssigneeId) {
      toast({
        title: 'Invalid assignee',
        description: 'Please select a valid assignee',
        variant: 'destructive'
      });
      return;
    }

    // Check if user exists in the users list
    const assignee = users.find(u => u.id === newAssigneeId);
    if (!assignee) {
      toast({
        title: 'Invalid assignee',
        description: 'Selected user not found',
        variant: 'destructive'
      });
      return;
    }

    try {
      const result = await updateTask(taskId, { assigned_to: newAssigneeId });

      if (!result.error) {
        toast({
          title: 'Assignee updated',
          description: `Task assigned to ${assignee.full_name}`,
        });
      } else {
        toast({
          title: 'Error updating assignee',
          description: result.error.message || 'Failed to update task assignee',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Assignee update error:', error);
      toast({
        title: 'Error updating assignee',
        description: 'An unexpected error occurred while updating assignee',
        variant: 'destructive'
      });
    }
  };

  const handleTaskTypeChange = async (taskId: string, newTaskType: string) => {
    // Validate task_type value
    if (!newTaskType || (newTaskType !== 'daily' && newTaskType !== 'one-off')) {
      toast({
        title: 'Invalid task type',
        description: 'Task type must be either "daily" or "one-off"',
        variant: 'destructive'
      });
      return;
    }

    const result = await updateTask(taskId, { task_type: newTaskType });

    if (!result.error) {
      toast({
        title: 'Task type updated',
        description: `Task type changed to ${newTaskType.replace('_', ' ')}`,
      });
    } else {
      toast({
        title: 'Error updating task type',
        description: result.error.message || 'Failed to update task type',
        variant: 'destructive'
      });
    }
  };

  const handleDueDateChange = async (taskId: string, newDate: Date | undefined) => {
    if (!newDate) {
      toast({
        title: 'Invalid date',
        description: 'Please select a valid date',
        variant: 'destructive'
      });
      return;
    }

    // Validate that the date is not in the past (optional - remove if past dates are allowed)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newDate < today) {
      const confirmPastDate = window.confirm(
        'You are setting a due date in the past. Are you sure you want to continue?'
      );
      if (!confirmPastDate) return;
    }

    try {
      // Format date as YYYY-MM-DD for database
      const formattedDate = newDate.toISOString().split('T')[0];

      const result = await updateTask(taskId, { due_date: formattedDate });

      if (!result.error) {
        toast({
          title: 'Due date updated',
          description: `Task due date changed to ${formattedDate}`,
        });
      } else {
        toast({
          title: 'Error updating due date',
          description: result.error.message || 'Failed to update task due date',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Due date update error:', error);
      toast({
        title: 'Error updating due date',
        description: 'An unexpected error occurred while updating due date',
        variant: 'destructive'
      });
    }
  };

  // Enhanced delete function with better error handling for subtasks
  const handleDeleteTask = async (taskId: string, taskTitle: string, hasSubtasks: boolean = false) => {
    const confirmMessage = hasSubtasks
      ? `Are you sure you want to delete "${taskTitle}" and all its subtasks? This action cannot be undone.`
      : `Are you sure you want to delete "${taskTitle}"? This action cannot be undone.`;

    if (window.confirm(confirmMessage)) {
      try {
        const result = await deleteTask(taskId);
        if (!result.error) {
          toast({
            title: "Task deleted",
            description: hasSubtasks
              ? "The task and all its subtasks have been successfully deleted."
              : "The task has been successfully deleted.",
          });
        } else {
          toast({
            title: "Error deleting task",
            description: result.error.message || "Failed to delete task. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Delete task error:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred while deleting the task. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Archive/unarchive task function
  const handleArchiveTask = async (taskId: string, taskTitle: string) => {
    try {
      // First get the current task to check its status
      const currentTask = tasks.find(t => t.id === taskId);
      const isCurrentlyArchived = currentTask?.status === 'done_auto_approved';
      const newStatus = isCurrentlyArchived ? 'pending' : 'done_auto_approved';
      const action = isCurrentlyArchived ? 'unarchived' : 'archived';

      console.log('Archive task attempt:', {
        taskId,
        taskTitle,
        currentStatus: currentTask?.status,
        newStatus,
        action
      });

      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select();

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      console.log('Archive success:', data);

      toast({
        title: `Task ${action}`,
        description: `"${taskTitle}" has been successfully ${action}.`,
      });

      // Refresh the tasks list
      refetch();
    } catch (error) {
      console.error('Archive task error:', error);
      const currentTask = tasks.find(t => t.id === taskId);
      toast({
        title: "Error",
        description: `Failed to ${currentTask?.status === 'archived' ? 'unarchive' : 'archive'} task. Please check console for details.`,
        variant: "destructive",
      });
    }
  };

  // Bulk update function for multiple tasks
  const handleBulkUpdate = async (taskIds: string[], updates: Partial<Task>, description: string) => {
    if (taskIds.length === 0) {
      toast({
        title: 'No tasks selected',
        description: 'Please select at least one task to update',
        variant: 'destructive'
      });
      return;
    }

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const taskId of taskIds) {
        const result = await updateTask(taskId, updates);
        if (!result.error) {
          successCount++;
        } else {
          errorCount++;
          console.error(`Failed to update task ${taskId}:`, result.error);
        }
      }

      if (successCount > 0) {
        toast({
          title: 'Bulk update completed',
          description: `${successCount} task(s) ${description}${errorCount > 0 ? `. ${errorCount} failed.` : ''}`,
        });
      }

      if (errorCount > 0 && successCount === 0) {
        toast({
          title: 'Bulk update failed',
          description: `Failed to update ${errorCount} task(s)`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Bulk update error:', error);
      toast({
        title: 'Error during bulk update',
        description: 'An unexpected error occurred during bulk update',
        variant: 'destructive'
      });
    }
  };


  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, start with ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="h-4 w-4 text-primary" />
      : <ArrowDown className="h-4 w-4 text-primary" />;
  };

  // Apply advanced filters to tasks
  const filteredTasks = React.useMemo(() => {
    if (!tasks.length) return tasks;

    return tasks.filter((task) => {
      // Date range filter
      if (advancedFilters.dateRange) {
        if (advancedFilters.dateRange.includes(' to ')) {
          const [startDate, endDate] = advancedFilters.dateRange.split(' to ');
          if (task.due_date) {
            const taskDate = new Date(task.due_date);
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (taskDate < start || taskDate > end) return false;
          }
        } else {
          // Single date
          if (task.due_date !== advancedFilters.dateRange) return false;
        }
      }

      // Status filter
      if (advancedFilters.selectedStatuses.length > 0) {
        if (!advancedFilters.selectedStatuses.includes(task.status)) return false;
      }

      // Priority filter
      if (advancedFilters.selectedPriorities.length > 0) {
        if (!advancedFilters.selectedPriorities.includes(task.priority)) return false;
      }

      // Type filter
      if (advancedFilters.selectedTypes.length > 0) {
        if (!advancedFilters.selectedTypes.includes(task.task_type)) return false;
      }

      // Assignee filter
      if (advancedFilters.selectedAssignees.length > 0) {
        if (!task.assigned_to || !advancedFilters.selectedAssignees.includes(task.assigned_to)) return false;
      }

      // Overdue filter
      if (advancedFilters.isOverdue) {
        if (!task.due_date || new Date(task.due_date) >= new Date()) return false;
      }

      // No assignee filter
      if (advancedFilters.hasNoAssignee) {
        if (task.assigned_to) return false;
      }

      // Tab-based filtering
      const isArchived = task.status === 'done_auto_approved';
      const isCompleted = task.status === 'approved';
      const isUnderReview = task.status === 'submitted_for_review';
      const isIncomplete = task.status === 'incomplete';

      if (activeTab === 'archived') {
        // Archived tab: show only archived tasks
        if (!isArchived) return false;
      } else if (activeTab === 'completed') {
        // Completed tab: show only completed tasks (approved status)
        if (!isCompleted) return false;
      } else if (activeTab === 'under_review') {
        // Under Review tab: show only tasks submitted for review
        if (!isUnderReview) return false;
      } else if (activeTab === 'incomplete') {
        // Incomplete tab: show only incomplete tasks
        if (!isIncomplete) return false;
      } else if (activeTab === 'todo') {
        // Todo tab: show only pending and in-progress tasks
        const isTodo = task.status === 'pending' || task.status === 'in_progress';
        if (!isTodo) return false;
      } else if (activeTab === 'all') {
        // All tab: hide archived tasks by default unless showArchived filter is true
        if (!advancedFilters.showArchived && isArchived) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, advancedFilters, activeTab]);

  // Build hierarchical task structure
  const buildTaskHierarchy = (tasks: TaskWithDetails[]): TaskWithDetails[] => {
    if (!tasks.length) return tasks;

    // Since subtasks are already attached by the database query, we just need to:
    // 1. Return only parent tasks (subtasks will be displayed when parents are expanded)
    // 2. Ensure subtasks are sorted correctly
    return tasks
      .filter(task => !task.parent_task_id) // Only parent tasks
      .map(parentTask => ({
        ...parentTask,
        // Sort existing subtasks by task_order if they exist
        subtasks: parentTask.subtasks?.sort((a, b) => (a.task_order || 0) - (b.task_order || 0)) || []
      }));
  };

  // Sort tasks based on current sort settings and build hierarchy
  const sortedTasks = React.useMemo(() => {
    if (!filteredTasks.length) return filteredTasks;

    // First sort all tasks
    const sorted = [...filteredTasks].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'title':
          aValue = a.title?.toLowerCase() || '';
          bValue = b.title?.toLowerCase() || '';
          break;
        case 'assignee':
          aValue = a.assigned_user?.full_name?.toLowerCase() || '';
          bValue = b.assigned_user?.full_name?.toLowerCase() || '';
          break;
        case 'type':
          aValue = a.task_type || '';
          bValue = b.task_type || '';
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'due_date':
          aValue = a.due_date ? new Date(a.due_date).getTime() : 0;
          bValue = b.due_date ? new Date(b.due_date).getTime() : 0;
          break;
        case 'task_id':
          aValue = a.task_id || 999999;
          bValue = b.task_id || 999999;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    // Build hierarchical structure from sorted tasks
    return buildTaskHierarchy(sorted);
  }, [filteredTasks, sortField, sortDirection]);

  // Group tasks based on groupBy setting
  const groupedTasks = React.useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Tasks': sortedTasks };
    }

    const groups: Record<string, typeof sortedTasks> = {};

    sortedTasks.forEach((task) => {
      let groupKey: string;

      switch (groupBy) {
        case 'priority':
          const priorityLabels = { high: 'High Priority', medium: 'Medium Priority', low: 'Low Priority' };
          groupKey = priorityLabels[task.priority as keyof typeof priorityLabels] || 'Unknown Priority';
          break;
        case 'assignee':
          groupKey = task.assigned_user?.full_name || 'Unassigned';
          break;
        case 'status':
          const statusLabels = {
            pending: 'Pending',
            in_progress: 'In Progress',
            submitted_for_review: 'Submitted',
            approved: 'Approved',
            rejected: 'Rejected',
            done_auto_approved: 'Done',
            incomplete: 'Incomplete'
          };
          groupKey = statusLabels[task.status as keyof typeof statusLabels] || 'Unknown Status';
          break;
        default:
          groupKey = 'All Tasks';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(task);
    });

    // Sort groups by priority for priority grouping, or alphabetically for others
    if (groupBy === 'priority') {
      const priorityOrder = ['High Priority', 'Medium Priority', 'Low Priority', 'Unknown Priority'];
      const sortedGroups: Record<string, typeof sortedTasks> = {};
      priorityOrder.forEach(key => {
        if (groups[key]) {
          sortedGroups[key] = groups[key];
        }
      });
      return sortedGroups;
    }

    // Sort groups alphabetically, but put "Unassigned" last for assignee grouping
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (groupBy === 'assignee') {
        if (a === 'Unassigned') return 1;
        if (b === 'Unassigned') return -1;
      }
      return a.localeCompare(b);
    });

    const sortedGroups: Record<string, typeof sortedTasks> = {};
    sortedKeys.forEach(key => {
      sortedGroups[key] = groups[key];
    });

    return sortedGroups;
  }, [sortedTasks, groupBy]);

  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }

      // Save to localStorage
      try {
        localStorage.setItem('adminTasksHub_collapsedGroups', JSON.stringify(Array.from(newSet)));
      } catch (error) {
        console.error('Error saving collapsed groups to localStorage:', error);
      }

      return newSet;
    });
  };

  // Function to render task with subtasks
  const renderTaskWithSubtasks = (task: TaskWithDetails, depth: number = 0, allTasks: TaskWithDetails[] = []) => {
    // Add null safety checks
    if (!task || !task.id) {
      console.error('renderTaskWithSubtasks: Invalid task data', task);
      return null;
    }

    const isExpanded = expandedRows.has(task.id);
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const indentClass = depth > 0 ? `pl-${depth * 6}` : '';


    return (
      <React.Fragment key={task.id}>
        {/* Main Task Row */}
        <TableRow
          className={`cursor-pointer hover:bg-muted/30 hover:shadow-sm transition-all duration-200 h-12 group border-l-2 border-l-transparent hover:border-l-primary/50 ${
            depth > 0 ? 'bg-blue-50/30 dark:bg-blue-950/10 border-l-blue-200 dark:border-l-blue-800' : ''
          }`}
          onClick={() => toggleRowExpansion(task.id)}
        >
          <TableCell className="border-r border-border/50 py-2">
            <div className={`flex items-center gap-1 ${indentClass}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleRowExpansion(task.id);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
              {hasSubtasks && (
                <span className="text-xs bg-primary/10 text-primary px-1 rounded">
                  {task.subtasks!.length}
                </span>
              )}
              {depth > 0 && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1 rounded flex items-center gap-1">
                  <GitBranch className="w-2 h-2" />
                  L{depth}
                </span>
              )}
            </div>
          </TableCell>

          {/* Task ID */}
          <TableCell className="border-r border-border/50 py-2 whitespace-nowrap text-center">
            <div className="text-sm font-mono font-medium text-primary">
              #{getHierarchicalTaskId(task, allTasks)}
            </div>
          </TableCell>

          {/* Task Title */}
          <TableCell className="border-r border-border/50 py-2">
            <div className={`flex items-center gap-2 ${indentClass}`}>
              {/* Branch Visual Hierarchy */}
              {depth > 0 && (
                <div className="flex items-center">
                  {/* Render branch connectors for all parent levels */}
                  {Array.from({ length: depth }, (_, i) => (
                    <div key={i} className="relative w-4 h-4">
                      {i === depth - 1 ? (
                        // Last level - show branch connector
                        <div className="absolute inset-0">
                          <div className="absolute left-2 top-0 h-2 w-px bg-border" />
                          <div className="absolute left-2 top-2 w-2 h-px bg-border" />
                        </div>
                      ) : (
                        // Intermediate levels - show vertical line
                        <div className="absolute left-2 top-0 h-4 w-px bg-border opacity-30" />
                      )}
                    </div>
                  ))}
                  <GitBranch className="w-3 h-3 text-muted-foreground ml-1" />
                </div>
              )}

              <span className="text-sm font-medium truncate">{task.title}</span>
              {hasSubtasks && (
                <div className="text-xs text-muted-foreground">
                  ({task.completion_percentage || 0}% complete)
                </div>
              )}
            </div>
          </TableCell>

          {/* Assignee */}
          <TableCell className="border-r border-border/50 py-2" onClick={(e) => e.stopPropagation()}>
            <Popover
              open={assigneePopovers[task.id] || false}
              onOpenChange={(open) => {
                setAssigneePopovers(prev => ({ ...prev, [task.id]: open }));
                if (open && !usersEnabled) {
                  setUsersEnabled(true);
                }
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full h-8 border-0 bg-transparent hover:bg-muted/50 focus:ring-0 focus:ring-offset-0 justify-start p-0"
                >
                  <div className="flex items-center min-w-0">
                    <span className="text-sm truncate">
                      {task.assigned_user?.full_name || 'Unassigned'}
                    </span>
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0">
                <Command>
                  <CommandInput placeholder="Search employees..." />
                  <CommandEmpty>No employees found.</CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-auto">
                    {users.map((user) => (
                      <CommandItem
                        key={user.id}
                        value={`${user.full_name} ${user.role} ${user.department}`}
                        onSelect={() => {
                          handleAssigneeChange(task.id, user.id);
                          setAssigneePopovers(prev => ({ ...prev, [task.id]: false }));
                        }}
                      >
                        <div className="flex items-center flex-1">
                          <div>
                            <div className="font-medium">{user.full_name}</div>
                            <div className="text-xs text-muted-foreground">{user.role} • {user.department}</div>
                          </div>
                        </div>
                        {task.assigned_to === user.id && (
                          <Check className="h-4 w-4" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </TableCell>

          {/* Type */}
          <TableCell className="border-r border-border/50 py-2" onClick={(e) => e.stopPropagation()}>
            <Select
              value={task.task_type}
              onValueChange={(value) => handleTaskTypeChange(task.id, value)}
            >
              <SelectTrigger className="w-full h-8 border-0 bg-transparent hover:bg-muted/50 focus:ring-0 focus:ring-offset-0 whitespace-nowrap">
                <SelectValue asChild>
                  <div className="flex items-center">
                    <Badge variant="outline" className="capitalize whitespace-nowrap">
                      {task.task_type ? task.task_type.replace(/[_-]/g, ' ') : 'Select Type'}
                    </Badge>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="one-off">One Off</SelectItem>
              </SelectContent>
            </Select>
          </TableCell>

          {/* Priority */}
          <TableCell className="border-r border-border/50 py-2" onClick={(e) => e.stopPropagation()}>
            <Select
              value={task.priority}
              onValueChange={(value) => handlePriorityChange(task.id, value)}
            >
              <SelectTrigger className="w-full h-8 border-0 bg-transparent hover:bg-muted/50 focus:ring-0 focus:ring-offset-0 whitespace-nowrap">
                <SelectValue asChild>
                  <div className="flex items-center whitespace-nowrap">
                    {getPriorityBadge(task.priority)}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-red-600" />
                    <span>High</span>
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-yellow-600" />
                    <span>Medium</span>
                  </div>
                </SelectItem>
                <SelectItem value="low">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-gray-500" />
                    <span>Low</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </TableCell>

          {/* Status */}
          <TableCell className="border-r border-border/50 py-2" onClick={(e) => e.stopPropagation()}>
            <Select
              value={task.status}
              onValueChange={(value) => handleStatusChange(task.id, value)}
            >
              <SelectTrigger className="w-full h-8 border-0 bg-transparent hover:bg-muted/50 focus:ring-0 focus:ring-offset-0 whitespace-nowrap">
                <SelectValue asChild>
                  <div className="flex items-center whitespace-nowrap">
                    {getStatusBadge(task.status)}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="submitted_for_review">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="done_auto_approved">Done</SelectItem>
                <SelectItem value="incomplete">Incomplete</SelectItem>
              </SelectContent>
            </Select>
          </TableCell>

          {/* Due Date */}
          <TableCell className="border-r border-border/50 py-2" onClick={(e) => e.stopPropagation()}>
            <DatePicker
              value={task.due_date ? new Date(task.due_date) : undefined}
              onChange={(date) => handleDueDateChange(task.id, date)}
              placeholder="Select due date"
              className="w-full h-8 border-0 bg-transparent hover:bg-muted/50 focus:ring-0 focus:ring-offset-0 text-sm"
            />
          </TableCell>

          {/* Created By */}
          <TableCell className="border-r border-border/50 py-2">
            <span className="text-sm truncate">
              {task.assigned_by_user?.full_name || 'Unknown'}
            </span>
          </TableCell>

          <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              {/* Comments Button - Always visible with count badge on icon */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedTaskForComments(task);
                  setCommentsDialogOpen(true);
                }}
                className="h-8 w-8 p-0 relative"
                title={`View/Add Comments (${getCommentCount(task.id)} comments)`}
              >
                <MessageSquare className="h-4 w-4" />
                {getCommentCount(task.id) > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs bg-blue-500 text-white border-2 border-white dark:border-gray-800 rounded-full"
                  >
                    {getCommentCount(task.id)}
                  </Badge>
                )}
              </Button>

              {/* Other Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setEditingTask(task);
                      setEditTaskOpen(true);
                    }}
                  >
                    Edit Task
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleArchiveTask(task.id, task.title)}
                  >
                    {task.status === 'done_auto_approved' ? 'Unarchive Task' : 'Archive Task'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleDeleteTask(task.id, task.title, hasSubtasks)}
                  >
                    Delete Task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TableCell>
        </TableRow>

        {/* Expanded Details Row */}
        {isExpanded && (
          <TableRow className="bg-muted/20">
            <TableCell colSpan={8} className="p-4">
              {/* Card Background for Description and Details */}
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg border border-border/30 shadow-sm p-4">
                <div className="grid grid-cols-12 gap-6">
                  {/* Left Side: Description and Details */}
                  <div className="col-span-8 space-y-4">
                    {/* Description */}
                    <div>
                      <span className="text-sm font-medium text-foreground">Description:</span>
                      <span className="text-sm text-muted-foreground ml-2">{renderRichContent(task.description || 'No description provided')}</span>
                    </div>

                    {/* All details in one organized line - very small and subtle */}
                    <div className="flex flex-wrap items-center gap-3 text-xs opacity-60">
                      <div className="flex items-center gap-1">
                        <span className="font-normal text-muted-foreground/80">Assignee:</span>
                        <span className="text-muted-foreground/70">{task.assigned_user?.full_name || 'Unassigned'}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="font-normal text-muted-foreground/80">Type:</span>
                        <span className="text-muted-foreground/70 capitalize">
                          {task.task_type.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="font-normal text-muted-foreground/80">Priority:</span>
                        <span className="text-muted-foreground/70 capitalize">{task.priority}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="font-normal text-muted-foreground/80">Status:</span>
                        <span className="text-muted-foreground/70 capitalize">{task.status.replace('_', ' ')}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="font-normal text-muted-foreground/80">Due Date:</span>
                        <span className="text-muted-foreground/70">
                          {task.due_date
                            ? new Date(task.due_date).toLocaleDateString()
                            : 'No due date'
                          }
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="font-normal text-muted-foreground/80">Created By:</span>
                        <span className="text-muted-foreground/70">
                          {task.assigned_by_user?.full_name || 'Unknown'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="font-normal text-muted-foreground/80">Created:</span>
                        <span className="text-muted-foreground/70">
                          {task.created_at && new Date(task.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Vertical Divider */}
                  <div className="col-span-1 flex justify-center">
                    <div className="h-full w-px bg-border/50"></div>
                  </div>

                  {/* Right Side: Media Files */}
                  <div className="col-span-3">
                    <div className="space-y-3">
                      <span className="text-sm font-medium text-foreground">Media Files:</span>

                      {/* Show submissions if available */}
                      {task.submissions && task.submissions.length > 0 ? (
                        <div className="space-y-2">
                          {task.submissions
                            .filter(submission =>
                              submission.submission_type === 'evidence' &&
                              (submission.file_url || submission.link_url)
                            )
                            .map((submission, index) => (
                              <div key={submission.id || index} className="flex items-center gap-2 p-2 bg-muted/30 rounded border">
                                {submission.evidence_type === 'photo' && (
                                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center">
                                    📷
                                  </div>
                                )}
                                {submission.evidence_type === 'file' && (
                                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded flex items-center justify-center">
                                    {(() => {
                                      const fileName = submission.file_name?.toLowerCase() || '';
                                      const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.webm', '.m4v'];
                                      const isVideo = videoExtensions.some(ext => fileName.endsWith(ext));
                                      return isVideo ? '🎥' : '📁';
                                    })()}
                                  </div>
                                )}
                                {submission.evidence_type === 'link' && (
                                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded flex items-center justify-center">
                                    🔗
                                  </div>
                                )}

                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-foreground truncate">
                                    {submission.file_name || 'Media File'}
                                  </p>
                                  <p className="text-xs text-muted-foreground capitalize">
                                    {submission.evidence_type}
                                  </p>
                                </div>

                                <div className="flex items-center gap-1">
                                  {(submission.file_url || submission.link_url) && (
                                    <a
                                      href={submission.file_url || submission.link_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}

                                  {/* Mini Delete Button */}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEvidenceDelete(submission.id, submission.file_path)}
                                    disabled={submissionLoading || deletingSubmissionId === submission.id}
                                    className="h-5 w-5 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                    title={deletingSubmissionId === submission.id ? "Deleting..." : "Delete evidence"}
                                  >
                                    {deletingSubmissionId === submission.id ? (
                                      <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <X className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground/60 italic">
                          No media files uploaded yet
                        </div>
                      )}

                      {/* Upload Evidence Section - Multiple Files & Links */}
                      <div className="mt-4 space-y-3 border-t border-border/30 pt-3">
                        <div className="text-xs font-medium text-foreground mb-2">Upload Evidence:</div>

                        {/* File Upload Area */}
                        <div className="space-y-2">
                          <div
                            className="border-2 border-dashed border-border/50 rounded-lg p-3 hover:border-border/80 transition-colors cursor-pointer"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.multiple = true;
                              input.accept = 'image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv';
                              input.onchange = async (e) => {
                                const files = Array.from((e.target as HTMLInputElement).files || []);
                                for (const file of files) {
                                  let evidenceType = 'file';
                                  if (file.type.startsWith('image/')) {
                                    evidenceType = 'photo';
                                  } else if (file.type.startsWith('video/')) {
                                    evidenceType = 'file'; // Videos are treated as files for storage
                                  }
                                  await handleEvidenceUpload(task, { type: evidenceType, file });
                                }
                              };
                              input.click();
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.currentTarget.classList.add('border-blue-300', 'bg-blue-50/50');
                            }}
                            onDragLeave={(e) => {
                              e.preventDefault();
                              e.currentTarget.classList.remove('border-blue-300', 'bg-blue-50/50');
                            }}
                            onDrop={async (e) => {
                              e.preventDefault();
                              e.currentTarget.classList.remove('border-blue-300', 'bg-blue-50/50');
                              const files = Array.from(e.dataTransfer.files);
                              for (const file of files) {
                                let evidenceType = 'file';
                                if (file.type.startsWith('image/')) {
                                  evidenceType = 'photo';
                                } else if (file.type.startsWith('video/')) {
                                  evidenceType = 'file'; // Videos are treated as files for storage
                                }
                                await handleEvidenceUpload(task, { type: evidenceType, file });
                              }
                            }}
                          >
                            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                              {submissionLoading ? (
                                <>
                                  <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                  {deletingSubmissionId ? 'Deleting...' : 'Uploading...'}
                                </>
                              ) : (
                                <>
                                  <Upload className="h-3 w-3" />
                                  Drop files/videos or click to upload
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Links Section */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Add a link (URL)..."
                              className="text-xs h-7 flex-1"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const input = e.target as HTMLInputElement;
                                  const url = input.value.trim();
                                  if (url) {
                                    try {
                                      new URL(url);
                                      handleEvidenceUpload(task, { type: 'link', url });
                                      input.value = '';
                                    } catch {
                                      toast({
                                        title: "Invalid URL",
                                        description: "Please enter a valid URL",
                                        variant: "destructive",
                                      });
                                    }
                                  }
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement;
                                const url = input?.value.trim();
                                if (url) {
                                  try {
                                    new URL(url);
                                    handleEvidenceUpload(task, { type: 'link', url });
                                    input.value = '';
                                  } catch {
                                    toast({
                                      title: "Invalid URL",
                                      description: "Please enter a valid URL",
                                      variant: "destructive",
                                    });
                                  }
                                }
                              }}
                              disabled={submissionLoading}
                              className="text-xs h-7 px-2"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Evidence Required Info */}
                      {task.evidence_required !== 'none' && (
                        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200 dark:border-amber-800">
                          <p className="text-xs text-amber-700 dark:text-amber-300">
                            <span className="font-medium">Evidence Required:</span> {task.evidence_required}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TableCell>
          </TableRow>
        )}

        {/* Render Subtasks */}
        {hasSubtasks && isExpanded && task.subtasks!.map((subtask) =>
          renderTaskWithSubtasks(subtask, depth + 1, allTasks)
        )}
      </React.Fragment>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const config = {
      high: { icon: AlertTriangle, color: 'text-red-600', label: 'High' },
      medium: { icon: Clock, color: 'text-yellow-600', label: 'Medium' },
      low: { icon: Clock, color: 'text-gray-500', label: 'Low' }
    };

    const { icon: Icon, color, label } = config[priority as keyof typeof config] || config.medium;

    return (
      <div className="flex items-center gap-1 whitespace-nowrap">
        <Icon className={`h-3 w-3 ${color}`} />
        <span className="text-sm">{label}</span>
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { icon: Clock, color: 'text-muted-foreground', label: 'Pending' },
      in_progress: { icon: AlertTriangle, color: 'text-primary', label: 'In Progress' },
      submitted_for_review: { icon: Clock, color: 'text-yellow-600', label: 'Submitted' },
      approved: { icon: CheckCircle, color: 'text-green-600', label: 'Approved' },
      rejected: { icon: AlertTriangle, color: 'text-red-600', label: 'Rejected' },
      done_auto_approved: { icon: CheckCircle, color: 'text-green-600', label: 'Done' },
      incomplete: { icon: AlertTriangle, color: 'text-orange-600', label: 'Incomplete' }
    };

    const { icon: Icon, color, label } = config[status as keyof typeof config] || config.pending;

    return (
      <div className="flex items-center gap-1 whitespace-nowrap">
        <Icon className={`h-3 w-3 ${color}`} />
        <span className="text-sm capitalize">{label}</span>
      </div>
    );
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
    const headers = ['System ID', 'Task ID', 'Title', 'Type', 'Priority', 'Status', 'Assignee', 'Due Date', 'Created'];
    const rows = tasks.map(task => [
      task.id,
      task.task_id || '--',
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

  const handleAdvancedFilterChange = (key: string, value: any) => {
    setAdvancedFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleStatusToggle = (status: string) => {
    setAdvancedFilters(prev => ({
      ...prev,
      selectedStatuses: prev.selectedStatuses.includes(status)
        ? prev.selectedStatuses.filter(s => s !== status)
        : [...prev.selectedStatuses, status]
    }));
  };

  const handlePriorityToggle = (priority: string) => {
    setAdvancedFilters(prev => ({
      ...prev,
      selectedPriorities: prev.selectedPriorities.includes(priority)
        ? prev.selectedPriorities.filter(p => p !== priority)
        : [...prev.selectedPriorities, priority]
    }));
  };

  const handleTypeToggle = (type: string) => {
    setAdvancedFilters(prev => ({
      ...prev,
      selectedTypes: prev.selectedTypes.includes(type)
        ? prev.selectedTypes.filter(t => t !== type)
        : [...prev.selectedTypes, type]
    }));
  };

  const handleAssigneeToggle = (assigneeId: string) => {
    setAdvancedFilters(prev => ({
      ...prev,
      selectedAssignees: prev.selectedAssignees.includes(assigneeId)
        ? prev.selectedAssignees.filter(a => a !== assigneeId)
        : [...prev.selectedAssignees, assigneeId]
    }));
  };

  const clearAllFilters = () => {
    setAdvancedFilters({
      dateRange: '',
      selectedStatuses: [],
      selectedPriorities: [],
      selectedTypes: [],
      selectedAssignees: [],
      isOverdue: false,
      hasNoAssignee: false,
      showArchived: false,
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (advancedFilters.dateRange) count++;
    if (advancedFilters.selectedStatuses.length > 0) count++;
    if (advancedFilters.selectedPriorities.length > 0) count++;
    if (advancedFilters.selectedTypes.length > 0) count++;
    if (advancedFilters.selectedAssignees.length > 0) count++;
    if (advancedFilters.isOverdue) count++;
    if (advancedFilters.hasNoAssignee) count++;
    if (advancedFilters.showArchived) count++;
    return count;
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending', icon: Clock },
    { value: 'in_progress', label: 'In Progress', icon: AlertTriangle },
    { value: 'submitted_for_review', label: 'Submitted', icon: Clock },
    { value: 'approved', label: 'Approved', icon: CheckCircle },
    { value: 'rejected', label: 'Rejected', icon: AlertTriangle },
    { value: 'done_auto_approved', label: 'Done', icon: CheckCircle },
    { value: 'incomplete', label: 'Incomplete', icon: AlertTriangle },
  ];

  const priorityOptions = [
    { value: 'high', label: 'High', icon: AlertTriangle },
    { value: 'medium', label: 'Medium', icon: Clock },
    { value: 'low', label: 'Low', icon: Clock },
  ];

  const typeOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'one_off', label: 'One Off' },
    { value: 'recurring', label: 'Recurring' },
    { value: 'project', label: 'Project' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'urgent', label: 'Urgent' },
  ];


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

      {/* Tasks table */}
      {tasks.length > 0 ? (
        <div className="border overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                <TableHead className="w-8 border-r border-border/50"></TableHead>
                <TableHead className="w-16 border-r border-border/50 whitespace-nowrap">
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 p-0 h-auto font-semibold hover:bg-transparent"
                    onClick={() => handleSort('task_id')}
                  >
                    ID
                    {getSortIcon('task_id')}
                  </Button>
                </TableHead>
                <TableHead className="border-r border-border/50 whitespace-nowrap">
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 p-0 h-auto font-semibold hover:bg-transparent"
                    onClick={() => handleSort('title')}
                  >
                    Task
                    {getSortIcon('title')}
                  </Button>
                </TableHead>
                <TableHead className="w-48 border-r border-border/50 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      className="flex items-center gap-1 p-0 h-auto font-semibold hover:bg-transparent"
                      onClick={() => handleSort('assignee')}
                    >
                      Assignee
                      {getSortIcon('assignee')}
                    </Button>
                    <DropdownMenu
                      onOpenChange={(open) => {
                        if (open && !usersEnabled) {
                          setUsersEnabled(true);
                        }
                      }}
                    >
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => setAdvancedFilters({...advancedFilters, selectedAssignees: []})}>
                          All Assignees
                        </DropdownMenuItem>
                        {users?.map((user) => (
                          <DropdownMenuItem
                            key={user.id}
                            onClick={() => setAdvancedFilters({...advancedFilters, selectedAssignees: [user.id]})}
                          >
                            {user.full_name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableHead>
                <TableHead className="w-32 border-r border-border/50 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      className="flex items-center gap-1 p-0 h-auto font-semibold hover:bg-transparent"
                      onClick={() => handleSort('type')}
                    >
                      Type
                      {getSortIcon('type')}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => setAdvancedFilters({...advancedFilters, selectedTypes: []})}>
                          All Types
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAdvancedFilters({...advancedFilters, selectedTypes: ['daily']})}>
                          Daily
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAdvancedFilters({...advancedFilters, selectedTypes: ['one-off']})}>
                          One-off
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableHead>
                <TableHead className="w-32 border-r border-border/50 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      className="flex items-center gap-1 p-0 h-auto font-semibold hover:bg-transparent"
                      onClick={() => handleSort('priority')}
                    >
                      Priority
                      {getSortIcon('priority')}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => setAdvancedFilters({...advancedFilters, selectedPriorities: []})}>
                          All Priorities
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAdvancedFilters({...advancedFilters, selectedPriorities: ['high']})}>
                          High
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAdvancedFilters({...advancedFilters, selectedPriorities: ['medium']})}>
                          Medium
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAdvancedFilters({...advancedFilters, selectedPriorities: ['low']})}>
                          Low
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableHead>
                <TableHead className="w-32 border-r border-border/50 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      className="flex items-center gap-1 p-0 h-auto font-semibold hover:bg-transparent"
                      onClick={() => handleSort('status')}
                    >
                      Status
                      {getSortIcon('status')}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => setAdvancedFilters({...advancedFilters, selectedStatuses: []})}>
                          All Status
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAdvancedFilters({...advancedFilters, selectedStatuses: ['pending']})}>
                          Pending
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAdvancedFilters({...advancedFilters, selectedStatuses: ['in_progress']})}>
                          In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAdvancedFilters({...advancedFilters, selectedStatuses: ['submitted_for_review']})}>
                          Submitted
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAdvancedFilters({...advancedFilters, selectedStatuses: ['approved']})}>
                          Approved
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAdvancedFilters({...advancedFilters, selectedStatuses: ['rejected']})}>
                          Rejected
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAdvancedFilters({...advancedFilters, selectedStatuses: ['done_auto_approved']})}>
                          Done/Archived
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAdvancedFilters({...advancedFilters, selectedStatuses: ['incomplete']})}>
                          Incomplete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableHead>
                <TableHead className="w-32 border-r border-border/50 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      className="flex items-center gap-1 p-0 h-auto font-semibold hover:bg-transparent"
                      onClick={() => handleSort('due_date')}
                    >
                      Due Date
                      {getSortIcon('due_date')}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => setAdvancedFilters({...advancedFilters, dateRange: ''})}>
                          All Dates
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          const today = new Date().toISOString().split('T')[0];
                          setAdvancedFilters({...advancedFilters, dateRange: today});
                        }}>
                          Today
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          const tomorrowStr = tomorrow.toISOString().split('T')[0];
                          setAdvancedFilters({...advancedFilters, dateRange: tomorrowStr});
                        }}>
                          Tomorrow
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          const today = new Date().toISOString().split('T')[0];
                          const nextWeek = new Date();
                          nextWeek.setDate(nextWeek.getDate() + 7);
                          const nextWeekStr = nextWeek.toISOString().split('T')[0];
                          setAdvancedFilters({...advancedFilters, dateRange: `${today} to ${nextWeekStr}`});
                        }}>
                          Next 7 Days
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setAdvancedFilters({...advancedFilters, isOverdue: true});
                        }}>
                          Overdue
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setAdvancedFilters({...advancedFilters, showArchived: true});
                        }}>
                          Archived
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableHead>
                <TableHead className="w-32 border-r border-border/50 whitespace-nowrap">
                  Created By
                </TableHead>
                <TableHead className="w-24 whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(groupedTasks).map(([groupKey, groupTasks]) => (
                <React.Fragment key={groupKey}>
                  {/* Group Header Row */}
                  {groupBy !== 'none' && (
                    <TableRow className="bg-muted/20 hover:bg-muted/30 transition-colors">
                      <TableCell colSpan={10} className="py-3">
                        <Button
                          variant="ghost"
                          className="flex items-center gap-2 p-0 h-auto font-semibold hover:bg-transparent text-left w-full justify-start"
                          onClick={() => toggleGroupCollapse(groupKey)}
                        >
                          {collapsedGroups.has(groupKey) ? (
                            <ChevronRight className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          <span className="text-sm font-medium">{groupKey}</span>
                          <Badge variant="secondary" className="ml-2">
                            {groupTasks.length}
                          </Badge>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Group Tasks */}
                  {!collapsedGroups.has(groupKey) && groupTasks
                    .filter(task => !task.parent_task_id) // Only render parent tasks, subtasks will be handled recursively
                    .map((task) => {
                      // Use renderTaskWithSubtasks for all tasks (handles both with and without subtasks)
                      return renderTaskWithSubtasks(task, 0, sortedTasks);
                    })}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
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


  // Show loading state for faster perceived performance
  if (loading && tasks.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Task Management</h1>
          <div className="flex items-center gap-2">
            <div className="h-9 w-24 bg-muted animate-pulse rounded"></div>
            <div className="h-9 w-32 bg-muted animate-pulse rounded"></div>
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Task Management</h1>
        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={loading}
            title="Refresh tasks"
          >
            <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          {/* Actions */}
          <Button onClick={() => navigate('/ai-task-analyzer')} variant="outline">
            <Brain className="h-4 w-4 mr-2" />
            AI Task Analyzer
          </Button>

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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'todo' | 'under_review' | 'incomplete' | 'completed' | 'archived' | 'all')}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="todo">To Do</TabsTrigger>
          <TabsTrigger value="under_review">Under Review</TabsTrigger>
          <TabsTrigger value="incomplete">Incomplete</TabsTrigger>
          <TabsTrigger value="completed">Completed Tasks</TabsTrigger>
          <TabsTrigger value="archived">Archived Tasks</TabsTrigger>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="todo" className="space-y-6">
          {/* Search and filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-80">
                  <Input
                    placeholder="Search to-do tasks by title, assignee, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
            <div className="flex gap-2">
              <Select value={groupBy} onValueChange={(value) => setGroupBy(value as typeof groupBy)}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Group By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Grouping</SelectItem>
                  <SelectItem value="assignee">By Assignee</SelectItem>
                  <SelectItem value="priority">By Priority</SelectItem>
                  <SelectItem value="status">By Status</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortField} onValueChange={(value) => setSortField(value as typeof sortField)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Created</SelectItem>
                  <SelectItem value="due_date">Due Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="assignee">Assignee</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="px-3"
              >
                {getSortIcon()}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setAdvancedFiltersOpen(!advancedFiltersOpen)}
                className="whitespace-nowrap"
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="px-3">
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => exportTasks('csv', sortedTasks.filter(task => ['pending', 'in_progress'].includes(task.status)))}>
                    Export To-Do as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportTasks('json', sortedTasks.filter(task => ['pending', 'in_progress'].includes(task.status)))}>
                    Export To-Do as JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasks display */}
          {renderTasksList()}
        </TabsContent>

        <TabsContent value="all" className="space-y-6">
          {/* Search and filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-80">
                  <Input
                    placeholder="Search tasks by title, assignee, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
            <div className="flex gap-2">
              <Select value={groupBy} onValueChange={(value) => setGroupBy(value as typeof groupBy)}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Group By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Grouping</SelectItem>
                  <SelectItem value="priority">Group by Priority</SelectItem>
                  <SelectItem value="assignee">Group by Assignee</SelectItem>
                  <SelectItem value="status">Group by Status</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={advancedFilters.selectedTypes?.length === 1 ? advancedFilters.selectedTypes[0] : "all"}
                onValueChange={(value) => {
                  if (value === "all") {
                    setAdvancedFilters({...advancedFilters, selectedTypes: []});
                  } else {
                    setAdvancedFilters({...advancedFilters, selectedTypes: [value]});
                  }
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="one-off">One-off</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={advancedFilters.selectedStatuses?.length === 1 ? advancedFilters.selectedStatuses[0] : "all"}
                onValueChange={(value) => {
                  if (value === "all") {
                    setAdvancedFilters({...advancedFilters, selectedStatuses: []});
                  } else {
                    setAdvancedFilters({...advancedFilters, selectedStatuses: [value]});
                  }
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="submitted_for_review">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="done_auto_approved">Done</SelectItem>
                  <SelectItem value="incomplete">Incomplete</SelectItem>
                </SelectContent>
              </Select>
              <Dialog
                open={advancedFiltersOpen}
                onOpenChange={(open) => {
                  setAdvancedFiltersOpen(open);
                  if (open && !usersEnabled) {
                    setUsersEnabled(true);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="relative">
                    <Filter className="h-4 w-4 mr-2" />
                    Advanced Filters
                    {getActiveFilterCount() > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                        {getActiveFilterCount()}
                      </Badge>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Advanced Filters</DialogTitle>
                    <DialogDescription>
                      Filter tasks by multiple criteria to find exactly what you're looking for.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-4">

                    {/* Date Range Filter */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Due Date Range</Label>
                      <DateRangePicker
                        value={advancedFilters.dateRange}
                        onChange={(dateRange) => handleAdvancedFilterChange('dateRange', dateRange)}
                        placeholder="Select date range"
                        className="w-full"
                      />
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Status</Label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {statusOptions.map((status) => {
                          const Icon = status.icon;
                          return (
                            <div key={status.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={`status-${status.value}`}
                                checked={advancedFilters.selectedStatuses.includes(status.value)}
                                onCheckedChange={() => handleStatusToggle(status.value)}
                              />
                              <Label
                                htmlFor={`status-${status.value}`}
                                className="flex items-center gap-2 text-sm cursor-pointer"
                              >
                                <Icon className="h-3 w-3" />
                                {status.label}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Priority Filter */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Priority</Label>
                      <div className="space-y-2">
                        {priorityOptions.map((priority) => {
                          const Icon = priority.icon;
                          return (
                            <div key={priority.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={`priority-${priority.value}`}
                                checked={advancedFilters.selectedPriorities.includes(priority.value)}
                                onCheckedChange={() => handlePriorityToggle(priority.value)}
                              />
                              <Label
                                htmlFor={`priority-${priority.value}`}
                                className="flex items-center gap-2 text-sm cursor-pointer"
                              >
                                <Icon className="h-3 w-3" />
                                {priority.label}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Type Filter */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Task Type</Label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {typeOptions.map((type) => (
                          <div key={type.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`type-${type.value}`}
                              checked={advancedFilters.selectedTypes.includes(type.value)}
                              onCheckedChange={() => handleTypeToggle(type.value)}
                            />
                            <Label
                              htmlFor={`type-${type.value}`}
                              className="text-sm cursor-pointer"
                            >
                              {type.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Assignee Filter */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Assignees</Label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {users?.map((user) => (
                          <div key={user.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`assignee-${user.id}`}
                              checked={advancedFilters.selectedAssignees.includes(user.id)}
                              onCheckedChange={() => handleAssigneeToggle(user.id)}
                            />
                            <Label
                              htmlFor={`assignee-${user.id}`}
                              className="text-sm cursor-pointer"
                            >
                              {user.full_name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Special Filters */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Special Filters</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="overdue"
                            checked={advancedFilters.isOverdue}
                            onCheckedChange={(checked) => handleAdvancedFilterChange('isOverdue', checked)}
                          />
                          <Label htmlFor="overdue" className="text-sm cursor-pointer">
                            Overdue tasks only
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="unassigned"
                            checked={advancedFilters.hasNoAssignee}
                            onCheckedChange={(checked) => handleAdvancedFilterChange('hasNoAssignee', checked)}
                          />
                          <Label htmlFor="unassigned" className="text-sm cursor-pointer">
                            Unassigned tasks only
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="archived"
                            checked={advancedFilters.showArchived}
                            onCheckedChange={(checked) => handleAdvancedFilterChange('showArchived', checked)}
                          />
                          <Label htmlFor="archived" className="text-sm cursor-pointer">
                            Show archived tasks
                          </Label>
                        </div>
                      </div>
                    </div>

                  </div>

                  <Separator />

                  <DialogFooter className="gap-2">
                    <Button
                      variant="outline"
                      onClick={clearAllFilters}
                      disabled={getActiveFilterCount() === 0}
                    >
                      <FilterX className="h-4 w-4 mr-2" />
                      Clear All Filters
                    </Button>
                    <Button onClick={() => setAdvancedFiltersOpen(false)}>
                      Apply Filters
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      {renderTasksList()}
        </TabsContent>

        <TabsContent value="completed" className="space-y-6">
          {/* Search and filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-80">
                  <Input
                    placeholder="Search completed tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasks Table for Completed */}
          {renderTasksList()}
        </TabsContent>

        <TabsContent value="under_review" className="space-y-6">
          {/* Search and filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-80">
                  <Input
                    placeholder="Search tasks under review..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasks Table for Under Review */}
          {renderTasksList()}
        </TabsContent>

        <TabsContent value="incomplete" className="space-y-6">
          {/* Search and filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-80">
                  <Input
                    placeholder="Search incomplete tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasks Table for Incomplete */}
          {renderTasksList()}
        </TabsContent>

        <TabsContent value="archived" className="space-y-6">
          {/* Search and filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-80">
                  <Input
                    placeholder="Search archived tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasks Table for Archived */}
          {renderTasksList()}
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

      {/* Edit task form */}
      <CreateTaskForm
        open={editTaskOpen}
        onOpenChange={(open) => {
          setEditTaskOpen(open);
          if (!open) {
            setEditingTask(null);
          }
        }}
        task={editingTask}
        mode="edit"
        onTaskCreated={() => {
          refetch(); // Refresh the tasks list
          setEditingTask(null);
        }}
      />

      {/* Task Comments Dialog */}
      <Dialog
        open={commentsDialogOpen}
        onOpenChange={(open) => {
          setCommentsDialogOpen(open);
          if (!open) {
            // Refresh comment counts when dialog closes
            refetchComments();
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Task Comments: {selectedTaskForComments?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedTaskForComments && (
            <TaskComments taskId={selectedTaskForComments.id} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
