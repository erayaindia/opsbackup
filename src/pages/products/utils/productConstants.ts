import {
  Lightbulb,
  Edit3,
  Factory,
  Camera,
  TrendingUp,
} from 'lucide-react'

// File upload limits
export const PRODUCT_LIMITS = {
  MAX_IMAGES: 10,
  MAX_VIDEOS: 5,
  MAX_DESIGN_FILES: 15,
  MAX_PRODUCTION_FILES: 15,
  MAX_FILE_SIZE_MB: 10,
  MAX_IMAGE_SIZE_MB: 5,
  MAX_VIDEO_SIZE_MB: 50,
} as const

// Cache and timing
export const CACHE_CONFIG = {
  DURATION_MS: 5 * 60 * 1000, // 5 minutes
  MAX_CACHE_ENTRIES: 50,
  SEARCH_DEBOUNCE_MS: 300,
  AUTOSAVE_DEBOUNCE_MS: 1000,
} as const

// Pagination
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const

// Stage definitions
export const STAGES = [
  {
    value: 'idea',
    label: 'Idea',
    icon: Lightbulb,
    color: 'purple',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600',
    borderColor: 'border-purple-200'
  },
  {
    value: 'design',
    label: 'Design',
    icon: Edit3,
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200'
  },
  {
    value: 'production',
    label: 'Production',
    icon: Factory,
    color: 'orange',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-200'
  },
  {
    value: 'content',
    label: 'Content',
    icon: Camera,
    color: 'cyan',
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-600',
    borderColor: 'border-cyan-200'
  },
  {
    value: 'scaling',
    label: 'Scaling',
    icon: TrendingUp,
    color: 'green',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600',
    borderColor: 'border-green-200'
  },
] as const

export type Stage = typeof STAGES[number]['value']

// Priority options
export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'gray' },
  { value: 'medium', label: 'Medium', color: 'blue' },
  { value: 'high', label: 'High', color: 'orange' },
  { value: 'urgent', label: 'Urgent', color: 'red' },
] as const

export type Priority = typeof PRIORITY_OPTIONS[number]['value']

// Design status options
export const DESIGN_STATUS_OPTIONS = [
  'not_started',
  'concept',
  'sketching',
  'prototyping',
  'refinement',
  'finalized',
  'approved'
] as const

export type DesignStatus = typeof DESIGN_STATUS_OPTIONS[number]

// Design style options
export const DESIGN_STYLE_OPTIONS = [
  'minimal',
  'modern',
  'vintage',
  'industrial',
  'luxury',
  'playful',
  'rustic',
  'scandinavian',
  'bohemian',
  'traditional'
] as const

export type DesignStyle = typeof DESIGN_STYLE_OPTIONS[number]

// Production status options
export const PRODUCTION_STATUS_OPTIONS = [
  'not_started',
  'sourcing_suppliers',
  'sample_requested',
  'sample_received',
  'sample_approved',
  'negotiating',
  'production_ready',
  'in_production',
  'quality_check',
  'shipped',
  'received'
] as const

export type ProductionStatus = typeof PRODUCTION_STATUS_OPTIONS[number]

// Sample quality rating options
export const QUALITY_RATING_OPTIONS = [
  { value: 'poor', label: 'Poor (1-2)', color: 'red' },
  { value: 'fair', label: 'Fair (3-4)', color: 'orange' },
  { value: 'good', label: 'Good (5-6)', color: 'yellow' },
  { value: 'very_good', label: 'Very Good (7-8)', color: 'blue' },
  { value: 'excellent', label: 'Excellent (9-10)', color: 'green' },
] as const

// Content status options
export const CONTENT_STATUS_OPTIONS = [
  'not_started',
  'planning',
  'shooting',
  'editing',
  'review',
  'approved',
  'published'
] as const

export type ContentStatus = typeof CONTENT_STATUS_OPTIONS[number]

// Scaling status options
export const SCALING_STATUS_OPTIONS = [
  'not_started',
  'soft_launch',
  'testing',
  'scaling',
  'optimizing',
  'mature'
] as const

