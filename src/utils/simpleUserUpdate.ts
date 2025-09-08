// Simple user update utility that bypasses complex database functions
// This directly updates the app_users table without triggering problematic functions

import { supabase } from '@/integrations/supabase/client'

export const simpleUpdateUser = async (userId: string, updateData: Record<string, any>) => {
  try {
    console.log(`🔧 [simpleUpdateUser] Direct update for user ${userId}`)
    console.log(`📝 [simpleUpdateUser] Update data:`, updateData)
    
    // Prepare the update with timestamp
    const finalUpdateData = {
      ...updateData,
      updated_at: new Date().toISOString()
    }
    
    // Use ONLY the most direct approach - no RPC functions, no complex queries
    // This completely bypasses any database functions that might reference app.users
    console.log(`🎯 [simpleUpdateUser] Using direct table update only...`)
    
    const { data: updatedData, error: updateError } = await supabase
      .from('app_users')
      .update(finalUpdateData)
      .eq('id', userId)
      .select()
    
    console.log(`📊 [simpleUpdateUser] Direct update response:`, { data: updatedData, error: updateError })
    
    if (updateError) {
      console.error(`❌ [simpleUpdateUser] Direct update failed:`, updateError)
      throw new Error(`Direct update failed: ${updateError.message}`)
    }
    
    if (!updatedData || updatedData.length === 0) {
      console.error(`❌ [simpleUpdateUser] No data returned from update`)
      throw new Error('No data returned from update - user may not exist or RLS may be blocking access')
    }
    
    console.log(`✅ [simpleUpdateUser] Update successful, returning:`, updatedData[0])
    return { success: true, data: updatedData[0], method: 'direct_table_update' }
    
  } catch (error) {
    console.error(`❌ [simpleUpdateUser] Error:`, error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      method: 'none' 
    }
  }
}

// Verify user exists and can be updated
export const verifyUserAccess = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('app_users')
      .select('id, full_name, company_email, status, role')
      .eq('id', userId)
      .maybeSingle()
    
    if (error) {
      return { canAccess: false, error: error.message }
    }
    
    if (!data) {
      return { canAccess: false, error: 'User not found' }
    }
    
    return { canAccess: true, user: data }
    
  } catch (error) {
    return { 
      canAccess: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}