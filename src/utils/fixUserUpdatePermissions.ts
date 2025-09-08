// Utility to check and potentially fix user update permissions
// This helps diagnose RLS issues with the app_users table

import { supabase } from '@/integrations/supabase/client'

export const debugUserUpdatePermissions = async (userId: string) => {
  try {
    console.log('🔍 [DEBUG] Checking user update permissions for:', userId)
    
    // Test 1: Can we select the user?
    const { data: selectTest, error: selectError } = await supabase
      .from('app_users')
      .select('id, full_name, company_email, role, status')
      .eq('id', userId)
      .maybeSingle()
    
    console.log('📖 [DEBUG] SELECT test:', { data: selectTest, error: selectError })
    
    if (selectError) {
      return {
        canSelect: false,
        canUpdate: false,
        issue: 'Cannot select user - possible RLS issue',
        error: selectError
      }
    }
    
    if (!selectTest) {
      return {
        canSelect: false,
        canUpdate: false,
        issue: 'User not found',
        error: null
      }
    }
    
    // Test 2: Can we update with a minimal change?
    const { data: updateTest, error: updateError } = await supabase
      .from('app_users')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('id, updated_at')
    
    console.log('✏️ [DEBUG] UPDATE test:', { data: updateTest, error: updateError })
    
    return {
      canSelect: true,
      canUpdate: !updateError,
      user: selectTest,
      issue: updateError ? updateError.message : null,
      error: updateError
    }
    
  } catch (error) {
    console.error('❌ [DEBUG] Permission check failed:', error)
    return {
      canSelect: false,
      canUpdate: false,
      issue: 'Permission check failed',
      error
    }
  }
}

// Alternative update method that bypasses potential RLS issues
export const updateUserWithFallback = async (userId: string, userData: Record<string, any>) => {
  try {
    // First try the normal update
    const { data, error } = await supabase
      .from('app_users')
      .update(userData)
      .eq('id', userId)
      .select('*')
    
    if (!error && data && data.length > 0) {
      return { success: true, data: data[0], method: 'direct' }
    }
    
    // If that fails, try using RPC function (if available)
    console.log('Direct update failed, trying alternative methods...')
    
    // Method 2: Try upsert instead of update
    const { data: upsertData, error: upsertError } = await supabase
      .from('app_users')
      .upsert({ id: userId, ...userData }, { onConflict: 'id' })
      .select('*')
    
    if (!upsertError && upsertData && upsertData.length > 0) {
      return { success: true, data: upsertData[0], method: 'upsert' }
    }
    
    // If all methods fail, return the original error
    return { 
      success: false, 
      error: error?.message || 'Update failed with unknown error',
      method: 'none'
    }
    
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error',
      method: 'none' 
    }
  }
}