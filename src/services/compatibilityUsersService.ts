// Compatibility service that works with current database setup
// This bridges the enhanced features with your existing app_users table

import { supabase } from '@/integrations/supabase/client'
import { ErrorHandler, ErrorFactory, RetryHandler } from '@/utils/errorHandling'
import { simpleUpdateUser, verifyUserAccess } from '@/utils/simpleUserUpdate'
import { diagnoseUserUpdateIssue, rawUserUpdate } from '@/utils/diagnoseUserUpdateIssue'
import { emergencyUpdateUser, verifyEmergencyUpdate } from '@/utils/emergencyUserUpdate'
import { triggerGlobalPermissionRefresh } from '@/contexts/PermissionsContext'

// Simple compatibility interface matching your current table
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

// Enhanced get users with error handling but using direct table access
export const getUsers = async (): Promise<User[]> => {
  try {
    const { data, error } = await RetryHandler.withRetry(
      () => supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false }),
      { maxAttempts: 3, delay: 1000 }
    )

    if (error) {
      console.error('Error fetching users:', error)
      const structuredError = ErrorFactory.database(
        `Database error: ${error.message}`,
        'Unable to load users. Please refresh and try again.',
        error.code
      )
      ErrorHandler.handle(structuredError)
      throw error
    }

    return data || []

  } catch (error) {
    console.error('Failed to fetch users:', error)
    throw error
  }
}

// Status functionality removed - users no longer have status field

// Enhanced user activation with better error handling and current table structure
export const activateUserOnLogin = async (authUserId: string, userEmail: string): Promise<boolean> => {
  try {
    console.log(`=== USER ACTIVATION ATTEMPT ===`)
    console.log(`Auth User ID: ${authUserId}`)
    console.log(`Email: ${userEmail}`)
    console.log(`Email (processed): ${userEmail.toLowerCase().trim()}`)
    
    // Find user by email in current table
    const { data: existingUser, error: findError } = await supabase
      .from('app_users')
      .select('*')
      .eq('company_email', userEmail.toLowerCase().trim())
      .maybeSingle() // Use maybeSingle to avoid error on no results

    console.log(`Find user query result:`, { existingUser, findError })

    if (findError) {
      console.error('Error finding user:', findError)
      return false
    }

    if (!existingUser) {
      console.log(`No user found with email: ${userEmail}`)
      return false
    }

    console.log(`Found user:`, existingUser)

    // Only link auth_user_id if not already linked
    if (existingUser.auth_user_id) {
      console.log(`User already linked to auth user: ${existingUser.auth_user_id}`)
      return true // Already linked
    }

    // Link auth_user_id to user account
    const { data, error } = await supabase
      .from('app_users')
      .update({ 
        auth_user_id: authUserId,
        updated_at: new Date().toISOString()
      })
      .eq('company_email', userEmail.toLowerCase().trim())
      .select('id, full_name, company_email')

    console.log(`Update query result:`, { data, error })

    if (error) {
      console.error('Error updating user status:', error)
      return false
    }

    if (data && data.length > 0) {
      console.log(`✅ User ${data[0].full_name} (${data[0].company_email}) linked to auth user`)
      
      // Try to log the activation
      try {
        await supabase
          .from('app_user_activity_logs')
          .insert({
            actor_auth_user_id: authUserId,
            target_user_id: data[0].id,
            action: 'login',
            details: {
              auth_linked: true,
              email: userEmail
            }
          })
      } catch (logError) {
        console.warn('Could not log activation (table may not exist yet):', logError)
      }
      
      return true
    } else {
      console.log(`❌ No rows updated for email: ${userEmail}`)
      return false
    }
  } catch (error) {
    console.error('Error in activateUserOnLogin:', error)
    return false
  }
}

