import { supabase } from '@/integrations/supabase/client'
import { createClient } from '@supabase/supabase-js'

export async function debugOnboardingIssues() {
  console.log('🔍 Debugging onboarding issues...')
  
  // 1. Check environment variables
  console.log('📋 Environment variables:')
  console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing')
  console.log('VITE_SUPABASE_PUBLISHABLE_KEY:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing')
  console.log('VITE_SUPABASE_SERVICE_ROLE_KEY:', import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing')
  
  // 2. Test basic connection
  try {
    const { data: connectionTest, error: connectionError } = await supabase
      .from('app_users')
      .select('count(*)')
      .limit(1)
      
    if (connectionError) {
      console.log('❌ Basic connection failed:', connectionError.message)
    } else {
      console.log('✅ Basic Supabase connection works')
    }
  } catch (error) {
    console.log('❌ Connection error:', error)
  }
  
  // 3. Check if employees_details table exists
  try {
    const { data: tableCheck, error: tableError } = await supabase
      .from('employees_details')
      .select('count(*)')
      .limit(1)
      
    if (tableError) {
      console.log('❌ employees_details table issue:', tableError.message)
      if (tableError.message.includes('relation "employees_details" does not exist')) {
        console.log('💡 The employees_details table does not exist in your database')
        console.log('💡 You need to create this table or run migrations')
      }
      if (tableError.message.includes('permission denied')) {
        console.log('💡 Permission denied - check Row Level Security policies')
      }
    } else {
      console.log('✅ employees_details table exists and is accessible')
      console.log('📊 Table has records:', tableCheck)
    }
  } catch (error) {
    console.log('❌ Table check error:', error)
  }
  
  // 4. Test admin client creation
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    
    if (!serviceRoleKey) {
      console.log('❌ Service Role Key is missing - this is why it falls back to mock data!')
      return
    }
    
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
    
    // Test admin client
    const { data: adminTest, error: adminError } = await adminClient
      .from('employees_details')
      .select('count(*)')
      .limit(1)
      
    if (adminError) {
      console.log('❌ Admin client failed:', adminError.message)
    } else {
      console.log('✅ Admin client works')
    }
    
  } catch (error) {
    console.log('❌ Admin client error:', error)
  }
  
  // 5. Show actual data if available
  try {
    const { data: actualData, error: dataError } = await supabase
      .from('employees_details')
      .select('id, full_name, personal_email, status')
      .limit(5)
      
    if (dataError) {
      console.log('❌ Could not fetch sample data:', dataError.message)
    } else {
      console.log('📄 Sample data from employees_details:')
      console.table(actualData)
    }
  } catch (error) {
    console.log('❌ Sample data error:', error)
  }
  
  console.log('🔍 Debug complete!')
}