import { Database } from '@/integrations/supabase/types';

export type TaskTemplate = Database['public']['Tables']['task_templates']['Row'];
export type TaskTemplateInsert = Database['public']['Tables']['task_templates']['Insert'];
export type TaskTemplateUpdate = Database['public']['Tables']['task_templates']['Update'];

export type Task = Database['public']['Tables']['tasks']['Row'];
export type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
export type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

export type TaskSubmission = Database['public']['Tables']['task_submissions']['Row'];
export type TaskSubmissionInsert = Database['public']['Tables']['task_submissions']['Insert'];

export type TaskReview = Database['public']['Tables']['task_reviews']['Row'];
export type TaskReviewInsert = Database['public']['Tables']['task_reviews']['Insert'];

export type TaskSettings = Database['public']['Tables']['task_settings']['Row'];
export type TaskSettingsInsert = Database['public']['Tables']['task_settings']['Insert'];
export type TaskSettingsUpdate = Database['public']['Tables']['task_settings']['Update'];

// Extended types with relations
export interface TaskWithDetails extends Task {
  template?: TaskTemplate | null;
  assigned_user?: {
    id: string;
    full_name: string | null;
    role: string;
    department: string | null;
    employee_id?: string | null;
  };
  assigned_by_user?: {
    id: string;
    full_name: string | null;
  } | null;
  reviewer?: {
    id: string;
    full_name: string | null;
    role: string;
  } | null;
  submissions?: TaskSubmission[];
  reviews?: TaskReview[];
  latest_submission?: TaskSubmission | null;
  latest_review?: TaskReview | null;
  // Subtask-related fields
  parent_task?: TaskWithDetails | null;
  subtasks?: TaskWithDetails[];
  parent_task_id?: string | null;
  task_level?: number;
  task_order?: number;
  completion_percentage?: number;
}

export interface TaskTemplateWithCreator extends TaskTemplate {
  created_by_user?: {
    id: string;
    full_name: string | null;
  } | null;
  reviewer_user?: {
    id: string;
    full_name: string | null;
    role: string;
  } | null;
}

// Enums for better type safety
export const TaskType = {
  DAILY: 'daily',
  ONE_OFF: 'one-off',
} as const;
export type TaskTypeValue = typeof TaskType[keyof typeof TaskType];

export const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;
export type TaskPriorityValue = typeof TaskPriority[keyof typeof TaskPriority];

export const TaskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  SUBMITTED_FOR_REVIEW: 'submitted_for_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  DONE_AUTO_APPROVED: 'done_auto_approved',
} as const;
export type TaskStatusValue = typeof TaskStatus[keyof typeof TaskStatus];

export const EvidenceType = {
  NONE: 'none',
  PHOTO: 'photo',
  FILE: 'file',
  LINK: 'link',
  CHECKLIST: 'checklist',
} as const;
export type EvidenceTypeValue = typeof EvidenceType[keyof typeof EvidenceType];

export const SubmissionType = {
  EVIDENCE: 'evidence',
  COMPLETION: 'completion',
  NOTE: 'note',
} as const;
export type SubmissionTypeValue = typeof SubmissionType[keyof typeof SubmissionType];

export const ReviewStatus = {
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;
export type ReviewStatusValue = typeof ReviewStatus[keyof typeof ReviewStatus];

// Filter types for UI
export interface TaskFilters {
  search?: string;
  type?: TaskTypeValue | 'all';
  status?: TaskStatusValue | 'all';
  priority?: TaskPriorityValue | 'all';
  assignee?: string | 'all';
  reviewer?: string | 'all';
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  department?: string | 'all';
  isLate?: boolean;
  needsReview?: boolean;
}

export interface TaskSort {
  field: 'due_date' | 'due_datetime' | 'priority' | 'status' | 'title' | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
}

export interface TaskGroup {
  field: 'status' | 'assignee' | 'priority' | 'reviewer' | 'department';
}

// View mode types
export type TaskViewMode = 'list' | 'kanban' | 'calendar';

// Checklist item structure
export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  required: boolean;
}

// Evidence upload structure
export interface EvidenceUpload {
  type: EvidenceTypeValue;
  file?: File;
  url?: string;
  notes?: string;
  checklist?: ChecklistItem[];
}

// Calendar event structure for calendar view
export interface TaskCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  allDay?: boolean;
  priority: TaskPriorityValue;
  status: TaskStatusValue;
  assignee: string;
  color?: string;
}

