-- Fix RLS policies for tasks table to allow more flexible task creation

-- Drop existing task insert policy
DROP POLICY IF EXISTS "tasks_insert" ON tasks;

-- Create a more flexible task insert policy
-- Allow users to create tasks if they:
-- 1. Have admin/manager/team_lead role, OR
-- 2. Are authenticated users in the app_users table (for basic task creation)
CREATE POLICY "tasks_insert_flexible" ON tasks
  FOR INSERT WITH CHECK (
    -- Check if user exists in app_users table with appropriate roles
    auth.uid() IN (
      SELECT auth_user_id FROM app_users
      WHERE role IN ('admin', 'manager', 'team_lead', 'super_admin')
    )
    OR
    -- Allow authenticated users who exist in app_users table to create tasks
    -- (This allows any authenticated app user to create tasks)
    auth.uid() IN (
      SELECT auth_user_id FROM app_users
      WHERE auth_user_id IS NOT NULL
    )
  );

-- Also ensure the assigned_by field is properly set in the insert
-- by updating the constraint to allow self-assignment for regular users
CREATE OR REPLACE FUNCTION ensure_task_assigned_by()
RETURNS TRIGGER AS $$
BEGIN
  -- If assigned_by is not set, set it to the current user's app_user id
  IF NEW.assigned_by IS NULL THEN
    SELECT id INTO NEW.assigned_by
    FROM app_users
    WHERE auth_user_id = auth.uid();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-set assigned_by
DROP TRIGGER IF EXISTS set_task_assigned_by ON tasks;
CREATE TRIGGER set_task_assigned_by
  BEFORE INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION ensure_task_assigned_by();

-- Update the tasks_select policy to be more inclusive
DROP POLICY IF EXISTS "tasks_select" ON tasks;
CREATE POLICY "tasks_select_flexible" ON tasks
  FOR SELECT USING (
    -- Users can see tasks assigned to them
    assigned_to IN (
      SELECT id FROM app_users WHERE auth_user_id = auth.uid()
    ) OR
    -- Users can see tasks they're reviewing
    reviewer_id IN (
      SELECT id FROM app_users WHERE auth_user_id = auth.uid()
    ) OR
    -- Users can see tasks they assigned
    assigned_by IN (
      SELECT id FROM app_users WHERE auth_user_id = auth.uid()
    ) OR
    -- Admins, managers, and team leads can see all tasks
    auth.uid() IN (
      SELECT auth_user_id FROM app_users
      WHERE role IN ('admin', 'manager', 'team_lead', 'super_admin')
    )
  );

-- Also update tasks_update policy for consistency
DROP POLICY IF EXISTS "tasks_update" ON tasks;
CREATE POLICY "tasks_update_flexible" ON tasks
  FOR UPDATE USING (
    -- Users can update tasks assigned to them
    assigned_to IN (
      SELECT id FROM app_users WHERE auth_user_id = auth.uid()
    ) OR
    -- Users can update tasks they're reviewing
    reviewer_id IN (
      SELECT id FROM app_users WHERE auth_user_id = auth.uid()
    ) OR
    -- Users can update tasks they assigned
    assigned_by IN (
      SELECT id FROM app_users WHERE auth_user_id = auth.uid()
    ) OR
    -- Admins, managers, and team leads can update all tasks
    auth.uid() IN (
      SELECT auth_user_id FROM app_users
      WHERE role IN ('admin', 'manager', 'team_lead', 'super_admin')
    )
  );