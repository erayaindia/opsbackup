-- Create a permissive RLS policy to allow any authenticated user to insert tasks
-- This is for debugging and testing purposes

-- First, drop existing restrictive insert policies if they exist
DROP POLICY IF EXISTS "Users can insert tasks they create" ON tasks;
DROP POLICY IF EXISTS "Managers can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Admin can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Team leads can insert tasks" ON tasks;

-- Create a simple permissive policy for authenticated users to insert tasks
CREATE POLICY "Allow authenticated users to insert tasks" ON tasks
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Also ensure authenticated users can read their own tasks (for the response after insert)
DROP POLICY IF EXISTS "Users can view assigned tasks" ON tasks;
CREATE POLICY "Allow authenticated users to view all tasks" ON tasks
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to update tasks
DROP POLICY IF EXISTS "Users can update their tasks" ON tasks;
CREATE POLICY "Allow authenticated users to update tasks" ON tasks
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to delete tasks
DROP POLICY IF EXISTS "Users can delete tasks they created" ON tasks;
CREATE POLICY "Allow authenticated users to delete tasks" ON tasks
    FOR DELETE
    TO authenticated
    USING (true);

-- Ensure RLS is enabled on the tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Optional: Add a comment explaining this is for testing
COMMENT ON POLICY "Allow authenticated users to insert tasks" ON tasks
IS 'Permissive policy for testing - allows any authenticated user to insert tasks including subtasks';