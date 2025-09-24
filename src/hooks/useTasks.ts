import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import {
  Task,
  TaskWithDetails,
  TaskInsert,
  TaskUpdate,
  TaskFilters,
  TaskSort,
  BulkTaskAction,
  TaskResponse,
  UseTasksReturn,
  TaskError,
  TaskStatus,
} from '@/types/tasks';

export function useTasks(initialFilters: TaskFilters = {}): UseTasksReturn {
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<TaskError | null>(null);
  const [filters, setFiltersState] = useState<TaskFilters>(initialFilters);
  const [sort, setSortState] = useState<TaskSort>({
    field: 'due_date',
    direction: 'asc',
  });

  const { toast } = useToast();

  const setFilters = useCallback((newFilters: Partial<TaskFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const setSort = useCallback((newSort: TaskSort) => {
    setSortState(newSort);
  }, []);

  const buildQuery = useCallback(() => {
    let query = supabase
      .from('tasks')
      .select(`
        *,
        template:task_templates(*),
        assigned_user:app_users!tasks_assigned_to_fkey(id, full_name, role, department, employee_id),
        assigned_by_user:app_users!tasks_assigned_by_fkey(id, full_name),
        reviewer:app_users!tasks_reviewer_id_fkey(id, full_name, role),
        submissions:task_submissions(*),
        reviews:task_reviews(*)
      `);

    // Apply filters
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters.type && filters.type !== 'all') {
      query = query.eq('task_type', filters.type);
    }

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.priority && filters.priority !== 'all') {
      query = query.eq('priority', filters.priority);
    }

    if (filters.assignee && filters.assignee !== 'all') {
      query = query.eq('assigned_to', filters.assignee);
    }

    if (filters.reviewer && filters.reviewer !== 'all') {
      query = query.eq('reviewer_id', filters.reviewer);
    }

    if (filters.dateRange) {
      query = query
        .gte('due_date', filters.dateRange.start.toISOString().split('T')[0])
        .lte('due_date', filters.dateRange.end.toISOString().split('T')[0]);
    }

    if (filters.isLate) {
      query = query.eq('is_late', true);
    }

    if (filters.needsReview) {
      query = query.in('status', [TaskStatus.SUBMITTED_FOR_REVIEW]);
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }

    // Apply sorting
    const orderColumn = sort.field === 'due_date' ? 'due_date' : sort.field;
    query = query.order(orderColumn, { ascending: sort.direction === 'asc' });

    return query;
  }, [filters, sort]);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await buildQuery();

      if (queryError) {
        throw new Error(queryError.message);
      }

      // Process the data to add latest submission and review
      const processedTasks: TaskWithDetails[] = (data || []).map(task => ({
        ...task,
        latest_submission: task.submissions?.length
          ? task.submissions.sort((a, b) =>
              new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
            )[0]
          : null,
        latest_review: task.reviews?.length
          ? task.reviews.sort((a, b) =>
              new Date(b.reviewed_at).getTime() - new Date(a.reviewed_at).getTime()
            )[0]
          : null,
      }));

      setTasks(processedTasks);
    } catch (err) {
      const error: TaskError = {
        code: 'FETCH_ERROR',
        message: err instanceof Error ? err.message : 'Failed to fetch tasks',
      };
      setError(error);
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  const createTask = useCallback(async (taskData: TaskInsert): Promise<TaskResponse<Task>> => {
    try {
      const { data, error: insertError } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      toast({
        title: "Success",
        description: "Task created successfully",
      });

      // Refresh tasks list
      fetchTasks();

      return { data };
    } catch (err) {
      const error: TaskError = {
        code: 'CREATE_ERROR',
        message: err instanceof Error ? err.message : 'Failed to create task',
      };

      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });

      return { error };
    }
  }, [fetchTasks, toast]);

  const updateTask = useCallback(async (id: string, updates: TaskUpdate): Promise<TaskResponse<Task>> => {
    try {
      const { data, error: updateError } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      toast({
        title: "Success",
        description: "Task updated successfully",
      });

      // Refresh tasks list
      fetchTasks();

      return { data };
    } catch (err) {
      const error: TaskError = {
        code: 'UPDATE_ERROR',
        message: err instanceof Error ? err.message : 'Failed to update task',
      };

      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });

      return { error };
    }
  }, [fetchTasks, toast]);

  const deleteTask = useCallback(async (id: string): Promise<TaskResponse> => {
    try {
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      toast({
        title: "Success",
        description: "Task deleted successfully",
      });

      // Refresh tasks list
      fetchTasks();

      return {};
    } catch (err) {
      const error: TaskError = {
        code: 'DELETE_ERROR',
        message: err instanceof Error ? err.message : 'Failed to delete task',
      };

      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });

      return { error };
    }
  }, [fetchTasks, toast]);

  const bulkAction = useCallback(async (action: BulkTaskAction): Promise<TaskResponse> => {
    try {
      let result;

      switch (action.type) {
        case 'assign':
          if (!action.data?.assignee_id) {
            throw new Error('Assignee ID is required for assignment');
          }
          result = await supabase
            .from('tasks')
            .update({ assigned_to: action.data.assignee_id })
            .in('id', action.task_ids);
          break;

        case 'approve':
          // Bulk approve daily tasks
          result = await supabase
            .from('tasks')
            .update({ status: TaskStatus.APPROVED })
            .in('id', action.task_ids)
            .eq('task_type', 'daily');
          break;

        case 'reject':
          if (!action.data?.notes) {
            throw new Error('Notes are required for rejection');
          }
          result = await supabase
            .from('tasks')
            .update({ status: TaskStatus.REJECTED })
            .in('id', action.task_ids);
          break;

        case 'change_status':
          if (!action.data?.status) {
            throw new Error('Status is required');
          }
          result = await supabase
            .from('tasks')
            .update({ status: action.data.status })
            .in('id', action.task_ids);
          break;

        case 'change_priority':
          if (!action.data?.priority) {
            throw new Error('Priority is required');
          }
          result = await supabase
            .from('tasks')
            .update({ priority: action.data.priority })
            .in('id', action.task_ids);
          break;

        case 'delete':
          result = await supabase
            .from('tasks')
            .delete()
            .in('id', action.task_ids);
          break;

        default:
          throw new Error('Invalid bulk action type');
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      toast({
        title: "Success",
        description: `Bulk ${action.type} completed successfully`,
      });

      // Refresh tasks list
      fetchTasks();

      return {};
    } catch (err) {
      const error: TaskError = {
        code: 'BULK_ACTION_ERROR',
        message: err instanceof Error ? err.message : 'Failed to perform bulk action',
      };

      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });

      return { error };
    }
  }, [fetchTasks, toast]);

  const refetch = useCallback(() => fetchTasks(), [fetchTasks]);

  // Fetch tasks when filters or sort change
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        () => {
          // Refetch tasks when there are changes
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTasks]);

  return {
    tasks,
    loading,
    error,
    filters,
    sort,
    setFilters,
    setSort,
    refetch,
    createTask,
    updateTask,
    deleteTask,
    bulkAction,
  };
}

// Hook for task templates
export function useTaskTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<TaskError | null>(null);

  const { toast } = useToast();

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('task_templates')
        .select(`
          *,
          created_by_user:app_users!task_templates_created_by_fkey(id, full_name),
          reviewer_user:app_users!task_templates_reviewer_user_id_fkey(id, full_name, role)
        `)
        .eq('is_active', true)
        .order('title');

      if (queryError) {
        throw new Error(queryError.message);
      }

      setTemplates(data || []);
    } catch (err) {
      const error: TaskError = {
        code: 'FETCH_TEMPLATES_ERROR',
        message: err instanceof Error ? err.message : 'Failed to fetch templates',
      };
      setError(error);
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    loading,
    error,
    refetch: fetchTemplates,
  };
}