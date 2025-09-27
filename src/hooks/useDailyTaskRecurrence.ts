import { useEffect, useCallback } from 'react';
import { useUserProfile } from './useUserProfile';

/**
 * Hook to ensure daily task instances exist for today
 * Simulates 12am auto-creation by checking when user opens the app
 */
export const useDailyTaskRecurrence = (onTasksCreated?: () => void) => {
  const { profile } = useUserProfile();

  const ensureDailyTasksForToday = useCallback(async () => {
    if (!profile?.appUser?.id) {
      return;
    }

    try {
      const { supabase } = await import('@/integrations/supabase/client');

      // Call the simplified function to create today's daily tasks
      const { data, error } = await supabase.rpc('create_todays_daily_tasks');

      if (error) {
        console.error('⚠️ Daily task function not found (database functions not set up yet):', error);
        // Function doesn't exist yet - that's ok, templates will still show
        return;
      }

      console.log(`✅ Daily tasks: ${data?.instances_created || 0} created, ${data?.templates_found || 0} templates, ${data?.expired_tasks || 0} expired`);

      // Trigger refresh if tasks were created
      if (data?.instances_created > 0 && onTasksCreated) {
        onTasksCreated();
      }
    } catch (error) {
      console.error('Exception in ensureDailyTasksForToday:', error);
    }
  }, [profile?.appUser?.id, onTasksCreated]);

  // Ensure daily tasks exist when user opens the app (simulating 12am creation)
  useEffect(() => {
    if (profile?.appUser?.id) {
      ensureDailyTasksForToday();
    }
  }, [profile?.appUser?.id, ensureDailyTasksForToday]);

  return {
    ensureDailyTasksForToday
  };
};