// Enhanced create user with validation but using current table
export const createUser = async (userData: CreateUserData) => {
  try {
    console.log('Creating user with data:', userData)

    // Basic validation
    if (!userData.full_name || !userData.company_email || !userData.role || !userData.department) {
      const error = ErrorFactory.validation(
        'Missing required fields',
        'Please fill in all required fields'
      )
      ErrorHandler.handle(error)
      throw new Error('Missing required fields')
    }

    // Validate email domain
    if (!userData.company_email.toLowerCase().endsWith('@erayastyle.com')) {
      const error = ErrorFactory.validation(
        'Invalid email domain',
        'Please use your @erayastyle.com email address'
      )
      ErrorHandler.handle(error)
      throw new Error('Invalid email domain')
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('app_users')
      .select('id')
      .eq('company_email', userData.company_email.toLowerCase().trim())
      .maybeSingle()

    if (existingUser) {
      const error = ErrorFactory.businessLogic(
        'Email already exists',
        'A user with this email address already exists'
      )
      ErrorHandler.handle(error)
      throw new Error('Email already exists')
    }

    // Prepare user data with defaults
    const userRecord = {
      auth_user_id: null, // Will be linked when user logs in
      full_name: userData.full_name.trim(),
      company_email: userData.company_email.toLowerCase().trim(),
      role: userData.role,
      department: userData.department,
      joined_at: userData.joined_at || new Date().toISOString().split('T')[0],
      personal_email: userData.personal_email || null,
      phone: userData.phone || null,
      designation: userData.designation || null,
      work_location: userData.work_location || 'Patna',
      employment_type: userData.employment_type || 'Full-time',
      module_access: userData.module_access?.length ? userData.module_access : ['dashboard'],
      notes: userData.notes || null
    }

    // Ensure dashboard is always included
    if (!userRecord.module_access.includes('dashboard')) {
      userRecord.module_access.push('dashboard')
    }

    const { data: newUser, error } = await supabase
      .from('app_users')
      .insert(userRecord)
      .select()
      .single()

    if (error) {
      console.error('Error creating user:', error)
      const structuredError = ErrorFactory.database(
        `Database error: ${error.message}`,
        'Failed to create user account',
        error.code
      )
      ErrorHandler.handle(structuredError)
      throw error
    }

    // Try to log the creation
    try {
      const { data: currentUser } = await supabase.auth.getUser()
      if (currentUser?.user) {
        await supabase
          .from('app_user_activity_logs')
          .insert({
            actor_auth_user_id: currentUser.user.id,
            target_user_id: newUser.id,
            action: 'create_user',
            details: {
              created_user: {
                name: newUser.full_name,
                email: newUser.company_email,
                role: newUser.role
              }
            }
          })
      }
    } catch (logError) {
      console.warn('Could not log user creation (table may not exist yet):', logError)
    }

    return {
      success: true,
      data: {
        user: newUser,
        tempPasswordSet: false,
        tempPassword: 'N/A - Create auth account manually in Supabase Dashboard',
        message: `User profile for ${newUser.full_name} created successfully. User can now log in with email: ${newUser.company_email}`
      }
    }

  } catch (error) {
    console.error('User creation failed:', error)
    throw error
  }
}

// Enhanced update user function
export const updateUser = async (userId: string, userData: UpdateUserData) => {
  try {
    if (!userId) {
      throw new Error('User ID is required')
    }

    console.log(`🔄 [updateUser] Starting update for user ${userId}`)
    console.log(`📝 [updateUser] Update data:`, userData)

    // First, verify the user exists
    console.log(`🔍 [updateUser] Verifying user access...`)
    const verificationResult = await verifyUserAccess(userId)
    
    if (!verificationResult.canAccess) {
      console.error('❌ [updateUser] Cannot access user:', verificationResult.error)
      throw new Error(`Cannot access user: ${verificationResult.error}`)
    }

    console.log(`✅ [updateUser] User verified:`, verificationResult.user)

    // Prepare update data - only include provided fields
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    // Only include fields that are provided
    Object.keys(userData).forEach(key => {
      const value = userData[key as keyof UpdateUserData]
      if (value !== undefined) {
        updateData[key] = value
      }
    })

    // Ensure dashboard is always in module_access if being updated
    if (updateData.module_access && !updateData.module_access.includes('dashboard')) {
      updateData.module_access.push('dashboard')
    }

    console.log(`📊 [updateUser] Final update data:`, updateData)

    // First, run diagnostics to understand the exact issue
    console.log(`🔍 [updateUser] Running diagnostics first...`)
    const diagnosticResult = await diagnoseUserUpdateIssue(userId)
    console.log(`📋 [updateUser] Diagnostic result:`, diagnosticResult)

    if (!diagnosticResult.success) {
      console.log(`🔧 [updateUser] Diagnostics failed, trying raw API approach...`)
      
      // Try the raw API approach as a fallback
      const rawResult = await rawUserUpdate(userId, updateData)
      console.log(`🌐 [updateUser] Raw update result:`, rawResult)
      
      if (rawResult.success) {
        const updatedUser = rawResult.data
        console.log(`✅ [updateUser] Raw update successful!`)
        
        const finalUser = updatedUser
        console.log('✅ [updateUser] User updated successfully via raw API:', finalUser)

        // Trigger global permission refresh after successful update
        try {
          console.log('🔄 [updateUser] Triggering global permission refresh after raw API update')
          triggerGlobalPermissionRefresh()
        } catch (refreshError) {
          console.warn('Could not trigger permission refresh:', refreshError)
        }

        return {
          success: true,
          data: {
            user: finalUser,
            message: `User ${finalUser.full_name} updated successfully (via direct API)`
          }
        }
      } else {
        console.log(`🚨 [updateUser] Standard methods failed, trying emergency update...`)
        
        // Final attempt with emergency update
        const emergencyResult = await emergencyUpdateUser(userId, updateData)
        console.log(`🚨 [updateUser] Emergency update result:`, emergencyResult)
        
        if (emergencyResult.success) {
          const updatedUser = emergencyResult.data
          console.log(`✅ [updateUser] Emergency update successful via ${emergencyResult.method}!`)
          
          // Verify the update worked
          const verificationResult = await verifyEmergencyUpdate(userId, updateData)
          console.log(`🔍 [updateUser] Update verification:`, verificationResult)
          
          // Trigger global permission refresh after successful update
          try {
            console.log('🔄 [updateUser] Triggering global permission refresh after user update')
            triggerGlobalPermissionRefresh()
          } catch (refreshError) {
            console.warn('Could not trigger permission refresh:', refreshError)
          }
          
          return {
            success: true,
            data: {
              user: updatedUser,
              message: `User ${updatedUser.full_name} updated successfully (emergency method: ${emergencyResult.method})`,
              needsPermissionRefresh: true // Signal that permissions may need refreshing
            }
          }
        } else {
          console.error('❌ [updateUser] Even emergency update failed')
          const structuredError = ErrorFactory.database(
            `All update methods failed including emergency. Diagnostic: ${diagnosticResult.diagnosis}. Raw API: ${rawResult.error}. Emergency: ${emergencyResult.error}`,
            'Failed to save changes. The user record may be corrupted. Please contact support.',
            'EMERGENCY_UPDATE_FAILED'
          )
          ErrorHandler.handle(structuredError)
          throw new Error(`All update methods failed. Emergency error: ${emergencyResult.error}`)
        }
      }
    }

    // If diagnostics passed, proceed with simple update
    const updateResult = await simpleUpdateUser(userId, updateData)
    console.log(`🔍 [updateUser] Simple update result:`, updateResult)

    if (!updateResult.success) {
      console.error('❌ [updateUser] Simple update failed despite passing diagnostics:', updateResult.error)
      
      // Try raw API as fallback
      console.log(`🔧 [updateUser] Trying raw API as final fallback...`)
      const rawFallbackResult = await rawUserUpdate(userId, updateData)
      
      if (rawFallbackResult.success) {
        const updatedUser = rawFallbackResult.data
        console.log(`✅ [updateUser] Raw fallback successful!`)
        
        // Trigger global permission refresh after successful update
        try {
          console.log('🔄 [updateUser] Triggering global permission refresh after fallback API update')
          triggerGlobalPermissionRefresh()
        } catch (refreshError) {
          console.warn('Could not trigger permission refresh:', refreshError)
        }

        return {
          success: true,
          data: {
            user: updatedUser,
            message: `User ${updatedUser.full_name} updated successfully (via fallback API)`
          }
        }
      }
      
      const structuredError = ErrorFactory.database(
        `Failed to update user: ${updateResult.error}`,
        'Failed to save changes. Please try again.',
        'UPDATE_FAILED'
      )
      ErrorHandler.handle(structuredError)
      throw new Error(updateResult.error)
    }

    const updatedUser = updateResult.data
    console.log(`✅ [updateUser] Update successful via ${updateResult.method} method`)

    const finalUser = updatedUser
    console.log('✅ [updateUser] User updated successfully:', finalUser)

    // Trigger global permission refresh after successful update
    try {
      console.log('🔄 [updateUser] Triggering global permission refresh after standard update')
      triggerGlobalPermissionRefresh()
    } catch (refreshError) {
      console.warn('Could not trigger permission refresh:', refreshError)
    }

    // Try to log the update
    try {
      const { data: currentUser } = await supabase.auth.getUser()
      if (currentUser?.user) {
        await supabase
          .from('app_user_activity_logs')
          .insert({
            actor_auth_user_id: currentUser.user.id,
            target_user_id: userId,
            action: 'update_user',
            details: {
              updated_fields: Object.keys(userData),
              updated_user: {
                name: finalUser.full_name,
                email: finalUser.company_email
              }
            }
          })
        console.log('✅ [updateUser] Activity logged successfully')
      }
    } catch (logError) {
      console.warn('⚠️ [updateUser] Could not log user update (table may not exist yet):', logError)
    }

    return {
      success: true,
      data: {
        user: finalUser,
        message: `User ${finalUser.full_name} updated successfully`
      }
    }

  } catch (error) {
    console.error('User update failed:', error)
    throw error
  }
}

// Enhanced delete user function
export const deleteUser = async (userId: string) => {
  try {
    if (!userId) {
      throw new Error('User ID is required')
    }

    // Get user data before deletion
    const { data: userToDelete, error: getUserError } = await supabase
      .from('app_users')
      .select('id, auth_user_id, company_email, full_name, role')
      .eq('id', userId)
      .single()

    if (getUserError) {
      console.error('Error getting user to delete:', getUserError)
      const error = ErrorFactory.businessLogic('User not found', 'The user you are trying to delete was not found')
      ErrorHandler.handle(error)
      throw new Error('User not found')
    }

    // Prevent deletion of super admins
    if (userToDelete.role === 'super_admin') {
      const error = ErrorFactory.authorization(
        'Cannot delete super admin users',
        'Super administrator users cannot be deleted for security reasons'
      )
      ErrorHandler.handle(error)
      throw new Error('Cannot delete super admin users')
    }

    // Try to log the deletion before it happens
    try {
      const { data: currentUser } = await supabase.auth.getUser()
      if (currentUser?.user) {
        await supabase
          .from('app_user_activity_logs')
          .insert({
            actor_auth_user_id: currentUser.user.id,
            target_user_id: userId,
            action: 'delete_user',
            details: {
              deleted_user: {
                name: userToDelete.full_name,
                email: userToDelete.company_email,
                role: userToDelete.role
              }
            }
          })
      }
    } catch (logError) {
      console.warn('Could not log user deletion (table may not exist yet):', logError)
    }

    // Delete from app_users table
    const { error: deleteAppUserError } = await supabase
      .from('app_users')
      .delete()
      .eq('id', userId)

    if (deleteAppUserError) {
      console.error('Error deleting user:', deleteAppUserError)
      const error = ErrorFactory.database(
        `Failed to delete app user: ${deleteAppUserError.message}`,
        'Failed to delete user. Please try again.',
        deleteAppUserError.code
      )
      ErrorHandler.handle(error)
      throw new Error(`Failed to delete app user: ${deleteAppUserError.message}`)
    }

    console.log(`User ${userToDelete.full_name} deleted successfully`)

    return {
      success: true,
      data: {
        deleted: true,
        company_email: userToDelete.company_email,
        full_name: userToDelete.full_name,
        message: `User ${userToDelete.full_name} has been deleted`,
        warning: 'Auth user cleanup may be required - cannot delete auth users from client'
      }
    }

  } catch (error) {
    console.error('User deletion failed:', error)
    throw error
  }
}

// Export all functions with backward compatibility
export {
  getUsers as getUsersCompat,
  activateUserOnLogin as activateUserOnLoginCompat,
  createUser as createUserCompat,
  updateUser as updateUserCompat,
  deleteUser as deleteUserCompat
}