import { supabase } from '@/integrations/supabase/client';

/**
 * Utility functions for managing daily task recurrence
 */

/**
 * Create daily task instances for a specific user and date
 */
export const createDailyTasksForUser = async (userId: string, targetDate?: string) => {
  try {
    const date = targetDate || new Date().toISOString().split('T')[0];

    console.log('🔄 Creating daily task instances for user:', userId, 'on date:', date);

    const { data, error } = await supabase.rpc('create_daily_task_instances_for_user', {
      user_id: userId,
      target_date: date
    });

    if (error) {
      console.error('❌ Error creating daily task instances:', error);
      throw error;
    }

    console.log('✅ Daily task instances created successfully - Created:', data?.instances_created, 'from', data?.templates_found, 'templates');
    return { success: true, data };
  } catch (error) {
    console.error('❌ Exception in createDailyTasksForUser:', error);
    return { success: false, error };
  }
};

/**
 * Check if a user has daily task instances for a specific date
 */
export const checkDailyTasksExist = async (userId: string, targetDate?: string) => {
  try {
    const date = targetDate || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, instance_date, is_recurring_instance')
      .eq('assigned_to', userId)
      .eq('task_type', 'daily')
      .eq('is_recurring_instance', true)
      .eq('instance_date', date);

    if (error) {
      console.error('❌ Error checking daily task instances:', error);
      throw error;
    }

    return {
      exists: data.length > 0,
      count: data.length,
      tasks: data
    };
  } catch (error) {
    console.error('❌ Exception in checkDailyTasksExist:', error);
    return { exists: false, count: 0, tasks: [], error };
  }
};

/**
 * Get all daily task templates for a user
 */
export const getUserDailyTemplates = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, description, priority, evidence_required')
      .eq('assigned_to', userId)
      .eq('task_type', 'daily')
      .eq('is_recurring_instance', false); // Only templates

    if (error) {
      console.error('❌ Error fetching daily task templates:', error);
      throw error;
    }

    return {
      success: true,
      templates: data
    };
  } catch (error) {
    console.error('❌ Exception in getUserDailyTemplates:', error);
    return { success: false, templates: [], error };
  }
};

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