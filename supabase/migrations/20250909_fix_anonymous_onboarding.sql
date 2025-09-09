-- Fix Anonymous Onboarding - Enable Anonymous Access
-- This script enables anonymous users to upload documents and submit onboarding applications
-- Run this SQL script in your Supabase SQL editor

-- =============================================================================
-- 1. ENABLE ANONYMOUS ACCESS FOR STORAGE (employee-documents bucket)
-- =============================================================================

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-documents', 'employee-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Allow anonymous users to INSERT (upload) files to employee-documents bucket
CREATE POLICY IF NOT EXISTS "Allow anonymous uploads to employee-documents"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'employee-documents' AND (storage.foldername(name))[1] = 'onboarding');

-- Allow authenticated users to INSERT files (for admin use)
CREATE POLICY IF NOT EXISTS "Allow authenticated uploads to employee-documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'employee-documents');

-- Allow anonymous users to SELECT (view) their uploaded files during onboarding
CREATE POLICY IF NOT EXISTS "Allow anonymous read of employee-documents"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'employee-documents' AND (storage.foldername(name))[1] = 'onboarding');

-- Allow authenticated users (admins) to view all files
CREATE POLICY IF NOT EXISTS "Allow authenticated read of employee-documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'employee-documents');

-- =============================================================================
-- 2. ENABLE ANONYMOUS ACCESS FOR EMPLOYEES_DETAILS TABLE
-- =============================================================================

-- Allow anonymous users to INSERT onboarding applications
CREATE POLICY IF NOT EXISTS "Allow anonymous onboarding submissions"
ON employees_details
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow authenticated users (admins) to view all applications
CREATE POLICY IF NOT EXISTS "Allow authenticated users to view applications"
ON employees_details
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users (admins) to update applications (for approval)
CREATE POLICY IF NOT EXISTS "Allow authenticated users to update applications"
ON employees_details
FOR UPDATE
TO authenticated
USING (true);

-- =============================================================================
-- 3. ENSURE CREATED_BY FIELD CAN BE NULL
-- =============================================================================

-- Make created_by field nullable for anonymous submissions
ALTER TABLE employees_details 
ALTER COLUMN created_by DROP NOT NULL;

-- Add a comment to explain why created_by can be null
COMMENT ON COLUMN employees_details.created_by IS 'User ID who created the record. NULL for anonymous onboarding submissions.';

-- =============================================================================
-- 4. CREATE INDEX FOR PERFORMANCE
-- =============================================================================

-- Index for filtering applications by status (for admin dashboard)
CREATE INDEX IF NOT EXISTS idx_employees_details_status ON employees_details(status);
CREATE INDEX IF NOT EXISTS idx_employees_details_submission_date ON employees_details(submission_date);

-- =============================================================================
-- 5. TESTING - VERIFY POLICIES ARE WORKING
-- =============================================================================

-- Test anonymous access to storage (should work)
-- This query should return without errors if policies are correct
DO $$
BEGIN
    -- Check if storage policies exist
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Allow anonymous uploads to employee-documents'
    ) THEN
        RAISE NOTICE '✅ Anonymous upload policy exists';
    ELSE
        RAISE NOTICE '❌ Anonymous upload policy missing';
    END IF;
    
    -- Check if table policies exist
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'employees_details' 
        AND policyname = 'Allow anonymous onboarding submissions'
    ) THEN
        RAISE NOTICE '✅ Anonymous submission policy exists';
    ELSE
        RAISE NOTICE '❌ Anonymous submission policy missing';
    END IF;
END $$;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Anonymous onboarding access configured!';
    RAISE NOTICE '📄 Anonymous users can now upload documents';
    RAISE NOTICE '📝 Anonymous users can now submit applications';
    RAISE NOTICE '👥 Admins can view and manage all applications';
    RAISE NOTICE '🔒 Security: Anonymous access limited to onboarding folder only';
END $$;