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
} from 'lucide-react';
import { useTaskCreation } from '@/hooks/useTaskCreation';
import { useTaskTemplates } from '@/hooks/useTasks';
import { useUsers } from '@/hooks/useUsers';
import { useToast } from '@/components/ui/use-toast';
import {
  CreateTaskData,
  TaskTypeValue,
  TaskPriorityValue,
  EvidenceTypeValue,
  ChecklistItem,
} from '@/types/tasks';

interface CreateTaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated?: () => void;
}

export function CreateTaskForm({ open, onOpenChange, onTaskCreated }: CreateTaskFormProps) {
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
  });

  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [newTag, setNewTag] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const { toast } = useToast();
  const { createTask, createTaskFromTemplate, loading: creationLoading } = useTaskCreation();
  const { templates, loading: templatesLoading } = useTaskTemplates();
  const { users, loading: usersLoading } = useUsers();

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
      });
      setSelectedTemplate('');
      setSelectedUsers(new Set());
      setNewTag('');
      setNewChecklistItem('');
      setUserSearchTerm('');
      setUserDropdownOpen(false);
      setActiveTab('manual');
    }
  }, [open]);

  const handleInputChange = (field: keyof CreateTaskData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      if (activeTab === 'template' && selectedTemplate) {
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
        const result = await createTask(formData);

        if (result.length > 0) {
          onTaskCreated?.();
          onOpenChange(false);
        }
      }
    } catch (error) {
      console.error('Error creating task:', error);
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
            Create New Task
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
                  <Label htmlFor="title">Task Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter task title"
                    className="rounded-none"
                  />
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
                      <SelectItem value="one-off">One-off Task</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <div className="border border-input rounded-md min-h-[150px]" style={{backgroundColor: '#111219'}}>
                  <RichEditor
                    value={formData.description as EditorContent}
                    onChange={(content) => handleInputChange('description', content)}
                  />
                </div>
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
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    className="rounded-none"
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
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    className="rounded-none"
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
            {creationLoading ? 'Creating...' : 'Create Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}