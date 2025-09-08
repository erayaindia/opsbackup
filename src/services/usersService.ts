import { supabase } from '@/integrations/supabase/client'
import { 
  User as EnhancedUser,
  CreateUserData as EnhancedCreateUserData,
  UpdateUserData as EnhancedUpdateUserData,
  UserRole,
  UserDepartment,
  ModuleAccess
} from '@/types/user.types'
// Enhanced users service temporarily disabled due to UserStatus removal
// import { 
//   EnhancedUsersService,
//   UserServiceError,
//   ValidationError,
//   NotFoundError,
//   PermissionError
// } from '@/services/enhancedUsersService'
import { ErrorHandler, ErrorFactory, RetryHandler } from '@/utils/errorHandling'

// Backward compatibility interface (legacy format)
export interface User {
  id: string
  auth_user_id: string | null
  full_name: string
  company_email: string
  role: string
  department: string
  joined_at: string
  personal_email: string | null
  phone: string | null
  designation: string | null
  work_location: string
  employment_type: string
  module_access: string[]
  notes: string | null
  created_at: string
  updated_at: string
}

// Transform enhanced user to legacy format for backward compatibility
const toLegacyUser = (enhancedUser: EnhancedUser): User => ({
  id: enhancedUser.id,
  auth_user_id: enhancedUser.auth_user_id,
  full_name: enhancedUser.full_name,
  company_email: enhancedUser.company_email,
  role: enhancedUser.role,
  department: enhancedUser.department,
  joined_at: enhancedUser.joined_at,
  personal_email: enhancedUser.personal_email,
  phone: enhancedUser.phone,
  designation: enhancedUser.designation,
  work_location: enhancedUser.work_location,
  employment_type: enhancedUser.employment_type,
  module_access: enhancedUser.module_access,
  notes: enhancedUser.notes,
  created_at: enhancedUser.created_at,
  updated_at: enhancedUser.updated_at
})

export interface CreateUserData {
  full_name: string
  company_email: string
  role: string
  department: string
  joined_at: string
  personal_email?: string
  phone?: string
  designation?: string
  work_location?: string
  employment_type?: string
  module_access?: string[]
  notes?: string
}

export interface DeleteUserResponse {
  success: boolean
  data?: {
    deleted: boolean
    company_email: string
    full_name: string
    message: string
    warning?: string
  }
  error?: string
}

export interface CreateUserResponse {
  success: boolean
  data?: {
    user: User
    tempPasswordSet: boolean
    tempPassword: string
    message: string
  }
  error?: string
}

export interface UpdateUserData {
  full_name?: string
  company_email?: string
  role?: string
  department?: string
  personal_email?: string
  phone?: string
  designation?: string
  work_location?: string
  employment_type?: string
  module_access?: string[]
  notes?: string
}

export interface UpdateUserResponse {
  success: boolean
  data?: {
    user: User
    message: string
  }
  error?: string
}

// Enhanced get users with compatibility layer
export const getUsers = async (): Promise<User[]> => {
  // Import compatibility service dynamically to avoid circular imports
  const { getUsers: getUsersCompat } = await import('./compatibilityUsersService')
  return getUsersCompat()
}

// Status update functionality removed

// Enhanced update user with compatibility layer
export const updateUser = async (userId: string, userData: UpdateUserData): Promise<UpdateUserResponse> => {
  const { updateUser: updateUserCompat } = await import('./compatibilityUsersService')
  return updateUserCompat(userId, userData)
}

// Enhanced create user with compatibility layer
export const createUser = async (userData: CreateUserData): Promise<CreateUserResponse> => {
  const { createUser: createUserCompat } = await import('./compatibilityUsersService')
  return createUserCompat(userData)
}

// Helper function to link auth user to app user profile
export const linkAuthUser = async (appUserId: string, authUserId: string) => {
  // Update app user with auth_user_id and set status to active
  const { error } = await supabase
    .from('app_users')
    .update({ 
      auth_user_id: authUserId, 
      status: 'active' 
    })
    .eq('id', appUserId)

  if (error) {
    throw new Error(`Failed to link auth user: ${error.message}`)
  }

  return true
}

