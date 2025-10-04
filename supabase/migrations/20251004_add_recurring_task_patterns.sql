-- Migration: Add recurring task patterns (weekly/monthly)
-- This extends the task system to support weekly and monthly recurring tasks

-- Step 1: Drop existing check constraint on task_type if it exists
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_task_type_check;

-- Step 2: Add new columns for recurrence pattern
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS recurrence_pattern JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS recurrence_start_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS recurrence_end_date DATE DEFAULT NULL;

-- Step 3: Add new check constraint that includes weekly and monthly
ALTER TABLE tasks ADD CONSTRAINT tasks_task_type_check
  CHECK (task_type IN ('daily', 'weekly', 'monthly', 'one-off'));

-- Step 4: Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_recurrence_pattern ON tasks USING GIN (recurrence_pattern);
CREATE INDEX IF NOT EXISTS idx_tasks_recurrence_dates ON tasks (recurrence_start_date, recurrence_end_date);

-- Step 5: Migrate existing daily tasks to use recurrence_pattern
UPDATE tasks
SET recurrence_pattern = '{"type": "daily"}'::jsonb
WHERE task_type = 'daily' AND recurrence_pattern IS NULL;

-- Step 6: Add comments for documentation
COMMENT ON COLUMN tasks.recurrence_pattern IS 'JSON pattern for recurring tasks. Examples: {"type":"daily"}, {"type":"weekly","days":[1,3,5]}, {"type":"monthly","days":[1,15,30]}';
COMMENT ON COLUMN tasks.recurrence_start_date IS 'Start date for recurring task pattern';
COMMENT ON COLUMN tasks.recurrence_end_date IS 'Optional end date for recurring task pattern (null = no end date)';

-- Step 7: Drop existing functions if they exist (to avoid type conflicts)
DROP FUNCTION IF EXISTS should_create_task_instance(TEXT, JSONB, DATE, DATE, DATE);
DROP FUNCTION IF EXISTS create_recurring_task_instances_for_user(UUID, DATE);
DROP FUNCTION IF EXISTS create_daily_task_instances_for_user(UUID, DATE);
DROP FUNCTION IF EXISTS validate_recurrence_pattern(TEXT, JSONB);

-- Step 8: Create function to check if task should run on a given date
CREATE OR REPLACE FUNCTION should_create_task_instance(
  p_task_type TEXT,
  p_recurrence_pattern JSONB,
  p_target_date DATE,
  p_start_date DATE,
  p_end_date DATE
) RETURNS BOOLEAN AS $$
DECLARE
  v_pattern_type TEXT;
  v_days INTEGER[];
  v_day_of_week INTEGER;
  v_day_of_month INTEGER;
BEGIN
  -- Check if date is within recurrence period
  IF p_start_date IS NOT NULL AND p_target_date < p_start_date THEN
    RETURN FALSE;
  END IF;

  IF p_end_date IS NOT NULL AND p_target_date > p_end_date THEN
    RETURN FALSE;
  END IF;

  -- Handle daily tasks (legacy and new)
  IF p_task_type = 'daily' THEN
    RETURN TRUE;
  END IF;

  -- Get pattern type from JSON (handle null pattern)
  IF p_recurrence_pattern IS NULL THEN
    RETURN FALSE;
  END IF;

  v_pattern_type := p_recurrence_pattern->>'type';

  -- Handle weekly tasks
  IF p_task_type = 'weekly' AND v_pattern_type = 'weekly' THEN
    -- Get day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
    v_day_of_week := EXTRACT(DOW FROM p_target_date);

    -- Get selected days from pattern
    v_days := ARRAY(SELECT jsonb_array_elements_text(p_recurrence_pattern->'days')::INTEGER);

    -- Check if current day is in the selected days
    RETURN v_day_of_week = ANY(v_days);
  END IF;

  -- Handle monthly tasks
  IF p_task_type = 'monthly' AND v_pattern_type = 'monthly' THEN
    -- Get day of month (1-31)
    v_day_of_month := EXTRACT(DAY FROM p_target_date);

    -- Get selected days from pattern
    v_days := ARRAY(SELECT jsonb_array_elements_text(p_recurrence_pattern->'days')::INTEGER);

    -- Check if current day is in the selected days
    RETURN v_day_of_month = ANY(v_days);
  END IF;

  -- Default: don't create instance
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 9: Create the main recurring task instances function
CREATE OR REPLACE FUNCTION create_recurring_task_instances_for_user(
  user_id UUID,
  target_date DATE DEFAULT CURRENT_DATE
) RETURNS JSON AS $$
DECLARE
  v_template RECORD;
  v_existing_instance_id UUID;
  v_new_instance_id UUID;
  v_templates_found INTEGER := 0;
  v_instances_created INTEGER := 0;
  v_instances_skipped INTEGER := 0;
  v_should_create BOOLEAN;
