// Local test script to verify database constraint and functions
// Run with: node test_database_connection.js

import { createClient } from '@supabase/supabase-js';

// Read environment variables (you may need to set these)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  console.log('🧪 Testing Database Connection and Constraints...\n');

  try {
    // Test 1: Check if we can connect
    console.log('📡 Test 1: Database Connection');
    const { data, error } = await supabase.from('tasks').select('count').limit(1);
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return;
    }
    console.log('✅ Database connection successful\n');

    // Test 2: Test Sunday skip function
    console.log('📅 Test 2: Sunday Skip Logic');
    const { data: sundayData, error: sundayError } = await supabase
      .rpc('auto_create_daily_tasks_for_date', { target_date: '2025-09-28' });

    if (sundayError) {
      console.error('❌ Sunday test failed:', sundayError.message);
    } else {
      console.log('✅ Sunday result:', sundayData);
      if (sundayData.total_instances_created === 0) {
        console.log('✅ Sunday skip working correctly!');
      } else {
        console.log('⚠️ Sunday skip may not be working - tasks were created');
      }
    }

    // Test 3: Test Monday creation
    console.log('\n📅 Test 3: Monday Creation Logic');
    const { data: mondayData, error: mondayError } = await supabase
      .rpc('auto_create_daily_tasks_for_date', { target_date: '2025-09-29' });

    if (mondayError) {
      console.error('❌ Monday test failed:', mondayError.message);
    } else {
      console.log('✅ Monday result:', mondayData);
    }

    // Test 4: Check if incomplete status works
    console.log('\n🔍 Test 4: Incomplete Status Test');
    const { data: incompleteTest, error: incompleteError } = await supabase
      .from('tasks')
      .select('id, status')
      .eq('status', 'incomplete')
      .limit(1);

    if (incompleteError) {
      console.error('❌ Incomplete status constraint issue:', incompleteError.message);
      console.log('💡 You need to run the database constraint fix first!');
    } else {
      console.log('✅ Incomplete status constraint is working');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the tests
testDatabase();