// Analytics types
export interface TaskAnalytics {
  completion_rate: number;
  on_time_rate: number;
  late_submissions: number;
  auto_approved_count: number;
  manual_review_count: number;
  rejection_rate: number;
  avg_completion_time_hours: number;
  tasks_by_status: Record<TaskStatusValue, number>;
  tasks_by_priority: Record<TaskPriorityValue, number>;
  top_rejection_reasons: Array<{
    reason: string;
    count: number;
  }>;
  employee_performance: Array<{
    employee_id: string;
    employee_name: string;
    completion_rate: number;
    on_time_rate: number;
    total_tasks: number;
  }>;
}

// Notification types
export interface TaskNotification {
  id: string;
  task_id: string;
  user_id: string;
  type: 'assigned' | 'due_soon' | 'overdue' | 'review_requested' | 'approved' | 'rejected';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  task?: TaskWithDetails;
}

// Bulk action types
export interface BulkTaskAction {
  type: 'assign' | 'approve' | 'reject' | 'delete' | 'change_status' | 'change_priority';
  task_ids: string[];
  data?: {
    assignee_id?: string;
    reviewer_id?: string;
    status?: TaskStatusValue;
    priority?: TaskPriorityValue;
    notes?: string;
  };
}

// Template creation helpers
export interface CreateTaskFromTemplate {
  template_id: string;
  assigned_to: string[];
  due_date?: string;
  due_time?: string;
  due_datetime?: string;
  override_priority?: TaskPriorityValue;
  override_reviewer?: string;
  additional_notes?: string;
}

// Settings types
export const SettingType = {
  GLOBAL: 'global',
  ROLE: 'role',
  TEAM: 'team',
  USER: 'user',
} as const;
export type SettingTypeValue = typeof SettingType[keyof typeof SettingType];

export interface TaskSettingsFormData {
  auto_approve_daily: boolean;
  auto_approve_cutoff_hours: number;
  notifications_enabled: boolean;
  email_notifications: boolean;
  due_reminder_hours: number;
  default_evidence_daily: EvidenceTypeValue;
  default_evidence_oneoff: EvidenceTypeValue;
}

// Error types
export interface TaskError {
  code: string;
  message: string;
  details?: any;
}

// API response types
export interface TaskResponse<T = any> {
  data?: T;
  error?: TaskError;
  count?: number;
}

export interface PaginatedTaskResponse<T = any> extends TaskResponse<T[]> {
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// Hook return types
export interface UseTasksReturn {
  tasks: TaskWithDetails[];
  loading: boolean;
  error: TaskError | null;
  filters: TaskFilters;
  sort: TaskSort;
  setFilters: (filters: Partial<TaskFilters>) => void;
  setSort: (sort: TaskSort) => void;
  refetch: () => Promise<void>;
  createTask: (task: TaskInsert) => Promise<TaskResponse<Task>>;
  updateTask: (id: string, updates: TaskUpdate) => Promise<TaskResponse<Task>>;
  deleteTask: (id: string) => Promise<TaskResponse>;
  bulkAction: (action: BulkTaskAction) => Promise<TaskResponse>;
}

export interface UseTaskAnalyticsReturn {
  analytics: TaskAnalytics | null;
  loading: boolean;
  error: TaskError | null;
  refetch: () => Promise<void>;
}

export interface UseTaskNotificationsReturn {
  notifications: TaskNotification[];
  unreadCount: number;
  loading: boolean;
  error: TaskError | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refetch: () => Promise<void>;
}

// EditorContent type for rich text descriptions
export interface EditorContent {
  type: string;
  content?: any[];
}

// Task creation interfaces
export interface CreateTaskData {
  title: string;
  description: EditorContent;
  taskType: TaskTypeValue;
  priority: TaskPriorityValue;
  evidenceRequired: EvidenceTypeValue;
  dueDate: string;
  dueTime?: string;
  assignedTo: string[];
  tags: string[];
  checklistItems: ChecklistItem[];
  // Subtask support
  parentTaskId?: string | null;
  subtasks?: CreateSubtaskData[];
}

export interface CreateSubtaskData {
  id?: string; // temporary ID for UI management
  title: string;
  description?: string;
  taskType?: TaskTypeValue;
  priority?: TaskPriorityValue;
  evidenceRequired?: EvidenceTypeValue;
  dueDate?: string;
  dueTime?: string;
  assignedTo?: string | null;
  tags?: string[];
  checklistItems?: ChecklistItem[];
  taskOrder: number;
}

// Subtask management interfaces
export interface SubtaskTreeNode extends TaskWithDetails {
  children: SubtaskTreeNode[];
  depth: number;
  isExpanded?: boolean;
}