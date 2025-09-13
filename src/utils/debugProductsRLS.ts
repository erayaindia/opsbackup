import { supabase } from '@/integrations/supabase/client'

export async function debugProductsRLS() {
  console.log('=== Products RLS Debug ===')

  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('1. Authentication check:')
    console.log('   User:', user ? `${user.email} (${user.id})` : 'Not authenticated')
    console.log('   Auth Error:', authError)

    if (!user) {
      console.log('❌ No authenticated user - stopping debug')
      return
    }

    // Check session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('2. Session check:')
    console.log('   Session exists:', !!session)
    console.log('   Session Error:', sessionError)

    // Test simple SELECT on products table
    console.log('3. Testing SELECT on products table:')
    const { data: products, error: selectError } = await supabase
      .from('products')
      .select('*')
      .limit(1)

    console.log('   Products data:', products)
    console.log('   Select Error:', selectError)

    // Test simple INSERT on products table
    console.log('4. Testing INSERT on products table:')
    const testInsert = {
      internal_code: `TEST-${Date.now()}`,
      working_title: 'RLS Test Product',
      name: 'RLS Test Product',
      priority: 'medium' as const,
      stage: 'idea' as const,
      created_by: user.id,
      assigned_to: user.id,
      potential_score: 50
    }

    const { data: insertData, error: insertError } = await supabase
      .from('products')
      .insert(testInsert)
      .select()
      .single()

    console.log('   Insert Data:', insertData)
    console.log('   Insert Error:', insertError)

    // If insert succeeded, clean up
    if (insertData && !insertError) {
      console.log('5. Cleaning up test product:')
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', insertData.id)

      console.log('   Delete Error:', deleteError)
    }

    // Check app_users table access
    console.log('6. Testing app_users table access:')
    const { data: userData, error: userError } = await supabase
      .from('app_users')
      .select('id, full_name, company_email')
      .eq('id', user.id)
      .single()

    console.log('   User Data:', userData)
    console.log('   User Error:', userError)

    // If user doesn't exist in app_users, try to sync them
    if (userError && userError.code === 'PGRST116') {
      console.log('7. User not found in app_users, attempting sync:')
      const { data: syncData, error: syncError } = await supabase.rpc('ensure_user_exists', { user_id: user.id })
      console.log('   Sync Data:', syncData)
      console.log('   Sync Error:', syncError)

      // Try fetching user again after sync
      if (!syncError) {
        const { data: userData2, error: userError2 } = await supabase
          .from('app_users')
          .select('id, full_name, company_email')
          .eq('id', user.id)
          .single()

        console.log('   User Data After Sync:', userData2)
        console.log('   User Error After Sync:', userError2)
      }
    }

  } catch (error) {
    console.error('Debug error:', error)
  }

  console.log('=== End Debug ===')
}

// Call this function in the browser console to debug
// You can also add it to the Products page temporarily
if (typeof window !== 'undefined') {
  (window as any).debugProductsRLS = debugProductsRLS
}