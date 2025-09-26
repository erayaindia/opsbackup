import React, { useState, useMemo, useEffect } from 'react';
import { renderRichContent } from '@/lib/textUtils';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
} from 'lucide-react';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskDrawer } from '@/components/tasks/TaskDrawer';
import { CreateTaskForm } from '@/components/tasks/CreateTaskForm';
import { EvidenceUploader } from '@/components/tasks/EvidenceUploader';
import { useTasks } from '@/hooks/useTasks';
import { useTaskCreation } from '@/hooks/useTaskCreation';
import { useTaskReviews } from '@/hooks/useTaskReviews';
import { useTaskSubmissions } from '@/hooks/useTaskSubmissions';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUsers } from '@/hooks/useUsers';
import { useToast } from '@/components/ui/use-toast';
import {
  Task,
  TaskWithDetails,
  TaskFilters,
  TaskViewMode,
  TaskStatus,
  TaskPriority,
  TaskType,
  TaskSort,
} from '@/types/tasks';

export default function MyTasks() {
  // All state variables from AdminTasksHub
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<TaskViewMode>('list');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [assigneePopovers, setAssigneePopovers] = useState<Record<string, boolean>>({});
  const [optimisticTaskStatuses, setOptimisticTaskStatuses] = useState<Record<string, string>>({});
  const [workingSessions, setWorkingSessions] = useState<Record<string, boolean>>({});
  const [taskTimers, setTaskTimers] = useState<Record<string, number>>({});
  const [timerStartTimes, setTimerStartTimes] = useState<Record<string, number>>({});
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<TaskFilters>({});
  const [sortField, setSortField] = useState<string>('due_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [groupBy, setGroupBy] = useState<'none' | 'priority' | 'assignee' | 'status'>('none');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(new Date()); // Default to today
  const [advancedFilters, setAdvancedFilters] = useState({
    dateRange: '',
    selectedStatuses: [] as string[],
    selectedPriorities: [] as string[],
    selectedTypes: [] as string[],
    selectedAssignees: [] as string[],
    isOverdue: false,
    hasNoAssignee: false,
  });
  const [deletingSubmissionId, setDeletingSubmissionId] = useState<string | null>(null);

  const { toast } = useToast();
  const { profile, loading: profileLoading } = useUserProfile();

  // Load tasks assigned to current user only - including subtasks
  // Only make the query when we have a valid user ID
  const currentUserId = profile?.appUser?.id;
  const shouldFetchTasks = !profileLoading && currentUserId;

  // Fixed: Don't run query until we have a user ID
  const taskFilters = currentUserId ? {
    ...filters,
    search: searchTerm,
    includeSubtasks: true, // Include subtasks assigned to current user
    assignee: currentUserId, // This MUST be last to override any assignee in filters
  } : {
    // When no user ID, use a filter that returns no results
    assignee: 'NO_USER_LOADED_YET',
    includeSubtasks: true,
  };

  // Minimal debug
  if (currentUserId) {
    console.log('🔍 MyTasks: User loaded, querying for:', currentUserId);
  }

  // TEMPORARY: Direct query to bypass useTasks hook issues
  const [directTasks, setDirectTasks] = useState<any[]>([]);
  const [directLoading, setDirectLoading] = useState(false);

  useEffect(() => {
    if (currentUserId) {
      const fetchDirectTasks = async () => {
        setDirectLoading(true);
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          console.log('🎯 DIRECT QUERY: Fetching tasks for user:', currentUserId);

          const { data: directTaskData, error: directError } = await supabase
            .from('tasks')
            .select(`
              id, title, description, task_type, status, priority, due_date, due_time,
              assigned_to, assigned_by, reviewer_id, parent_task_id, task_level,
              completion_percentage, created_at, updated_at, work_duration_seconds,
              assigned_user:app_users!tasks_assigned_to_fkey(id, full_name, role, department),
              assigned_by_user:app_users!tasks_assigned_by_fkey(id, full_name),
              reviewer:app_users!tasks_reviewer_id_fkey(id, full_name),
              submissions:task_submissions(*),
              reviews:task_reviews(*)
            `)
            .eq('assigned_to', currentUserId)
            .order('due_date', { ascending: true });

          console.log('🎯 DIRECT QUERY RESULT:', { directTaskData, directError, currentUserId });

          if (!directError && directTaskData) {
            setDirectTasks(directTaskData);

            // Initialize timers from database for in_progress tasks
            directTaskData.forEach((task: any) => {
              if (task.status === 'in_progress' && task.work_duration_seconds > 0) {
                setTaskTimers(prev => ({
                  ...prev,
                  [task.id]: task.work_duration_seconds * 1000 // Convert seconds to milliseconds
                }));
              }
            });
          } else {
            console.error('🎯 DIRECT QUERY ERROR:', directError);
            setDirectTasks([]);
          }
        } catch (err) {
          console.error('🎯 DIRECT QUERY EXCEPTION:', err);
          setDirectTasks([]);
        } finally {
          setDirectLoading(false);
        }
      };

      fetchDirectTasks();
    }
  }, [currentUserId]);

  // Use direct tasks instead of useTasks result for now
  const tasks = directTasks;
  const loading = directLoading;
  const error = null;

  // Refetch function that actually re-fetches tasks
  const refetch = async () => {
    if (!currentUserId) return;

    console.log('🔄 Direct refetch called');
    setDirectLoading(true);

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      console.log('🎯 REFETCH: Fetching tasks for user:', currentUserId);

      const { data: directTaskData, error: directError } = await supabase
        .from('tasks')
        .select(`
          id, title, description, task_type, status, priority, due_date, due_time,
          assigned_to, assigned_by, reviewer_id, parent_task_id, task_level,
          completion_percentage, created_at, updated_at, work_duration_seconds,
          assigned_user:app_users!tasks_assigned_to_fkey(id, full_name, role, department),
          assigned_by_user:app_users!tasks_assigned_by_fkey(id, full_name),
          reviewer:app_users!tasks_reviewer_id_fkey(id, full_name),
          submissions:task_submissions(*),
          reviews:task_reviews(*)
        `)
        .eq('assigned_to', currentUserId)
        .order('due_date', { ascending: true });

      console.log('🎯 REFETCH RESULT:', { directTaskData, directError, currentUserId });

      if (!directError && directTaskData) {
        setDirectTasks(directTaskData);
        console.log('✅ Refetch successful, loaded', directTaskData.length, 'tasks');

        // Initialize timers from database for in_progress tasks
        directTaskData.forEach((task: any) => {
          if (task.status === 'in_progress' && task.work_duration_seconds > 0) {
            setTaskTimers(prev => ({
              ...prev,
              [task.id]: task.work_duration_seconds * 1000 // Convert seconds to milliseconds
            }));
          }
        });
      } else {
        console.error('🎯 REFETCH ERROR:', directError);
        setDirectTasks([]);
      }
    } catch (err) {
      console.error('🎯 REFETCH EXCEPTION:', err);
      setDirectTasks([]);
    } finally {
      setDirectLoading(false);
    }
  };
  const bulkAction = async () => ({ error: { message: 'Not implemented in direct mode' } });
  const updateTask = async () => ({ error: { message: 'Not implemented in direct mode' } });
  const deleteTask = async () => ({ error: { message: 'Not implemented in direct mode' } });

  // Original useTasks call (commented out)
  // const { tasks, loading, error, refetch, bulkAction, updateTask, deleteTask } = useTasks(taskFilters);

  // Clean debug - only log final result
  useEffect(() => {
    if (currentUserId && tasks.length >= 0) {
      console.log(`🎯 FINAL RESULT: User ${currentUserId} has ${tasks.length} tasks`);
      if (tasks.length > 0) {
        console.log('🎯 Task titles:', tasks.map(t => t.title));
      }
    }
  }, [currentUserId, tasks.length]);

  // Timer effect - update timers every second for active working sessions
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTaskTimers(prev => {
        const updated = { ...prev };
        Object.keys(workingSessions).forEach(taskId => {
          if (workingSessions[taskId] && timerStartTimes[taskId]) {
            // Add elapsed time since last update
            const elapsed = now - timerStartTimes[taskId];
            updated[taskId] = (updated[taskId] || 0) + elapsed;
          }
        });
        return updated;
      });

      // Update start times to current time for next interval
      setTimerStartTimes(prev => {
        const updated = { ...prev };
        Object.keys(workingSessions).forEach(taskId => {
          if (workingSessions[taskId]) {
            updated[taskId] = now;
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [workingSessions, timerStartTimes]);

  // Lazy load users only when needed (when dropdowns are opened)
  const [usersEnabled, setUsersEnabled] = useState(false);
  const { users } = useUsers(usersEnabled);
  const { createTask, createTaskFromTemplate, createDailyTasks, loading: creationLoading } = useTaskCreation();
  const { bulkReview, loading: reviewLoading } = useTaskReviews();
  const { submitTaskEvidence, deleteTaskSubmission, loading: submissionLoading } = useTaskSubmissions();

  // Copy all helper functions from AdminTasksHub but remove admin-only actions
  const handleTaskSelect = (task: TaskWithDetails, selected: boolean) => {
    const newSelected = new Set(selectedTasks);
    if (selected) {
      newSelected.add(task.id);
    } else {
      newSelected.delete(task.id);
    }
    setSelectedTasks(newSelected);
  };

  const handleStartTask = async (taskId: string, taskTitle: string) => {
    const now = Date.now();

    // Start working session and timer immediately
    setWorkingSessions(prev => ({ ...prev, [taskId]: true }));
    setTimerStartTimes(prev => ({ ...prev, [taskId]: now }));

    // Update database status to in_progress and set started_at timestamp
    await handleStatusUpdate(taskId, taskTitle, 'in_progress');

    // Update started_at in database
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase
        .from('tasks')
        .update({ started_at: new Date().toISOString() })
        .eq('id', taskId);
    } catch (error) {
      console.error('Error updating started_at:', error);
    }
  };

  const handlePauseTask = async (taskId: string, taskTitle: string) => {
    // Pause working session (timer automatically stops in useEffect)
    setWorkingSessions(prev => ({ ...prev, [taskId]: false }));

    // Save current duration to database
    const currentDuration = taskTimers[taskId] || 0;
    const durationInSeconds = Math.floor(currentDuration / 1000);

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase
        .from('tasks')
        .update({ work_duration_seconds: durationInSeconds })
        .eq('id', taskId);
    } catch (error) {
      console.error('Error saving task duration:', error);
    }

    toast({
      title: "Task paused",
      description: `"${taskTitle}" is paused. You can resume anytime.`,
    });
  };

  const handleResumeTask = (taskId: string, taskTitle: string) => {
    const now = Date.now();

    // Resume working session and timer
    setWorkingSessions(prev => ({ ...prev, [taskId]: true }));
    setTimerStartTimes(prev => ({ ...prev, [taskId]: now }));

    toast({
      title: "Task resumed",
      description: `"${taskTitle}" work resumed.`,
    });
  };

  const handleDoneTask = async (taskId: string, taskTitle: string) => {
    // End working session and stop timer
    setWorkingSessions(prev => ({ ...prev, [taskId]: false }));
    setTimerStartTimes(prev => {
      const updated = { ...prev };
      delete updated[taskId];
      return updated;
    });

    // Save final duration to database
    const finalDuration = taskTimers[taskId] || 0;
    const durationInSeconds = Math.floor(finalDuration / 1000);

    await handleStatusUpdate(taskId, taskTitle, 'submitted_for_review');

    // Update submitted_at and final duration in database
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase
        .from('tasks')
        .update({
          submitted_at: new Date().toISOString(),
          work_duration_seconds: durationInSeconds
        })
        .eq('id', taskId);
    } catch (error) {
      console.error('Error updating submitted_at and duration:', error);
    }
  };

  const handleStatusUpdate = async (taskId: string, taskTitle: string, newStatus: string) => {
    // Immediately update UI optimistically
    setOptimisticTaskStatuses(prev => ({ ...prev, [taskId]: newStatus }));

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (!error) {
        const statusMessages = {
          'pending': 'Task reset to pending',
          'in_progress': 'Task started',
          'submitted_for_review': 'Task submitted for review',
          'approved': 'Task approved',
          'rejected': 'Task rejected',
          'done_auto_approved': 'Task auto-approved'
        };

        toast({
          title: 'Status updated',
          description: `"${taskTitle}": ${statusMessages[newStatus] || `Status changed to ${newStatus}`}`,
        });
        // Refresh tasks to show updated status
        await new Promise(resolve => setTimeout(resolve, 500));
        await refetch();
        // Clear optimistic update after successful database update
        setOptimisticTaskStatuses(prev => {
          const updated = { ...prev };
          delete updated[taskId];
          return updated;
        });
      } else {
        // Revert optimistic update on error
        setOptimisticTaskStatuses(prev => {
          const updated = { ...prev };
          delete updated[taskId];
          return updated;
        });
        toast({
          title: 'Error updating task',
          description: error.message || 'Failed to update task status',
          variant: 'destructive'
        });
      }
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticTaskStatuses(prev => {
        const updated = { ...prev };
        delete updated[taskId];
        return updated;
      });
      console.error('Error updating task status:', error);
      toast({
        title: 'Error updating task',
        description: 'An unexpected error occurred while updating the task',
        variant: 'destructive'
      });
    }
  };

  // Keep the old functions for backward compatibility with button clicks
  const handleMarkCompleted = async (taskId: string, taskTitle: string) => {
    await handleStatusUpdate(taskId, taskTitle, 'submitted_for_review');
  };

  // Format timer display
  const formatTimer = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  // Format creation time with IST timezone
  const formatCreationTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Kolkata',
      timeZoneName: 'short'
    });
  };

  // Get first word of full name
  const getFirstName = (fullName: string): string => {
    return fullName.split(' ')[0];
  };

  const handleEvidenceUpload = async (task: TaskWithDetails, evidenceData: { type: string; evidenceType?: string; file?: File; url?: string }) => {
    const fileKey = evidenceData.file ? `${task.id}-${evidenceData.file.name}` : `${task.id}-${Date.now()}`;

    try {
      // Add to uploading set
      setUploadingFiles(prev => new Set(prev).add(fileKey));

      console.log('🔄 Starting evidence upload:', { taskId: task.id, evidenceData: { ...evidenceData, file: evidenceData.file?.name } });

      const success = await submitTaskEvidence(task, evidenceData);

      if (success) {
        toast({
          title: "Evidence uploaded",
          description: "Task evidence has been uploaded successfully",
        });
        // Refresh tasks to show updated evidence
        console.log('🔄 Refreshing tasks after upload...');

        // Small delay to ensure database consistency
        await new Promise(resolve => setTimeout(resolve, 500));

        await refetch();
        console.log('✅ Tasks refreshed successfully after evidence upload');
      } else {
        throw new Error("Upload returned false/null");
      }
    } catch (error) {
      console.error('❌ Error uploading evidence:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload evidence";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error; // Re-throw to allow file-level error handling
    } finally {
      // Remove from uploading set
      setUploadingFiles(prev => {
        const next = new Set(prev);
        next.delete(fileKey);
        return next;
      });
    }
  };

  const handleEvidenceDelete = async (submissionId: string, filePath?: string | null) => {
    try {
      console.log('Starting evidence delete for submission:', submissionId);
      setDeletingSubmissionId(submissionId);

      const success = await deleteTaskSubmission(submissionId, filePath);

      if (success) {
        console.log('Delete successful, refetching tasks...');
        await new Promise(resolve => setTimeout(resolve, 500));
        await refetch();
        console.log('Tasks refetched successfully');
        setSelectedTasks(new Set(selectedTasks));
      } else {
        console.log('Delete was not successful');
      }
    } catch (error) {
      console.error('Error in handleEvidenceDelete:', error);
      await new Promise(resolve => setTimeout(resolve, 500));
      await refetch();
    } finally {
      setDeletingSubmissionId(null);
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

  const filteredTasks = useMemo(() => {
    if (!tasks.length) return tasks;

    return tasks.filter((task) => {
      // Search filter
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        const titleMatch = task.title?.toLowerCase().includes(searchLower);
        const descriptionMatch = task.description?.toLowerCase().includes(searchLower);
        if (!titleMatch && !descriptionMatch) return false;
      }

      // Basic Status filter
      if (statusFilter !== 'all') {
        if (task.status !== statusFilter) return false;
      }

      // Basic Type filter
      if (typeFilter !== 'all') {
        if (task.task_type !== typeFilter) return false;
      }

      // Date filter - compare created_at with selected date
      if (dateFilter) {
        const filterDate = new Date(dateFilter);
        const taskDate = new Date(task.created_at);

        // Compare dates ignoring time (same day)
        const filterDateOnly = new Date(filterDate.getFullYear(), filterDate.getMonth(), filterDate.getDate());
        const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());

        if (taskDateOnly.getTime() !== filterDateOnly.getTime()) return false;
      }

      // Advanced filters are disabled for My Tasks page
      // Since tasks are already filtered by assigned_to in the database query,
      // we only need basic filtering here

      return true;
    });
  }, [tasks, searchTerm, statusFilter, typeFilter, dateFilter]);

  // Group tasks by the selected groupBy option
  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Tasks': filteredTasks };
    }

    const groups: Record<string, TaskWithDetails[]> = {};

    filteredTasks.forEach(task => {
      let groupKey = '';

      if (groupBy === 'priority') {
        groupKey = task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'No Priority';
      } else if (groupBy === 'status') {
        if (task.status === 'in_progress') {
          groupKey = 'In Progress';
        } else if (task.status === 'submitted_for_review') {
          groupKey = 'Under Review';
        } else {
          groupKey = task.status ? task.status.charAt(0).toUpperCase() + task.status.slice(1) : 'No Status';
        }
      } else if (groupBy === 'assignee') {
        groupKey = task.assigned_user?.full_name || 'Unassigned';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(task);
    });

    // Sort groups by priority order or alphabetically
    const sortedGroups: Record<string, TaskWithDetails[]> = {};
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (groupBy === 'priority') {
        const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3, 'No Priority': 4 };
        return (priorityOrder[a as keyof typeof priorityOrder] || 999) - (priorityOrder[b as keyof typeof priorityOrder] || 999);
      } else if (groupBy === 'status') {
        const statusOrder = { 'Pending': 1, 'In Progress': 2, 'Under Review': 3, 'Approved': 4, 'Rejected': 5 };
        return (statusOrder[a as keyof typeof statusOrder] || 999) - (statusOrder[b as keyof typeof statusOrder] || 999);
      }
      return a.localeCompare(b);
    });

    sortedKeys.forEach(key => {
      sortedGroups[key] = groups[key];
    });

    return sortedGroups;
  }, [filteredTasks, groupBy]);

  // Add toggleRowExpansion function
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

  // Copy exact rendering function from AdminTasksHub with employee-specific modifications
  const renderTaskWithSubtasks = (task: TaskWithDetails, depth: number = 0) => {
    // Add null safety checks
    if (!task || !task.id) {
      console.error('renderTaskWithSubtasks: Invalid task data', task);
      return null;
    }

    const isExpanded = expandedRows.has(task.id);
    // Get subtasks either from the task's subtasks property or from the main tasks list
    const taskSubtasks = task.subtasks || filteredTasks.filter(t => t.parent_task_id === task.id);
    const hasSubtasks = taskSubtasks && taskSubtasks.length > 0;
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
          <TableCell className="border-r border-border/50 py-2 whitespace-nowrap">
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
                  {taskSubtasks.length}
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
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  ({task.completion_percentage || 0}% complete)
                </div>
              )}
            </div>
          </TableCell>

          {/* Type - Show as read-only */}
          <TableCell className="border-r border-border/50 py-2 whitespace-nowrap">
            <Badge variant="secondary" className="text-xs">
              {task.task_type === 'one-off' ? 'One-off' : 'Daily'}
            </Badge>
          </TableCell>

          {/* Priority */}
          <TableCell className="border-r border-border/50 py-2 whitespace-nowrap">
            <Badge
              variant="outline"
              className={`text-xs ${
                task.priority === 'urgent' ? 'bg-red-50 text-red-700 border-red-200' :
                task.priority === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                task.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                'bg-green-50 text-green-700 border-green-200'
              }`}
            >
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </Badge>
          </TableCell>

          {/* Status */}
          <TableCell className="border-r border-border/50 py-2 whitespace-nowrap">
            <Badge
              variant="outline"
              className={`text-xs ${
                task.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                task.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                task.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                task.status === 'submitted_for_review' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                task.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                'bg-gray-50 text-gray-700 border-gray-200'
              }`}
            >
              {task.status === 'in_progress' ? 'In Progress' :
               task.status === 'submitted_for_review' ? 'Under Review' :
               task.status.charAt(0).toUpperCase() + task.status.slice(1)}
            </Badge>
          </TableCell>

          {/* Created Date */}
          <TableCell className="border-r border-border/50 py-2 whitespace-nowrap">
            <div className="text-sm">
              {task.created_at ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-muted-foreground cursor-help">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(task.created_at).toLocaleDateString()}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs bg-popover border shadow-lg">
                      <div className="font-medium">Created at:</div>
                      <div className="text-muted-foreground">{formatCreationTime(task.created_at)}</div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <span className="text-muted-foreground">No date</span>
              )}
            </div>
          </TableCell>

          {/* Due Date */}
          <TableCell className="border-r border-border/50 py-2 whitespace-nowrap">
            <div className="text-sm">
              {task.due_date ? (
                <div className={`flex items-center gap-1 ${
                  new Date(task.due_date) < new Date() && !['completed', 'approved'].includes(task.status)
                    ? 'text-red-600' : 'text-muted-foreground'
                }`}>
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(task.due_date).toLocaleDateString()}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">No date</span>
              )}
            </div>
          </TableCell>

          {/* Created By */}
          <TableCell className="border-r border-border/50 py-2 whitespace-nowrap">
            <span className="text-sm truncate">
              {task.assigned_by_user?.full_name || 'Unknown'}
            </span>
          </TableCell>

          {/* Smart Actions - Start, Pause, Resume, Done */}
          <TableCell className="w-40 py-2 whitespace-nowrap border-r border-border/50" onClick={(e) => e.stopPropagation()}>
            {(() => {
              // Use optimistic status if available, otherwise use actual task status
              const currentStatus = optimisticTaskStatuses[task.id] || task.status;
              const isWorking = workingSessions[task.id] || false;

              // Start Task Button - Show for pending tasks
              if (currentStatus === 'pending') {
                return (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800 hover:border-emerald-300 transition-all duration-200 shadow-sm"
                    onClick={() => handleStartTask(task.id, task.title)}
                    title="Start working on this task"
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-xs font-medium">Start</span>
                    </div>
                  </Button>
                );
              }

              // Smart buttons for in-progress tasks
              if (currentStatus === 'in_progress') {
                return (
                  <div className="flex gap-1">
                    {isWorking ? (
                      // Currently working - show Pause and Done buttons
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:text-amber-800 hover:border-amber-300 transition-all duration-200 shadow-sm"
                          onClick={() => handlePauseTask(task.id, task.title)}
                          title="Pause work on this task"
                        >
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-3 bg-amber-500 rounded-sm"></div>
                            <div className="w-1.5 h-3 bg-amber-500 rounded-sm"></div>
                            <span className="text-xs font-medium ml-1">Pause</span>
                          </div>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800 hover:border-green-300 transition-all duration-200 shadow-sm"
                          onClick={() => handleDoneTask(task.id, task.title)}
                          title="Complete and submit for review"
                        >
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full flex items-center justify-center">
                              <div className="w-1 h-1 bg-white rounded-full"></div>
                            </div>
                            <span className="text-xs font-medium">Done</span>
                          </div>
                        </Button>
                      </>
                    ) : (
                      // Paused - show Resume and Done buttons
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800 hover:border-blue-300 transition-all duration-200 shadow-sm"
                          onClick={() => handleResumeTask(task.id, task.title)}
                          title="Resume work on this task"
                        >
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 border-l-2 border-l-blue-500 border-t-2 border-t-blue-500 border-b-2 border-b-blue-500 rounded-l-full"></div>
                            <span className="text-xs font-medium">Resume</span>
                          </div>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800 hover:border-green-300 transition-all duration-200 shadow-sm"
                          onClick={() => handleDoneTask(task.id, task.title)}
                          title="Complete and submit for review"
                        >
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full flex items-center justify-center">
                              <div className="w-1 h-1 bg-white rounded-full"></div>
                            </div>
                            <span className="text-xs font-medium">Done</span>
                          </div>
                        </Button>
                      </>
                    )}
                  </div>
                );
              }

              // No button for submitted/rejected tasks, but show "Done" for approved
              if (currentStatus === 'submitted_for_review') {
                return (
                  <span className="text-xs text-muted-foreground">
                    Under Review
                  </span>
                );
              }

              if (['approved', 'done_auto_approved'].includes(currentStatus)) {
                return (
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                    Done
                  </span>
                );
              }

              if (currentStatus === 'rejected') {
                return (
                  <span className="text-xs text-muted-foreground">
                    Rejected
                  </span>
                );
              }

              // Fallback for other statuses
              return null;
            })()}
          </TableCell>

          {/* Timer Column */}
          <TableCell className="w-24 py-2 whitespace-nowrap text-center">
            {(() => {
              const currentStatus = optimisticTaskStatuses[task.id] || task.status;
              const isWorking = workingSessions[task.id] || false;
              const currentTime = taskTimers[task.id] || 0;

              // Show timer for in_progress tasks
              if (currentStatus === 'in_progress') {
                return (
                  <div className={`text-sm font-mono text-center ${isWorking ? 'text-green-600' : 'text-orange-600'}`}>
                    {formatTimer(currentTime)}
                  </div>
                );
              }

              // Show final time for completed/submitted tasks
              if (['submitted_for_review', 'approved', 'rejected', 'done_auto_approved'].includes(currentStatus)) {
                return (
                  <div className="text-sm font-mono text-center text-gray-600">
                    {currentTime > 0 ? formatTimer(currentTime) : '--'}
                  </div>
                );
              }

              // No timer for pending tasks
              return (
                <div className="text-xs text-muted-foreground">
                  --
                </div>
              );
            })()}
          </TableCell>
        </TableRow>

        {/* Expanded Details Row - EXACT copy from AdminTasksHub */}
        {isExpanded && (
          <TableRow className="bg-muted/20">
            <TableCell colSpan={10} className="p-4">
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
                        <span className="font-normal text-muted-foreground/80">Type:</span>
                        <span className="text-muted-foreground/70 capitalize">
                          {task.task_type?.replace('_', ' ') || 'Unknown'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="font-normal text-muted-foreground/80">Priority:</span>
                        <span className="text-muted-foreground/70 capitalize">{task.priority}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="font-normal text-muted-foreground/80">Status:</span>
                        <span className="text-muted-foreground/70 capitalize">{task.status?.replace('_', ' ') || 'Unknown'}</span>
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
                            .filter(submission => submission.file_url || submission.link_url)
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

                                  {/* Delete Button for Evidence */}
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
                                try {
                                  const files = Array.from((e.target as HTMLInputElement).files || []);
                                  console.log('📁 Processing files:', files.length);

                                  for (const file of files) {
                                    try {
                                      console.log('📄 Processing file:', file.name, file.type);
                                      let evidenceType = 'file';
                                      if (file.type.startsWith('image/')) {
                                        evidenceType = 'photo';
                                      } else if (file.type.startsWith('video/')) {
                                        evidenceType = 'file';
                                      }

                                      await handleEvidenceUpload(task, { type: 'evidence', evidenceType: evidenceType as any, file });
                                      console.log('✅ File processed successfully:', file.name);
                                    } catch (fileError) {
                                      console.error('❌ Error processing file:', file.name, fileError);
                                      toast({
                                        title: "File Upload Error",
                                        description: `Failed to upload ${file.name}: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`,
                                        variant: "destructive",
                                      });
                                      // Continue with next file instead of crashing
                                    }
                                  }

                                  // Clear the input to allow re-uploading same file
                                  if (e.target) {
                                    (e.target as HTMLInputElement).value = '';
                                  }
                                } catch (error) {
                                  console.error('❌ Error in file selection handler:', error);
                                  toast({
                                    title: "Upload Error",
                                    description: "Failed to process selected files",
                                    variant: "destructive",
                                  });
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
                                  evidenceType = 'file';
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
        {hasSubtasks && isExpanded && taskSubtasks.map((subtask) =>
          renderTaskWithSubtasks(subtask, depth + 1)
        )}
      </React.Fragment>
    );
  };

  // Show loading state for faster perceived performance
  if ((loading && tasks.length === 0) || profileLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">
            {profile?.appUser?.full_name ? `${getFirstName(profile.appUser.full_name)}'s Tasks` : 'My Tasks'}
          </h1>
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
        <h1 className="text-2xl font-bold">
          {profile?.appUser?.full_name ? `${getFirstName(profile.appUser.full_name)}'s Tasks` : 'My Tasks'}
        </h1>
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
        </div>
      </div>

      {/* Search and filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-80">
              <Input
                placeholder="Search tasks by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                  <SelectItem value="status">Group by Status</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="one-off">One-off</SelectItem>
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
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1">
                <DatePicker
                  value={dateFilter}
                  onChange={setDateFilter}
                  placeholder="Filter by date"
                  className="w-40 min-w-[10rem] text-sm"
                />
                {dateFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDateFilter(undefined)}
                    className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
                    title="Clear date filter"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-12 whitespace-nowrap">
                <Checkbox
                  checked={selectedTasks.size > 0 && selectedTasks.size === filteredTasks.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedTasks(new Set(filteredTasks.map(task => task.id)));
                    } else {
                      setSelectedTasks(new Set());
                    }
                  }}
                />
              </TableHead>
              <TableHead className="border-r border-border/50 whitespace-nowrap">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 lg:px-3 font-medium"
                  onClick={() => {
                    if (sortField === 'title') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('title');
                      setSortDirection('asc');
                    }
                  }}
                >
                  Task
                  {getSortIcon('title')}
                </Button>
              </TableHead>
              <TableHead className="w-20 border-r border-border/50 whitespace-nowrap">Type</TableHead>
              <TableHead className="w-24 border-r border-border/50 whitespace-nowrap">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 lg:px-3 font-medium"
                  onClick={() => {
                    if (sortField === 'priority') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('priority');
                      setSortDirection('asc');
                    }
                  }}
                >
                  Priority
                  {getSortIcon('priority')}
                </Button>
              </TableHead>
              <TableHead className="w-28 border-r border-border/50 whitespace-nowrap">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 lg:px-3 font-medium"
                  onClick={() => {
                    if (sortField === 'status') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('status');
                      setSortDirection('asc');
                    }
                  }}
                >
                  Status
                  {getSortIcon('status')}
                </Button>
              </TableHead>
              <TableHead className="w-28 border-r border-border/50 whitespace-nowrap">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 lg:px-3 font-medium"
                  onClick={() => {
                    if (sortField === 'created_at') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('created_at');
                      setSortDirection('asc');
                    }
                  }}
                >
                  Created
                  {getSortIcon('created_at')}
                </Button>
              </TableHead>
              <TableHead className="w-28 border-r border-border/50 whitespace-nowrap">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 lg:px-3 font-medium"
                  onClick={() => {
                    if (sortField === 'due_date') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('due_date');
                      setSortDirection('asc');
                    }
                  }}
                >
                  Due Date
                  {getSortIcon('due_date')}
                </Button>
              </TableHead>
              <TableHead className="w-28 border-r border-border/50 whitespace-nowrap">Created By</TableHead>
              <TableHead className="w-40 border-r border-border/50 whitespace-nowrap">Actions</TableHead>
              <TableHead className="w-24 whitespace-nowrap">Timer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <Clock className="h-12 w-12 text-muted-foreground" />
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
                      <p className="text-muted-foreground">
                        {tasks.length === 0
                          ? `${profile?.appUser?.full_name || 'You'} don't have any tasks assigned yet.`
                          : "No tasks match your current filters."
                        }
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
                <React.Fragment key={groupName}>
                  {groupBy !== 'none' && (
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={10} className="py-3 px-4 font-semibold text-foreground border-b">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          {groupName} ({groupTasks.length})
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {groupTasks
                    .filter(task => !task.parent_task_id || !groupTasks.some(t => t.id === task.parent_task_id))
                    .map((task) => renderTaskWithSubtasks(task))
                  }
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Task Edit/View Drawer */}
      {editTaskOpen && editingTask && (
        <TaskDrawer
          task={editingTask}
          open={editTaskOpen}
          onClose={() => {
            setEditTaskOpen(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}