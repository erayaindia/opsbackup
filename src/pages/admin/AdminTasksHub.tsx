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
} from 'lucide-react';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskDrawer } from '@/components/tasks/TaskDrawer';
import { CreateTaskForm } from '@/components/tasks/CreateTaskForm';
import { useTasks } from '@/hooks/useTasks';
import { useTaskCreation } from '@/hooks/useTaskCreation';
import { useTaskReviews } from '@/hooks/useTaskReviews';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUsers } from '@/hooks/useUsers';
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
  const [advancedFilters, setAdvancedFilters] = useState({
    dateRange: '',
    selectedStatuses: [] as string[],
    selectedPriorities: [] as string[],
    selectedTypes: [] as string[],
    selectedAssignees: [] as string[],
    isOverdue: false,
    hasNoAssignee: false,
  });

  const { toast } = useToast();
  const { profile } = useUserProfile();
  const { users } = useUsers();
  const { createTask, createTaskFromTemplate, createDailyTasks, loading: creationLoading } = useTaskCreation();
  const { bulkReview, loading: reviewLoading } = useTaskReviews();

  const { tasks, loading, error, refetch, bulkAction, updateTask } = useTasks({
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
            <ul key={key} className="list-disc list-inside mb-2 space-y-1">
              {Array.isArray(node.content) ? node.content.map((child: any, index: number) => renderNode(child, index)) : ''}
            </ul>
          );

        case 'orderedList':
          return (
            <ol key={key} className="list-decimal list-inside mb-2 space-y-1">
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

  // Sort tasks based on current sort settings
  const sortedTasks = React.useMemo(() => {
    if (!filteredTasks.length) return filteredTasks;

    return [...filteredTasks].sort((a, b) => {
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
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 p-0 h-auto font-semibold hover:bg-transparent"
                    onClick={() => handleSort('assignee')}
                  >
                    Assignee
                    {getSortIcon('assignee')}
                  </Button>
                </TableHead>
                <TableHead className="w-32 border-r border-border/50 whitespace-nowrap">
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 p-0 h-auto font-semibold hover:bg-transparent"
                    onClick={() => handleSort('type')}
                  >
                    Type
                    {getSortIcon('type')}
                  </Button>
                </TableHead>
                <TableHead className="w-32 border-r border-border/50 whitespace-nowrap">
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 p-0 h-auto font-semibold hover:bg-transparent"
                    onClick={() => handleSort('priority')}
                  >
                    Priority
                    {getSortIcon('priority')}
                  </Button>
                </TableHead>
                <TableHead className="w-32 border-r border-border/50 whitespace-nowrap">
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 p-0 h-auto font-semibold hover:bg-transparent"
                    onClick={() => handleSort('status')}
                  >
                    Status
                    {getSortIcon('status')}
                  </Button>
                </TableHead>
                <TableHead className="w-32 border-r border-border/50 whitespace-nowrap">
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 p-0 h-auto font-semibold hover:bg-transparent"
                    onClick={() => handleSort('due_date')}
                  >
                    Due Date
                    {getSortIcon('due_date')}
                  </Button>
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
                      <TableCell colSpan={8} className="py-3">
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
                  {!collapsedGroups.has(groupKey) && groupTasks.map((task) => {
                    const isExpanded = expandedRows.has(task.id);

                    return (
                      <React.Fragment key={task.id}>
                        <TableRow
                          className="cursor-pointer hover:bg-muted/30 hover:shadow-sm transition-all duration-200 h-12 group border-l-2 border-l-transparent hover:border-l-primary/50"
                          onClick={() => toggleRowExpansion(task.id)}
                        >
                      <TableCell className="border-r border-border/50 py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRowExpansion(task.id);
                          }}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3 transition-transform duration-200" />
                          ) : (
                            <ChevronRight className="h-3 w-3 transition-transform duration-200" />
                          )}
                        </Button>
                      </TableCell>

                      <TableCell className="border-r border-border/50 py-2">
                        <div className="font-medium text-sm truncate">{task.title}</div>
                      </TableCell>

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
                            <SelectItem value="daily">
                              <div className="flex items-center">
                                <Badge variant="outline" className="capitalize">Daily</Badge>
                              </div>
                            </SelectItem>
                            <SelectItem value="one_off">
                              <div className="flex items-center">
                                <Badge variant="outline" className="capitalize">One Off</Badge>
                              </div>
                            </SelectItem>
                            <SelectItem value="recurring">
                              <div className="flex items-center">
                                <Badge variant="outline" className="capitalize">Recurring</Badge>
                              </div>
                            </SelectItem>
                            <SelectItem value="project">
                              <div className="flex items-center">
                                <Badge variant="outline" className="capitalize">Project</Badge>
                              </div>
                            </SelectItem>
                            <SelectItem value="maintenance">
                              <div className="flex items-center">
                                <Badge variant="outline" className="capitalize">Maintenance</Badge>
                              </div>
                            </SelectItem>
                            <SelectItem value="urgent">
                              <div className="flex items-center">
                                <Badge variant="outline" className="capitalize">Urgent</Badge>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>

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
                            <SelectItem value="pending">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                <span>Pending</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="in_progress">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-3 w-3" />
                                <span>In Progress</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="submitted_for_review">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                <span>Submitted</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="approved">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-3 w-3" />
                                <span>Approved</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="rejected">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-3 w-3" />
                                <span>Rejected</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="done_auto_approved">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-3 w-3" />
                                <span>Done</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell className="border-r border-border/50 py-2" onClick={(e) => e.stopPropagation()}>
                        <DatePicker
                          value={task.due_date ? new Date(task.due_date) : undefined}
                          onChange={(date) => handleDueDateChange(task.id, date)}
                          placeholder="Select due date"
                          className="w-full h-8 border-0 bg-transparent hover:bg-muted/50 focus:ring-0 focus:ring-offset-0 text-sm"
                        />
                      </TableCell>


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
                            <DropdownMenuItem className="text-destructive">
                              Delete Task
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Row Content */}
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={8} className="p-0">
                          <div className="bg-muted/30 p-6 border-t animate-in slide-in-from-top-2 duration-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                              {/* Task Details */}
                              <div className="space-y-4">
                                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                  Task Details
                                </h4>

                                <div className="space-y-3">
                                  <div>
                                    <div className="text-sm font-medium">Description</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {renderRichContent(task.description)}
                                    </div>
                                  </div>


                                  <div>
                                    <div className="text-sm font-medium">Created</div>
                                    <div className="text-xs text-muted-foreground">
                                      {new Date(task.created_at).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Assignment Information */}
                              <div className="space-y-4">
                                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                  Assignment Information
                                </h4>

                                <div className="space-y-3">
                                  <div className="flex items-center space-x-3">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    <div>
                                      <div className="text-sm font-medium">Assignee</div>
                                      <div className="text-xs text-muted-foreground">
                                        {task.assigned_user?.full_name || 'Unassigned'}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center space-x-3">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    <div>
                                      <div className="text-sm font-medium">Due Date</div>
                                      <div className="text-xs text-muted-foreground">
                                        {task.due_date} {task.due_time && `at ${task.due_time}`}
                                      </div>
                                    </div>
                                  </div>

                                  {task.submissions && task.submissions.length > 0 && (
                                    <div className="flex items-center space-x-3">
                                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                                      <div>
                                        <div className="text-sm font-medium">Submissions</div>
                                        <div className="text-xs text-muted-foreground">
                                          {task.submissions.length} submission(s)
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Status Information */}
                              <div className="space-y-4">
                                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                  Status Information
                                </h4>

                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm">Type</span>
                                    <Badge variant="outline" className="capitalize">
                                      {task.task_type.replace('_', ' ')}
                                    </Badge>
                                  </div>

                                  <div className="flex justify-between items-center">
                                    <span className="text-sm">Priority</span>
                                    {getPriorityBadge(task.priority)}
                                  </div>

                                  <div className="flex justify-between items-center">
                                    <span className="text-sm">Status</span>
                                    {getStatusBadge(task.status)}
                                  </div>

                                  {task.is_late && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm">Late</span>
                                      <Badge variant="destructive" className="text-xs">
                                        Overdue
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                      </React.Fragment>
                    );
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