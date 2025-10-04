/**
 * SUPER SIMPLE DAILY TASK AUTO-CREATION
 *
 * This runs from the frontend when user opens the app.
 * Simulates midnight creation by checking the date.
 *
 * How it works:
 * 1. Check localStorage: "What was the last date we created tasks?"
 * 2. If today's date is different → Create new tasks
 * 3. If same date → Skip (already created today)
 */

import { supabase } from '@/integrations/supabase/client';

const LAST_CREATION_DATE_KEY = 'daily_tasks_last_created_date';

/**
 * Get today's date as YYYY-MM-DD string
 */
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Check if we already created tasks today
 */
function tasksCreatedToday(): boolean {
  const lastCreatedDate = localStorage.getItem(LAST_CREATION_DATE_KEY);
  const today = getTodayString();

  console.log('📅 Last created date:', lastCreatedDate);
  console.log('📅 Today:', today);

  return lastCreatedDate === today;
}

/**
 * Mark that we created tasks today
 */
function markTasksCreatedToday(): void {
  const today = getTodayString();
  localStorage.setItem(LAST_CREATION_DATE_KEY, today);
  console.log('✅ Marked tasks created for:', today);
}

/**
 * Main function: Auto-create daily tasks if needed
 * Call this when app loads
 */
export async function autoCreateDailyTasksIfNeeded(): Promise<void> {
  try {
    // Check if we already created today
    if (tasksCreatedToday()) {
      console.log('⏭️ Daily tasks already created today, skipping...');
      return;
    }

    console.log('🔄 Creating daily tasks for today...');

    // Call existing database function
    const { data, error } = await supabase.rpc('create_todays_daily_tasks');

    if (error) {
      console.error('❌ Error creating daily tasks:', error);

      // If function doesn't exist, try the user-specific one
      console.log('⚠️ Trying user-specific function...');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user logged in, skipping task creation');
        return;
      }

      const { data: profile } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile) {
        console.log('No user profile found');
        return;
      }

      const { data: userData, error: userError } = await supabase.rpc(
        'create_daily_task_instances_for_user',
        {
          user_id: profile.id,
          target_date: getTodayString()
        }
      );

      if (userError) {
        console.error('❌ User-specific function also failed:', userError);
        return;
      }

      console.log('✅ Daily tasks created (user-specific):', userData);
      markTasksCreatedToday();
      return;
    }

    console.log('✅ Daily tasks created:', data);
    console.log(`   - Created: ${data?.instances_created || 0}`);
    console.log(`   - Templates: ${data?.templates_found || 0}`);
    console.log(`   - Expired: ${data?.expired_tasks || 0}`);

    // Mark that we created today
    markTasksCreatedToday();

  } catch (error) {
    console.error('❌ Exception in autoCreateDailyTasksIfNeeded:', error);
  }
}

/**
 * Force create tasks (bypass date check)
 * Useful for testing or manual refresh
 */
export async function forceCreateDailyTasks(): Promise<void> {
  console.log('🔄 Force creating daily tasks...');

  try {
    const { data, error } = await supabase.rpc('create_todays_daily_tasks');

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('✅ Force created:', data);
    markTasksCreatedToday();

  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

/**
 * Reset the creation flag (for testing)
 * This makes the system think tasks haven't been created today
 */
export function resetDailyTaskFlag(): void {
  localStorage.removeItem(LAST_CREATION_DATE_KEY);
  console.log('🔄 Daily task flag reset - next load will create tasks');
}

/**
 * Check when tasks were last created
 */
export function getLastCreationDate(): string | null {
  return localStorage.getItem(LAST_CREATION_DATE_KEY);
}
