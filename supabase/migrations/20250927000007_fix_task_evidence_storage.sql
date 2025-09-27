-- Fix storage policies for existing task-evidence bucket
-- This migration ensures authenticated users can upload and manage task evidence files

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Authenticated users can upload task evidence" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view task evidence" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update task evidence" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete task evidence" ON storage.objects;

-- Allow authenticated users to upload files to task-evidence bucket
CREATE POLICY "Authenticated users can upload task evidence"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'task-evidence'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to view files in task-evidence bucket
CREATE POLICY "Authenticated users can view task evidence"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'task-evidence'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update files in task-evidence bucket
CREATE POLICY "Authenticated users can update task evidence"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'task-evidence'
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'task-evidence'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete files in task-evidence bucket
CREATE POLICY "Authenticated users can delete task evidence"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'task-evidence'
  AND auth.role() = 'authenticated'
);

-- Ensure task_submissions table has proper RLS policies
ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing task_submissions policies to recreate them
DROP POLICY IF EXISTS "Authenticated users can view task submissions" ON task_submissions;
DROP POLICY IF EXISTS "Authenticated users can create task submissions" ON task_submissions;
DROP POLICY IF EXISTS "Authenticated users can update task submissions" ON task_submissions;
DROP POLICY IF EXISTS "Authenticated users can delete task submissions" ON task_submissions;

-- Allow authenticated users to view all task submissions
CREATE POLICY "Authenticated users can view task submissions"
ON task_submissions FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow authenticated users to create task submissions
CREATE POLICY "Authenticated users can create task submissions"
ON task_submissions FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
  AND submitted_by = (
    SELECT id FROM app_users WHERE auth_user_id = auth.uid()
  )
);

-- Allow users to update their own submissions or admins to update any
CREATE POLICY "Authenticated users can update task submissions"
ON task_submissions FOR UPDATE
USING (
  auth.role() = 'authenticated'
  AND (
    submitted_by = (
      SELECT id FROM app_users WHERE auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM app_users
      WHERE auth_user_id = auth.uid()
      AND role IN ('admin', 'super_admin', 'manager')
    )
  )
)
WITH CHECK (
  auth.role() = 'authenticated'
);

-- Allow users to delete their own submissions or admins to delete any
CREATE POLICY "Authenticated users can delete task submissions"
ON task_submissions FOR DELETE
USING (
  auth.role() = 'authenticated'
  AND (
    submitted_by = (
      SELECT id FROM app_users WHERE auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM app_users
      WHERE auth_user_id = auth.uid()
      AND role IN ('admin', 'super_admin', 'manager')
    )
  )
);

-- Grant necessary permissions
GRANT ALL ON task_submissions TO authenticated;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_submissions_task_id ON task_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_submitted_by ON task_submissions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_task_submissions_submission_type ON task_submissions(submission_type);
CREATE INDEX IF NOT EXISTS idx_task_submissions_evidence_type ON task_submissions(evidence_type);

-- Log completion
SELECT 'Task evidence storage policies have been updated successfully' as status;