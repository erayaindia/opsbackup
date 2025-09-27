-- Simplify daily task system - remove template/instance complexity
-- Daily tasks are simply made visible when user checks in

-- Add a simple field to track when daily tasks were last activated
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS last_activated_date DATE;

-- Remove the complex template/instance system
-- (Keep the columns for backward compatibility but don't use them)

-- Create simple function to activate daily tasks when user checks in
CREATE OR REPLACE FUNCTION activate_daily_tasks_for_user(user_id UUID, activation_date DATE DEFAULT CURRENT_DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Simply update the last_activated_date for all daily tasks assigned to this user
    -- This makes them "available" for today without creating duplicates
    UPDATE tasks
    SET
        last_activated_date = activation_date,
        updated_at = NOW(),
        status = CASE
            -- Reset status to pending if it was completed/approved from previous day
            WHEN status IN ('approved', 'done_auto_approved') THEN 'pending'
            ELSE status
        END
    WHERE assigned_to = user_id
      AND task_type = 'daily'
      AND (last_activated_date IS NULL OR last_activated_date < activation_date);

    -- Log the activation
    RAISE NOTICE 'Activated daily tasks for user % on date %', user_id, activation_date;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION activate_daily_tasks_for_user(UUID, DATE) TO authenticated;

-- Comment
COMMENT ON FUNCTION activate_daily_tasks_for_user(UUID, DATE) IS 'Activates daily tasks for a user when they check in - no duplication, just makes existing daily tasks available.';