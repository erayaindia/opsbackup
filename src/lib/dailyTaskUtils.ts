import { supabase } from '@/integrations/supabase/client';

/**
 * Utility functions for managing recurring task instances (daily, weekly, monthly)
 */

/**
 * Create recurring task instances for a specific user and date
 * Handles daily, weekly, and monthly tasks
 */
export const createRecurringTasksForUser = async (userId: string, targetDate?: string) => {
  try {
    const date = targetDate || new Date().toISOString().split('T')[0];

    console.log('🔄 Creating recurring task instances for user:', userId, 'on date:', date);

    const { data, error } = await supabase.rpc('create_recurring_task_instances_for_user', {
      user_id: userId,
      target_date: date
    });

    if (error) {
      console.error('❌ Error creating recurring task instances:', error);
      throw error;
    }

    console.log('✅ Recurring task instances created successfully - Created:', data?.instances_created, 'from', data?.templates_found, 'templates', '(Skipped:', data?.instances_skipped, ')');
    return { success: true, data };
  } catch (error) {
    console.error('❌ Exception in createRecurringTasksForUser:', error);
    return { success: false, error };
  }
};

/**
 * Legacy alias for backward compatibility
 * @deprecated Use createRecurringTasksForUser instead
 */
export const createDailyTasksForUser = createRecurringTasksForUser;

/**
 * Check if a user has recurring task instances for a specific date
 */
export const checkRecurringTasksExist = async (userId: string, targetDate?: string) => {
  try {
    const date = targetDate || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, task_type, instance_date, is_recurring_instance')
      .eq('assigned_to', userId)
      .in('task_type', ['daily', 'weekly', 'monthly'])
      .eq('is_recurring_instance', true)
      .eq('instance_date', date);

    if (error) {
      console.error('❌ Error checking recurring task instances:', error);
      throw error;
    }

    return {
      exists: data.length > 0,
      count: data.length,
      tasks: data
    };
  } catch (error) {
    console.error('❌ Exception in checkRecurringTasksExist:', error);
    return { exists: false, count: 0, tasks: [], error };
  }
};

/**
 * Legacy alias for backward compatibility
 * @deprecated Use checkRecurringTasksExist instead
 */
export const checkDailyTasksExist = checkRecurringTasksExist;

/**
 * Get all recurring task templates for a user
 */
export const getUserRecurringTemplates = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, description, task_type, priority, evidence_required, recurrence_pattern, recurrence_start_date, recurrence_end_date')
      .eq('assigned_to', userId)
      .in('task_type', ['daily', 'weekly', 'monthly'])
      .eq('is_recurring_instance', false); // Only templates

    if (error) {
      console.error('❌ Error fetching recurring task templates:', error);
      throw error;
    }

    return {
      success: true,
      templates: data
    };
  } catch (error) {
    console.error('❌ Exception in getUserRecurringTemplates:', error);
    return { success: false, templates: [], error };
  }
};

/**
 * Legacy alias for backward compatibility
 * @deprecated Use getUserRecurringTemplates instead
 */
export const getUserDailyTemplates = getUserRecurringTemplates;

/**
 * Get daily task completion history for a user
 */
export const getDailyTaskHistory = async (
  userId: string,
  fromDate?: string,
  toDate?: string
) => {
  try {
    const from = fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const to = toDate || new Date().toISOString().split('T')[0];

    console.log('📊 Fetching daily task history for user:', userId, 'from:', from, 'to:', to);

    const { data, error } = await supabase.rpc('get_daily_task_history', {
      user_id: userId,
      from_date: from,
      to_date: to
    });

    if (error) {
      console.error('❌ Error fetching daily task history:', error);
      throw error;
    }

    console.log('✅ Daily task history fetched successfully:', data?.length, 'entries');
    return {
      success: true,
      history: data
    };
  } catch (error) {
    console.error('❌ Exception in getDailyTaskHistory:', error);
    return { success: false, history: [], error };
  }
};