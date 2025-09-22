import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { EditorContent } from '@/components/editor-types';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  Task,
  TaskInsert,
  TaskTemplate,
  TaskWithDetails,
  CreateTaskFromTemplate,
  TaskTypeValue,
  TaskPriorityValue,
  EvidenceTypeValue,
} from '@/types/tasks';

export interface CreateTaskData {
  title: string;
  description?: EditorContent | string;
  taskType: TaskTypeValue;
  priority: TaskPriorityValue;
  evidenceRequired: EvidenceTypeValue;
  dueDate: string;
  dueTime?: string;
  dueDateTime?: string;
  assignedTo: string[];
  reviewerId?: string;
  tags?: string[];
  checklistItems?: Array<{ text: string; required: boolean }>;
}

export function useTaskCreation() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { profile } = useUserProfile();

  const createTask = useCallback(async (taskData: CreateTaskData): Promise<Task[]> => {
    if (!profile?.appUser?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return [];
    }

    try {
      setLoading(true);

      const createdTasks: Task[] = [];

      // Create a task for each assigned user
      for (const userId of taskData.assignedTo) {
        // Handle description - serialize rich content to JSON string
        const description = taskData.description
          ? (typeof taskData.description === 'string'
             ? taskData.description
             : JSON.stringify(taskData.description))
          : null;

        const taskInsert: TaskInsert = {
          title: taskData.title,
          description: description,
          task_type: taskData.taskType,
          priority: taskData.priority,
          evidence_required: taskData.evidenceRequired,
          due_date: taskData.dueDate,
          due_time: taskData.dueTime || null,
          due_datetime: taskData.dueDateTime || null,
          assigned_to: userId,
          assigned_by: profile.appUser.id,
          reviewer_id: taskData.reviewerId || null,
          tags: taskData.tags || [],
          checklist_items: taskData.checklistItems ? JSON.stringify(taskData.checklistItems) : null,
          status: 'pending',
        };

        const { data: task, error } = await supabase
          .from('tasks')
          .insert(taskInsert)
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to create task for user ${userId}: ${error.message}`);
        }

        createdTasks.push(task);
      }

      toast({
        title: "Success",
        description: `${createdTasks.length} task(s) created successfully`,
      });

      return createdTasks;
    } catch (error) {
      console.error('Error creating tasks:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create tasks",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [profile, toast]);

  const createTaskFromTemplate = useCallback(async (
    templateData: CreateTaskFromTemplate
  ): Promise<Task[]> => {
    if (!profile?.appUser?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return [];
    }

    try {
      setLoading(true);

      // Get the template
      const { data: template, error: templateError } = await supabase
        .from('task_templates')
        .select('*')
        .eq('id', templateData.template_id)
        .eq('is_active', true)
        .single();

      if (templateError || !template) {
        throw new Error('Template not found or inactive');
      }

      const createdTasks: Task[] = [];

      // Create tasks for each assigned user
      for (const userId of templateData.assigned_to) {
        const taskInsert: TaskInsert = {
          template_id: template.id,
          title: template.title,
          description: template.description,
          task_type: template.task_type,
          priority: templateData.override_priority || template.priority,
          evidence_required: template.evidence_required,
          due_date: templateData.due_date || new Date().toISOString().split('T')[0],
          due_time: templateData.due_time || template.due_time,
          due_datetime: templateData.due_datetime || null,
          assigned_to: userId,
          assigned_by: profile.appUser.id,
          reviewer_id: templateData.override_reviewer || template.reviewer_user_id,
          tags: template.tags || [],
          checklist_items: template.checklist_items,
          status: 'pending',
        };

        // Add additional notes if provided
        if (templateData.additional_notes) {
          taskInsert.description = `${taskInsert.description || ''}\n\nAdditional Notes: ${templateData.additional_notes}`.trim();
        }

        const { data: task, error } = await supabase
          .from('tasks')
          .insert(taskInsert)
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to create task for user ${userId}: ${error.message}`);
        }

        createdTasks.push(task);
      }

      toast({
        title: "Success",
        description: `${createdTasks.length} task(s) created from template`,
      });

      return createdTasks;
    } catch (error) {
      console.error('Error creating tasks from template:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create tasks from template",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [profile, toast]);

  const createDailyTasks = useCallback(async (
    date: string,
    userIds?: string[]
  ): Promise<Task[]> => {
    if (!profile?.appUser?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return [];
    }

    try {
      setLoading(true);

      // Get all active daily task templates
      const { data: templates, error: templatesError } = await supabase
        .from('task_templates')
        .select('*')
        .eq('task_type', 'daily')
        .eq('is_active', true);

      if (templatesError) {
        throw new Error(templatesError.message);
      }

      if (!templates || templates.length === 0) {
        toast({
          title: "Info",
          description: "No active daily task templates found",
        });
        return [];
      }

      const createdTasks: Task[] = [];

      // Get users to assign tasks to
      let targetUsers: string[] = [];
      if (userIds && userIds.length > 0) {
        targetUsers = userIds;
      } else {
        // Get all active users if no specific users provided
        const { data: users, error: usersError } = await supabase
          .from('app_users')
          .select('id')
          .eq('status', 'active');

        if (usersError) {
          throw new Error(usersError.message);
        }

        targetUsers = users?.map(u => u.id) || [];
      }

      // Create tasks for each template and user combination
      for (const template of templates) {
        // Filter users based on template's role access if specified
        let eligibleUsers = targetUsers;
        if (template.auto_assign_roles && template.auto_assign_roles.length > 0) {
          const { data: roleUsers } = await supabase
            .from('app_users')
            .select('id')
            .in('role', template.auto_assign_roles)
            .in('id', targetUsers);

          eligibleUsers = roleUsers?.map(u => u.id) || [];
        }

        for (const userId of eligibleUsers) {
          // Check if task already exists for this user and date
          const { data: existingTask } = await supabase
            .from('tasks')
            .select('id')
            .eq('template_id', template.id)
            .eq('assigned_to', userId)
            .eq('due_date', date)
            .single();

          if (existingTask) {
            continue; // Skip if task already exists
          }

          const taskInsert: TaskInsert = {
            template_id: template.id,
            title: template.title,
            description: template.description,
            task_type: 'daily',
            priority: template.priority,
            evidence_required: template.evidence_required,
            due_date: date,
            due_time: template.due_time,
            assigned_to: userId,
            assigned_by: profile.appUser.id,
            reviewer_id: template.reviewer_user_id,
            tags: template.tags || [],
            checklist_items: template.checklist_items,
            status: 'pending',
          };

          const { data: task, error } = await supabase
            .from('tasks')
            .insert(taskInsert)
            .select()
            .single();

          if (error) {
            console.error(`Failed to create daily task for user ${userId}:`, error);
            continue; // Continue with other tasks
          }

          createdTasks.push(task);
        }
      }

      toast({
        title: "Success",
        description: `${createdTasks.length} daily task(s) created for ${date}`,
      });

      return createdTasks;
    } catch (error) {
      console.error('Error creating daily tasks:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create daily tasks",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [profile, toast]);

  const duplicateTask = useCallback(async (
    originalTask: TaskWithDetails,
    newAssignees: string[],
    newDueDate?: string
  ): Promise<Task[]> => {
    if (!profile?.appUser?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return [];
    }

    try {
      setLoading(true);

      const createdTasks: Task[] = [];

      for (const userId of newAssignees) {
        const taskInsert: TaskInsert = {
          template_id: originalTask.template_id,
          title: originalTask.title,
          description: originalTask.description,
          task_type: originalTask.task_type,
          priority: originalTask.priority,
          evidence_required: originalTask.evidence_required,
          due_date: newDueDate || originalTask.due_date,
          due_time: originalTask.due_time,
          due_datetime: originalTask.due_datetime,
          assigned_to: userId,
          assigned_by: profile.appUser.id,
          reviewer_id: originalTask.reviewer_id,
          tags: originalTask.tags || [],
          checklist_items: originalTask.checklist_items,
          status: 'pending',
        };

        const { data: task, error } = await supabase
          .from('tasks')
          .insert(taskInsert)
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to duplicate task for user ${userId}: ${error.message}`);
        }

        createdTasks.push(task);
      }

      toast({
        title: "Success",
        description: `Task duplicated for ${createdTasks.length} user(s)`,
      });

      return createdTasks;
    } catch (error) {
      console.error('Error duplicating task:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to duplicate task",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [profile, toast]);

  return {
    loading,
    createTask,
    createTaskFromTemplate,
    createDailyTasks,
    duplicateTask,
  };
}