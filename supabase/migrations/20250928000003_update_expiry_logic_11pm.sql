-- Phase 4: Update auto-expiry logic - tasks expire at 11 PM IST and become 'incomplete'
-- Update both main functions to mark tasks as 'incomplete' instead of 'expired'

-- Drop existing functions first (required to change return type)
DROP FUNCTION IF EXISTS auto_create_daily_tasks_for_date(DATE);
DROP FUNCTION IF EXISTS create_todays_daily_tasks();

-- Update main function: auto_create_daily_tasks_for_date
CREATE OR REPLACE FUNCTION auto_create_daily_tasks_for_date(target_date DATE DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE)
RETURNS TABLE(
    total_instances_created INTEGER,
    total_templates_processed INTEGER,
    total_marked_incomplete INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    template_record RECORD;
    instance_count INTEGER := 0;
    template_count INTEGER := 0;
    incomplete_count INTEGER := 0;
BEGIN
    -- Phase 3: Skip weekends - do not create tasks on Sundays (DOW = 0)
    -- Uses IST timezone for day-of-week calculation
    IF EXTRACT(DOW FROM target_date) = 0 THEN
        RAISE NOTICE 'Skipping daily task creation on Sunday (IST): %', target_date;
        RETURN QUERY SELECT 0, 0, 0;
        RETURN;
    END IF;

    -- Phase 4: Mark incomplete daily tasks as 'incomplete' after 11 PM IST
    -- Tasks expire at 11 PM IST on their creation date (instance_date)
    UPDATE tasks
    SET status = 'incomplete'
    WHERE task_type = 'daily'
      AND is_recurring_instance = true
      AND (
          -- Either task is from previous date
          instance_date < target_date
          OR
          -- Or task is from today but it's after 11 PM IST
          (instance_date = target_date AND (NOW() AT TIME ZONE 'Asia/Kolkata')::TIME >= '23:00:00'::TIME)
      )
      AND status IN ('pending', 'in_progress', 'submitted_for_review');

    GET DIAGNOSTICS incomplete_count = ROW_COUNT;

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
    RETURN QUERY SELECT instance_count, template_count, incomplete_count;

    -- Log the result
    RAISE NOTICE 'Auto-created % daily task instances from % templates, marked % tasks incomplete (after 11 PM IST) for date %',
                 instance_count, template_count, incomplete_count, target_date;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION auto_create_daily_tasks_for_date(DATE) TO authenticated;

-- Update helper function: create_todays_daily_tasks
CREATE OR REPLACE FUNCTION create_todays_daily_tasks()
RETURNS TABLE(
    instances_created INTEGER,
    templates_found INTEGER,
    marked_incomplete INTEGER
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

-- Add helpful comments
COMMENT ON FUNCTION auto_create_daily_tasks_for_date(DATE) IS 'Automatically creates daily task instances for all users for the specified date. Tasks expire at 11 PM IST and become incomplete (Phase 4). Skips Sundays (Phase 3). Meant to be called at 12am daily.';
COMMENT ON FUNCTION create_todays_daily_tasks() IS 'Manually trigger creation of daily task instances for today with 11 PM IST expiry logic.';