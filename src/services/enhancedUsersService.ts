import { supabase } from '@/integrations/supabase/client'
import { 
  User, 
  CreateUserData, 
  UpdateUserData,
  UserRole,
  UserDepartment,
  ModuleAccess,
  ApiResponse,
  CreateUserResponse,
  UpdateUserResponse,
  DeleteUserResponse,
  GetUsersResponse,
  GetUsersParams,
  BulkOperationResponse,
  BulkUserOperation,
  UserActivityLog
} from '@/types/user.types'
import { 
  validateUser,
  validateCreateUser, 
  validateUpdateUser,
  validateGetUsersParams,
  validateBulkOperation,
  transformLegacyUser 
} from '@/schemas/user.schemas'

// Error classes for better error handling
export class UserServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = 'UserServiceError'
  }
}

export class ValidationError extends UserServiceError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details)
    this.name = 'ValidationError'
  }
}

export class PermissionError extends UserServiceError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'PERMISSION_DENIED', 403)
    this.name = 'PermissionError'
  }
}

export class NotFoundError extends UserServiceError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends UserServiceError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409)
    this.name = 'ConflictError'
  }
}

// Utility functions
const createApiResponse = <T>(
  success: boolean,
  data?: T,
  error?: { code: string; message: string; details?: any }
): ApiResponse<T> => ({
  success,
  data,
  error,
  metadata: {
    timestamp: new Date().toISOString(),
    request_id: crypto.randomUUID()
  }
})

const handleServiceError = (error: any): never => {
  if (error instanceof UserServiceError) {
    throw error
  }

  console.error('Unexpected error in user service:', error)
  
  // Handle Supabase errors
  if (error?.code) {
    switch (error.code) {
      case '23505': // Unique constraint violation
        throw new ConflictError('A user with this information already exists')
      case '23503': // Foreign key constraint violation
        throw new ValidationError('Referenced data does not exist')
      case '42501': // Insufficient privilege
        throw new PermissionError()
      default:
        throw new UserServiceError(
          error.message || 'Database operation failed',
          error.code,
          500,
          error
        )
    }
  }

  throw new UserServiceError(
    error?.message || 'An unexpected error occurred',
    'UNKNOWN_ERROR',
    500,
    error
  )
}

// Enhanced user service class
export class EnhancedUsersService {
  
  /**
   * Get all users with advanced filtering, pagination, and search
   */
  static async getUsers(params: GetUsersParams = { page: 1, page_size: 20 }): Promise<GetUsersResponse> {
    try {
      // Validate parameters
      const validation = validateGetUsersParams(params)
      if (!validation.success) {
        throw new ValidationError('Invalid parameters', validation.error.errors)
      }

      const validParams = validation.data

      // Use the enhanced search RPC function
      const { data, error } = await supabase.rpc('search_users', {
        p_search_term: validParams.filters?.search || null,
        p_roles: validParams.filters?.role || null,
        p_statuses: validParams.filters?.status || null,
        p_departments: validParams.filters?.department || null,
        p_module_access: validParams.filters?.has_module_access || null,
        p_joined_after: validParams.filters?.joined_after || null,
        p_joined_before: validParams.filters?.joined_before || null,
        p_page: validParams.page,
        p_page_size: validParams.page_size,
        p_sort_by: validParams.sort_by,
        p_sort_order: validParams.sort_order
      })

      if (error) {
        handleServiceError(error)
      }

      if (!data.success) {
        throw new UserServiceError(
          data.error?.message || 'Failed to fetch users',
          data.error?.code || 'FETCH_FAILED'
        )
      }

      return createApiResponse(true, {
        users: data.data.users.map((user: any) => transformLegacyUser(user)),
        total_count: data.data.total_count,
        page: data.data.page,
        page_size: data.data.page_size
      })

    } catch (error) {
      if (error instanceof UserServiceError) {
        return createApiResponse(false, undefined, {
          code: error.code,
          message: error.message,
          details: error.details
        })
      }
      handleServiceError(error)
    }
  }

  /**
   * Get a single user by ID
   */
  static async getUserById(userId: string): Promise<ApiResponse<User>> {
    try {
      if (!userId) {
        throw new ValidationError('User ID is required')
      }

      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError('User')
        }
        handleServiceError(error)
      }

      // Validate and transform the data
      const validation = validateUser(data)
      if (!validation.success) {
        console.warn('User data validation failed:', validation.error)
        // Transform legacy data format
        const transformedUser = transformLegacyUser(data)
        return createApiResponse(true, transformedUser)
      }

