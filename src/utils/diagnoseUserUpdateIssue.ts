// Diagnostic utility to identify the exact cause of user update failures
// This will help us understand what's triggering the app.users reference

import { supabase } from '@/integrations/supabase/client'

export const diagnoseUserUpdateIssue = async (userId: string) => {
  try {
    console.log('🔍 [DIAGNOSE] Starting comprehensive diagnosis for user:', userId)
    
    // Step 1: Test basic table access
    console.log('📋 [DIAGNOSE] Step 1: Testing basic table access...')
    const { data: basicSelect, error: basicSelectError } = await supabase
      .from('app_users')
      .select('id, full_name, company_email, status')
      .eq('id', userId)
      .maybeSingle()
    
    console.log('📋 [DIAGNOSE] Basic select result:', { data: basicSelect, error: basicSelectError })
    
    if (basicSelectError) {
      return {
        step: 'basic_select',
        success: false,
        error: basicSelectError,
        diagnosis: 'Cannot perform basic SELECT on app_users table'
      }
    }
    
    if (!basicSelect) {
      return {
        step: 'basic_select',
        success: false,
        error: null,
        diagnosis: 'User not found in app_users table'
      }
    }
    
    // Step 2: Test minimal update without any potential trigger fields
    console.log('✏️ [DIAGNOSE] Step 2: Testing minimal timestamp-only update...')
    const testTimestamp = new Date().toISOString()
    
    const { data: timestampUpdate, error: timestampError } = await supabase
      .from('app_users')
      .update({ updated_at: testTimestamp })
      .eq('id', userId)
      .select('id, updated_at')
    
    console.log('✏️ [DIAGNOSE] Timestamp update result:', { data: timestampUpdate, error: timestampError })
    
    if (timestampError) {
      return {
        step: 'timestamp_update',
        success: false,
        error: timestampError,
        diagnosis: 'Even basic timestamp update fails - likely RLS or trigger issue',
        recommendation: 'Check database triggers and RLS policies on app_users table'
      }
    }
    
    // Step 3: Test update with a non-critical field
    console.log('📝 [DIAGNOSE] Step 3: Testing notes field update...')
    const testNote = `Test update ${Date.now()}`
    
    const { data: notesUpdate, error: notesError } = await supabase
      .from('app_users')
      .update({ 
        notes: testNote,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, notes, updated_at')
    
    console.log('📝 [DIAGNOSE] Notes update result:', { data: notesUpdate, error: notesError })
    
    if (notesError) {
      return {
        step: 'notes_update',
        success: false,
        error: notesError,
        diagnosis: 'Notes field update fails - confirms database-level issue'
      }
    }
    
    // Step 4: Test role/status update (common failure points)
    console.log('🔐 [DIAGNOSE] Step 4: Testing status update...')
    const currentStatus = basicSelect.status
    
    const { data: statusUpdate, error: statusError } = await supabase
      .from('app_users')
      .update({ 
        status: currentStatus, // Set to same value to avoid actual change
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, status, updated_at')
    
    console.log('🔐 [DIAGNOSE] Status update result:', { data: statusUpdate, error: statusError })
    
    if (statusError) {
      return {
        step: 'status_update',
        success: false,
        error: statusError,
        diagnosis: 'Status field update triggers the error - likely a database function is triggered by status changes'
      }
    }
    
    // If we get here, updates are working
    return {
      step: 'complete',
      success: true,
      error: null,
      diagnosis: 'All update tests passed - the issue may be intermittent or related to specific field combinations',
      user: basicSelect
    }
    
  } catch (error) {
    console.error('❌ [DIAGNOSE] Diagnosis failed:', error)
    return {
      step: 'exception',
      success: false,
      error,
      diagnosis: 'Diagnostic process failed with exception'
    }
  }
}

// Alternative raw update approach using Supabase's REST API directly
export const rawUserUpdate = async (userId: string, updateData: Record<string, any>) => {
  try {
    console.log('🔧 [RAW] Attempting raw update for user:', userId)
    console.log('📝 [RAW] Update data:', updateData)
    
    // Get auth session for manual API call
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('No authenticated session available')
    }
    
    // Prepare update payload
    const updatePayload = {
      ...updateData,
      updated_at: new Date().toISOString()
    }
    
    console.log('🌐 [RAW] Making direct REST API call...')
    
    // Make direct API call bypassing PostgREST client entirely
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    
    console.log('🌐 [RAW] API URL:', `${supabaseUrl}/rest/v1/app_users?id=eq.${userId}`)
    
    const response = await fetch(`${supabaseUrl}/rest/v1/app_users?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': supabaseKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(updatePayload)
    })
    
    console.log('📊 [RAW] Raw API response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [RAW] Raw API error:', errorText)
      throw new Error(`Raw API call failed: ${response.status} - ${errorText}`)
    }
    
    const updatedData = await response.json()
    console.log('✅ [RAW] Raw update successful:', updatedData)
    
    return {
      success: true,
      data: updatedData[0] || updatedData,
      method: 'raw_api'
    }
    
  } catch (error) {
    console.error('❌ [RAW] Raw update failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      method: 'raw_api'
    }
  }
}