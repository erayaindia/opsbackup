import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { renderRichContent } from '@/lib/textUtils';
import { getHierarchicalTaskId } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Checkbox } from '@/components/ui/checkbox';
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
  UserCheck,
  MapPin,
  ChevronUp,
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
import { useUserAttendanceStatus } from '@/hooks/useUserAttendanceStatus';
import { useDailyTaskRecurrence } from '@/hooks/useDailyTaskRecurrence';
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
  const [sortField, setSortField] = useState<string>('task_id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [groupBy, setGroupBy] = useState<'none' | 'priority' | 'assignee' | 'status' | 'task_type'>('task_type');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'todo' | 'completed'>('todo');
  // Default to last 7 days - DateRangePicker expects string format
  const getDefaultDateRangeString = () => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    const fromStr = sevenDaysAgo.toISOString().split('T')[0];
    const toStr = today.toISOString().split('T')[0];
    return `${fromStr} to ${toStr}`;
  };
  const [dateRangeString, setDateRangeString] = useState<string>(getDefaultDateRangeString());
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
  const { isPresent, isLoading: attendanceLoading, attendanceRecord } = useUserAttendanceStatus();

  // Initialize daily task recurrence
  useDailyTaskRecurrence(refetch);

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

          // First get tasks assigned to current user
          const { data: userTasks, error: userTasksError } = await supabase
            .from('tasks')
            .select(`
              id, task_id, title, description, task_type, status, priority, evidence_required, due_date, due_time,
              assigned_to, assigned_by, reviewer_id, parent_task_id, task_level,
              completion_percentage, created_at, updated_at, work_duration_seconds,
              original_task_id, is_recurring_instance, instance_date,
              assigned_user:app_users!tasks_assigned_to_fkey(id, full_name, role, department),
              assigned_by_user:app_users!tasks_assigned_by_fkey(id, full_name),
              reviewer:app_users!tasks_reviewer_id_fkey(id, full_name),
              submissions:task_submissions(*),
              reviews:task_reviews(*)
            `)
            .eq('assigned_to', currentUserId);

          if (userTasksError) {
            console.error('🎯 ERROR fetching user tasks:', userTasksError);
            setDirectLoading(false);
            return;
          }

          // Get parent task IDs for user tasks
          const parentTaskIds = userTasks.filter(task => !task.parent_task_id).map(task => task.id);

          // Get subtasks for these parent tasks, but exclude ones already assigned to current user
          const { data: subtasks, error: subtasksError } = await supabase
            .from('tasks')
            .select(`
              id, task_id, title, description, task_type, status, priority, evidence_required, due_date, due_time,
              assigned_to, assigned_by, reviewer_id, parent_task_id, task_level,
              completion_percentage, created_at, updated_at, work_duration_seconds,
              original_task_id, is_recurring_instance, instance_date,
              assigned_user:app_users!tasks_assigned_to_fkey(id, full_name, role, department),
              assigned_by_user:app_users!tasks_assigned_by_fkey(id, full_name),
              reviewer:app_users!tasks_reviewer_id_fkey(id, full_name),
              submissions:task_submissions(*),
              reviews:task_reviews(*)
            `)
            .in('parent_task_id', parentTaskIds)
            .neq('assigned_to', currentUserId); // Exclude subtasks already assigned to current user

          if (subtasksError) {
            console.error('🎯 ERROR fetching subtasks:', subtasksError);
          }

          // Combine user tasks and subtasks, then sort by due date
          const allTasks = [...userTasks, ...(subtasks || [])];
          const directTaskData = allTasks.sort((a, b) => {
            if (!a.due_date && !b.due_date) return 0;
            if (!a.due_date) return 1;
            if (!b.due_date) return -1;
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          });
          const directError = null;

          console.log('🎯 DIRECT QUERY RESULT:', { directTaskData, directError, currentUserId });

          if (!directError && directTaskData) {
            // Group subtasks under their parent tasks
            const parentTasks = directTaskData.filter(task => !task.parent_task_id);
            const subtasks = directTaskData.filter(task => task.parent_task_id);

            // Group subtasks by parent_task_id
            const subtasksByParent = subtasks.reduce((acc, subtask) => {
              if (!acc[subtask.parent_task_id]) {
                acc[subtask.parent_task_id] = [];
              }
              acc[subtask.parent_task_id].push(subtask);
              return acc;
            }, {} as Record<string, any[]>);

            // Attach subtasks to their parent tasks
            const tasksWithSubtasks = parentTasks.map(task => ({
              ...task,
              subtasks: (subtasksByParent[task.id] || []).sort((a, b) => (a.task_order || 0) - (b.task_order || 0))
            }));


            setDirectTasks(tasksWithSubtasks);

            // Debug: Log daily task information
            const dailyTasks = directTaskData.filter(task => task.task_type === 'daily');
            const dailyInstances = dailyTasks.filter(task => task.is_recurring_instance);
            const dailyTemplates = dailyTasks.filter(task => !task.is_recurring_instance);
            console.log('🎯 Daily tasks debug:', {
              totalTasks: directTaskData.length,
              dailyTasks: dailyTasks.length,
              dailyInstances: dailyInstances.length,
              dailyTemplates: dailyTemplates.length,
              dailyInstancesData: dailyInstances.map(t => ({ id: t.id, title: t.title, instance_date: t.instance_date, status: t.status }))
            });

            // Initialize timers from database for in_progress tasks (including subtasks)
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
  const refetch = useCallback(async () => {
    if (!currentUserId) return;

    console.log('🔄 Direct refetch called');
    setDirectLoading(true);

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      console.log('🎯 REFETCH: Fetching tasks for user:', currentUserId);

      // First get tasks assigned to current user
      const { data: userTasks, error: userTasksError } = await supabase
        .from('tasks')
        .select(`
          id, task_id, title, description, task_type, status, priority, evidence_required, due_date, due_time,
          assigned_to, assigned_by, reviewer_id, parent_task_id, task_level,
          completion_percentage, created_at, updated_at, work_duration_seconds,
          original_task_id, is_recurring_instance, instance_date,
          assigned_user:app_users!tasks_assigned_to_fkey(id, full_name, role, department),
          assigned_by_user:app_users!tasks_assigned_by_fkey(id, full_name),
          reviewer:app_users!tasks_reviewer_id_fkey(id, full_name),
          submissions:task_submissions(*),
          reviews:task_reviews(*)
        `)
        .eq('assigned_to', currentUserId);

      if (userTasksError) {
        console.error('🎯 ERROR fetching user tasks:', userTasksError);
        return;
      }

      // Get parent task IDs for user tasks
      const parentTaskIds = userTasks.filter(task => !task.parent_task_id).map(task => task.id);

      // Get subtasks for these parent tasks, but exclude ones already assigned to current user
      const { data: subtasks, error: subtasksError } = await supabase
        .from('tasks')
        .select(`
          id, task_id, title, description, task_type, status, priority, evidence_required, due_date, due_time,
          assigned_to, assigned_by, reviewer_id, parent_task_id, task_level,
          completion_percentage, created_at, updated_at, work_duration_seconds,
          original_task_id, is_recurring_instance, instance_date,
          assigned_user:app_users!tasks_assigned_to_fkey(id, full_name, role, department),
          assigned_by_user:app_users!tasks_assigned_by_fkey(id, full_name),
          reviewer:app_users!tasks_reviewer_id_fkey(id, full_name),
          submissions:task_submissions(*),
          reviews:task_reviews(*)
        `)
        .in('parent_task_id', parentTaskIds)
        .neq('assigned_to', currentUserId); // Exclude subtasks already assigned to current user

      if (subtasksError) {
        console.error('🎯 ERROR fetching subtasks:', subtasksError);
      }

      // Combine user tasks and subtasks
      const directTaskData = [...userTasks, ...(subtasks || [])];
      const directError = null;

      console.log('🎯 REFETCH RESULT:', { directTaskData, directError, currentUserId });

      if (!directError && directTaskData) {
        // Group subtasks under their parent tasks (same logic as initial fetch)
        const parentTasks = directTaskData.filter(task => !task.parent_task_id);
        const subtasks = directTaskData.filter(task => task.parent_task_id);

        // Group subtasks by parent_task_id
        const subtasksByParent = subtasks.reduce((acc, subtask) => {
          if (!acc[subtask.parent_task_id]) {
            acc[subtask.parent_task_id] = [];
          }
          acc[subtask.parent_task_id].push(subtask);
          return acc;
        }, {} as Record<string, any[]>);

        // Attach subtasks to their parent tasks
        const tasksWithSubtasks = parentTasks.map(task => ({
          ...task,
          subtasks: (subtasksByParent[task.id] || []).sort((a, b) => (a.task_order || 0) - (b.task_order || 0))
        }));

        setDirectTasks(tasksWithSubtasks);

        // Debug: Log daily task information during refetch
        const dailyTasks = directTaskData.filter(task => task.task_type === 'daily');
        const dailyInstances = dailyTasks.filter(task => task.is_recurring_instance);
        const dailyTemplates = dailyTasks.filter(task => !task.is_recurring_instance);
        console.log('🔄 Refetch daily tasks debug:', {
          totalTasks: directTaskData.length,
          dailyTasks: dailyTasks.length,
          dailyInstances: dailyInstances.length,
          dailyTemplates: dailyTemplates.length,
          dailyInstancesData: dailyInstances.map(t => ({ id: t.id, title: t.title, instance_date: t.instance_date, status: t.status }))
        });
        console.log('✅ Refetch successful, loaded', directTaskData.length, 'total tasks,', parentTasks.length, 'parent tasks with', subtasks.length, 'subtasks');

        // Initialize timers from database for in_progress tasks (including subtasks)
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
  }, [currentUserId]);
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

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Format date in IST timezone
  const formatDateIST = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatDateTimeIST = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
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

      // Attendance check - show tasks only if user is checked in
      if (!isPresent) {
        return false;
      }

      // For daily tasks: Show instances, hide templates
      if (task.task_type === 'daily') {
        // Hide templates (show only instances)
        if (!task.is_recurring_instance) {
          return false; // This is a template, don't show it
        }

        // Show instances based on date range or default to today's instances
        const today = new Date().toISOString().split('T')[0];

        if (dateRangeString && dateRangeString.includes(' to ')) {
          // For date range views, show instances in that range
          const [fromStr, toStr] = dateRangeString.split(' to ');
          if (fromStr && toStr) {
            const instanceDate = task.instance_date || task.due_date;
            if (instanceDate < fromStr || instanceDate > toStr) {
              return false;
            }
          }
        } else {
          // Default view: show today's instances only
          const instanceDate = task.instance_date || task.due_date;
          if (instanceDate !== today) {
            return false;
          }
        }
      }

      // One-off tasks: always show if checked in

      // Date range filter - parse date range string and compare with created_at
      if (dateRangeString) {
        const taskDate = new Date(task.created_at);
        const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());

        if (dateRangeString.includes(' to ')) {
          // Range format: "2025-01-15 to 2025-01-20"
          const [fromStr, toStr] = dateRangeString.split(' to ');

          if (fromStr) {
            const fromDate = new Date(fromStr);
            const fromDateOnly = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
            if (taskDateOnly.getTime() < fromDateOnly.getTime()) return false;
          }

          if (toStr) {
            const toDate = new Date(toStr);
            const toDateOnly = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
            if (taskDateOnly.getTime() > toDateOnly.getTime()) return false;
          }
        } else {
          // Single date format: "2025-01-15"
          const filterDate = new Date(dateRangeString);
          const filterDateOnly = new Date(filterDate.getFullYear(), filterDate.getMonth(), filterDate.getDate());
          if (taskDateOnly.getTime() !== filterDateOnly.getTime()) return false;
        }
      }

      // Tab-based filtering
      if (activeTab === 'completed') {
        // Completed tab: show only approved or done tasks
        return ['approved', 'done', 'done_auto_approved'].includes(task.status);
      } else {
        // To Do tab: show all other statuses (pending, in_progress, submitted_for_review, etc.)
        return !['approved', 'done', 'done_auto_approved'].includes(task.status);
      }

      return true;
    });
  }, [tasks, searchTerm, statusFilter, typeFilter, dateRangeString, activeTab, isPresent]);

  // Apply sorting to filtered tasks
  const sortedTasks = useMemo(() => {
    if (!filteredTasks.length) return filteredTasks;

    return [...filteredTasks].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'title':
          aValue = a.title?.toLowerCase() || '';
          bValue = b.title?.toLowerCase() || '';
          break;
        case 'priority':
          const priorityOrder = { 'urgent': 1, 'high': 2, 'medium': 3, 'low': 4 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 999;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 999;
          break;
        case 'status':
          aValue = a.status?.toLowerCase() || '';
          bValue = b.status?.toLowerCase() || '';
          break;
        case 'assignee':
          aValue = a.assignee?.full_name?.toLowerCase() || '';
          bValue = b.assignee?.full_name?.toLowerCase() || '';
          break;
        case 'assigned_by':
          aValue = a.assigned_by_user?.full_name?.toLowerCase() || '';
          bValue = b.assigned_by_user?.full_name?.toLowerCase() || '';
          break;
        case 'due_date':
          aValue = a.due_date ? new Date(a.due_date).getTime() : 0;
          bValue = b.due_date ? new Date(b.due_date).getTime() : 0;
          break;
        case 'created_at':
          aValue = a.created_at ? new Date(a.created_at).getTime() : 0;
          bValue = b.created_at ? new Date(b.created_at).getTime() : 0;
          break;
        case 'task_id':
          aValue = a.task_id || 999999;
          bValue = b.task_id || 999999;
          break;
        default:
          return 0;
      }

      if (aValue === bValue) return 0;

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [filteredTasks, sortField, sortDirection]);

  // Group tasks by the selected groupBy option
  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Tasks': sortedTasks };
    }

    const groups: Record<string, TaskWithDetails[]> = {};

    sortedTasks.forEach(task => {
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
      } else if (groupBy === 'task_type') {
        groupKey = task.task_type === 'daily' ? 'Daily Tasks' : 'One-off Tasks';
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
      } else if (groupBy === 'task_type') {
        const typeOrder = { 'Daily Tasks': 1, 'One-off Tasks': 2 };
        return (typeOrder[a as keyof typeof typeOrder] || 999) - (typeOrder[b as keyof typeof typeOrder] || 999);
      }
      return a.localeCompare(b);
    });

    sortedKeys.forEach(key => {
      sortedGroups[key] = groups[key];
    });

    return sortedGroups;
  }, [sortedTasks, groupBy]);

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
  const renderTaskWithSubtasks = (task: TaskWithDetails, depth: number = 0, allTasks: TaskWithDetails[] = []) => {
    // Add null safety checks
    if (!task || !task.id) {
      console.error('renderTaskWithSubtasks: Invalid task data', task);
      return null;
    }

    const isExpanded = expandedRows.has(task.id);
    // Get subtasks from the task's subtasks property (now properly attached)
    const taskSubtasks = task.subtasks || [];
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

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{task.title}</span>
              </div>
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
                        <span>{formatDateIST(task.created_at)}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs bg-popover border shadow-lg">
                      <div className="font-medium">Created at (IST):</div>
                      <div className="text-muted-foreground">{formatDateTimeIST(task.created_at)}</div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <span className="text-muted-foreground">No date</span>
              )}
            </div>
          </TableCell>

          {/* Assigned By */}
          <TableCell className="border-r border-border/50 py-2 whitespace-nowrap">
            <span className="text-sm truncate">
              {task.assigned_by_user?.full_name || 'Unknown'}
            </span>
          </TableCell>

          {/* Work Time */}
          <TableCell className="border-r border-border/50 py-2 whitespace-nowrap">
            <div className="text-sm flex items-center gap-1 text-muted-foreground">
              {task.work_duration_seconds ? (
                <>
                  <Clock className="h-3 w-3" />
                  <span>{Math.floor(task.work_duration_seconds / 60)}:{(task.work_duration_seconds % 60).toString().padStart(2, '0')}</span>
                </>
              ) : (
                <span>--</span>
              )}
            </div>
          </TableCell>

          {/* Actions */}
          <TableCell className="w-40 py-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
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
          renderTaskWithSubtasks(subtask, depth + 1, allTasks)
        )}
      </React.Fragment>
    );
  };

  // Show loading state for faster perceived performance
  if ((loading && tasks.length === 0) || profileLoading || attendanceLoading) {
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

  // Check-in prompt when user is not present
  if (!isPresent && !attendanceLoading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">
            {profile?.appUser?.full_name ? `${getFirstName(profile.appUser.full_name)}'s Tasks` : 'My Tasks'}
          </h1>
        </div>

        {/* Check-in Required Card */}
        <div className="flex items-center justify-center min-h-[50vh]">
          <Card className="max-w-sm w-full shadow-sm">
            <CardContent className="text-center p-8 space-y-6">
              <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-muted-foreground" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Check-in Required</h3>
                <p className="text-sm text-muted-foreground">
                  Please check in to access your tasks
                </p>
              </div>

              <Button
                className="w-full"
                onClick={() => window.location.href = '/checkin'}
              >
                Start Check-in
              </Button>
            </CardContent>
          </Card>
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'todo' | 'completed')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="todo">To Do</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="todo" className="space-y-6">
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
                  <SelectItem value="task_type">Group by Task Type</SelectItem>
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
                <DateRangePicker
                  value={dateRangeString}
                  onChange={setDateRangeString}
                  placeholder="Filter by date range"
                  className="w-60 min-w-[15rem] text-sm"
                />

                {/* Quick date range presets */}
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date().toISOString().split('T')[0];
                      setDateRangeString(`${today} to ${today}`);
                    }}
                    className="text-xs px-2 py-1 h-7"
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      const yesterday = new Date();
                      yesterday.setDate(today.getDate() - 1);
                      const yesterdayStr = yesterday.toISOString().split('T')[0];
                      setDateRangeString(`${yesterdayStr} to ${yesterdayStr}`);
                    }}
                    className="text-xs px-2 py-1 h-7"
                  >
                    Yesterday
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      const weekAgo = new Date();
                      weekAgo.setDate(today.getDate() - 7);
                      const fromStr = weekAgo.toISOString().split('T')[0];
                      const toStr = today.toISOString().split('T')[0];
                      setDateRangeString(`${fromStr} to ${toStr}`);
                    }}
                    className="text-xs px-2 py-1 h-7"
                  >
                    Last 7 Days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      const monthAgo = new Date();
                      monthAgo.setDate(today.getDate() - 30);
                      const fromStr = monthAgo.toISOString().split('T')[0];
                      const toStr = today.toISOString().split('T')[0];
                      setDateRangeString(`${fromStr} to ${toStr}`);
                    }}
                    className="text-xs px-2 py-1 h-7"
                  >
                    Last 30 Days
                  </Button>
                </div>

                {dateRangeString && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDateRangeString("")}
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
              <TableHead className="w-16 border-r border-border/50 whitespace-nowrap">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 lg:px-3 font-medium"
                  onClick={() => handleSort('task_id')}
                >
                  ID
                  {getSortIcon('task_id')}
                </Button>
              </TableHead>
              <TableHead className="border-r border-border/50 whitespace-nowrap">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 lg:px-3 font-medium"
                  onClick={() => handleSort('title')}
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
                  onClick={() => handleSort('priority')}
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
                  onClick={() => handleSort('status')}
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
                  onClick={() => handleSort('created_at')}
                >
                  Created Date
                  {getSortIcon('created_at')}
                </Button>
              </TableHead>
              <TableHead className="w-28 border-r border-border/50 whitespace-nowrap">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 lg:px-3 font-medium"
                  onClick={() => handleSort('assigned_by')}
                >
                  Assigned By
                  {getSortIcon('assigned_by')}
                </Button>
              </TableHead>
              <TableHead className="w-28 border-r border-border/50 whitespace-nowrap">Work Time</TableHead>
              <TableHead className="w-40 whitespace-nowrap">Actions</TableHead>
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
                          {(() => {
                            // Custom SVG icons for different group types
                            if (groupName === 'Daily Tasks') {
                              return (
                                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                                </svg>
                              );
                            } else if (groupName === 'One-off Tasks') {
                              return (
                                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                              );
                            } else if (groupName.includes('High')) {
                              return (
                                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                              );
                            } else if (groupName.includes('Medium')) {
                              return (
                                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                              );
                            } else if (groupName.includes('Low')) {
                              return (
                                <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                              );
                            } else if (groupName.includes('Progress')) {
                              return (
                                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18V12H18A6,6 0 0,0 12,6Z"/>
                                </svg>
                              );
                            } else if (groupName.includes('Pending')) {
                              return (
                                <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M13,7H11V12L15.75,14.85L16.5,13.6L12.5,11.25V7Z"/>
                                </svg>
                              );
                            } else {
                              // Default icon for other groups
                              return (
                                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2.5-5H18V4c0-.55-.45-1-1-1s-1 .45-1 1v2H8V4c0-.55-.45-1-1-1s-1 .45-1 1v2H4.5C3.67 6 3 6.67 3 7.5v11C3 19.33 3.67 20 4.5 20h15c.83 0 1.5-.67 1.5-1.5v-11C21 6.67 20.33 6 19.5 6z"/>
                                </svg>
                              );
                            }
                          })()}
                          {groupName} ({groupTasks.length})
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {groupTasks
                    .filter(task => !task.parent_task_id) // Only show parent tasks since subtasks are now attached as task.subtasks
                    .map((task) => renderTaskWithSubtasks(task, 0, sortedTasks))
                  }
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-6">
          {/* Search and filters for completed tab */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-80">
                  <Input
                    placeholder="Search completed tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasks Table for Completed - Using same structure as To Do tab */}
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
                  <TableHead className="w-16 border-r border-border/50 whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 p-0 text-left justify-start font-medium hover:bg-transparent"
                      onClick={() => handleSort('task_id')}
                    >
                      ID
                      {getSortIcon('task_id')}
                    </Button>
                  </TableHead>
                  <TableHead className="border-r border-border/50 whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 p-0 text-left justify-start font-medium hover:bg-transparent"
                      onClick={() => handleSort('title')}
                    >
                      Task
                      {sortField === 'title' && (
                        sortDirection === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="border-r border-border/50 w-[100px] whitespace-nowrap">Type</TableHead>
                  <TableHead className="border-r border-border/50 w-[100px] whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 p-0 text-left justify-start font-medium hover:bg-transparent"
                      onClick={() => handleSort('priority')}
                    >
                      Priority
                      {getSortIcon('priority')}
                    </Button>
                  </TableHead>
                  <TableHead className="border-r border-border/50 w-[120px] whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 p-0 text-left justify-start font-medium hover:bg-transparent"
                      onClick={() => handleSort('status')}
                    >
                      Status
                      {getSortIcon('status')}
                    </Button>
                  </TableHead>
                  <TableHead className="border-r border-border/50 w-[140px] whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 p-0 text-left justify-start font-medium hover:bg-transparent"
                      onClick={() => handleSort('created_at')}
                    >
                      Created Date
                      {getSortIcon('created_at')}
                    </Button>
                  </TableHead>
                  <TableHead className="border-r border-border/50 w-[120px] whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 p-0 text-left justify-start font-medium hover:bg-transparent"
                      onClick={() => handleSort('assigned_by')}
                    >
                      Assigned By
                      {getSortIcon('assigned_by')}
                    </Button>
                  </TableHead>
                  <TableHead className="border-r border-border/50 w-[100px] whitespace-nowrap">Work Time</TableHead>
                  <TableHead className="w-[100px] whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <Clock className="h-12 w-12 text-muted-foreground" />
                        <div className="text-center">
                          <h3 className="text-lg font-semibold mb-2">No completed tasks found</h3>
                          <p className="text-muted-foreground">
                            No completed tasks match your current filters.
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
                    <React.Fragment key={groupName}>
                      {/* Group Header Row */}
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableCell colSpan={10} className="font-semibold py-3">
                          <div className="flex items-center gap-3">
                            {(() => {
                              if (groupName === 'Daily Tasks') {
                                return (
                                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                                  </svg>
                                );
                              } else if (groupName === 'One-off Tasks') {
                                return (
                                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                  </svg>
                                );
                              } else {
                                return (
                                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2.5-5H18V4c0-.55-.45-1-1-1s-1 .45-1 1v2H8V4c0-.55-.45-1-1-1s-1 .45-1 1v2H4.5C3.67 6 3 6.67 3 7.5v11C3 19.33 3.67 20 4.5 20h15c.83 0 1.5-.67 1.5-1.5v-11C21 6.67 20.33 6 19.5 6z"/>
                                  </svg>
                                );
                              }
                            })()}
                            {groupName} ({groupTasks.length})
                          </div>
                        </TableCell>
                      </TableRow>
                      {groupTasks
                        .filter(task => !task.parent_task_id)
                        .map((task) => renderTaskWithSubtasks(task, 0, sortedTasks))
                      }
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

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