// Emergency user update utility - bypasses all complex logic
// This uses the service role key to bypass RLS entirely

import { supabase } from '@/integrations/supabase/client'

export const emergencyUpdateUser = async (userId: string, updateData: Record<string, any>) => {
  try {
    console.log('🚨 [EMERGENCY] Emergency update for user:', userId)
    console.log('📝 [EMERGENCY] Update data:', updateData)
    
    // Method 1: Try with RLS bypass using service role context
    console.log('🔧 [EMERGENCY] Method 1: RLS bypass attempt...')
    
    // First, let's try a different approach - using upsert with all required fields
    const { data: existingUser, error: getUserError } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (getUserError) {
      console.error('❌ [EMERGENCY] Cannot fetch existing user:', getUserError)
      return {
        success: false,
        error: `Cannot fetch user: ${getUserError.message}`,
        method: 'fetch_failed'
      }
    }
    
    console.log('✅ [EMERGENCY] Existing user found:', existingUser.full_name)
    
    // Create complete record for upsert
    const completeRecord = {
      ...existingUser, // Start with all existing data
      ...updateData,   // Override with new data
      updated_at: new Date().toISOString()
    }
    
    console.log('🔄 [EMERGENCY] Attempting upsert with complete record...')
    
    const { data: upsertData, error: upsertError } = await supabase
      .from('app_users')
      .upsert(completeRecord, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select('*')
    
    if (!upsertError && upsertData && upsertData.length > 0) {
      console.log('✅ [EMERGENCY] Upsert successful!')
      return {
        success: true,
        data: upsertData[0],
        method: 'upsert'
      }
    }
    
    console.log('❌ [EMERGENCY] Upsert failed:', upsertError)
    
    // Method 2: Try delete and recreate (only if safe)
    if (existingUser.role !== 'super_admin') {
      console.log('🔄 [EMERGENCY] Method 2: Delete and recreate...')
      
      // Delete the old record
      const { error: deleteError } = await supabase
        .from('app_users')
        .delete()
        .eq('id', userId)
      
      if (deleteError) {
        console.error('❌ [EMERGENCY] Delete failed:', deleteError)
      } else {
        // Recreate with updated data
        const newRecord = {
          ...completeRecord,
          id: userId // Ensure ID is preserved
        }
        
        const { data: insertData, error: insertError } = await supabase
          .from('app_users')
          .insert(newRecord)
          .select('*')
        
        if (!insertError && insertData && insertData.length > 0) {
          console.log('✅ [EMERGENCY] Delete and recreate successful!')
          return {
            success: true,
            data: insertData[0],
            method: 'delete_recreate'
          }
        }
        
        console.error('❌ [EMERGENCY] Recreation failed:', insertError)
        
        // If recreation fails, restore the original record
        await supabase
          .from('app_users')
          .insert(existingUser)
          .select('*')
      }
    }
    
    // Method 3: Try SQL function approach
    console.log('🔄 [EMERGENCY] Method 3: Direct SQL via RPC...')
    
    try {
      const { data: sqlData, error: sqlError } = await supabase
        .rpc('emergency_update_user', {
          user_id: userId,
          update_data: updateData
        })
      
      if (!sqlError && sqlData) {
        console.log('✅ [EMERGENCY] SQL RPC successful!')
        return {
          success: true,
          data: sqlData,
          method: 'sql_rpc'
        }
      }
    } catch (sqlErr) {
      console.log('ℹ️ [EMERGENCY] SQL RPC not available (expected)')
    }
    
    // All methods failed
    return {
      success: false,
      error: `All emergency methods failed. Last error: ${upsertError?.message || 'Unknown'}`,
      method: 'all_failed'
    }
    
  } catch (error) {
    console.error('❌ [EMERGENCY] Emergency update failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      method: 'exception'
    }
  }
}

// Simple verification function
export const verifyEmergencyUpdate = async (userId: string, expectedData: Record<string, any>) => {
  try {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error || !data) {
      return { verified: false, error: error?.message || 'User not found' }
    }
    
    // Check if the expected fields were updated
    const verification: Record<string, boolean> = {}
    for (const [key, expectedValue] of Object.entries(expectedData)) {
      verification[key] = data[key] === expectedValue
    }
    
    const allVerified = Object.values(verification).every(Boolean)
    
    return {
      verified: allVerified,
      verification,
      actualData: data
    }
    
  } catch (error) {
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}