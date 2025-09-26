-- Clean up existing policies and recreate with correct permissions
-- First, drop ALL existing policies to start fresh

-- Drop storage policies
DROP POLICY IF EXISTS "Any authenticated user can view evidence" ON storage.objects;
DROP POLICY IF EXISTS "Any authenticated user can upload evidence" ON storage.objects;
DROP POLICY IF EXISTS "Any authenticated user can update evidence" ON storage.objects;
DROP POLICY IF EXISTS "Any authenticated user can delete evidence" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own task evidence" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload evidence for their tasks" ON storage.objects;
DROP POLICY IF EXISTS "Users can update evidence for their tasks" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete evidence for their tasks" ON storage.objects;

-- Drop task_submissions policies
DROP POLICY IF EXISTS "Any authenticated user can delete task submissions" ON task_submissions;
DROP POLICY IF EXISTS "Any authenticated user can insert task submissions" ON task_submissions;
DROP POLICY IF EXISTS "Any authenticated user can view task submissions" ON task_submissions;
DROP POLICY IF EXISTS "Users can delete their own submissions" ON task_submissions;
DROP POLICY IF EXISTS "Users can delete evidence for their tasks" ON task_submissions;
DROP POLICY IF EXISTS "Users can insert task submissions" ON task_submissions;
DROP POLICY IF EXISTS "Users can view task submissions" ON task_submissions;

-- Now create the permissive policies for storage.objects
CREATE POLICY "authenticated_users_can_view_evidence" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'task-evidence' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "authenticated_users_can_upload_evidence" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'task-evidence' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "authenticated_users_can_update_evidence" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'task-evidence' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "authenticated_users_can_delete_evidence" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'task-evidence' AND
    auth.uid() IS NOT NULL
  );

-- Create permissive policies for task_submissions table
CREATE POLICY "authenticated_users_can_delete_submissions" ON task_submissions
  FOR DELETE USING (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "authenticated_users_can_insert_submissions" ON task_submissions
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "authenticated_users_can_view_submissions" ON task_submissions
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );