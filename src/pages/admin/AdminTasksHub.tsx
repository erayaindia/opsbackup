import React, { useState, useMemo } from 'react';
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
  TaskWithDetails,
  TaskFilters,
  TaskViewMode,
  BulkTaskAction,
  EvidenceUpload,
  TaskStatus,
  TaskPriority,
} from '@/types/tasks';

export default function AdminTasksHub() {
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
  const { profile } = useUserProfile();
  const { users } = useUsers();
  const { createTask, createTaskFromTemplate, createDailyTasks, loading: creationLoading } = useTaskCreation();
  const { bulkReview, loading: reviewLoading } = useTaskReviews();
  const { submitTaskEvidence, deleteTaskSubmission, loading: submissionLoading } = useTaskSubmissions();

  const { tasks, loading, error, refetch, bulkAction, updateTask, deleteTask } = useTasks({
    ...filters,
    search: searchTerm,
  });


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
    const result = await updateTask(taskId, { priority: newPriority });

    if (!result.error) {
      toast({
        title: 'Priority updated',
        description: `Task priority changed to ${newPriority}`,
      });
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const result = await updateTask(taskId, { status: newStatus });

    if (!result.error) {
      toast({
        title: 'Status updated',
        description: `Task status changed to ${newStatus.replace('_', ' ')}`,
      });
    }
  };


  const handleAssigneeChange = async (taskId: string, newAssigneeId: string) => {
    const result = await updateTask(taskId, { assigned_to: newAssigneeId });

    if (!result.error) {
      const assignee = users.find(u => u.id === newAssigneeId);
      toast({
        title: 'Assignee updated',
        description: `Task assigned to ${assignee?.full_name || 'selected user'}`,
      });
    }
  };

  const handleTaskTypeChange = async (taskId: string, newTaskType: string) => {
    const result = await updateTask(taskId, { task_type: newTaskType });

    if (!result.error) {
      toast({
        title: 'Task type updated',
        description: `Task type changed to ${newTaskType.replace('_', ' ')}`,
      });
    }
  };

  const handleDueDateChange = async (taskId: string, newDate: Date | undefined) => {
    if (!newDate) return;

    // Format date as YYYY-MM-DD for database
    const formattedDate = newDate.toISOString().split('T')[0];

    const result = await updateTask(taskId, { due_date: formattedDate });

    if (!result.error) {
      toast({
        title: 'Due date updated',
        description: `Task due date changed to ${formattedDate}`,
      });
    }
  };

  const renderRichContent = (content: any): JSX.Element => {
    if (!content) return <span>No description provided</span>;

    // If it's already a string that doesn't look like JSON, return it
    if (typeof content === 'string' && !content.trim().startsWith('{')) {
      return <span>{content}</span>;
    }

    // If it's a stringified JSON, try to parse it
    if (typeof content === 'string' && content.trim().startsWith('{')) {
      try {
        content = JSON.parse(content);
      } catch (e) {
        return <span>{content}</span>;
      }
    }

    // Function to recursively render nodes with formatting
    const renderNode = (node: any, key: number = 0): JSX.Element => {
      if (!node) return <span key={key}></span>;

      // If it's a text node, render the text with any marks (formatting)
      if (node.text) {
        let textElement = <span key={key}>{node.text}</span>;

        // Apply formatting marks if they exist
        if (node.marks) {
          node.marks.forEach((mark: any) => {
            switch (mark.type) {
              case 'bold':
                textElement = <strong key={key}>{textElement}</strong>;
                break;
              case 'italic':
                textElement = <em key={key}>{textElement}</em>;
                break;
              case 'underline':
                textElement = <u key={key}>{textElement}</u>;
                break;
              // Add more formatting as needed
            }
          });
        }
        return textElement;
      }

      // Handle different node types
      switch (node.type) {
        case 'paragraph':
          return (
            <p key={key} className="mb-2 last:mb-0">
              {Array.isArray(node.content) ? node.content.map((child: any, index: number) => renderNode(child, index)) : ''}
            </p>
          );

        case 'heading':
          const level = node.attrs?.level || 1;
          const HeadingTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements;
          return (
            <HeadingTag key={key} className="font-semibold mb-2">
              {Array.isArray(node.content) ? node.content.map((child: any, index: number) => renderNode(child, index)) : ''}
            </HeadingTag>
          );

        case 'bulletList':
          return (
            <ul key={key} className="list-disc ml-4 mb-2 space-y-1">
              {Array.isArray(node.content) ? node.content.map((child: any, index: number) => renderNode(child, index)) : ''}
            </ul>
          );

        case 'orderedList':
          return (
            <ol key={key} className="list-decimal ml-4 mb-2 space-y-1">
              {Array.isArray(node.content) ? node.content.map((child: any, index: number) => renderNode(child, index)) : ''}
            </ol>
          );

        case 'listItem':
          return (
            <li key={key}>
              {Array.isArray(node.content) ? node.content.map((child: any, index: number) => renderNode(child, index)) : ''}
            </li>
          );

        case 'hardBreak':
          return <br key={key} />;

        default:
          // For unknown node types, try to render their content
          if (Array.isArray(node.content)) {
            return <span key={key}>{node.content.map((child: any, index: number) => renderNode(child, index))}</span>;
          }
          return <span key={key}></span>;
      }
    };

    // Handle rich editor content structure
    if (content && typeof content === 'object') {
      if (content.type === 'doc' && Array.isArray(content.content)) {
        return (
          <div className="prose prose-sm max-w-none">
            {content.content.map((node: any, index: number) => renderNode(node, index))}
          </div>
        );
      }
    }

    return <span>No description provided</span>;
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

      return true;
    });
  }, [tasks, advancedFilters]);

  // Build hierarchical task structure
  const buildTaskHierarchy = (tasks: TaskWithDetails[]): TaskWithDetails[] => {
    if (!tasks.length) return tasks;

    // Check if subtask columns exist by looking for parent_task_id in the first task
    const hasSubtaskSupport = tasks.some(task => task.parent_task_id !== undefined);

    if (!hasSubtaskSupport) {
      return tasks; // No subtask support, return as is
    }

    // Separate parent tasks and subtasks
    const parentTasks = tasks.filter(task => !task.parent_task_id);
    const subtaskMap = new Map<string, TaskWithDetails[]>();

    // Group subtasks by their parent_task_id
    tasks.filter(task => task.parent_task_id).forEach(subtask => {
      if (!subtaskMap.has(subtask.parent_task_id!)) {
        subtaskMap.set(subtask.parent_task_id!, []);
      }
      subtaskMap.get(subtask.parent_task_id!)!.push(subtask);
    });

    // Attach subtasks to their parents and sort them
    return parentTasks.map(parentTask => ({
      ...parentTask,
      subtasks: (subtaskMap.get(parentTask.id) || []).sort((a, b) => (a.task_order || 0) - (b.task_order || 0))
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
          groupKey = task.assigned_user?.full_name
            ? `${task.assigned_user.full_name} (${task.assigned_user.employee_id || task.assigned_user.id})`
            : 'Unassigned';
          break;
        case 'status':
          const statusLabels = {
            pending: 'Pending',
            in_progress: 'In Progress',
            submitted_for_review: 'Submitted',
            approved: 'Approved',
            rejected: 'Rejected',
            done_auto_approved: 'Done'
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
      return newSet;
    });
  };

  // Function to render a single task (fallback for when subtasks not supported)
  const renderSingleTask = (task: TaskWithDetails) => {
    const isExpanded = expandedRows.has(task.id);

    return (
      <React.Fragment key={task.id}>
        {/* Main Task Row */}
        <TableRow
          className="cursor-pointer hover:bg-muted/30 hover:shadow-sm transition-all duration-200 h-12 group border-l-2 border-l-transparent hover:border-l-primary/50"
          onClick={() => toggleRowExpansion(task.id)}
        >
          <TableCell className="border-r border-border/50 py-2">
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
          </TableCell>

          {/* Task Title */}
          <TableCell className="border-r border-border/50 py-2">
            <span className="text-sm font-medium truncate">{task.title}</span>
          </TableCell>

          {/* Assignee */}
          <TableCell className="border-r border-border/50 py-2" onClick={(e) => e.stopPropagation()}>
            <Popover
              open={assigneePopovers[task.id] || false}
              onOpenChange={(open) => setAssigneePopovers(prev => ({ ...prev, [task.id]: open }))}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full h-8 border-0 bg-transparent hover:bg-muted/50 focus:ring-0 focus:ring-offset-0 justify-start p-0"
                >
                  <div className="flex items-center min-w-0">
                    <span className="text-sm truncate">
                      {task.assigned_user?.full_name
                        ? `${task.assigned_user.full_name} (${task.assigned_user.employee_id || task.assigned_user.id})`
                        : 'Unassigned'
                      }
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
                            <div className="font-medium">{user.full_name} ({user.employee_id || user.id})</div>
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
                      {task.task_type.replace('_', ' ')}
                    </Badge>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="one_off">One Off</SelectItem>
                <SelectItem value="recurring">Recurring</SelectItem>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
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
              {task.created_by_user?.full_name || 'Unknown'}
            </span>
          </TableCell>

          {/* Actions */}
          <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
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
                  className="text-destructive"
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
                      try {
                        const result = await deleteTask(task.id);
                        if (!result.error) {
                          toast({
                            title: "Task deleted",
                            description: "The task has been successfully deleted.",
                          });
                        }
                      } catch (error) {
                        console.error('Delete task error:', error);
                        toast({
                          title: "Error",
                          description: "Failed to delete task. Please try again.",
                          variant: "destructive",
                        });
                      }
                    }
                  }}
                >
                  Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>

        {/* Expanded Row Content - COMPREHENSIVE Task Details */}
        {isExpanded && (
          <TableRow>
            <TableCell colSpan={8} className="p-0">
              <div className="bg-gradient-to-br from-muted/20 via-muted/30 to-muted/40 border-t-2 border-primary/20 animate-in slide-in-from-top-2 duration-300">
                <div className="p-8 space-y-8">
                  {/* HEADER SECTION - Task Overview */}
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 pb-6 border-b-2 border-border/30">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <FileTextIcon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-foreground mb-1">{task.title}</h2>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              Task ID: <code className="bg-muted px-1 rounded text-xs">{task.id}</code>
                            </span>
                            {task.template_id && (
                              <span className="flex items-center gap-1">
                                <FileTextIcon className="w-3 h-3" />
                                Template ID: <code className="bg-muted px-1 rounded text-xs">{task.template_id}</code>
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Created: {task.created_at ? new Date(task.created_at).toLocaleString() : 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-sm px-3 py-1 capitalize font-medium">
                        {task.task_type.replace('_', ' ')}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {getPriorityBadge(task.priority)}
                      </div>
                      <div className="flex items-center gap-1">
                        {getStatusBadge(task.status)}
                      </div>
                      {task.is_late && (
                        <Badge variant="destructive" className="text-sm px-3 py-1 font-medium animate-pulse">
                          🚨 OVERDUE
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* MAIN INFORMATION GRID - 4 Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

                    {/* 📋 TASK CONTENT & DESCRIPTION */}
                    <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-base text-primary mb-4 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Task Content
                      </h4>

                      <div className="space-y-4">
                        <div>
                          <div className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                            <FileTextIcon className="w-4 h-4 text-blue-500" />
                            Description
                          </div>
                          <div className="bg-muted/30 p-4 rounded-lg border text-sm leading-relaxed">
                            {renderRichContent(task.description)}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                            <span className="text-sm font-medium">Task Type</span>
                            <Badge variant="outline" className="capitalize font-medium">
                              {task.task_type.replace('_', ' ')}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                            <span className="text-sm font-medium">Evidence Required</span>
                            <Badge variant="secondary" className="capitalize">
                              {task.evidence_required?.replace('_', ' ') || 'None'}
                            </Badge>
                          </div>

                          {task.template && (
                            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                              <span className="text-sm font-medium">Template</span>
                              <span className="text-sm text-muted-foreground">{task.template.title}</span>
                            </div>
                          )}
                        </div>

                        {task.tags && task.tags.length > 0 && (
                          <div>
                            <div className="text-sm font-semibold text-foreground mb-2">Tags</div>
                            <div className="flex flex-wrap gap-2">
                              {task.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 👥 PEOPLE & ASSIGNMENTS */}
                    <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-base text-primary mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        People & Roles
                      </h4>

                      <div className="space-y-4">
                        {/* Assigned To */}
                        <div className="border-l-4 border-blue-400 pl-4 py-2 bg-blue-50/50 dark:bg-blue-900/20 rounded-r-lg">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-foreground">Assigned To</div>
                              {task.assigned_user ? (
                                <div className="space-y-1">
                                  <div className="text-base font-medium text-foreground">
                                    {task.assigned_user.full_name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {task.assigned_user.role} • {task.assigned_user.department}
                                  </div>
                                  <div className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded inline-block">
                                    ID: {task.assigned_user.employee_id || task.assigned_user.id}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm text-muted-foreground italic">❌ Unassigned</div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Created By */}
                        <div className="border-l-4 border-green-400 pl-4 py-2 bg-green-50/50 dark:bg-green-900/20 rounded-r-lg">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                              <Plus className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-foreground">Created By</div>
                              {task.created_by_user ? (
                                <div className="space-y-1">
                                  <div className="text-base font-medium text-foreground">
                                    {task.created_by_user.full_name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Task Creator</div>
                                </div>
                              ) : (
                                <div className="text-sm text-muted-foreground italic">Unknown Creator</div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Reviewer */}
                        {task.reviewer && (
                          <div className="border-l-4 border-purple-400 pl-4 py-2 bg-purple-50/50 dark:bg-purple-900/20 rounded-r-lg">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                                <CheckCircle className="w-4 h-4 text-purple-600" />
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-semibold text-foreground">Reviewer</div>
                                <div className="space-y-1">
                                  <div className="text-base font-medium text-foreground">
                                    {task.reviewer.full_name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">{task.reviewer.role}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ⏰ TIMELINE & SCHEDULE */}
                    <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-base text-primary mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Timeline & Schedule
                      </h4>

                      <div className="space-y-4">
                        {/* Created */}
                        <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium">Created</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {task.created_at ? new Date(task.created_at).toLocaleString() : 'Unknown'}
                          </span>
                        </div>

                        {/* Due Date */}
                        <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-medium">Due Date</span>
                          </div>
                          <div className="text-right">
                            {task.due_date ? (
                              <div className="space-y-1">
                                <div className="text-sm font-medium">
                                  {new Date(task.due_date).toLocaleDateString()}
                                </div>
                                {task.due_time && (
                                  <div className="text-xs text-muted-foreground">
                                    at {task.due_time}
                                  </div>
                                )}
                                {task.due_datetime && (
                                  <div className="text-xs text-muted-foreground">
                                    Full: {new Date(task.due_datetime).toLocaleString()}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground italic">No due date</span>
                            )}
                          </div>
                        </div>

                        {/* Last Updated */}
                        {task.updated_at && (
                          <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-blue-500" />
                              <span className="text-sm font-medium">Last Updated</span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {new Date(task.updated_at).toLocaleString()}
                            </span>
                          </div>
                        )}

                        {/* Priority & Status */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                            <span className="text-sm font-medium">Priority</span>
                            {getPriorityBadge(task.priority)}
                          </div>
                          <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                            <span className="text-sm font-medium">Status</span>
                            {getStatusBadge(task.status)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 📊 TASK METADATA & IDS */}
                    <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-base text-primary mb-4 flex items-center gap-2">
                        <FileTextIcon className="w-5 h-5" />
                        Metadata & Technical
                      </h4>

                      <div className="space-y-4">
                        {/* Technical IDs */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-2 bg-muted/10 rounded">
                            <span className="text-xs font-medium text-muted-foreground">Task ID</span>
                            <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                              {task.id}
                            </code>
                          </div>

                          {task.template_id && (
                            <div className="flex items-center justify-between p-2 bg-muted/10 rounded">
                              <span className="text-xs font-medium text-muted-foreground">Template ID</span>
                              <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                {task.template_id}
                              </code>
                            </div>
                          )}

                          {task.assigned_by && (
                            <div className="flex items-center justify-between p-2 bg-muted/10 rounded">
                              <span className="text-xs font-medium text-muted-foreground">Assigned By ID</span>
                              <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                {task.assigned_by}
                              </code>
                            </div>
                          )}

                          {task.assigned_to && (
                            <div className="flex items-center justify-between p-2 bg-muted/10 rounded">
                              <span className="text-xs font-medium text-muted-foreground">Assigned To ID</span>
                              <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                {task.assigned_to}
                              </code>
                            </div>
                          )}

                          {task.reviewer_id && (
                            <div className="flex items-center justify-between p-2 bg-muted/10 rounded">
                              <span className="text-xs font-medium text-muted-foreground">Reviewer ID</span>
                              <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                {task.reviewer_id}
                              </code>
                            </div>
                          )}
                        </div>

                        {/* Hierarchy Info */}
                        {(task.parent_task_id || task.task_level || task.task_order || task.completion_percentage !== undefined) && (
                          <div className="border-t pt-4">
                            <h5 className="text-sm font-semibold mb-3 text-muted-foreground">Hierarchy & Progress</h5>
                            <div className="space-y-2">
                              {task.parent_task_id && (
                                <div className="flex items-center justify-between p-2 bg-amber-50/50 dark:bg-amber-900/20 rounded">
                                  <span className="text-xs font-medium">Parent Task</span>
                                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                    {task.parent_task_id}
                                  </code>
                                </div>
                              )}

                              {task.task_level && (
                                <div className="flex items-center justify-between p-2 bg-muted/10 rounded">
                                  <span className="text-xs font-medium">Task Level</span>
                                  <Badge variant="outline" className="text-xs">
                                    Level {task.task_level}
                                  </Badge>
                                </div>
                              )}

                              {task.task_order && (
                                <div className="flex items-center justify-between p-2 bg-muted/10 rounded">
                                  <span className="text-xs font-medium">Task Order</span>
                                  <Badge variant="outline" className="text-xs">
                                    #{task.task_order}
                                  </Badge>
                                </div>
                              )}

                              {task.completion_percentage !== undefined && (
                                <div className="flex items-center justify-between p-2 bg-muted/10 rounded">
                                  <span className="text-xs font-medium">Completion</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 bg-muted rounded-full h-2">
                                      <div
                                        className="bg-green-500 h-2 rounded-full transition-all"
                                        style={{ width: `${task.completion_percentage || 0}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-xs font-medium">{task.completion_percentage || 0}%</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ADDITIONAL SECTIONS - Full Width */}
                  <div className="space-y-6">

                    {/* 📝 CHECKLIST ITEMS */}
                    {task.checklist_items && (
                      <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-border/50 shadow-sm">
                        <h4 className="font-bold text-base text-primary mb-4 flex items-center gap-2">
                          <CheckSquare className="w-5 h-5" />
                          Checklist Items
                        </h4>

                        <div className="space-y-2">
                          {(() => {
                            try {
                              const items = typeof task.checklist_items === 'string'
                                ? JSON.parse(task.checklist_items)
                                : task.checklist_items;

                              if (Array.isArray(items) && items.length > 0) {
                                return items.map((item: any, index: number) => (
                                  <div key={index} className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors">
                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                      item.completed
                                        ? 'bg-green-500 border-green-500 text-white'
                                        : 'border-muted-foreground/30'
                                    }`}>
                                      {item.completed && <Check className="w-3 h-3" />}
                                    </div>
                                    <span className={`text-sm flex-1 ${
                                      item.completed
                                        ? 'line-through text-muted-foreground'
                                        : 'text-foreground'
                                    }`}>
                                      {typeof item === 'string' ? item : item.text || item.description || JSON.stringify(item)}
                                    </span>
                                    {item.required && (
                                      <Badge variant="destructive" className="text-xs px-2 py-0.5">
                                        Required
                                      </Badge>
                                    )}
                                  </div>
                                ));
                              } else {
                                return (
                                  <div className="text-sm text-muted-foreground italic bg-muted/10 p-3 rounded-lg">
                                    No checklist items
                                  </div>
                                );
                              }
                            } catch (e) {
                              return (
                                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                                  Error parsing checklist: {String(task.checklist_items)}
                                </div>
                              );
                            }
                          })()
                          }
                        </div>
                      </div>
                    )}

                    {/* 📎 TASK SUBMISSIONS */}
                    {task.submissions && task.submissions.length > 0 && (
                      <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-border/50 shadow-sm">
                        <h4 className="font-bold text-base text-primary mb-4 flex items-center gap-2">
                          <Upload className="w-5 h-5" />
                          Task Submissions ({task.submissions.length})
                        </h4>

                        <div className="space-y-4">
                          {task.submissions.map((submission: any, index: number) => (
                            <div key={submission.id || index} className="border border-border/30 rounded-lg p-4 bg-muted/10">
                              <div className="flex items-start justify-between mb-2">
                                <div className="space-y-1">
                                  <div className="text-sm font-semibold">Submission #{index + 1}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {submission.created_at ? new Date(submission.created_at).toLocaleString() : 'Date unknown'}
                                  </div>
                                  {submission.submitted_by_user && (
                                    <div className="text-xs text-muted-foreground">
                                      By: {submission.submitted_by_user.full_name || submission.submitted_by_user.id}
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  {submission.status && (
                                    <Badge variant="outline" className="text-xs">
                                      {submission.status}
                                    </Badge>
                                  )}
                                  {submission.submission_type && (
                                    <Badge variant="secondary" className="text-xs">
                                      {submission.submission_type}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {submission.content && (
                                <div className="text-sm bg-background/50 p-3 rounded border mb-2">
                                  {submission.content}
                                </div>
                              )}

                              {submission.file_url && (
                                <div className="text-xs text-blue-600 hover:text-blue-800">
                                  <a href={submission.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3" />
                                    View File
                                  </a>
                                </div>
                              )}

                              {submission.metadata && (
                                <div className="text-xs text-muted-foreground mt-2">
                                  <code className="bg-muted px-2 py-1 rounded">
                                    {JSON.stringify(submission.metadata)}
                                  </code>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 📋 TASK REVIEWS */}
                    {task.reviews && task.reviews.length > 0 && (
                      <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-border/50 shadow-sm">
                        <h4 className="font-bold text-base text-primary mb-4 flex items-center gap-2">
                          <MessageSquare className="w-5 h-5" />
                          Task Reviews ({task.reviews.length})
                        </h4>

                        <div className="space-y-4">
                          {task.reviews.map((review: any, index: number) => (
                            <div key={review.id || index} className="border border-border/30 rounded-lg p-4 bg-muted/10">
                              <div className="flex items-start justify-between mb-3">
                                <div className="space-y-1">
                                  <div className="text-sm font-semibold flex items-center gap-2">
                                    Review #{index + 1}
                                    {review.review_status && (
                                      <Badge
                                        variant={review.review_status === 'approved' ? 'default' :
                                               review.review_status === 'rejected' ? 'destructive' : 'secondary'}
                                        className="text-xs"
                                      >
                                        {review.review_status}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {review.created_at ? new Date(review.created_at).toLocaleString() : 'Date unknown'}
                                  </div>
                                  {review.reviewer_user && (
                                    <div className="text-xs text-muted-foreground">
                                      Reviewer: {review.reviewer_user.full_name || review.reviewer_user.id}
                                    </div>
                                  )}
                                </div>
                                {review.rating && (
                                  <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-3 h-3 ${
                                          i < review.rating
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-muted-foreground'
                                        }`}
                                      />
                                    ))}
                                    <span className="text-xs ml-1">{review.rating}/5</span>
                                  </div>
                                )}
                              </div>

                              {review.comments && (
                                <div className="text-sm bg-background/50 p-3 rounded border">
                                  {review.comments}
                                </div>
                              )}

                              {review.feedback_data && (
                                <div className="text-xs text-muted-foreground mt-2">
                                  <details className="cursor-pointer">
                                    <summary className="font-medium">Feedback Data</summary>
                                    <code className="bg-muted px-2 py-1 rounded block mt-1 whitespace-pre-wrap">
                                      {JSON.stringify(review.feedback_data, null, 2)}
                                    </code>
                                  </details>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 👶 SUBTASKS */}
                    {task.subtasks && task.subtasks.length > 0 && (
                      <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-border/50 shadow-sm">
                        <h4 className="font-bold text-base text-primary mb-4 flex items-center gap-2">
                          <GitBranch className="w-5 h-5" />
                          Subtasks ({task.subtasks.length})
                        </h4>

                        <div className="space-y-3">
                          {task.subtasks.map((subtask: any, index: number) => (
                            <div key={subtask.id || index} className="border border-border/30 rounded-lg p-4 bg-muted/10 hover:bg-muted/20 transition-colors">
                              <div className="flex items-start justify-between mb-2">
                                <div className="space-y-1 flex-1">
                                  <div className="text-sm font-semibold flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${
                                      subtask.status === 'completed' ? 'bg-green-500' :
                                      subtask.status === 'in_progress' ? 'bg-blue-500' :
                                      subtask.status === 'pending' ? 'bg-gray-400' : 'bg-gray-300'
                                    }`}></div>
                                    {subtask.title}
                                  </div>
                                  {subtask.description && (
                                    <div className="text-xs text-muted-foreground">
                                      {subtask.description}
                                    </div>
                                  )}
                                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                    {subtask.assigned_user && (
                                      <span>👤 {subtask.assigned_user.full_name}</span>
                                    )}
                                    {subtask.due_date && (
                                      <span>📅 Due: {new Date(subtask.due_date).toLocaleDateString()}</span>
                                    )}
                                    {subtask.task_level && (
                                      <span>📊 Level {subtask.task_level}</span>
                                    )}
                                    {subtask.task_order && (
                                      <span>🔢 Order #{subtask.task_order}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2 ml-3">
                                  {subtask.priority && (
                                    <Badge variant="outline" className="text-xs">
                                      {subtask.priority}
                                    </Badge>
                                  )}
                                  {subtask.status && (
                                    <Badge
                                      variant={subtask.status === 'completed' ? 'default' :
                                             subtask.status === 'in_progress' ? 'secondary' : 'outline'}
                                      className="text-xs"
                                    >
                                      {subtask.status.replace('_', ' ')}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {subtask.completion_percentage !== undefined && subtask.completion_percentage > 0 && (
                                <div className="flex items-center gap-2 mt-2">
                                  <div className="flex-1 bg-muted rounded-full h-2">
                                    <div
                                      className="bg-green-500 h-2 rounded-full transition-all"
                                      style={{ width: `${subtask.completion_percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs font-medium">{subtask.completion_percentage}%</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 🔗 RAW DATA - DEBUG INFO */}
                    {(task.metadata || task.additional_data) && (
                      <details className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-border/50 shadow-sm">
                        <summary className="cursor-pointer font-bold text-base text-primary mb-4 flex items-center gap-2">
                          <Code className="w-5 h-5" />
                          Raw Task Data (Debug)
                        </summary>

                        <div className="mt-4 space-y-4">
                          {task.metadata && (
                            <div>
                              <h5 className="text-sm font-semibold mb-2">Metadata</h5>
                              <pre className="bg-muted/20 p-3 rounded text-xs overflow-auto border">
                                <code>{JSON.stringify(task.metadata, null, 2)}</code>
                              </pre>
                            </div>
                          )}

                          {task.additional_data && (
                            <div>
                              <h5 className="text-sm font-semibold mb-2">Additional Data</h5>
                              <pre className="bg-muted/20 p-3 rounded text-xs overflow-auto border">
                                <code>{JSON.stringify(task.additional_data, null, 2)}</code>
                              </pre>
                            </div>
                          )}

                          <div>
                            <h5 className="text-sm font-semibold mb-2">Full Task Object</h5>
                            <pre className="bg-muted/20 p-3 rounded text-xs overflow-auto border max-h-64">
                              <code>{JSON.stringify(task, null, 2)}</code>
                            </pre>
                          </div>
                        </div>
                      </details>
                    )}

                  </div>
                </div>
              </div>
            </TableCell>
          </TableRow>
        )}
      </React.Fragment>
    );
  };

  // Function to render task with subtasks
  const renderTaskWithSubtasks = (task: TaskWithDetails, depth: number = 0) => {
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
              onOpenChange={(open) => setAssigneePopovers(prev => ({ ...prev, [task.id]: open }))}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full h-8 border-0 bg-transparent hover:bg-muted/50 focus:ring-0 focus:ring-offset-0 justify-start p-0"
                >
                  <div className="flex items-center min-w-0">
                    <span className="text-sm truncate">
                      {task.assigned_user?.full_name
                        ? `${task.assigned_user.full_name} (${task.assigned_user.employee_id || task.assigned_user.id})`
                        : 'Unassigned'
                      }
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
                            <div className="font-medium">{user.full_name} ({user.employee_id || user.id})</div>
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
                      {task.task_type.replace('_', ' ')}
                    </Badge>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="one_off">One Off</SelectItem>
                <SelectItem value="recurring">Recurring</SelectItem>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
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
              {task.created_by_user?.full_name || 'Unknown'}
            </span>
          </TableCell>

          <TableCell className="py-2">
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
                  className="text-destructive"
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
                      try {
                        const result = await deleteTask(task.id);
                        if (!result.error) {
                          toast({
                            title: "Task deleted",
                            description: "The task has been successfully deleted.",
                          });
                        }
                      } catch (error) {
                        console.error('Delete task error:', error);
                        toast({
                          title: "Error",
                          description: "Failed to delete task. Please try again.",
                          variant: "destructive",
                        });
                      }
                    }
                  }}
                >
                  Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                      <span className="text-sm text-muted-foreground ml-2">{renderRichContent(task.description)}</span>
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
                          {task.created_by_user?.full_name || 'Unknown'}
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
          renderTaskWithSubtasks(subtask, depth + 1)
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
      done_auto_approved: { icon: CheckCircle, color: 'text-green-600', label: 'Done' }
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
    return count;
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending', icon: Clock },
    { value: 'in_progress', label: 'In Progress', icon: AlertTriangle },
    { value: 'submitted_for_review', label: 'Submitted', icon: Clock },
    { value: 'approved', label: 'Approved', icon: CheckCircle },
    { value: 'rejected', label: 'Rejected', icon: AlertTriangle },
    { value: 'done_auto_approved', label: 'Done', icon: CheckCircle },
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => setFilters({...filters, assignee: 'all'})}>
                          All Assignees
                        </DropdownMenuItem>
                        {users?.map((user) => (
                          <DropdownMenuItem
                            key={user.id}
                            onClick={() => setFilters({...filters, assignee: user.id})}
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
                        <DropdownMenuItem onClick={() => setFilters({...filters, type: 'all'})}>
                          All Types
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilters({...filters, type: 'daily'})}>
                          Daily
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilters({...filters, type: 'one-off'})}>
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
                        <DropdownMenuItem onClick={() => setFilters({...filters, priority: 'all'})}>
                          All Priorities
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilters({...filters, priority: 'high'})}>
                          High
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilters({...filters, priority: 'medium'})}>
                          Medium
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilters({...filters, priority: 'low'})}>
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
                        <DropdownMenuItem onClick={() => setFilters({...filters, status: 'all'})}>
                          All Status
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilters({...filters, status: 'pending'})}>
                          Pending
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilters({...filters, status: 'in_progress'})}>
                          In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilters({...filters, status: 'submitted_for_review'})}>
                          Submitted
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilters({...filters, status: 'approved'})}>
                          Approved
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilters({...filters, status: 'rejected'})}>
                          Rejected
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilters({...filters, status: 'done_auto_approved'})}>
                          Done
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
                        <DropdownMenuItem onClick={() => setFilters({...filters, dateRange: undefined})}>
                          All Dates
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          const today = new Date().toISOString().split('T')[0];
                          setFilters({...filters, dateRange: { start: new Date(today), end: new Date(today) }});
                        }}>
                          Today
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          const tomorrowStr = tomorrow.toISOString().split('T')[0];
                          setFilters({...filters, dateRange: { start: new Date(tomorrowStr), end: new Date(tomorrowStr) }});
                        }}>
                          Tomorrow
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          const today = new Date();
                          const nextWeek = new Date();
                          nextWeek.setDate(today.getDate() + 7);
                          setFilters({...filters, dateRange: { start: today, end: nextWeek }});
                        }}>
                          Next 7 Days
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          const today = new Date();
                          setFilters({...filters, isLate: true});
                        }}>
                          Overdue
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
                      <TableCell colSpan={9} className="py-3">
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
                      // Check if this task has subtasks
                      const hasSubtasks = task.subtasks && task.subtasks.length > 0;
                      return hasSubtasks ? renderTaskWithSubtasks(task) : renderSingleTask(task);
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


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Task Management</h1>
        <div className="flex items-center gap-2">

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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search and filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-80">
              <Input
                placeholder="Search tasks by title, assignee, or description..."
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
                  <SelectItem value="assignee">Group by Assignee</SelectItem>
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
              <Dialog open={advancedFiltersOpen} onOpenChange={setAdvancedFiltersOpen}>
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
                              {user.full_name} ({user.employee_id || user.id})
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
    </div>
  );
}