export type ScalingStatus = typeof SCALING_STATUS_OPTIONS[number]

// Marketing channels
export const MARKETING_CHANNELS = [
  'facebook',
  'instagram',
  'google',
  'youtube',
  'tiktok',
  'pinterest',
  'email',
  'organic',
  'affiliate',
  'influencer'
] as const

export type MarketingChannel = typeof MARKETING_CHANNELS[number]

// View type options
export const VIEW_TYPES = ['gallery', 'table'] as const
export type ViewType = typeof VIEW_TYPES[number]

// Group by options
export const GROUP_BY_OPTIONS = [
  { value: 'none', label: 'No Grouping' },
  { value: 'category', label: 'Category' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'assignee', label: 'Assignee' },
  { value: 'stage', label: 'Stage' },
  { value: 'priority', label: 'Priority' },
] as const

export type GroupByOption = typeof GROUP_BY_OPTIONS[number]['value']

// Local storage keys
export const STORAGE_KEYS = {
  LAST_VIEW: 'products-last-view',
  SAVED_VIEWS: 'products-saved-views',
  FAVORITE_PRODUCTS: 'products-favorites',
  COLUMN_VISIBILITY: 'products-column-visibility',
  FILTER_PREFERENCES: 'products-filter-preferences',
} as const

// Date format patterns
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy HH:mm',
  ISO: 'yyyy-MM-dd',
  RELATIVE: 'relative', // "2 days ago"
} as const

// Allowed file types
export const ALLOWED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  VIDEOS: ['video/mp4', 'video/webm', 'video/quicktime'],
  DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  ALL_DESIGN_FILES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'video/mp4',
    'application/zip',
  ],
} as const

// Default form values
export const DEFAULT_PRODUCT_FORM = {
  title: '',
  tags: '',
  category: '',
  competitorLinks: '',
  adLinks: '',
  notes: '',
  problemStatement: '',
  opportunityStatement: '',
  estimatedSourcePriceMin: '',
  estimatedSourcePriceMax: '',
  selectedSupplierId: '',
  priority: 'medium' as Priority,
  stage: 'idea' as Stage,
  assignedTo: '',
} as const

// Validation rules
export const VALIDATION_RULES = {
  MIN_TITLE_LENGTH: 3,
  MAX_TITLE_LENGTH: 200,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_DESCRIPTION_LENGTH: 5000,
  MIN_PRICE: 0,
  MAX_PRICE: 1000000,
  MIN_SCORE: 0,
  MAX_SCORE: 100,
} as const

// Error messages
export const ERROR_MESSAGES = {
  TITLE_REQUIRED: 'Product title is required',
  TITLE_TOO_SHORT: `Title must be at least ${VALIDATION_RULES.MIN_TITLE_LENGTH} characters`,
  TITLE_TOO_LONG: `Title must not exceed ${VALIDATION_RULES.MAX_TITLE_LENGTH} characters`,
  CATEGORY_REQUIRED: 'Please select at least one category',
  INVALID_PRICE: 'Please enter a valid price',
  INVALID_URL: 'Please enter a valid URL',
  FILE_TOO_LARGE: 'File size exceeds maximum allowed',
  INVALID_FILE_TYPE: 'File type not supported',
  MAX_FILES_EXCEEDED: 'Maximum number of files exceeded',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  GENERIC_ERROR: 'An error occurred. Please try again.',
} as const

// Success messages
export const SUCCESS_MESSAGES = {
  PRODUCT_CREATED: 'Product created successfully!',
  PRODUCT_UPDATED: 'Product updated successfully!',
  PRODUCT_DELETED: 'Product deleted successfully!',
  PRODUCT_ARCHIVED: 'Product archived successfully!',
  PRODUCT_RESTORED: 'Product restored successfully!',
  PRODUCT_DUPLICATED: 'Product duplicated successfully!',
  FILE_UPLOADED: 'File uploaded successfully!',
  CHANGES_SAVED: 'Changes saved automatically',
} as const
