import { useEffect, useCallback } from 'react';
import { useUserProfile } from './useUserProfile';
import { useUserAttendanceStatus } from './useUserAttendanceStatus';

/**
 * Hook to handle daily task instance creation
 * Creates daily task instances when user checks in (if already checked in)
 */
export const useDailyTaskRecurrence = (onTasksCreated?: () => void) => {
  const { profile } = useUserProfile();
  const { isPresent, attendanceRecord } = useUserAttendanceStatus();

  const createDailyTaskInstances = useCallback(async (targetDate?: string) => {
    if (!profile?.appUser?.id) {
      return;
    }

    try {
      const { supabase } = await import('@/integrations/supabase/client');

      // Get target date in YYYY-MM-DD format (default to today)
      const date = targetDate || new Date().toISOString().split('T')[0];

      // Call the database function to create daily task instances for this specific user
      const { data, error } = await supabase.rpc('create_daily_task_instances_for_user', {
        user_id: profile.appUser.id,
        target_date: date
      });

      if (error) {
        console.error('Error creating daily task instances:', error);
      } else {
        // Trigger callback to refresh task data if instances were created
        if (data?.instances_created > 0 && onTasksCreated) {
          onTasksCreated();
        }
      }
    } catch (error) {
      console.error('Exception in createDailyTaskInstances:', error);
    }
  }, [profile?.appUser?.id, onTasksCreated]);

  // Create daily task instances when user is already checked in (page load scenario)
  useEffect(() => {
    if (profile?.appUser?.id && isPresent && attendanceRecord) {
      const checkInTime = new Date(attendanceRecord.check_in_time);

      // Check if check-in was today
      const checkInDate = checkInTime.toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];

      if (checkInDate === today) {
        createDailyTaskInstances(); // Ensure daily task instances exist for today
      }
    }
  }, [profile?.appUser?.id, isPresent, attendanceRecord, createDailyTaskInstances]);

  return {
    createDailyTaskInstances
  };
};