      return createApiResponse(true, validation.data)

    } catch (error) {
      if (error instanceof UserServiceError) {
        return createApiResponse(false, undefined, {
          code: error.code,
          message: error.message,
          details: error.details
        })
      }
      handleServiceError(error)
    }
  }

  /**
   * Create a new user using the enhanced Edge Function
   */
  static async createUser(userData: CreateUserData, options?: {
    createAuthAccount?: boolean
    sendWelcomeEmail?: boolean
  }): Promise<CreateUserResponse> {
    try {
      // Validate input data
      const validation = validateCreateUser(userData)
      if (!validation.success) {
        throw new ValidationError('Invalid user data', validation.error.errors)
      }

      // Use Edge Function for secure user creation
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          ...validation.data,
          create_auth_account: options?.createAuthAccount || false,
          send_welcome_email: options?.sendWelcomeEmail || false
        }
      })

      if (error) {
        handleServiceError(error)
      }

      if (!data.success) {
        throw new UserServiceError(
          data.error?.message || 'Failed to create user',
          data.error?.code || 'CREATE_FAILED',
          400
        )
      }

      return createApiResponse(true, data.data)

    } catch (error) {
      if (error instanceof UserServiceError) {
        return createApiResponse(false, undefined, {
          code: error.code,
          message: error.message,
          details: error.details
        })
      }
      handleServiceError(error)
    }
  }

  /**
   * Update user with enhanced validation and audit logging
   */
  static async updateUser(userId: string, userData: UpdateUserData): Promise<UpdateUserResponse> {
    try {
      if (!userId) {
        throw new ValidationError('User ID is required')
      }

      // Validate input data
      const validation = validateUpdateUser(userData)
      if (!validation.success) {
        throw new ValidationError('Invalid update data', validation.error.errors)
      }

      // Use RPC function for transaction-safe updates with audit
      const { data, error } = await supabase.rpc('update_user_with_audit', {
        p_user_id: userId,
        p_updates: validation.data
      })

      if (error) {
        handleServiceError(error)
      }

      if (!data.success) {
        throw new UserServiceError(
          data.error?.message || 'Failed to update user',
          data.error?.code || 'UPDATE_FAILED'
        )
      }

      return createApiResponse(true, data.data)

    } catch (error) {
      if (error instanceof UserServiceError) {
        return createApiResponse(false, undefined, {
          code: error.code,
          message: error.message,
          details: error.details
        })
      }
      handleServiceError(error)
    }
  }

  /**
   * Update user status with enhanced validation and audit
   */
  static async updateUserStatus(
    userId: string, 
    status: UserStatus, 
    reason?: string
  ): Promise<ApiResponse<{ message: string; old_status: string; new_status: string }>> {
    try {
      if (!userId) {
        throw new ValidationError('User ID is required')
      }

      if (!Object.values(UserStatus).includes(status)) {
        throw new ValidationError('Invalid status value')
      }

      // Use enhanced RPC function
      const { data, error } = await supabase.rpc('admin_set_user_status', {
        p_user_id: userId,
        p_status: status,
        p_reason: reason
      })

      if (error) {
        handleServiceError(error)
      }

      if (!data.success) {
        throw new UserServiceError(
          data.error || 'Failed to update user status',
          'STATUS_UPDATE_FAILED'
        )
      }

      return createApiResponse(true, data.data)

    } catch (error) {
      if (error instanceof UserServiceError) {
        return createApiResponse(false, undefined, {
          code: error.code,
          message: error.message,
          details: error.details
        })
      }
      handleServiceError(error)
    }
  }

  /**
   * Delete user using secure Edge Function
   */
  static async deleteUser(userId: string, reason?: string): Promise<DeleteUserResponse> {
    try {
      if (!userId) {
        throw new ValidationError('User ID is required')
      }

      // Use Edge Function for secure deletion
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: {
          user_id: userId,
          reason
        }
      })

      if (error) {
        handleServiceError(error)
      }

      if (!data.success) {
        throw new UserServiceError(
          data.error?.message || 'Failed to delete user',
          data.error?.code || 'DELETE_FAILED'
        )
      }

      return createApiResponse(true, data.data)

    } catch (error) {
      if (error instanceof UserServiceError) {
        return createApiResponse(false, undefined, {
          code: error.code,
          message: error.message,
          details: error.details
        })
      }
      handleServiceError(error)
    }
  }

  /**
   * Bulk operations using Edge Function
   */
  static async bulkOperation(operation: BulkUserOperation): Promise<BulkOperationResponse> {
    try {
      // Validate bulk operation data
      const validation = validateBulkOperation(operation)
      if (!validation.success) {
        throw new ValidationError('Invalid bulk operation data', validation.error.errors)
      }

      // Use Edge Function for secure bulk operations
      const { data, error } = await supabase.functions.invoke('bulk-user-operations', {
        body: validation.data
      })

      if (error) {
        handleServiceError(error)
      }

      if (!data.success) {
        throw new UserServiceError(
          data.error?.message || 'Bulk operation failed',
          data.error?.code || 'BULK_OPERATION_FAILED'
        )
      }

      return createApiResponse(true, data.data)

    } catch (error) {
      if (error instanceof UserServiceError) {
        return createApiResponse(false, undefined, {
          code: error.code,
          message: error.message,
          details: error.details
        })
      }
      handleServiceError(error)
    }
  }

  /**
   * Auto-activate user on login (backward compatibility)
   */
  static async activateUserOnLogin(authUserId: string, userEmail: string): Promise<boolean> {
    try {
      console.log(`Attempting to activate user: ${userEmail}`)

      // Find user by email
      const { data: existingUser, error: findError } = await supabase
        .from('app_users')
        .select('id, status')
        .eq('company_email', userEmail.toLowerCase().trim())
        .single()

      if (findError || !existingUser) {
        console.log(`User not found: ${userEmail}`)
        return false
      }

      // Update to active status and link auth user
      const { error: updateError } = await supabase
        .from('app_users')
        .update({
          status: UserStatus.ACTIVE,
          auth_user_id: authUserId,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id)

      if (updateError) {
        console.error('Failed to activate user:', updateError)
        return false
      }

      // Log the activation
      await supabase
        .from('app_user_activity_logs')
        .insert({
          actor_auth_user_id: authUserId,
          target_user_id: existingUser.id,
          action: 'login',
          details: {
            auto_activated: true,
            previous_status: existingUser.status,
            email: userEmail
          }
        })

      console.log(`✅ User ${userEmail} activated successfully`)
      return true

    } catch (error) {
      console.error('Error in activateUserOnLogin:', error)
      return false
    }
  }

  /**
   * Get user activity logs
   */
  static async getUserActivityLogs(params: {
    targetUserId?: string
    actions?: string[]
    startDate?: string
    endDate?: string
    page?: number
    pageSize?: number
  } = {}): Promise<ApiResponse<{ logs: UserActivityLog[]; total_count: number }>> {
    try {
      const { data, error } = await supabase.rpc('get_user_activity_logs', {
        p_target_user_id: params.targetUserId || null,
        p_actions: params.actions || null,
        p_start_date: params.startDate || null,
        p_end_date: params.endDate || null,
        p_page: params.page || 1,
        p_page_size: params.pageSize || 50
      })

      if (error) {
        handleServiceError(error)
      }

      if (!data.success) {
        throw new UserServiceError(
          data.error?.message || 'Failed to fetch activity logs',
          data.error?.code || 'LOGS_FETCH_FAILED'
        )
      }

      return createApiResponse(true, data.data)

    } catch (error) {
      if (error instanceof UserServiceError) {
        return createApiResponse(false, undefined, {
          code: error.code,
          message: error.message,
          details: error.details
        })
      }
      handleServiceError(error)
    }
  }

  /**
   * Check if current user has specific permissions
   */
  static async checkPermissions(requiredRole?: UserRole[], requiredModules?: ModuleAccess[]): Promise<{
    hasPermission: boolean
    user: User | null
    reason?: string
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { hasPermission: false, user: null, reason: 'Not authenticated' }
      }

      const { data: appUser, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

      if (error || !appUser) {
        return { hasPermission: false, user: null, reason: 'App user not found' }
      }

      const validatedUser = transformLegacyUser(appUser)

      // Super admin bypass
      if (validatedUser.role === UserRole.SUPER_ADMIN) {
        return { hasPermission: true, user: validatedUser }
      }

      // Check active status
      if (validatedUser.status !== UserStatus.ACTIVE) {
        return { hasPermission: false, user: validatedUser, reason: 'User not active' }
      }

      // Check role requirements
      if (requiredRole && requiredRole.length > 0 && !requiredRole.includes(validatedUser.role)) {
        return { hasPermission: false, user: validatedUser, reason: 'Insufficient role' }
      }

      // Check module requirements
      if (requiredModules && requiredModules.length > 0) {
        const hasAllModules = requiredModules.every(module => 
          validatedUser.module_access.includes(module)
        )
        if (!hasAllModules) {
          return { hasPermission: false, user: validatedUser, reason: 'Missing module access' }
        }
      }

      return { hasPermission: true, user: validatedUser }

    } catch (error) {
      console.error('Error checking permissions:', error)
      return { hasPermission: false, user: null, reason: 'Permission check failed' }
    }
  }
}

// Export commonly used functions for backward compatibility
export const getUsers = EnhancedUsersService.getUsers
export const getUserById = EnhancedUsersService.getUserById
export const createUser = EnhancedUsersService.createUser
export const updateUser = EnhancedUsersService.updateUser
export const updateUserStatus = EnhancedUsersService.updateUserStatus
export const deleteUser = EnhancedUsersService.deleteUser
export const activateUserOnLogin = EnhancedUsersService.activateUserOnLogin
export const checkPermissions = EnhancedUsersService.checkPermissions

// Re-export types for convenience
export type {
  User,
  CreateUserData,
  UpdateUserData,
  UserRole,
  UserDepartment,
  ModuleAccess,
  CreateUserResponse,
  UpdateUserResponse,
  DeleteUserResponse,
  GetUsersResponse,
  BulkOperationResponse
}