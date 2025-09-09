// Utility to fix missing auth_user_id links for existing users
import { supabase } from '@/integrations/supabase/client'

export interface LinkFixResult {
  success: boolean
  message: string
  usersLinked?: number
  errors?: string[]
}

// Fix all users with missing auth_user_id links - Simple version without admin permissions
export async function fixAllUserLinks(): Promise<LinkFixResult> {
  try {
    console.log('🔧 [fixAllUserLinks] Starting user link fix...')
    
    // Get all users without auth_user_id
    const { data: unlinkedUsers, error: fetchError } = await supabase
      .from('app_users')
      .select('id, company_email, full_name, auth_user_id')
      .is('auth_user_id', null)
    
    if (fetchError) {
      console.error('❌ Failed to fetch unlinked users:', fetchError)
      return { success: false, message: `Failed to fetch users: ${fetchError.message}` }
    }
    
    if (!unlinkedUsers || unlinkedUsers.length === 0) {
      console.log('✅ No unlinked users found')
      return { success: true, message: 'All users are already properly linked', usersLinked: 0 }
    }
    
    console.log(`🔍 Found ${unlinkedUsers.length} unlinked users:`, unlinkedUsers.map(u => u.company_email))
    
    // Return instructions for manual fix since we don't have admin permissions
    const instructions = [
      "Manual fix required - Please update the following in Supabase Dashboard:",
      "",
      "1. Go to Table Editor > app_users",
      "2. For each user below, find their auth_user_id:",
      "   - Go to Authentication > Users in Supabase",
      "   - Find user by email and copy their ID",
      "   - Update the auth_user_id column in app_users table",
      "",
      "Users needing fixes:"
    ]
    
    unlinkedUsers.forEach(user => {
      instructions.push(`   - ${user.full_name} (${user.company_email})`)
    })
    
    console.log(instructions.join('\n'))
    
    return {
      success: false,
      message: `Found ${unlinkedUsers.length} users needing manual linking. Check console for instructions.`,
      errors: instructions
    }
    
  } catch (error) {
    const message = `Failed to check user links: ${error}`
    console.error('❌ [fixAllUserLinks]', message)
    return { success: false, message }
  }
}

// Fix a specific user's link by email
export async function fixUserLinkByEmail(email: string): Promise<LinkFixResult> {
  try {
    console.log(`🔧 [fixUserLinkByEmail] Fixing link for ${email}`)
    
    // Get the app user
    const { data: appUser, error: appUserError } = await supabase
      .from('app_users')
      .select('id, company_email, full_name, auth_user_id')
      .eq('company_email', email.toLowerCase())
      .single()
    
    if (appUserError || !appUser) {
      const msg = `App user not found for ${email}`
      console.error('❌', msg)
      return { success: false, message: msg }
    }
    
    if (appUser.auth_user_id) {
      const msg = `User ${email} is already linked to auth user ${appUser.auth_user_id}`
      console.log('✅', msg)
      return { success: true, message: msg }
    }
    
    // Get the auth user
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      const msg = `Failed to fetch auth users: ${authError.message}`
      console.error('❌', msg)
      return { success: false, message: msg }
    }
    
    const matchingAuthUser = authUsers.find(authUser => 
      authUser.email?.toLowerCase() === email.toLowerCase()
    )
    
    if (!matchingAuthUser) {
      const msg = `No auth user found with email ${email}`
      console.error('❌', msg)
      return { success: false, message: msg }
    }
    
    // Link the users
    const { emergencyUpdateUser } = await import('./emergencyUserUpdate')
    
    const updateResult = await emergencyUpdateUser(appUser.id, {
      auth_user_id: matchingAuthUser.id,
      updated_at: new Date().toISOString()
    })
    
    if (updateResult.success) {
      const msg = `Successfully linked ${appUser.full_name} (${email}) to auth user`
      console.log('✅', msg)
      return { success: true, message: msg, usersLinked: 1 }
    } else {
      const msg = `Failed to link user: ${updateResult.error}`
      console.error('❌', msg)
      return { success: false, message: msg }
    }
    
  } catch (error) {
    const msg = `Error fixing link for ${email}: ${error}`
    console.error('❌ [fixUserLinkByEmail]', msg)
    return { success: false, message: msg }
  }
}