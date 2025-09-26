-- Fix infinite recursion in RLS policies
-- This fixes the "infinite recursion detected in policy for relation app_users" error

-- First, drop all existing policies to start clean
DROP POLICY IF EXISTS "tasks_select_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_insert_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_update_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_delete_policy" ON tasks;
DROP POLICY IF EXISTS "Users can view assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Managers can manage all tasks" ON tasks;

DROP POLICY IF EXISTS "app_users_select_policy" ON app_users;
DROP POLICY IF EXISTS "Users can view their own profile" ON app_users;
DROP POLICY IF EXISTS "Users can view profiles" ON app_users;

-- Enable RLS on both tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Create a simple app_users policy that doesn't reference itself
-- This allows authenticated users to read app_users table for task assignment
CREATE POLICY "app_users_read_policy" ON app_users
FOR SELECT
TO authenticated
USING (true);  -- Allow all authenticated users to read app_users (simplified for now)

-- Now create tasks policies that won't cause recursion
-- Policy 1: SELECT - Allow users to view tasks based on role stored directly in their JWT/session
CREATE POLICY "tasks_select_policy" ON tasks
FOR SELECT
TO authenticated
USING (
  -- User is assigned to the task
  assigned_to = auth.uid()
  -- Or user created the task
  OR assigned_by = auth.uid()
  -- Or user is the reviewer
  OR reviewer_id = auth.uid()
);

-- Policy 2: INSERT - Allow task creation (we'll handle role checks in the application layer)
CREATE POLICY "tasks_insert_policy" ON tasks
FOR INSERT
TO authenticated
WITH CHECK (
  -- The assigned_by field must match the current user
  assigned_by = auth.uid()
);

-- Policy 3: UPDATE - Users can update tasks they are involved with
CREATE POLICY "tasks_update_policy" ON tasks
FOR UPDATE
TO authenticated
USING (
  -- User is assigned to the task
  assigned_to = auth.uid()
  -- Or user created the task
  OR assigned_by = auth.uid()
  -- Or user is the reviewer
  OR reviewer_id = auth.uid()
)
WITH CHECK (
  -- Same conditions as USING clause
  assigned_to = auth.uid()
  OR assigned_by = auth.uid()
  OR reviewer_id = auth.uid()
);

-- Policy 4: DELETE - Users can delete tasks they created
CREATE POLICY "tasks_delete_policy" ON tasks
FOR DELETE
TO authenticated
USING (
  -- User created the task
  assigned_by = auth.uid()
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_tasks_reviewer_id ON tasks(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO authenticated;
GRANT SELECT ON app_users TO authenticated;