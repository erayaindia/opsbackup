import { z } from 'zod'
import {
  UserRole,
  UserDepartment,
  EmploymentType,
  ModuleAccess,
  UserAction,
  USER_VALIDATION_RULES
} from '@/types/user.types'

// Base schemas for reuse
const emailSchema = z.string()
  .email('Invalid email format')
  .toLowerCase()
  .trim()

const phoneSchema = z.string()
  .regex(USER_VALIDATION_RULES.phone.pattern, 'Invalid phone number format')
  .optional()
  .or(z.literal(''))

const fullNameSchema = z.string()
  .min(USER_VALIDATION_RULES.full_name.min, `Name must be at least ${USER_VALIDATION_RULES.full_name.min} characters`)
  .max(USER_VALIDATION_RULES.full_name.max, `Name must be at most ${USER_VALIDATION_RULES.full_name.max} characters`)
  .regex(USER_VALIDATION_RULES.full_name.pattern, 'Name can only contain letters, spaces, and periods')
  .trim()

// Enum validation schemas
export const userRoleSchema = z.nativeEnum(UserRole, {
  errorMap: () => ({ message: 'Invalid user role' })
})

// UserStatus schema removed

export const userDepartmentSchema = z.nativeEnum(UserDepartment, {
  errorMap: () => ({ message: 'Invalid department' })
})

export const employmentTypeSchema = z.nativeEnum(EmploymentType, {
  errorMap: () => ({ message: 'Invalid employment type' })
})

export const moduleAccessSchema = z.nativeEnum(ModuleAccess, {
  errorMap: () => ({ message: 'Invalid module access' })
})

export const userActionSchema = z.nativeEnum(UserAction, {
  errorMap: () => ({ message: 'Invalid user action' })
})

// Company email validation
const companyEmailSchema = emailSchema
  .refine(
    email => email.endsWith(USER_VALIDATION_RULES.company_email.domain),
    `Email must end with ${USER_VALIDATION_RULES.company_email.domain}`
  )

// Date validation
const dateStringSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine(date => {
    const parsed = new Date(date)
    return parsed instanceof Date && !isNaN(parsed.getTime())
  }, 'Invalid date')

// JSONB field schemas
const permissionsJsonSchema = z.record(z.any()).optional()

const documentsJsonSchema = z.array(z.object({
  type: z.string().min(1, 'Document type is required'),
  url: z.string().url('Invalid document URL'),
  verified_at: z.string().datetime().optional()
})).optional()

const devicesJsonSchema = z.array(z.object({
  kind: z.string().min(1, 'Device kind is required'),
  serial: z.string().min(1, 'Serial number is required'),
  note: z.string().optional()
})).optional()

const kpisJsonSchema = z.record(z.any()).optional()

const assetsJsonSchema = z.array(z.object({
  type: z.string().min(1, 'Asset type is required'),
  name: z.string().min(1, 'Asset name is required'),
  assigned_at: z.string().datetime()
})).optional()

const onboardingJsonSchema = z.record(z.any()).optional()

// Core User schema
export const userSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
  auth_user_id: z.string().uuid('Invalid auth user ID format').nullable(),
  
  // Basic Info
  full_name: fullNameSchema,
  company_email: companyEmailSchema,
  personal_email: emailSchema.optional().or(z.literal('')),
  phone: phoneSchema,
  
  // Employment Details
  role: userRoleSchema,
  department: userDepartmentSchema,
  designation: z.string()
    .max(USER_VALIDATION_RULES.designation.max, `Designation must be at most ${USER_VALIDATION_RULES.designation.max} characters`)
    .optional()
    .or(z.literal('')),
  work_location: z.string()
    .max(USER_VALIDATION_RULES.work_location.max, `Work location must be at most ${USER_VALIDATION_RULES.work_location.max} characters`)
    .default('Patna'),
  employment_type: employmentTypeSchema,
  joined_at: dateStringSchema,
  exited_at: dateStringSchema.optional().nullable(),
  
  // Permissions & Access
  module_access: z.array(moduleAccessSchema).min(1, 'At least one module access is required'),
  
  // Flexible JSONB fields
  permissions_json: permissionsJsonSchema,
  onboarding_json: onboardingJsonSchema,
  documents_json: documentsJsonSchema,
  devices_json: devicesJsonSchema,
  kpis_json: kpisJsonSchema,
  assets_json: assetsJsonSchema,
  
  // Additional Info
  notes: z.string()
    .max(USER_VALIDATION_RULES.notes.max, `Notes must be at most ${USER_VALIDATION_RULES.notes.max} characters`)
    .optional()
    .or(z.literal('')),
  
  // Metadata
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

