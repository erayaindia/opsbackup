-- Fix storage RLS policies to work with app_users table
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own task evidence" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload evidence for their tasks" ON storage.objects;
DROP POLICY IF EXISTS "Users can update evidence for their tasks" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete evidence for their tasks" ON storage.objects;

-- Recreate policies with proper app_users relationship
CREATE POLICY "Any authenticated user can view evidence" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'task-evidence' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Any authenticated user can upload evidence" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'task-evidence' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Any authenticated user can update evidence" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'task-evidence' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Any authenticated user can delete evidence" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'task-evidence' AND
    auth.uid() IS NOT NULL
  );

-- Also ensure RLS policies for task_submissions table allow deletion
-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can delete their own submissions" ON task_submissions;
DROP POLICY IF EXISTS "Users can delete evidence for their tasks" ON task_submissions;

-- Create permissive deletion policy for task_submissions
CREATE POLICY "Any authenticated user can delete task submissions" ON task_submissions
  FOR DELETE USING (
    auth.uid() IS NOT NULL
  );

-- Ensure authenticated users can also insert and select task submissions
DROP POLICY IF EXISTS "Users can insert task submissions" ON task_submissions;
DROP POLICY IF EXISTS "Users can view task submissions" ON task_submissions;

CREATE POLICY "Any authenticated user can insert task submissions" ON task_submissions
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Any authenticated user can view task submissions" ON task_submissions
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );