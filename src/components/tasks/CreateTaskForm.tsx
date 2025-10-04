import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RichEditor } from '@/components/RichEditor';
import type { EditorContent } from '@/components/editor-types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DatePicker } from '@/components/ui/date-picker';
import { AIWritingAssistant } from '@/components/ui/ai-writing-assistant';
import {
  CalendarIcon,
  ClockIcon,
  PlusIcon,
  XIcon,
  UsersIcon,
  FileTextIcon,
  CheckCircleIcon,
  SearchIcon,
  ChevronDownIcon,
  CheckIcon,
  ListTreeIcon,
  MoveUpIcon,
  MoveDownIcon,
  Trash2Icon,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { useTaskCreation } from '@/hooks/useTaskCreation';
import { useTaskTemplates, useTasks } from '@/hooks/useTasks';
import { useUsers } from '@/hooks/useUsers';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  CreateTaskData,
  CreateSubtaskData,
  TaskTypeValue,
  TaskPriorityValue,
  EvidenceTypeValue,
  ChecklistItem,
  TaskWithDetails,
  TaskInsert,
} from '@/types/tasks';

interface CreateTaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated?: () => void;
  task?: TaskWithDetails | null;
  mode?: 'create' | 'edit';
}

export function CreateTaskForm({ open, onOpenChange, onTaskCreated, task, mode = 'create' }: CreateTaskFormProps) {
  const [activeTab, setActiveTab] = useState('manual');
  const [formData, setFormData] = useState<CreateTaskData>({
    title: '',
    description: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: []
        }
      ]
    },
    taskType: 'one-off',
    priority: 'medium',
    evidenceRequired: 'none',
    dueDate: '',
    dueTime: '',
    assignedTo: [],
    tags: [],
    checklistItems: [],
    subtasks: [],
    recurrencePattern: null,
    recurrenceStartDate: null,
    recurrenceEndDate: null,
  });

  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [newTag, setNewTag] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showTitleAI, setShowTitleAI] = useState(false);
  const [showDescriptionAI, setShowDescriptionAI] = useState(false);

  // Recurrence pattern state
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([]);
  const [selectedMonthDays, setSelectedMonthDays] = useState<number[]>([]);

  const { toast } = useToast();

  // Helper function to extract plain text from editor content
  const getPlainTextFromEditor = (content: any): string => {
    if (typeof content === 'string') return content;
    if (!content || !content.content) return '';

    let text = '';
    const extractText = (node: any) => {
      if (node.type === 'text') {
        text += node.text || '';
      } else if (node.content) {
        node.content.forEach(extractText);
      }
    };

    content.content.forEach(extractText);
    return text.trim();
  };

  // Subtask management functions
  const addSubtask = () => {
    const newSubtask: CreateSubtaskData = {
      id: `temp-${Date.now()}`,
      title: '',
      taskOrder: formData.subtasks?.length || 0,
      priority: formData.priority, // Inherit parent priority
      assignedTo: null,
      tags: [],
      checklistItems: [],
    };

    setFormData(prev => ({
      ...prev,
      subtasks: [...(prev.subtasks || []), newSubtask]
    }));
  };

  const updateSubtask = (index: number, updates: Partial<CreateSubtaskData>) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks?.map((subtask, i) =>
        i === index ? { ...subtask, ...updates } : subtask
      ) || []
    }));
  };

  const removeSubtask = (index: number) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks?.filter((_, i) => i !== index) || []
    }));
  };

  const moveSubtask = (index: number, direction: 'up' | 'down') => {
    if (!formData.subtasks) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= formData.subtasks.length) return;

    const subtasks = [...formData.subtasks];
    [subtasks[index], subtasks[newIndex]] = [subtasks[newIndex], subtasks[index]];

    // Update task orders
    subtasks.forEach((subtask, i) => {
      subtask.taskOrder = i;
    });

    setFormData(prev => ({
      ...prev,
      subtasks
    }));
  };
  const { createTask, createTaskFromTemplate, loading: creationLoading } = useTaskCreation();
  const { templates, loading: templatesLoading } = useTaskTemplates();
  const { users, loading: usersLoading } = useUsers();
  const { updateTask } = useTasks();
  const { profile } = useUserProfile();

  // Populate form data when editing a task
  useEffect(() => {
    if (task && mode === 'edit' && open) {
      // Convert subtasks from TaskWithDetails to CreateSubtaskData format
      const convertedSubtasks = task.subtasks?.map((subtask, index) => ({
        id: subtask.id,
        title: subtask.title || '',
        description: subtask.description || '',
        taskType: (subtask.task_type as TaskTypeValue) || 'one-off',
        priority: (subtask.priority as TaskPriorityValue) || 'medium',
        evidenceRequired: (subtask.evidence_required as EvidenceTypeValue) || 'none',
        dueDate: subtask.due_date || '',
        dueTime: subtask.due_time || '',
        assignedTo: subtask.assigned_to || null,
        tags: subtask.tags || [],
        checklistItems: subtask.checklist_items || [],
        taskOrder: subtask.task_order || index,
      })) || [];

      setFormData({
        title: task.title || '',
        description: task.description || {
          type: 'doc',
          content: [{ type: 'paragraph', content: [] }]
        },
        taskType: (task.task_type as TaskTypeValue) || 'one-off',
        priority: (task.priority as TaskPriorityValue) || 'medium',
        evidenceRequired: (task.evidence_required as EvidenceTypeValue) || 'none',
        dueDate: task.due_date || '',
        dueTime: task.due_time || '',
        assignedTo: task.assigned_to ? [task.assigned_to] : [],
        tags: task.tags || [],
        checklistItems: task.checklist_items || [],
        subtasks: convertedSubtasks,
      });

      if (task.assigned_to) {
        setSelectedUsers(new Set([task.assigned_to]));
      }

    }
  }, [task, mode, open]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setFormData({
        title: '',
        description: '',
        taskType: 'one-off',
        priority: 'medium',
        evidenceRequired: 'none',
        dueDate: '',
        dueTime: '',
        assignedTo: [],
        tags: [],
        checklistItems: [],
        subtasks: [],
      });
      setSelectedTemplate('');
      setSelectedUsers(new Set());
      setNewTag('');
      setNewChecklistItem('');
      setUserSearchTerm('');
      setUserDropdownOpen(false);
      setActiveTab('manual');
      setShowTitleAI(false);
      setShowDescriptionAI(false);
    }
  }, [open]);

  const handleInputChange = (field: keyof CreateTaskData, value: unknown) => {
    // Special handling for taskType to set recurrence pattern
    if (field === 'taskType') {
      const taskType = value as TaskTypeValue;

      // Clear recurrence selections when changing task type
      setSelectedWeekDays([]);
      setSelectedMonthDays([]);

      let recurrencePattern = null;
      if (taskType === 'daily') {
        recurrencePattern = { type: 'daily' };
      } else if (taskType === 'weekly') {
        recurrencePattern = null; // Will be set when user selects days
      } else if (taskType === 'monthly') {
        recurrencePattern = null; // Will be set when user selects days
      }

      setFormData(prev => ({
        ...prev,
        [field]: value,
        recurrencePattern,
        recurrenceStartDate: (taskType !== 'one-off') ? prev.recurrenceStartDate : null,
        recurrenceEndDate: (taskType !== 'one-off') ? prev.recurrenceEndDate : null,
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleUserSelection = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
    handleInputChange('assignedTo', Array.from(newSelected));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      const updatedTags = [...(formData.tags || []), newTag.trim()];
      handleInputChange('tags', updatedTags);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const updatedTags = formData.tags?.filter(tag => tag !== tagToRemove) || [];
    handleInputChange('tags', updatedTags);
  };

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      const newItem: ChecklistItem = {
        id: Date.now().toString(),
        text: newChecklistItem.trim(),
        completed: false,
        required: true,
      };
      const updatedItems = [...(formData.checklistItems || []), newItem];
      handleInputChange('checklistItems', updatedItems);
      setNewChecklistItem('');
    }
  };

  const removeChecklistItem = (itemId: string) => {
    const updatedItems = formData.checklistItems?.filter(item => item.id !== itemId) || [];
    handleInputChange('checklistItems', updatedItems);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Task title is required',
        variant: 'destructive',
      });
      return;
    }

    if (formData.assignedTo.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least one user to assign the task',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.dueDate) {
      toast({
        title: 'Validation Error',
        description: 'Due date is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (mode === 'edit' && task) {
        // Update existing task
        const updateData = {
          title: formData.title.trim(),
          description: formData.description,
          task_type: formData.taskType,
          priority: formData.priority,
          evidence_required: formData.evidenceRequired,
          due_date: formData.dueDate,
          due_time: formData.dueTime || null,
          assigned_to: formData.assignedTo.length > 0 ? formData.assignedTo[0] : null,
          tags: formData.tags || [],
          checklist_items: formData.checklistItems || [],
        };

        const result = await updateTask(task.id, updateData);

        if (!result.error) {
          // Handle subtasks for edit mode
          if (formData.subtasks && formData.subtasks.length > 0) {
            console.log('Processing subtasks in edit mode:', formData.subtasks.length);

            // Filter valid subtasks (must have title)
            const validSubtasks = formData.subtasks.filter(subtask =>
              subtask.title && subtask.title.trim() !== ''
            );

            console.log('Valid subtasks to create:', validSubtasks.length);

            // Get existing subtask IDs (if any) to identify new vs existing
            const existingSubtaskIds = new Set(
              (task.subtasks || []).map(st => st.id)
            );

            // Process each valid subtask
            for (const subtaskData of validSubtasks) {
              // Check if this is a new subtask (no ID or ID not in existing set)
              const isNewSubtask = !subtaskData.id || !existingSubtaskIds.has(subtaskData.id);

              if (isNewSubtask) {
                console.log('Creating new subtask:', subtaskData.title);

                // Create subtask directly using Supabase
                try {
                  if (!profile?.appUser?.id) {
                    throw new Error('User profile not found');
                  }

                  const subtaskDescription = subtaskData.description
                    ? (typeof subtaskData.description === 'string'
                       ? subtaskData.description
                       : JSON.stringify(subtaskData.description))
                    : null;

                  // Use the first assignee from formData, or fallback to current user
                  const assignedToId = subtaskData.assignedTo ||
                    (formData.assignedTo.length > 0 ? formData.assignedTo[0] : profile.appUser.id);

                  const subtaskInsert: TaskInsert = {
                    title: subtaskData.title,
                    description: subtaskDescription,
                    task_type: subtaskData.taskType || formData.taskType,
                    priority: subtaskData.priority || formData.priority,
                    evidence_required: subtaskData.evidenceRequired || formData.evidenceRequired,
                    due_date: subtaskData.dueDate || formData.dueDate,
                    due_time: subtaskData.dueTime || formData.dueTime || null,
                    due_datetime: null,
                    assigned_to: assignedToId,
                    assigned_by: profile.appUser.id,
                    reviewer_id: null,
                    tags: subtaskData.tags || formData.tags || [],
                    checklist_items: subtaskData.checklistItems ? JSON.stringify(subtaskData.checklistItems) : null,
                    status: 'pending',
                    parent_task_id: task.id, // Link to parent task
                    task_level: 1, // First level subtask
                    task_order: subtaskData.taskOrder || 0,
                    completion_percentage: 0,
                  };

                  const { error: subtaskError } = await supabase
                    .from('tasks')
                    .insert(subtaskInsert);

                  if (subtaskError) {
                    throw subtaskError;
                  }

                  console.log('Successfully created subtask:', subtaskData.title);
                  toast({
                    title: "Subtask created",
                    description: `Successfully created subtask "${subtaskData.title}"`,
                  });
                } catch (error: unknown) {
                  console.error('Error creating subtask:', error);
                  toast({
                    title: "Error creating subtask",
                    description: `Failed to create subtask "${subtaskData.title}": ${error instanceof Error ? error.message : 'Unknown error'}`,
                    variant: "destructive",
                  });
                }
              }
              // Note: For existing subtasks, we would need additional logic to update them
              // For now, we'll focus on creating new subtasks added in edit mode
            }
          }

          onTaskCreated?.();
          onOpenChange(false);
        }
      } else if (activeTab === 'template' && selectedTemplate) {
        // Create from template
        const result = await createTaskFromTemplate({
          template_id: selectedTemplate,
          assigned_to: formData.assignedTo,
          due_date: formData.dueDate,
          due_time: formData.dueTime,
          override_priority: formData.priority,
        });

        if (result.length > 0) {
          onTaskCreated?.();
          onOpenChange(false);
        }
      } else {
        // Create manual task
        // Filter out subtasks with empty titles before conversion
        const validSubtasks = formData.subtasks?.filter(subtask => subtask.title && subtask.title.trim() !== '') || [];

        console.log('🔧 DEBUG CreateTaskForm: Original formData:', JSON.stringify(formData, null, 2));
        console.log('🔧 DEBUG CreateTaskForm: Original subtasks:', formData.subtasks);
        console.log('🔧 DEBUG CreateTaskForm: Valid subtasks after filtering:', validSubtasks);
        console.log('🔧 DEBUG CreateTaskForm: Filter condition - subtasks with titles:', validSubtasks.map(s => s.title));

        // Keep the subtasks as CreateSubtaskData format - no conversion needed
        const convertedFormData: CreateTaskData = {
          ...formData,
          subtasks: validSubtasks.map(subtask => ({
            title: subtask.title.trim(),
            description: subtask.description || '',
            taskType: subtask.taskType || formData.taskType,
            priority: subtask.priority || formData.priority,
            evidenceRequired: subtask.evidenceRequired || formData.evidenceRequired,
            dueDate: subtask.dueDate || '',
            dueTime: subtask.dueTime || '',
            assignedTo: subtask.assignedTo,
            tags: subtask.tags || [],
            checklistItems: subtask.checklistItems || [],
            taskOrder: subtask.taskOrder,
          }))
        };

        console.log('🔧 DEBUG CreateTaskForm: Converted form data with subtasks:', JSON.stringify(convertedFormData, null, 2));
        console.log('🔧 DEBUG CreateTaskForm: About to call createTask with subtasks:', convertedFormData.subtasks);
        console.log('🔧 DEBUG CreateTaskForm: Number of subtasks being sent:', convertedFormData.subtasks?.length || 0);

        const result = await createTask(convertedFormData);

        if (result.length > 0) {
          onTaskCreated?.();
          onOpenChange(false);
        }
      }
    } catch (error) {
      console.error('Error creating/updating task:', error);
    }
  };

  const selectedTemplateData = templates?.find(t => t.id === selectedTemplate);

  // Filter users based on search term
  const filteredUsers = users?.filter(user =>
    user.full_name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.department.toLowerCase().includes(userSearchTerm.toLowerCase())
  ) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusIcon className="h-5 w-5" />
            {mode === 'edit' ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>

        {/* Top controls - User Assignment and Task Type */}
        <div className="flex gap-4 px-1 pb-4 border-b">
          {/* User Assignment */}
          <div className="space-y-2 w-80">
            <Label>Assign to Users *</Label>
            <Popover open={userDropdownOpen} onOpenChange={setUserDropdownOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={userDropdownOpen}
                  className="w-full justify-between rounded-none"
                >
                  {selectedUsers.size === 0
                    ? "Select users..."
                    : `${selectedUsers.size} user(s) selected`}
                  <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 rounded-none">
              <Command>
                <CommandInput placeholder="Search users..." />
                <CommandEmpty>No users found.</CommandEmpty>
                <CommandGroup className="max-h-64 overflow-auto">
                  {users?.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={`${user.full_name} ${user.role} ${user.department}`}
                      onSelect={() => {
                        handleUserSelection(user.id, !selectedUsers.has(user.id));
                      }}
                    >
                      <CheckIcon
                        className={`mr-2 h-4 w-4 ${
                          selectedUsers.has(user.id) ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{user.full_name}</span>
                        <span className="text-sm text-muted-foreground">
                          {user.role} - {user.department}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
            </Popover>
            {selectedUsers.size > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedUsers.size} user(s) selected
              </p>
            )}
          </div>

          {/* Task Type Selection */}
          <div className="space-y-2 w-64">
            <Label>Task Type</Label>
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="manual">Manual Task</SelectItem>
                <SelectItem value="template">From Template</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="flex-1 max-h-[70vh] overflow-y-auto" type="always">
          <div className="px-1">
            {/* Manual Task Form */}
            {activeTab === 'manual' && (
              <div className="space-y-6 mt-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="title">Task Title *</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTitleAI(!showTitleAI)}
                      className="h-6 px-2 text-xs flex items-center gap-1"
                    >
                      <Sparkles className="h-3 w-3" />
                      AI Assist
                    </Button>
                  </div>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter task title"
                    className="rounded-none"
                  />
                  {showTitleAI && (
                    <AIWritingAssistant
                      originalText={formData.title}
                      onTextUpdate={(newText) => handleInputChange('title', newText)}
                      type="title"
                      placeholder="Enter a task title to get AI suggestions..."
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taskType">Task Type</Label>
                  <Select
                    value={formData.taskType}
                    onValueChange={(value: TaskTypeValue) => handleInputChange('taskType', value)}
                  >
                    <SelectTrigger className="rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="daily">Daily Task</SelectItem>
                      <SelectItem value="weekly">Weekly Task</SelectItem>
                      <SelectItem value="monthly">Monthly Task</SelectItem>
                      <SelectItem value="one-off">One-off Task</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Weekly Recurrence Pattern */}
                {formData.taskType === 'weekly' && (
                  <div className="space-y-2 mt-4 p-4 border border-border rounded-md bg-muted/20">
                    <Label>Select Days of Week</Label>
                    <div className="grid grid-cols-7 gap-2">
                      {[
                        { label: 'Sun', value: 0 },
                        { label: 'Mon', value: 1 },
                        { label: 'Tue', value: 2 },
                        { label: 'Wed', value: 3 },
                        { label: 'Thu', value: 4 },
                        { label: 'Fri', value: 5 },
                        { label: 'Sat', value: 6 },
                      ].map((day) => (
                        <div key={day.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`day-${day.value}`}
                            checked={selectedWeekDays.includes(day.value)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                const newDays = [...selectedWeekDays, day.value].sort();
                                setSelectedWeekDays(newDays);
                                setFormData({
                                  ...formData,
                                  recurrencePattern: {
                                    type: 'weekly',
                                    days: newDays,
                                  },
                                });
                              } else {
                                const newDays = selectedWeekDays.filter((d) => d !== day.value);
                                setSelectedWeekDays(newDays);
                                setFormData({
                                  ...formData,
                                  recurrencePattern: newDays.length > 0 ? {
                                    type: 'weekly',
                                    days: newDays,
                                  } : null,
                                });
                              }
                            }}
                          />
                          <Label
                            htmlFor={`day-${day.value}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {day.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {selectedWeekDays.length === 0 && (
                      <p className="text-xs text-muted-foreground">Please select at least one day</p>
                    )}
                  </div>
                )}

                {/* Monthly Recurrence Pattern */}
                {formData.taskType === 'monthly' && (
                  <div className="space-y-2 mt-4 p-4 border border-border rounded-md bg-muted/20">
                    <Label>Select Days of Month</Label>
                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox
                            id={`month-day-${day}`}
                            checked={selectedMonthDays.includes(day)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                const newDays = [...selectedMonthDays, day].sort((a, b) => a - b);
                                setSelectedMonthDays(newDays);
                                setFormData({
                                  ...formData,
                                  recurrencePattern: {
                                    type: 'monthly',
                                    days: newDays,
                                  },
                                });
                              } else {
                                const newDays = selectedMonthDays.filter((d) => d !== day);
                                setSelectedMonthDays(newDays);
                                setFormData({
                                  ...formData,
                                  recurrencePattern: newDays.length > 0 ? {
                                    type: 'monthly',
                                    days: newDays,
                                  } : null,
                                });
                              }
                            }}
                          />
                          <Label
                            htmlFor={`month-day-${day}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {day}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {selectedMonthDays.length === 0 && (
                      <p className="text-xs text-muted-foreground">Please select at least one day</p>
                    )}
                  </div>
                )}

                {/* Recurrence Start/End Dates */}
                {(formData.taskType === 'daily' || formData.taskType === 'weekly' || formData.taskType === 'monthly') && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="recurrenceStartDate">Start Date</Label>
                      <DatePicker
                        value={formData.recurrenceStartDate || ''}
                        onChange={(date) => setFormData({ ...formData, recurrenceStartDate: date })}
                        placeholder="Select start date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recurrenceEndDate">End Date (Optional)</Label>
                      <DatePicker
                        value={formData.recurrenceEndDate || ''}
                        onChange={(date) => setFormData({ ...formData, recurrenceEndDate: date })}
                        placeholder="No end date"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Description</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDescriptionAI(!showDescriptionAI)}
                    className="h-6 px-2 text-xs flex items-center gap-1"
                  >
                    <Wand2 className="h-3 w-3" />
                    AI Enhance
                  </Button>
                </div>
                <div className="border border-input rounded-md min-h-[150px]" style={{backgroundColor: '#111219'}}>
                  <RichEditor
                    value={formData.description as EditorContent}
                    onChange={(content) => handleInputChange('description', content)}
                    disableUndoRedo={true}
                  />
                </div>
                {showDescriptionAI && (
                  <AIWritingAssistant
                    originalText={getPlainTextFromEditor(formData.description)}
                    onTextUpdate={(newText) => {
                      // Convert plain text back to editor format
                      const editorContent: EditorContent = {
                        type: 'doc',
                        content: [
                          {
                            type: 'paragraph',
                            content: [
                              {
                                type: 'text',
                                text: newText
                              }
                            ]
                          }
                        ]
                      };
                      handleInputChange('description', editorContent);
                    }}
                    type="description"
                    placeholder="Enter a task description to get AI enhancements..."
                  />
                )}
              </div>

              {/* Priority and Evidence */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: TaskPriorityValue) => handleInputChange('priority', value)}
                  >
                    <SelectTrigger className="rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="evidenceRequired">Evidence Required</Label>
                  <Select
                    value={formData.evidenceRequired}
                    onValueChange={(value: EvidenceTypeValue) => handleInputChange('evidenceRequired', value)}
                  >
                    <SelectTrigger className="rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="photo">Photo</SelectItem>
                      <SelectItem value="file">File</SelectItem>
                      <SelectItem value="link">Link</SelectItem>
                      <SelectItem value="checklist">Checklist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Due Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <DatePicker
                    value={formData.dueDate ? new Date(formData.dueDate) : undefined}
                    onChange={(date) => {
                      const dateString = date ? date.toISOString().split('T')[0] : '';
                      handleInputChange('dueDate', dateString);
                    }}
                    placeholder="Select due date"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueTime">Due Time</Label>
                  <Input
                    id="dueTime"
                    type="time"
                    value={formData.dueTime}
                    onChange={(e) => handleInputChange('dueTime', e.target.value)}
                    className="rounded-none"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="rounded-none"
                  />
                  <Button type="button" onClick={addTag} size="sm" className="rounded-none">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {formData.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <XIcon
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Checklist Items */}
              {formData.evidenceRequired === 'checklist' && (
                <div className="space-y-2">
                  <Label>Checklist Items</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      placeholder="Add checklist item"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                      className="rounded-none"
                    />
                    <Button type="button" onClick={addChecklistItem} size="sm" className="rounded-none">
                      Add
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {formData.checklistItems?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                        <span>{item.text}</span>
                        <XIcon
                          className="h-4 w-4 cursor-pointer text-destructive"
                          onClick={() => removeChecklistItem(item.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subtasks Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <ListTreeIcon className="h-4 w-4" />
                    Subtasks ({formData.subtasks?.length || 0})
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSubtask}
                    className="flex items-center gap-2"
                  >
                    <PlusIcon className="h-3 w-3" />
                    Add Subtask
                  </Button>
                </div>

                {formData.subtasks && formData.subtasks.length > 0 && (
                  <div className="space-y-3 border-l-2 border-muted pl-4 ml-2">
                    {formData.subtasks.map((subtask, index) => (
                      <Card key={subtask.id} className="p-3">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-muted px-2 py-1 rounded">
                                Subtask {index + 1}
                              </span>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveSubtask(index, 'up')}
                                  disabled={index === 0}
                                  className="h-6 w-6 p-0"
                                >
                                  <MoveUpIcon className="h-3 w-3" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveSubtask(index, 'down')}
                                  disabled={index === (formData.subtasks?.length || 0) - 1}
                                  className="h-6 w-6 p-0"
                                >
                                  <MoveDownIcon className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSubtask(index)}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2Icon className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Subtask Title *</Label>
                              <Input
                                value={subtask.title}
                                onChange={(e) => updateSubtask(index, { title: e.target.value })}
                                placeholder="Enter subtask title"
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Assignee</Label>
                              <Select
                                value={subtask.assignedTo || 'unassigned'}
                                onValueChange={(value) => updateSubtask(index, { assignedTo: value === 'unassigned' ? null : value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select assignee" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unassigned">Unassigned</SelectItem>
                                  {users?.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                      {user.full_name} ({user.employee_id || user.id})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Priority</Label>
                              <Select
                                value={subtask.priority || formData.priority}
                                onValueChange={(value) => updateSubtask(index, { priority: value as TaskPriorityValue })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Due Date</Label>
                              <DatePicker
                                value={subtask.dueDate ? new Date(subtask.dueDate) : undefined}
                                onChange={(date) => {
                                  const dateString = date ? date.toISOString().split('T')[0] : '';
                                  updateSubtask(index, { dueDate: dateString });
                                }}
                                placeholder="Select due date"
                                className="w-full"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                              value={subtask.description || ''}
                              onChange={(e) => updateSubtask(index, { description: e.target.value })}
                              placeholder="Optional subtask description"
                              rows={2}
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
              </div>
            )}

            {/* Template Task Form */}
            {activeTab === 'template' && (
              <div className="space-y-6 mt-4">
              {/* Template Selection */}
              <div className="space-y-2">
                <Label htmlFor="template">Select Template</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder="Choose a template" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    {templates?.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.title} ({template.task_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Template Preview */}
              {selectedTemplateData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Template Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><strong>Title:</strong> {selectedTemplateData.title}</p>
                    <p><strong>Type:</strong> {selectedTemplateData.task_type}</p>
                    <p><strong>Priority:</strong> {selectedTemplateData.priority}</p>
                    <p><strong>Evidence:</strong> {selectedTemplateData.evidence_required}</p>
                    {selectedTemplateData.description && (
                      <p><strong>Description:</strong> {selectedTemplateData.description}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Override Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <DatePicker
                    value={formData.dueDate ? new Date(formData.dueDate) : undefined}
                    onChange={(date) => {
                      const dateString = date ? date.toISOString().split('T')[0] : '';
                      handleInputChange('dueDate', dateString);
                    }}
                    placeholder="Select due date"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Override Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: TaskPriorityValue) => handleInputChange('priority', value)}
                  >
                    <SelectTrigger className="rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              </div>
            )}
            </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-none">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={creationLoading || (activeTab === 'template' && !selectedTemplate)}
            className="rounded-none"
          >
            {creationLoading
              ? (mode === 'edit' ? 'Updating...' : 'Creating...')
              : (mode === 'edit' ? 'Update Task' : 'Create Task')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}