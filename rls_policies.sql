-- RLS Policies to allow authenticated users to delete tasks
-- Run these commands in your Supabase SQL Editor

-- First, check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'tasks';

-- Drop existing delete policies if they exist (optional)
-- DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;
-- DROP POLICY IF EXISTS "Allow delete for authenticated users" ON tasks;

-- Create a permissive delete policy for all authenticated users
CREATE POLICY "Allow authenticated users to delete tasks" ON tasks
    FOR DELETE
    TO authenticated
    USING (true);

-- Alternative: More restrictive policy - users can only delete tasks they created or are assigned to
CREATE POLICY "Allow delete for task creators and assignees" ON tasks
    FOR DELETE
    TO authenticated
    USING (
        auth.uid()::text IN (
            SELECT auth_user_id::text FROM app_users WHERE id = assigned_by
        )
        OR
        auth.uid()::text IN (
            SELECT auth_user_id::text FROM app_users WHERE id = assigned_to
        )
        OR
        EXISTS (
            SELECT 1 FROM app_users
            WHERE auth_user_id = auth.uid()
            AND role IN ('admin', 'super_admin', 'manager')
        )
    );

-- Alternative: Super simple policy - any authenticated user can delete any task
CREATE POLICY "Allow all authenticated delete" ON tasks
    FOR DELETE
    TO authenticated
    USING (auth.uid() IS NOT NULL);

-- Make sure RLS is enabled on the tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Check if there are any conflicting policies
SELECT * FROM pg_policies WHERE tablename = 'tasks' AND cmd = 'DELETE';