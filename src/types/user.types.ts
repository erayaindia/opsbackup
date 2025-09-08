// Enhanced type definitions for user management system
// Provides type safety and validation for all user-related operations

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
  INTERN = 'intern',
  EXTERNAL = 'external'
}

export enum UserStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  ON_LEAVE = 'on_leave',
  INACTIVE = 'inactive',
  RESIGNED = 'resigned',
  TERMINATED = 'terminated'
}

export enum UserDepartment {
  CONTENT = 'Content',
  FULFILLMENT = 'Fulfillment',
  SUPPORT = 'Support',
  MARKETING = 'Marketing',
  FINANCE = 'Finance',
  ADMIN = 'Admin',
  OPS = 'Ops',
  HR = 'HR',
  IT = 'IT'
}

export enum EmploymentType {
  FULL_TIME = 'Full-time',
  PART_TIME = 'Part-time',
  INTERN = 'Intern',
  CONTRACTOR = 'Contractor'
}

export enum ModuleAccess {
  DASHBOARD = 'dashboard',
  ORDERS = 'orders',
  FULFILLMENT = 'fulfillment',
  SUPPORT = 'support',
  CONTENT = 'content',
  MARKETING = 'marketing',
  PRODUCTS = 'products',
  FINANCE = 'finance',
  MANAGEMENT = 'management',
  TEAM_HUB = 'team-hub',
  ANALYTICS = 'analytics',
  TRAINING = 'training',
  ALERTS = 'alerts'
}

// Enhanced User interface with strict typing
export interface User {
  id: string
  auth_user_id: string | null
  
  // Basic Info
  full_name: string
  company_email: string
  personal_email: string | null
  phone: string | null
  
  // Employment Details
  role: UserRole
  department: UserDepartment
  status: UserStatus
  designation: string | null
  work_location: string
  employment_type: EmploymentType
  joined_at: string
  exited_at?: string | null
  
  // Permissions & Access
  module_access: ModuleAccess[]
  
  // Flexible fields for future expansion
  permissions_json?: Record<string, any>
  onboarding_json?: Record<string, any>
  documents_json?: Array<{
    type: string
    url: string
    verified_at?: string
  }>
  devices_json?: Array<{
    kind: string
    serial: string
    note?: string
  }>
  kpis_json?: Record<string, any>
  assets_json?: Array<{
    type: string
    name: string
    assigned_at: string
  }>
  
  // Additional Info
  notes: string | null
  
  // Metadata
  created_at: string
  updated_at: string
}

// User creation data with required fields
export interface CreateUserData {
  full_name: string
  company_email: string
  role: UserRole
  department: UserDepartment
  joined_at: string
  personal_email?: string
  phone?: string
  designation?: string
  work_location?: string
  employment_type?: EmploymentType
  module_access?: ModuleAccess[]
  notes?: string
}

// User update data - all fields optional for partial updates
export interface UpdateUserData {
  full_name?: string
  company_email?: string
  role?: UserRole
  department?: UserDepartment
  status?: UserStatus
  personal_email?: string
  phone?: string
  designation?: string
  work_location?: string
  employment_type?: EmploymentType
  module_access?: ModuleAccess[]
  notes?: string
  permissions_json?: Record<string, any>
  onboarding_json?: Record<string, any>
  documents_json?: Array<any>
  devices_json?: Array<any>
  kpis_json?: Record<string, any>
  assets_json?: Array<any>
}

// Response interfaces with proper error handling
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  metadata?: {
    timestamp: string
    request_id?: string
  }
}

export interface CreateUserResponse extends ApiResponse<{
  user: User
  tempPasswordSet: boolean
  tempPassword?: string
  auth_created: boolean
  message: string
}> {}

export interface UpdateUserResponse extends ApiResponse<{
  user: User
  changes_made: string[]
  message: string
}> {}

export interface DeleteUserResponse extends ApiResponse<{
  deleted: boolean
  user_email: string
  user_name: string
  auth_deleted: boolean
  message: string
  warnings?: string[]
}> {}

export interface GetUsersResponse extends ApiResponse<{
  users: User[]
  total_count: number
  page?: number
  page_size?: number
}> {}

// Audit log interfaces
export enum UserAction {
  CREATE_USER = 'create_user',
  UPDATE_USER = 'update_user',
  DELETE_USER = 'delete_user',
  CHANGE_STATUS = 'change_status',
  CHANGE_ROLE = 'change_role',
  UPDATE_PERMISSIONS = 'update_permissions',
  LOGIN = 'login',
  LOGOUT = 'logout',
  PASSWORD_RESET = 'password_reset'
}

export interface UserActivityLog {
  id: string
  actor_auth_user_id: string
  target_user_id: string
  action: UserAction
  module: string
  details: Record<string, any>
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
}

// Filter and pagination interfaces
export interface UserFilters {
  role?: UserRole[]
  status?: UserStatus[]
  department?: UserDepartment[]
  search?: string
  joined_after?: string
  joined_before?: string
  has_module_access?: ModuleAccess[]
}

export interface PaginationParams {
  page: number
  page_size: number
  sort_by?: 'created_at' | 'full_name' | 'joined_at' | 'updated_at'
  sort_order?: 'asc' | 'desc'
}

export interface GetUsersParams extends PaginationParams {
  filters?: UserFilters
}

// Permission checking utilities
export interface PermissionContext {
  user_role: UserRole
  user_status: UserStatus
  required_modules?: ModuleAccess[]
  required_roles?: UserRole[]
}

// Bulk operations
export interface BulkUserOperation {
  operation: 'update_status' | 'update_role' | 'add_module_access' | 'remove_module_access' | 'delete'
  user_ids: string[]
  data?: any
  reason?: string
}

export interface BulkOperationResponse extends ApiResponse<{
  total_requested: number
  successful: number
  failed: number
  results: Array<{
    user_id: string
    success: boolean
    error?: string
  }>
}> {}

// Type guards for runtime checking
export const isUserRole = (value: string): value is UserRole => {
  return Object.values(UserRole).includes(value as UserRole)
}

export const isUserStatus = (value: string): value is UserStatus => {
  return Object.values(UserStatus).includes(value as UserStatus)
}

export const isUserDepartment = (value: string): value is UserDepartment => {
  return Object.values(UserDepartment).includes(value as UserDepartment)
}

export const isModuleAccess = (value: string): value is ModuleAccess => {
  return Object.values(ModuleAccess).includes(value as ModuleAccess)
}

// Utility functions
export const getUserDisplayName = (user: User): string => {
  return user.full_name || user.company_email
}

export const getUserInitials = (user: User): string => {
  return user.full_name
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const getRoleDisplayName = (role: UserRole): string => {
  return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export const getStatusDisplayName = (status: UserStatus): string => {
  return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Constants for validation
export const USER_VALIDATION_RULES = {
  full_name: {
    min: 2,
    max: 100,
    pattern: /^[a-zA-Z\s\.]+$/
  },
  company_email: {
    domain: '@erayastyle.com'
  },
  phone: {
    pattern: /^\+?[\d\s\-\(\)]{10,15}$/
  },
  work_location: {
    max: 100
  },
  designation: {
    max: 100
  },
  notes: {
    max: 1000
  }
} as const