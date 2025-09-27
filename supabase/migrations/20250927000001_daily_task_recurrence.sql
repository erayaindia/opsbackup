-- Add support for daily task recurrence
-- This migration creates a function that automatically creates new instances of daily tasks

-- Add columns to track recurrence for tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS original_task_id UUID REFERENCES tasks(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_recurring_instance BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS last_recurrence_date DATE;

-- Create function to generate daily tasks for the next day
CREATE OR REPLACE FUNCTION create_daily_task_instances()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    task_record RECORD;
    new_due_date DATE;
    new_task_id UUID;
BEGIN
    -- Get tomorrow's date
    new_due_date := CURRENT_DATE + INTERVAL '1 day';

    -- Find all daily tasks that need to be recreated for tomorrow
    FOR task_record IN
        SELECT DISTINCT ON (t.id) t.*
        FROM tasks t
        WHERE t.task_type = 'daily'
          AND t.is_recurring_instance = false  -- Only use original daily tasks as templates
          AND NOT EXISTS (
              -- Check if task already exists for tomorrow
              SELECT 1 FROM tasks t2
              WHERE t2.original_task_id = t.id
                AND t2.due_date = new_due_date::text
          )
    LOOP
        -- Create new task instance for tomorrow
        INSERT INTO tasks (
            id,
            original_task_id,
            is_recurring_instance,
            template_id,
            title,
            description,
            task_type,
            priority,
            status,
            evidence_required,
            due_date,
            due_time,
            due_datetime,
            checklist_items,
            tags,
            assigned_to,
            assigned_by,
            reviewer_id,
            assigned_at,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            task_record.id,
            true,
            task_record.template_id,
            task_record.title,
            task_record.description,
            task_record.task_type,
            task_record.priority,
            'pending',  -- Always start with pending status
            task_record.evidence_required,
            new_due_date::text,
            task_record.due_time,
            CASE
                WHEN task_record.due_time IS NOT NULL
                THEN (new_due_date::text || ' ' || task_record.due_time)::timestamp
                ELSE new_due_date::timestamp
            END,
            task_record.checklist_items,
            task_record.tags,
            task_record.assigned_to,
            task_record.assigned_by,
            task_record.reviewer_id,
            NOW(),
            NOW(),
            NOW()
        );

        -- Update the original task's last_recurrence_date
        UPDATE tasks
        SET last_recurrence_date = new_due_date,
            updated_at = NOW()
        WHERE id = task_record.id;

    END LOOP;

    -- Also create instances for subtasks of daily parent tasks
    FOR task_record IN
        SELECT DISTINCT ON (t.id) t.*
        FROM tasks t
        INNER JOIN tasks parent ON parent.id = t.parent_task_id
        WHERE parent.task_type = 'daily'
          AND parent.is_recurring_instance = false
          AND t.is_recurring_instance = false
          AND NOT EXISTS (
              SELECT 1 FROM tasks t2
              WHERE t2.original_task_id = t.id
                AND t2.due_date = new_due_date::text
          )
    LOOP
        -- Find the new parent task instance for tomorrow
        SELECT id INTO new_task_id
        FROM tasks
        WHERE original_task_id = task_record.parent_task_id
          AND due_date = new_due_date::text
        LIMIT 1;

        IF new_task_id IS NOT NULL THEN
            -- Create subtask instance
            INSERT INTO tasks (
                id,
                original_task_id,
                is_recurring_instance,
                parent_task_id,
                task_level,
                task_order,
                template_id,
                title,
                description,
                task_type,
                priority,
                status,
                evidence_required,
                due_date,
                due_time,
                due_datetime,
                checklist_items,
                tags,
                assigned_to,
                assigned_by,
                reviewer_id,
                assigned_at,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                task_record.id,
                true,
                new_task_id,  -- Link to new parent instance
                task_record.task_level,
                task_record.task_order,
                task_record.template_id,
                task_record.title,
                task_record.description,
                task_record.task_type,
                task_record.priority,
                'pending',
                task_record.evidence_required,
                new_due_date::text,
                task_record.due_time,
                CASE
                    WHEN task_record.due_time IS NOT NULL
                    THEN (new_due_date::text || ' ' || task_record.due_time)::timestamp
                    ELSE new_due_date::timestamp
                END,
                task_record.checklist_items,
                task_record.tags,
                task_record.assigned_to,
                task_record.assigned_by,
                task_record.reviewer_id,
                NOW(),
                NOW(),
                NOW()
            );
        END IF;
    END LOOP;
END;
$$;

-- Create a function that can be called to ensure daily tasks exist for a specific date
CREATE OR REPLACE FUNCTION ensure_daily_tasks_for_date(target_date DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    task_record RECORD;
    new_task_id UUID;
BEGIN
    -- Find all daily tasks that need to be created for the target date
    FOR task_record IN
        SELECT DISTINCT ON (t.id) t.*
        FROM tasks t
        WHERE t.task_type = 'daily'
          AND t.is_recurring_instance = false  -- Only use original daily tasks as templates
          AND NOT EXISTS (
              -- Check if task already exists for target date
              SELECT 1 FROM tasks t2
              WHERE t2.original_task_id = t.id
                AND t2.due_date = target_date::text
          )
    LOOP
        -- Create new task instance for target date
        INSERT INTO tasks (
            id,
            original_task_id,
            is_recurring_instance,
            template_id,
            title,
            description,
            task_type,
            priority,
            status,
            evidence_required,
            due_date,
            due_time,
            due_datetime,
            checklist_items,
            tags,
            assigned_to,
            assigned_by,
            reviewer_id,
            assigned_at,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            task_record.id,
            true,
            task_record.template_id,
            task_record.title,
            task_record.description,
            task_record.task_type,
            task_record.priority,
            'pending',
            task_record.evidence_required,
            target_date::text,
            task_record.due_time,
            CASE
                WHEN task_record.due_time IS NOT NULL
                THEN (target_date::text || ' ' || task_record.due_time)::timestamp
                ELSE target_date::timestamp
            END,
            task_record.checklist_items,
            task_record.tags,
            task_record.assigned_to,
            task_record.assigned_by,
            task_record.reviewer_id,
            NOW(),
            NOW(),
            NOW()
        );
    END LOOP;
END;
$$;

-- Create function to generate daily tasks for a specific user when they check in
CREATE OR REPLACE FUNCTION create_daily_tasks_for_user(user_id UUID, target_date DATE DEFAULT CURRENT_DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    task_record RECORD;
    new_task_id UUID;
BEGIN
    -- Find all daily tasks assigned to this user that need to be created for the target date
    FOR task_record IN
        SELECT DISTINCT ON (t.id) t.*
        FROM tasks t
        WHERE t.task_type = 'daily'
          AND t.assigned_to = user_id
          AND t.is_recurring_instance = false  -- Only use original daily tasks as templates
          AND NOT EXISTS (
              -- Check if task already exists for target date and user
              SELECT 1 FROM tasks t2
              WHERE t2.original_task_id = t.id
                AND t2.due_date = target_date::text
                AND t2.assigned_to = user_id
          )
    LOOP
        -- Create new task instance for target date
        INSERT INTO tasks (
            id,
            original_task_id,
            is_recurring_instance,
            template_id,
            title,
            description,
            task_type,
            priority,
            status,
            evidence_required,
            due_date,
            due_time,
            due_datetime,
            checklist_items,
            tags,
            assigned_to,
            assigned_by,
            reviewer_id,
            assigned_at,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            task_record.id,
            true,
            task_record.template_id,
            task_record.title,
            task_record.description,
            task_record.task_type,
            task_record.priority,
            'pending',  -- Always start with pending status
            task_record.evidence_required,
            target_date::text,
            task_record.due_time,
            CASE
                WHEN task_record.due_time IS NOT NULL
                THEN (target_date::text || ' ' || task_record.due_time)::timestamp
                ELSE target_date::timestamp
            END,
            task_record.checklist_items,
            task_record.tags,
            task_record.assigned_to,
            task_record.assigned_by,
            task_record.reviewer_id,
            NOW(),
            NOW(),
            NOW()
        );

        -- Update the original task's last_recurrence_date
        UPDATE tasks
        SET last_recurrence_date = target_date,
            updated_at = NOW()
        WHERE id = task_record.id;

    END LOOP;

    -- Also create instances for subtasks of daily parent tasks assigned to this user
    FOR task_record IN
        SELECT DISTINCT ON (t.id) t.*
        FROM tasks t
        INNER JOIN tasks parent ON parent.id = t.parent_task_id
        WHERE parent.task_type = 'daily'
          AND parent.assigned_to = user_id
          AND parent.is_recurring_instance = false
          AND t.is_recurring_instance = false
          AND NOT EXISTS (
              SELECT 1 FROM tasks t2
              WHERE t2.original_task_id = t.id
                AND t2.due_date = target_date::text
          )
    LOOP
        -- Find the new parent task instance for target date
        SELECT id INTO new_task_id
        FROM tasks
        WHERE original_task_id = task_record.parent_task_id
          AND due_date = target_date::text
          AND assigned_to = user_id
        LIMIT 1;

        IF new_task_id IS NOT NULL THEN
            -- Create subtask instance
            INSERT INTO tasks (
                id,
                original_task_id,
                is_recurring_instance,
                parent_task_id,
                task_level,
                task_order,
                template_id,
                title,
                description,
                task_type,
                priority,
                status,
                evidence_required,
                due_date,
                due_time,
                due_datetime,
                checklist_items,
                tags,
                assigned_to,
                assigned_by,
                reviewer_id,
                assigned_at,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                task_record.id,
                true,
                new_task_id,  -- Link to new parent instance
                task_record.task_level,
                task_record.task_order,
                task_record.template_id,
                task_record.title,
                task_record.description,
                task_record.task_type,
                task_record.priority,
                'pending',
                task_record.evidence_required,
                target_date::text,
                task_record.due_time,
                CASE
                    WHEN task_record.due_time IS NOT NULL
                    THEN (target_date::text || ' ' || task_record.due_time)::timestamp
                    ELSE target_date::timestamp
                END,
                task_record.checklist_items,
                task_record.tags,
                task_record.assigned_to,
                task_record.assigned_by,
                task_record.reviewer_id,
                NOW(),
                NOW(),
                NOW()
            );
        END IF;
    END LOOP;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_daily_task_instances() TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_daily_tasks_for_date(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION create_daily_tasks_for_user(UUID, DATE) TO authenticated;

-- Insert a comment for tracking
COMMENT ON FUNCTION create_daily_task_instances() IS 'Creates daily task instances for tomorrow. Should be run daily at midnight.';
COMMENT ON FUNCTION ensure_daily_tasks_for_date(DATE) IS 'Ensures daily task instances exist for a specific date. Used for client-side checks.';
COMMENT ON FUNCTION create_daily_tasks_for_user(UUID, DATE) IS 'Creates daily task instances for a specific user when they check in.';