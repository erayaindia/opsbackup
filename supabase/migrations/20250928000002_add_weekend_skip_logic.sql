-- Phase 3: Add weekend skip logic to main daily task creation function
-- Update auto_create_daily_tasks_for_date to skip Sundays

CREATE OR REPLACE FUNCTION auto_create_daily_tasks_for_date(target_date DATE DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE)
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
    -- Phase 3: Skip weekends - do not create tasks on Sundays (DOW = 0)
    -- Uses IST timezone for day-of-week calculation
    IF EXTRACT(DOW FROM target_date) = 0 THEN
        RAISE NOTICE 'Skipping daily task creation on Sunday (IST): %', target_date;
        RETURN QUERY SELECT 0, 0, 0;
        RETURN;
    END IF;

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
                target_date,                    -- Use creation date as due_date
                template_record.due_time,       -- Preserve template due_time
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
    RAISE NOTICE 'Auto-created % daily task instances from % templates, expired % old tasks for date % (weekday)',
                 instance_count, template_count, expired_count, target_date;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION auto_create_daily_tasks_for_date(DATE) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION auto_create_daily_tasks_for_date(DATE) IS 'Automatically creates daily task instances for all users for the specified date. Skips Sundays (Phase 3). Meant to be called at 12am daily.';