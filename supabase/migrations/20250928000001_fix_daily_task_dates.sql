-- Fix Phase 2: Ensure auto-created tasks have correct dates and complete template data
-- Fix Phase 3: Add weekend skip logic - do not create tasks on Sundays
-- Update create_daily_task_instances_for_user function to include all template fields

CREATE OR REPLACE FUNCTION create_daily_task_instances_for_user(user_id UUID, target_date DATE DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE)
RETURNS TABLE(
    instances_created INTEGER,
    templates_found INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    template_record RECORD;
    instance_count INTEGER := 0;
    template_count INTEGER := 0;
BEGIN
    -- Phase 3: Skip weekends - do not create tasks on Sundays (DOW = 0)
    -- Uses IST timezone for day-of-week calculation
    IF EXTRACT(DOW FROM target_date) = 0 THEN
        RAISE NOTICE 'Skipping daily task creation on Sunday (IST): %', target_date;
        RETURN QUERY SELECT 0, 0;
        RETURN;
    END IF;

    -- Get all daily task templates for this user with ALL required fields
    FOR template_record IN
        SELECT
            id, title, description, priority, evidence_required,
            assigned_to, assigned_by, reviewer_id, tags, checklist_items,
            due_time, template_id
        FROM tasks
        WHERE assigned_to = user_id
          AND task_type = 'daily'
          AND (is_recurring_instance = false OR is_recurring_instance IS NULL)
          AND status != 'archived'
    LOOP
        template_count := template_count + 1;

        -- Check if instance already exists for this date
        IF NOT EXISTS (
            SELECT 1 FROM tasks
            WHERE original_task_id = template_record.id
              AND instance_date = target_date
              AND is_recurring_instance = true
        ) THEN
            -- Create new instance with ALL template fields
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
                target_date,                    -- ✅ Use creation date as due_date
                template_record.due_time,       -- ✅ Preserve template due_time
                template_record.assigned_to,
                template_record.assigned_by,
                template_record.reviewer_id,
                template_record.tags,           -- ✅ Preserve tags
                template_record.checklist_items, -- ✅ Preserve checklist
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
    RETURN QUERY SELECT instance_count, template_count;

    -- Log the result
    RAISE NOTICE 'Created % daily task instances from % templates for user % on date %',
                 instance_count, template_count, user_id, target_date;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_daily_task_instances_for_user(UUID, DATE) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION create_daily_task_instances_for_user(UUID, DATE) IS 'Creates daily task instances from templates for a specific user and date. Fixed in Phase 2 to include all template fields and correct dates.';