// Create User schema - for new user creation
export const createUserSchema = z.object({
  full_name: fullNameSchema,
  company_email: companyEmailSchema,
  role: userRoleSchema.default(UserRole.EMPLOYEE),
  department: userDepartmentSchema,
  joined_at: dateStringSchema.default(() => new Date().toISOString().split('T')[0]),
  personal_email: emailSchema.optional().or(z.literal('')),
  phone: phoneSchema,
  designation: z.string()
    .max(USER_VALIDATION_RULES.designation.max)
    .optional()
    .or(z.literal('')),
  work_location: z.string()
    .max(USER_VALIDATION_RULES.work_location.max)
    .default('Patna'),
  employment_type: employmentTypeSchema.default(EmploymentType.FULL_TIME),
  module_access: z.array(moduleAccessSchema)
    .min(1, 'At least one module access is required')
    .default([ModuleAccess.DASHBOARD]),
  notes: z.string()
    .max(USER_VALIDATION_RULES.notes.max)
    .optional()
    .or(z.literal(''))
}).refine(data => {
  // Ensure dashboard is always included
  if (!data.module_access.includes(ModuleAccess.DASHBOARD)) {
    data.module_access.push(ModuleAccess.DASHBOARD)
  }
  return true
}, {
  message: 'Dashboard access is required for all users'
})

// Update User schema - for user updates (all fields optional)
export const updateUserSchema = z.object({
  full_name: fullNameSchema.optional(),
  company_email: companyEmailSchema.optional(),
  role: userRoleSchema.optional(),
  department: userDepartmentSchema.optional(),
  status: userStatusSchema.optional(),
  personal_email: emailSchema.optional().or(z.literal('')),
  phone: phoneSchema,
  designation: z.string()
    .max(USER_VALIDATION_RULES.designation.max)
    .optional()
    .or(z.literal('')),
  work_location: z.string()
    .max(USER_VALIDATION_RULES.work_location.max)
    .optional(),
  employment_type: employmentTypeSchema.optional(),
  module_access: z.array(moduleAccessSchema)
    .min(1, 'At least one module access is required')
    .optional(),
  notes: z.string()
    .max(USER_VALIDATION_RULES.notes.max)
    .optional()
    .or(z.literal('')),
  permissions_json: permissionsJsonSchema,
  onboarding_json: onboardingJsonSchema,
  documents_json: documentsJsonSchema,
  devices_json: devicesJsonSchema,
  kpis_json: kpisJsonSchema,
  assets_json: assetsJsonSchema
}).refine(data => {
  // Ensure dashboard is always included if module_access is being updated
  if (data.module_access && !data.module_access.includes(ModuleAccess.DASHBOARD)) {
    data.module_access.push(ModuleAccess.DASHBOARD)
  }
  return true
}, {
  message: 'Dashboard access is required for all users'
})

// User Status Update schema removed

// User Activity Log schema
export const userActivityLogSchema = z.object({
  id: z.string().uuid().optional(), // Optional for creation
  actor_auth_user_id: z.string().uuid('Invalid actor auth user ID'),
  target_user_id: z.string().uuid('Invalid target user ID'),
  action: userActionSchema,
  module: z.string().default('users'),
  details: z.record(z.any()).default({}),
  old_values: z.record(z.any()).optional(),
  new_values: z.record(z.any()).optional(),
  ip_address: z.string().ip().optional(),
  user_agent: z.string().optional(),
  created_at: z.string().datetime().optional() // Optional for creation, will be auto-generated
})

// Filters schema
export const userFiltersSchema = z.object({
  role: z.array(userRoleSchema).optional(),
  department: z.array(userDepartmentSchema).optional(),
  search: z.string().optional(),
  joined_after: dateStringSchema.optional(),
  joined_before: dateStringSchema.optional(),
  has_module_access: z.array(moduleAccessSchema).optional()
})

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().min(1, 'Page must be at least 1').default(1),
  page_size: z.number()
    .min(1, 'Page size must be at least 1')
    .max(100, 'Page size cannot exceed 100')
    .default(20),
  sort_by: z.enum(['created_at', 'full_name', 'joined_at', 'updated_at'])
    .default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
})

