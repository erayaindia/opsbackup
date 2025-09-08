// Compatibility service that works with current database setup
// This bridges the enhanced features with your existing app_users table

import { supabase } from '@/integrations/supabase/client'
import { ErrorHandler, ErrorFactory, RetryHandler } from '@/utils/errorHandling'

// Simple compatibility interface matching your current table
export interface User {
  id: string
  auth_user_id: string | null
  full_name: string
  company_email: string
  role: string
  department: string
  status: string
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
  status?: string
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

// Enhanced user status update with better error handling
export const updateUserStatus = async (userId: string, status: string) => {
  try {
    console.log(`Updating user ${userId} status to ${status}`)

    // First check if we can read the table
    console.log('Testing table access first...')
    const { data: testData, error: testError } = await supabase
      .from('app_users')
      .select('id')
      .limit(1)
    
    if (testError) {
      console.error('❌ Cannot access app_users table:', testError)
      throw new Error(`Table access failed: ${testError.message}`)
    }
    console.log('✅ Table access test passed')

    // Skip RPC function and go directly to table update for simplicity
    console.log('Using direct database update for status change')
    
    // Try bypassing RLS by using service role for updates
    const { data, error } = await supabase
      .from('app_users')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, full_name, status')

    if (error) {
      console.error('Direct update error:', error)
      const structuredError = ErrorFactory.database(
        `Failed to update user status: ${error.message}`,
        'Failed to update user status. Please try again.',
        error.code
      )
      ErrorHandler.handle(structuredError)
      throw error
    }

    if (!data || data.length === 0) {
      console.error('No user found with ID:', userId)
      throw new Error('User not found')
    }

    console.log('✅ User status updated successfully:', data[0])

    // Try to log the action if activity logs table exists
    try {
      const { data: currentUser } = await supabase.auth.getUser()
      if (currentUser?.user) {
        await supabase
          .from('app_user_activity_logs')
          .insert({
            actor_auth_user_id: currentUser.user.id,
            target_user_id: userId,
            action: 'change_status',
            details: {
              new_status: status,
              method: 'direct_update'
            }
          })
      }
    } catch (logError) {
      console.warn('Could not log activity (table may not exist yet):', logError)
    }

    return {
      success: true,
      data: {
        user_id: userId,
        new_status: status,
        message: `Status updated to ${status}`
      }
    }

  } catch (error) {
    console.error('Error updating user status:', error)
    const structuredError = ErrorFactory.businessLogic(
      `Failed to update user status: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'Failed to update user status. Please try again.'
    )
    ErrorHandler.handle(structuredError)
    throw error
  }
}

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

    // Only update if user is pending or doesn't have auth_user_id linked
    if (existingUser.status !== 'pending' && existingUser.auth_user_id) {
      console.log(`User already active and linked: ${existingUser.status}`)
      return true // Already activated
    }

    // Update user to active status and link auth_user_id
    const { data, error } = await supabase
      .from('app_users')
      .update({ 
        status: 'active',
        auth_user_id: authUserId,
        updated_at: new Date().toISOString()
      })
      .eq('company_email', userEmail.toLowerCase().trim())
      .select('id, full_name, status, company_email')

    console.log(`Update query result:`, { data, error })

    if (error) {
      console.error('Error updating user status:', error)
      return false
    }

    if (data && data.length > 0) {
      console.log(`✅ User ${data[0].full_name} (${data[0].company_email}) status updated to active`)
      
      // Try to log the activation
      try {
        await supabase
          .from('app_user_activity_logs')
          .insert({
            actor_auth_user_id: authUserId,
            target_user_id: data[0].id,
            action: 'login',
            details: {
              auto_activated: true,
              previous_status: existingUser.status,
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
      status: 'pending',
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
        message: `User profile for ${newUser.full_name} created. Please create auth account manually with email: ${newUser.company_email}`
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

    console.log(`Updating user ${userId} with data:`, userData)

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

    const { data: updatedUser, error } = await supabase
      .from('app_users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      const structuredError = ErrorFactory.database(
        `Failed to update user: ${error.message}`,
        'Failed to save changes. Please try again.',
        error.code
      )
      ErrorHandler.handle(structuredError)
      throw error
    }

    console.log('User updated successfully:', updatedUser)

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
                name: updatedUser.full_name,
                email: updatedUser.company_email
              }
            }
          })
      }
    } catch (logError) {
      console.warn('Could not log user update (table may not exist yet):', logError)
    }

    return {
      success: true,
      data: {
        user: updatedUser,
        message: `User ${updatedUser.full_name} updated successfully`
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
  updateUserStatus as updateUserStatusCompat, 
  activateUserOnLogin as activateUserOnLoginCompat,
  createUser as createUserCompat,
  updateUser as updateUserCompat,
  deleteUser as deleteUserCompat
}