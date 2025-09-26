-- Fix RLS policies for tasks table to allow proper task creation and viewing
-- First, drop all existing policies for tasks table to start clean
DROP POLICY IF EXISTS "tasks_select_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_insert_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_update_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_delete_policy" ON tasks;
DROP POLICY IF EXISTS "Users can view assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Managers can manage all tasks" ON tasks;

-- Enable RLS on tasks table (if not already enabled)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy 1: SELECT - Users can view tasks they are assigned to, created by them, or if they are managers/admins
CREATE POLICY "tasks_select_policy" ON tasks
FOR SELECT
TO authenticated
USING (
  -- User is assigned to the task
  assigned_to = auth.uid()
  -- Or user created the task
  OR assigned_by = auth.uid()
  -- Or user has elevated privileges (admin, super_admin, manager, team_lead)
  OR EXISTS (
    SELECT 1 FROM app_users au
    WHERE au.id = auth.uid()
    AND au.role IN ('admin', 'super_admin', 'manager', 'team_lead')
    AND au.status = 'active'
  )
  -- Or user is the reviewer
  OR reviewer_id = auth.uid()
);

-- Policy 2: INSERT - Users with elevated privileges can create tasks
CREATE POLICY "tasks_insert_policy" ON tasks
FOR INSERT
TO authenticated
WITH CHECK (
  -- Only users with elevated privileges can create tasks
  EXISTS (
    SELECT 1 FROM app_users au
    WHERE au.id = auth.uid()
    AND au.role IN ('admin', 'super_admin', 'manager', 'team_lead')
    AND au.status = 'active'
  )
  -- And the assigned_by field must match the current user
  AND assigned_by = auth.uid()
);

-- Policy 3: UPDATE - Users can update tasks they are assigned to or if they have elevated privileges
CREATE POLICY "tasks_update_policy" ON tasks
FOR UPDATE
TO authenticated
USING (
  -- User is assigned to the task (can update status, evidence, etc.)
  assigned_to = auth.uid()
  -- Or user created the task
  OR assigned_by = auth.uid()
  -- Or user has elevated privileges
  OR EXISTS (
    SELECT 1 FROM app_users au
    WHERE au.id = auth.uid()
    AND au.role IN ('admin', 'super_admin', 'manager', 'team_lead')
    AND au.status = 'active'
  )
  -- Or user is the reviewer
  OR reviewer_id = auth.uid()
)
WITH CHECK (
  -- Same conditions as USING clause
  assigned_to = auth.uid()
  OR assigned_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM app_users au
    WHERE au.id = auth.uid()
    AND au.role IN ('admin', 'super_admin', 'manager', 'team_lead')
    AND au.status = 'active'
  )
  OR reviewer_id = auth.uid()
);

-- Policy 4: DELETE - Only users with elevated privileges can delete tasks
CREATE POLICY "tasks_delete_policy" ON tasks
FOR DELETE
TO authenticated
USING (
  -- User created the task
  assigned_by = auth.uid()
  -- Or user has elevated privileges
  OR EXISTS (
    SELECT 1 FROM app_users au
    WHERE au.id = auth.uid()
    AND au.role IN ('admin', 'super_admin', 'manager', 'team_lead')
    AND au.status = 'active'
  )
);

-- Ensure app_users table also has proper RLS policies for the role checks to work
-- Check if app_users RLS is enabled and create basic policy if needed
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Drop existing app_users policies that might conflict
DROP POLICY IF EXISTS "app_users_select_policy" ON app_users;

-- Allow authenticated users to read their own profile and others for task assignment
CREATE POLICY "app_users_select_policy" ON app_users
FOR SELECT
TO authenticated
USING (
  -- Users can always see their own profile
  id = auth.uid()
  -- Or if they have elevated privileges, they can see all active users
  OR EXISTS (
    SELECT 1 FROM app_users au
    WHERE au.id = auth.uid()
    AND au.role IN ('admin', 'super_admin', 'manager', 'team_lead')
    AND au.status = 'active'
  )
);

-- Create an index on tasks for better performance with RLS
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_tasks_reviewer_id ON tasks(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO authenticated;
GRANT SELECT ON app_users TO authenticated;