// Get Users params schema
export const getUsersParamsSchema = paginationSchema.extend({
  filters: userFiltersSchema.optional()
})

// Bulk operations schema
export const bulkUserOperationSchema = z.object({
  operation: z.enum(['update_role', 'add_module_access', 'remove_module_access', 'delete']),
  user_ids: z.array(z.string().uuid()).min(1, 'At least one user ID is required'),
  data: z.any().optional(), // The data depends on the operation
  reason: z.string().optional()
}).refine(data => {
  // Validate specific operations
  switch (data.operation) {
    case 'update_role':
      return userRoleSchema.safeParse(data.data).success
    case 'add_module_access':
    case 'remove_module_access':
      return z.array(moduleAccessSchema).safeParse(data.data).success
    case 'delete':
      return true // No additional data required
    default:
      return false
  }
}, {
  message: 'Invalid data for the specified operation'
})

// Permission context schema
export const permissionContextSchema = z.object({
  user_role: userRoleSchema,
  required_modules: z.array(moduleAccessSchema).optional(),
  required_roles: z.array(userRoleSchema).optional()
})

// API Response schemas
export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) => z.object({
  success: z.boolean(),
  data: dataSchema.optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional()
  }).optional(),
  metadata: z.object({
    timestamp: z.string().datetime(),
    request_id: z.string().optional()
  }).optional()
})

// Specific response schemas
export const createUserResponseSchema = apiResponseSchema(z.object({
  user: userSchema,
  tempPasswordSet: z.boolean(),
  tempPassword: z.string().optional(),
  auth_created: z.boolean(),
  message: z.string()
}))

export const updateUserResponseSchema = apiResponseSchema(z.object({
  user: userSchema,
  changes_made: z.array(z.string()),
  message: z.string()
}))

export const deleteUserResponseSchema = apiResponseSchema(z.object({
  deleted: z.boolean(),
  user_email: z.string(),
  user_name: z.string(),
  auth_deleted: z.boolean(),
  message: z.string(),
  warnings: z.array(z.string()).optional()
}))

export const getUsersResponseSchema = apiResponseSchema(z.object({
  users: z.array(userSchema),
  total_count: z.number(),
  page: z.number().optional(),
  page_size: z.number().optional()
}))

export const bulkOperationResponseSchema = apiResponseSchema(z.object({
  total_requested: z.number(),
  successful: z.number(),
  failed: z.number(),
  results: z.array(z.object({
    user_id: z.string().uuid(),
    success: z.boolean(),
    error: z.string().optional()
  }))
}))

// Validation helper functions
export const validateUser = (data: unknown) => userSchema.safeParse(data)
export const validateCreateUser = (data: unknown) => createUserSchema.safeParse(data)
export const validateUpdateUser = (data: unknown) => updateUserSchema.safeParse(data)
export const validateUserFilters = (data: unknown) => userFiltersSchema.safeParse(data)
export const validatePagination = (data: unknown) => paginationSchema.safeParse(data)
export const validateGetUsersParams = (data: unknown) => getUsersParamsSchema.safeParse(data)
export const validateBulkOperation = (data: unknown) => bulkUserOperationSchema.safeParse(data)

// Transform functions for backward compatibility
export const transformLegacyUser = (legacyUser: any): z.infer<typeof userSchema> => {
  return userSchema.parse({
    ...legacyUser,
    role: legacyUser.role || UserRole.EMPLOYEE,
    department: legacyUser.department || UserDepartment.OPS,
    employment_type: legacyUser.employment_type || EmploymentType.FULL_TIME,
    work_location: legacyUser.work_location || 'Patna',
    module_access: legacyUser.module_access || [ModuleAccess.DASHBOARD],
    joined_at: legacyUser.joined_at || new Date().toISOString().split('T')[0]
  })
}

export type ValidUser = z.infer<typeof userSchema>
export type ValidCreateUser = z.infer<typeof createUserSchema>
export type ValidUpdateUser = z.infer<typeof updateUserSchema>
export type ValidUserFilters = z.infer<typeof userFiltersSchema>
export type ValidPagination = z.infer<typeof paginationSchema>
export type ValidGetUsersParams = z.infer<typeof getUsersParamsSchema>
export type ValidBulkOperation = z.infer<typeof bulkUserOperationSchema>