// Enhanced user activation with compatibility layer
export const activateUserOnLogin = async (authUserId: string, userEmail: string): Promise<boolean> => {
  const { activateUserOnLogin: activateUserOnLoginCompat } = await import('./compatibilityUsersService')
  return activateUserOnLoginCompat(authUserId, userEmail)
}

// Manual activation function for testing
export const manualActivateUser = async (userEmail: string) => {
  try {
    console.log(`Manual activation for: ${userEmail}`)
    
    const { data, error } = await supabase
      .from('app_users')
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('company_email', userEmail.toLowerCase().trim())
      .select('id, full_name, status')

    if (error) {
      console.error('Error in manual activation:', error)
      return false
    }

    if (data && data.length > 0) {
      console.log(`Manually activated user: ${data[0].full_name}`)
      return true
    }
    
    return false
  } catch (error) {
    console.error('Error in manual activation:', error)
    return false
  }
}

// Helper function to generate temporary password
const generateTempPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// Enhanced delete user with secure Edge Function
export const deleteUser = async (userId: string, reason?: string): Promise<DeleteUserResponse> => {
  try {
    if (!userId) {
      const error = ErrorFactory.validation('User ID is required')
      ErrorHandler.handle(error)
      throw new Error(error.message)
    }

    // Use enhanced service with secure Edge Function
    const response = await EnhancedUsersService.deleteUser(userId, reason)

    if (!response.success) {
      ErrorHandler.handleApiResponse(response)
      return response
    }

    return response

  } catch (error) {
    // Fallback to direct database deletion (less secure, but maintains compatibility)
    console.warn('Enhanced delete failed, falling back to direct deletion:', error)
    
    try {
      // Step 1: Get user data before deletion
      const { data: userToDelete, error: getUserError } = await supabase
        .from('app_users')
        .select('id, auth_user_id, company_email, full_name, role')
        .eq('id', userId)
        .single()

      if (getUserError) {
        const notFoundError = ErrorFactory.businessLogic('User not found', 'The user you are trying to delete was not found')
        ErrorHandler.handle(notFoundError)
        throw new Error('User not found')
      }

      // Prevent deletion of super admins
      if (userToDelete.role === 'super_admin') {
        const permissionError = ErrorFactory.authorization('Cannot delete super admin users', 'Super administrator users cannot be deleted')
        ErrorHandler.handle(permissionError)
        throw new Error('Cannot delete super admin users')
      }

      // Step 2: Delete from app_users table
      const { error: deleteAppUserError } = await supabase
        .from('app_users')
        .delete()
        .eq('id', userId)

      if (deleteAppUserError) {
        throw new Error(`Failed to delete app user: ${deleteAppUserError.message}`)
      }

      // Step 3: Log the deletion manually (since we're not using the secure function)
      try {
        await supabase
          .from('app_user_activity_logs')
          .insert({
            actor_auth_user_id: (await supabase.auth.getUser()).data.user?.id,
            target_user_id: userId,
            action: 'delete_user',
            details: {
              reason: reason || 'Direct database deletion (fallback)',
              deleted_user: {
                name: userToDelete.full_name,
                email: userToDelete.company_email,
                role: userToDelete.role
              }
            }
          })
      } catch (logError) {
        console.warn('Failed to log user deletion:', logError)
      }

      return {
        success: true,
        data: {
          deleted: true,
          user_email: userToDelete.company_email,
          user_name: userToDelete.full_name,
          auth_deleted: false, // Cannot delete auth user from client
          message: `User ${userToDelete.full_name} has been deleted`,
          warnings: ['Auth user deletion skipped - requires manual cleanup']
        }
      }

    } catch (fallbackError) {
      console.error('User deletion failed:', fallbackError)
      const structuredError = ErrorFactory.businessLogic(
        `Failed to delete user: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`,
        'Failed to delete user. Please try again or contact support.'
      )
      ErrorHandler.handle(structuredError)
      throw fallbackError
    }
  }
}