BEGIN
  -- Find all recurring task templates for this user (daily, weekly, monthly)
  FOR v_template IN
    SELECT
      t.id,
      t.title,
      t.description,
      t.task_type,
      t.priority,
      t.evidence_required,
      t.due_time,
      t.duration_hours,
      t.checklist_items,
      t.tags,
      t.department,
      t.role_access,
      t.auto_assign_roles,
      t.reviewer_role,
      t.reviewer_user_id,
      t.assigned_by,
      t.parent_task_id,
      t.task_level,
      t.task_order,
      t.recurrence_pattern,
      t.recurrence_start_date,
      t.recurrence_end_date
    FROM tasks t
    WHERE t.assigned_to = user_id
      AND t.task_type IN ('daily', 'weekly', 'monthly')
      AND t.is_recurring_instance = FALSE  -- Only templates
      AND t.status != 'archived'
  LOOP
    v_templates_found := v_templates_found + 1;

    -- Check if this task should run on the target date
    v_should_create := should_create_task_instance(
      v_template.task_type,
      v_template.recurrence_pattern,
      target_date,
      v_template.recurrence_start_date,
      v_template.recurrence_end_date
    );

    IF NOT v_should_create THEN
      v_instances_skipped := v_instances_skipped + 1;
      CONTINUE;
    END IF;

    -- Check if instance already exists for this date
    SELECT id INTO v_existing_instance_id
    FROM tasks
    WHERE template_id = v_template.id
      AND instance_date = target_date
      AND is_recurring_instance = TRUE
    LIMIT 1;

    -- Only create if it doesn't exist
    IF v_existing_instance_id IS NULL THEN
      -- Create instance for this date
      INSERT INTO tasks (
        title,
        description,
        task_type,
        priority,
        evidence_required,
        due_date,
        due_time,
        duration_hours,
        checklist_items,
        tags,
        department,
        role_access,
        auto_assign_roles,
        assigned_to,
        assigned_by,
        reviewer_role,
        reviewer_user_id,
        status,
        template_id,
        is_recurring_instance,
        instance_date,
        parent_task_id,
        task_level,
        task_order,
        recurrence_pattern
      ) VALUES (
        v_template.title,
        v_template.description,
        v_template.task_type,
        v_template.priority,
        v_template.evidence_required,
        target_date,  -- Set due_date to the target date
        v_template.due_time,
        v_template.duration_hours,
        v_template.checklist_items,
        v_template.tags,
        v_template.department,
        v_template.role_access,
        v_template.auto_assign_roles,
        user_id,
        v_template.assigned_by,
        v_template.reviewer_role,
        v_template.reviewer_user_id,
        'pending',
        v_template.id,
        TRUE,
        target_date,
        v_template.parent_task_id,
        v_template.task_level,
        v_template.task_order,
        v_template.recurrence_pattern
      ) RETURNING id INTO v_new_instance_id;

      v_instances_created := v_instances_created + 1;
    END IF;
  END LOOP;

  RETURN json_build_object(
    'success', TRUE,
    'target_date', target_date,
    'templates_found', v_templates_found,
    'instances_created', v_instances_created,
    'instances_skipped', v_instances_skipped
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create alias for backward compatibility
CREATE OR REPLACE FUNCTION create_daily_task_instances_for_user(
  user_id UUID,
  target_date DATE DEFAULT CURRENT_DATE
) RETURNS JSON AS $$
BEGIN
  RETURN create_recurring_task_instances_for_user(user_id, target_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Add validation function for recurrence patterns
CREATE OR REPLACE FUNCTION validate_recurrence_pattern(
  p_task_type TEXT,
  p_recurrence_pattern JSONB
) RETURNS BOOLEAN AS $$
DECLARE
  v_pattern_type TEXT;
  v_days INTEGER[];
  v_day INTEGER;
BEGIN
  -- One-off tasks don't need patterns
  IF p_task_type = 'one-off' THEN
    RETURN p_recurrence_pattern IS NULL OR p_recurrence_pattern = 'null'::jsonb;
  END IF;

  -- Recurring tasks must have a pattern
  IF p_recurrence_pattern IS NULL THEN
    RETURN FALSE;
  END IF;

  v_pattern_type := p_recurrence_pattern->>'type';

  -- Daily tasks
  IF p_task_type = 'daily' THEN
    RETURN v_pattern_type = 'daily';
  END IF;

  -- Weekly tasks
  IF p_task_type = 'weekly' THEN
    IF v_pattern_type != 'weekly' THEN
      RETURN FALSE;
    END IF;

    -- Check if days array exists and contains valid values (0-6)
    IF NOT (p_recurrence_pattern ? 'days') THEN
      RETURN FALSE;
    END IF;

    v_days := ARRAY(SELECT jsonb_array_elements_text(p_recurrence_pattern->'days')::INTEGER);

    FOREACH v_day IN ARRAY v_days LOOP
      IF v_day < 0 OR v_day > 6 THEN
        RETURN FALSE;
      END IF;
    END LOOP;

    RETURN array_length(v_days, 1) > 0;
  END IF;

  -- Monthly tasks
  IF p_task_type = 'monthly' THEN
    IF v_pattern_type != 'monthly' THEN
      RETURN FALSE;
    END IF;

    -- Check if days array exists and contains valid values (1-31)
    IF NOT (p_recurrence_pattern ? 'days') THEN
      RETURN FALSE;
    END IF;

    v_days := ARRAY(SELECT jsonb_array_elements_text(p_recurrence_pattern->'days')::INTEGER);

    FOREACH v_day IN ARRAY v_days LOOP
      IF v_day < 1 OR v_day > 31 THEN
        RETURN FALSE;
      END IF;
    END LOOP;

    RETURN array_length(v_days, 1) > 0;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 12: Add check constraint for recurrence pattern validation
-- Note: We're commenting this out for now as it may be too strict for existing data
-- You can enable it after ensuring all data is valid
-- ALTER TABLE tasks DROP CONSTRAINT IF EXISTS check_recurrence_pattern;
-- ALTER TABLE tasks ADD CONSTRAINT check_recurrence_pattern
--   CHECK (validate_recurrence_pattern(task_type, recurrence_pattern));

-- Step 13: Grant necessary permissions
GRANT EXECUTE ON FUNCTION should_create_task_instance TO authenticated;
GRANT EXECUTE ON FUNCTION create_recurring_task_instances_for_user TO authenticated;
GRANT EXECUTE ON FUNCTION validate_recurrence_pattern TO authenticated;
