-- Implement robust daily task system with proper template/instance pattern
-- This provides complete historical tracking and data integrity

-- Ensure we have the required columns for template/instance pattern
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS original_task_id UUID REFERENCES tasks(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_recurring_instance BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS instance_date DATE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tasks_template_instance ON tasks(original_task_id, is_recurring_instance, instance_date);
CREATE INDEX IF NOT EXISTS idx_tasks_daily_templates ON tasks(task_type, is_recurring_instance) WHERE task_type = 'daily';

-- Create robust function to create daily task instances
CREATE OR REPLACE FUNCTION create_daily_task_instances_for_user(user_id UUID, target_date DATE DEFAULT CURRENT_DATE)
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
    -- Get all daily task templates for this user
    FOR template_record IN
        SELECT id, title, description, priority, evidence_required, assigned_to, assigned_by, reviewer_id
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
            -- Create new instance
            INSERT INTO tasks (
                title,
                description,
                task_type,
                status,
                priority,
                evidence_required,
                due_date,
                assigned_to,
                assigned_by,
                reviewer_id,
                original_task_id,
                is_recurring_instance,
                instance_date,
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
                template_record.assigned_to,
                template_record.assigned_by,
                template_record.reviewer_id,
                template_record.id,
                true,
                target_date,
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

-- Create function to get user's daily task completion history
CREATE OR REPLACE FUNCTION get_daily_task_history(user_id UUID, from_date DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days')::DATE, to_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
    date DATE,
    total_tasks INTEGER,
    completed_tasks INTEGER,
    completion_rate DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.instance_date as date,
        COUNT(i.id)::INTEGER as total_tasks,
        COUNT(CASE WHEN i.status IN ('done', 'approved', 'done_auto_approved') THEN 1 END)::INTEGER as completed_tasks,
        ROUND(
            (COUNT(CASE WHEN i.status IN ('done', 'approved', 'done_auto_approved') THEN 1 END)::DECIMAL /
             NULLIF(COUNT(i.id), 0)) * 100,
            2
        ) as completion_rate
    FROM tasks i
    WHERE i.assigned_to = user_id
      AND i.task_type = 'daily'
      AND i.is_recurring_instance = true
      AND i.instance_date BETWEEN from_date AND to_date
    GROUP BY i.instance_date
    ORDER BY i.instance_date DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_daily_task_history(UUID, DATE, DATE) TO authenticated;

-- Create function to clean up old daily task instances (optional - for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_daily_instances(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete daily task instances older than specified days
    -- But keep completed ones for historical record
    DELETE FROM tasks
    WHERE task_type = 'daily'
      AND is_recurring_instance = true
      AND instance_date < (CURRENT_DATE - days_to_keep)
      AND status IN ('pending', 'cancelled')
      AND NOT EXISTS (
          SELECT 1 FROM task_submissions ts WHERE ts.task_id = tasks.id
      );

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RAISE NOTICE 'Cleaned up % old daily task instances', deleted_count;
    RETURN deleted_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION cleanup_old_daily_instances(INTEGER) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION create_daily_task_instances_for_user(UUID, DATE) IS 'Creates daily task instances from templates for a specific user and date. Safe to call multiple times.';
COMMENT ON FUNCTION get_daily_task_history(UUID, DATE, DATE) IS 'Returns daily task completion statistics for a user over a date range.';
COMMENT ON FUNCTION cleanup_old_daily_instances(INTEGER) IS 'Maintenance function to clean up old pending daily task instances while preserving completed ones.';