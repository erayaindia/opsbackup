import { useState, useEffect, useCallback } from 'react';
import { useUserProfile } from './useUserProfile';

interface DailyTaskManager {
  ensureDailyTasks: () => Promise<void>;
  checkDailyTasksStatus: () => Promise<DailyTaskStatus>;
  loading: boolean;
  error: string | null;
}

interface DailyTaskStatus {
  hasTemplates: boolean;
  hasInstances: boolean;
  templateCount: number;
  instanceCount: number;
  lastCheck: Date;
}

export const useDailyTaskManager = (onTasksCreated?: () => void): DailyTaskManager => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useUserProfile();

  const checkDailyTasksStatus = useCallback(async (): Promise<DailyTaskStatus> => {
    if (!profile?.appUser?.id) {
      throw new Error('No user profile available');
    }

    const { supabase } = await import('@/integrations/supabase/client');
    const today = new Date().toISOString().split('T')[0];

    try {
      // Check for daily task templates
      const { data: templates, error: templatesError } = await supabase
        .from('tasks')
        .select('id')
        .eq('assigned_to', profile.appUser.id)
        .eq('task_type', 'daily')
        .eq('is_recurring_instance', false)
        .neq('status', 'archived');

      if (templatesError) {
        throw new Error(`Template check failed: ${templatesError.message}`);
      }

      // Check for today's daily task instances
      const { data: instances, error: instancesError } = await supabase
        .from('tasks')
        .select('id')
        .eq('assigned_to', profile.appUser.id)
        .eq('task_type', 'daily')
        .eq('is_recurring_instance', true)
        .eq('instance_date', today);

      if (instancesError) {
        throw new Error(`Instance check failed: ${instancesError.message}`);
      }

      return {
        hasTemplates: templates.length > 0,
        hasInstances: instances.length > 0,
        templateCount: templates.length,
        instanceCount: instances.length,
        lastCheck: new Date()
      };
    } catch (err) {
      throw err;
    }
  }, [profile?.appUser?.id]);

  const ensureDailyTasks = useCallback(async (): Promise<void> => {
    if (!profile?.appUser?.id) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const today = new Date().toISOString().split('T')[0];

      // First check if we need to create instances
      const status = await checkDailyTasksStatus();

      if (!status.hasTemplates) {
        setError('No daily task templates configured for this user');
        return;
      }

      if (status.hasInstances) {
        return;
      }

      // Create daily task instances
      const { data, error } = await supabase.rpc('create_daily_task_instances_for_user', {
        user_id: profile.appUser.id,
        target_date: today
      });

      if (error) {
        throw new Error(`Failed to create daily task instances: ${error.message}`);
      }

      const instancesCreated = data?.instances_created || 0;

      if (instancesCreated > 0) {
        onTasksCreated?.();
      }

      // Verify instances were created
      const finalStatus = await checkDailyTasksStatus();
      if (!finalStatus.hasInstances) {
        throw new Error('Daily task instances were not created successfully');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Failed to ensure daily tasks:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [profile?.appUser?.id, onTasksCreated, checkDailyTasksStatus]);

  // Auto-ensure daily tasks when user profile loads (simulating 12am creation)
  useEffect(() => {
    if (!profile?.appUser?.id) {
      return;
    }

    // Add a small delay to ensure database is ready
    const timer = setTimeout(() => {
      ensureDailyTasks().catch(() => {
        // Silently handle auto-creation failures
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [profile?.appUser?.id, ensureDailyTasks]);

  // Retry mechanism for failed attempts
  useEffect(() => {
    if (error && profile?.appUser?.id) {
      const retryTimer = setTimeout(() => {
        ensureDailyTasks().catch(() => {
          // Silently handle retry failures
        });
      }, 30000); // Retry after 30 seconds

      return () => clearTimeout(retryTimer);
    }
  }, [error, profile?.appUser?.id, ensureDailyTasks]);

  return {
    ensureDailyTasks,
    checkDailyTasksStatus,
    loading,
    error
  };
};