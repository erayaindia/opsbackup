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
  const [viewMode, setViewMode] = useState<TaskViewMode>('list');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [assigneePopovers, setAssigneePopovers] = useState<Record<string, boolean>>({});
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<TaskFilters>({});
  const [sortField, setSortField] = useState<string>('due_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [groupBy, setGroupBy] = useState<'none' | 'priority' | 'assignee' | 'status'>('none');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
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
              completion_percentage, created_at, updated_at,
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

  // Dummy functions for missing hooks
  const refetch = () => {
    if (currentUserId) {
      console.log('🔄 Direct refetch called');
      // Re-trigger the useEffect above
      setDirectTasks([]);
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

  const handleMarkCompleted = async (taskId: string, taskTitle: string) => {
    try {
      const result = await updateTask(taskId, { status: 'completed' });

      if (!result.error) {
        toast({
          title: 'Task completed',
          description: `"${taskTitle}" has been marked as completed`,
        });
        // Refresh tasks to show updated status
        await refetch();
      } else {
        toast({
          title: 'Error updating task',
          description: result.error.message || 'Failed to mark task as completed',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error marking task as completed:', error);
      toast({
        title: 'Error updating task',
        description: 'An unexpected error occurred while updating the task',
        variant: 'destructive'
      });
    }
  };

  const handleEvidenceUpload = async (task: TaskWithDetails, evidenceData: { type: string; file?: File; url?: string }) => {
    try {
      const success = await submitTaskEvidence(task.id, evidenceData);

      if (success) {
        toast({
          title: "Evidence uploaded",
          description: "Task evidence has been uploaded successfully",
        });
        // Refresh tasks to show updated evidence
        await refetch();
      } else {
        toast({
          title: "Upload failed",
          description: "Failed to upload evidence",
          variant: "destructive",
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
      // Date range filter
      if (advancedFilters.dateRange) {
        if (advancedFilters.dateRange === 'overdue') {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const taskDate = new Date(task.due_date || '');
          if (taskDate >= today) return false;
        } else {
          const [start, end] = advancedFilters.dateRange.split(' to ');
          if (start && end) {
            const taskDate = new Date(task.due_date || '');
            if (taskDate < start || taskDate > end) return false;
          } else {
            if (task.due_date !== advancedFilters.dateRange) return false;
          }
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

      // Assignee filter (less relevant for employee view but keep for consistency)
      if (advancedFilters.selectedAssignees.length > 0) {
        if (!task.assigned_to || !advancedFilters.selectedAssignees.includes(task.assigned_to)) return false;
      }

      // Overdue filter
      if (advancedFilters.isOverdue) {
        if (!task.due_date || new Date(task.due_date) >= new Date()) return false;
      }

      // No assignee filter (won't be relevant for My Tasks but keep for consistency)
      if (advancedFilters.hasNoAssignee) {
        if (task.assigned_to) return false;
      }

      return true;
    });
  }, [tasks, advancedFilters]);

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
                task.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                task.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                task.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                task.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                'bg-gray-50 text-gray-700 border-gray-200'
              }`}
            >
              {task.status === 'in_progress' ? 'In Progress' :
               task.status === 'submitted_for_review' ? 'Under Review' :
               task.status.charAt(0).toUpperCase() + task.status.slice(1)}
            </Badge>
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

          {/* Actions - Limited for employee view */}
          <TableCell className="w-32 py-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
            {/* Quick Complete Button */}
            {!['completed', 'approved'].includes(task.status) && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-green-600 border-green-200 hover:text-green-700 hover:bg-green-50 hover:border-green-300"
                onClick={() => handleMarkCompleted(task.id, task.title)}
                title="Mark as completed"
              >
                Mark Complete
              </Button>
            )}
          </TableCell>
        </TableRow>

        {/* Expanded Details Row - EXACT copy from AdminTasksHub */}
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
                                const files = Array.from((e.target as HTMLInputElement).files || []);
                                for (const file of files) {
                                  let evidenceType = 'file';
                                  if (file.type.startsWith('image/')) {
                                    evidenceType = 'photo';
                                  } else if (file.type.startsWith('video/')) {
                                    evidenceType = 'file';
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
            {profile?.appUser?.full_name ? `${profile.appUser.full_name} Tasks` : 'My Tasks'}
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
          {profile?.appUser?.full_name ? `${profile.appUser.full_name} Tasks` : 'My Tasks'}
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
                </SelectContent>
              </Select>
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
              <TableHead className="w-32 whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
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
              filteredTasks
                .filter(task => !task.parent_task_id || !filteredTasks.some(t => t.id === task.parent_task_id))
                .map((task) => renderTaskWithSubtasks(task))
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