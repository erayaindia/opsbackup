-- Simple Daily Task Auto-Creation System
-- Any task with task_type='daily' will auto-create instances at 12am

-- Create simple function to auto-create daily tasks for all users
CREATE OR REPLACE FUNCTION auto_create_daily_tasks_for_date(target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
    total_instances_created INTEGER,
    total_templates_processed INTEGER,
    total_expired INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    template_record RECORD;
    instance_count INTEGER := 0;
    template_count INTEGER := 0;
    expired_count INTEGER := 0;
BEGIN
    -- First, mark yesterday's incomplete daily tasks as expired
    UPDATE tasks
    SET status = 'expired'
    WHERE task_type = 'daily'
      AND is_recurring_instance = true
      AND instance_date = target_date - INTERVAL '1 day'
      AND status IN ('pending', 'in_progress', 'submitted_for_review');

    GET DIAGNOSTICS expired_count = ROW_COUNT;
    -- Get all daily task templates (tasks with task_type='daily' that are not instances)
    FOR template_record IN
        SELECT
            id, title, description, priority, evidence_required,
            assigned_to, assigned_by, reviewer_id, tags, checklist_items,
            due_time, template_id
        FROM tasks
        WHERE task_type = 'daily'
          AND (is_recurring_instance = false OR is_recurring_instance IS NULL)
          AND status != 'done_auto_approved'
    LOOP
        template_count := template_count + 1;

        -- Check if instance already exists for this template and date
        IF NOT EXISTS (
            SELECT 1 FROM tasks
            WHERE original_task_id = template_record.id
              AND instance_date = target_date
              AND is_recurring_instance = true
        ) THEN
            -- Create new daily task instance
            INSERT INTO tasks (
                title,
                description,
                task_type,
                status,
                priority,
                evidence_required,
                due_date,
                due_time,
                assigned_to,
                assigned_by,
                reviewer_id,
                tags,
                checklist_items,
                original_task_id,
                is_recurring_instance,
                instance_date,
                template_id,
                created_at,
                updated_at
            ) VALUES (
                template_record.title,
                template_record.description,
                'daily',
                'pending',
                template_record.priority,
                template_record.evidence_required,
                target_date,
                template_record.due_time,
                template_record.assigned_to,
                template_record.assigned_by,
                template_record.reviewer_id,
                template_record.tags,
                template_record.checklist_items,
                template_record.id,
                true,
                target_date,
                template_record.template_id,
                NOW(),
                NOW()
            );

            instance_count := instance_count + 1;
        END IF;
    END LOOP;

    -- Return results
    RETURN QUERY SELECT instance_count, template_count, expired_count;

    -- Log the result
    RAISE NOTICE 'Auto-created % daily task instances from % templates, expired % old tasks for date %',
                 instance_count, template_count, expired_count, target_date;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION auto_create_daily_tasks_for_date(DATE) TO authenticated;

-- Create function to manually trigger daily task creation for today
CREATE OR REPLACE FUNCTION create_todays_daily_tasks()
RETURNS TABLE(
    instances_created INTEGER,
    templates_found INTEGER,
    expired_tasks INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY SELECT * FROM auto_create_daily_tasks_for_date(CURRENT_DATE);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_todays_daily_tasks() TO authenticated;

-- Helper function to get daily tasks for a specific user and date
CREATE OR REPLACE FUNCTION get_user_daily_tasks_for_date(user_id UUID, target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
    task_id UUID,
    title TEXT,
    description TEXT,
    priority TEXT,
    status TEXT,
    evidence_required TEXT,
    due_time TEXT,
    is_template BOOLEAN,
    instance_date DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id as task_id,
        t.title,
        t.description,
        t.priority,
        t.status,
        t.evidence_required,
        t.due_time,
        (t.is_recurring_instance = false OR t.is_recurring_instance IS NULL) as is_template,
        t.instance_date
    FROM tasks t
    WHERE t.assigned_to = user_id
      AND t.task_type = 'daily'
      AND (
          -- Show today's instances
          (t.is_recurring_instance = true AND t.instance_date = target_date)
          OR
          -- Show templates if no instances exist yet
          ((t.is_recurring_instance = false OR t.is_recurring_instance IS NULL) AND NOT EXISTS (
              SELECT 1 FROM tasks instances
              WHERE instances.original_task_id = t.id
                AND instances.instance_date = target_date
          ))
      )
      AND t.status != 'archived'
    ORDER BY t.due_time NULLS LAST, t.created_at;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_daily_tasks_for_date(UUID, DATE) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION auto_create_daily_tasks_for_date(DATE) IS 'Automatically creates daily task instances for all users for the specified date. Meant to be called at 12am daily.';
COMMENT ON FUNCTION create_todays_daily_tasks() IS 'Manually trigger creation of daily task instances for today. Useful for testing or manual execution.';
COMMENT ON FUNCTION get_user_daily_tasks_for_date(UUID, DATE) IS 'Gets all daily tasks for a user on a specific date - either instances or templates if no instances exist.';