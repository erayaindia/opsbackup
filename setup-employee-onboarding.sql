-- Employee Onboarding System Setup Script
-- Execute this script in your Supabase SQL Editor to set up the complete onboarding system

-- =============================================================================
-- 1. CREATE ENUMS
-- =============================================================================

-- Application status enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'onboarding_status') THEN
    CREATE TYPE onboarding_status AS ENUM (
      'draft',
      'submitted', 
      'under_review',
      'approved',
      'rejected'
    );
  END IF;
END $$;

-- Document type enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_type') THEN
    CREATE TYPE document_type AS ENUM (
      'aadhaar_front',
      'aadhaar_back', 
      'pan',
      'bank_passbook',
      'profile_photo',
      'education_certificate',
      'resume',
      'other'
    );
  END IF;
END $$;

-- Gender enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_type') THEN
    CREATE TYPE gender_type AS ENUM ('Male', 'Female');
  END IF;
END $$;

-- =============================================================================
-- 2. CREATE MAIN TABLE: employees_details
-- =============================================================================

CREATE TABLE IF NOT EXISTS employees_details (
  -- Primary identifiers
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  app_user_id UUID, -- Will be linked after approval
  
  -- Application status and tracking
  status onboarding_status NOT NULL DEFAULT 'draft',
  submission_date TIMESTAMPTZ,
  approval_date TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Personal Information (Required fields)
  full_name TEXT NOT NULL,
  personal_email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender gender_type NOT NULL,
  
  -- Work Details (Required)
  designation TEXT NOT NULL,
  work_location TEXT NOT NULL,
  employment_type TEXT NOT NULL,
  joining_date DATE NOT NULL,
  
  -- Addresses (JSONB for flexibility)
  current_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  permanent_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  same_as_current BOOLEAN NOT NULL DEFAULT false,
  
  -- Emergency Contact (Required, JSONB)
  emergency_contact JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Bank Details (Required, JSONB)
  bank_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Documents References (JSONB array)
  documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Additional fields
  notes TEXT,
  
  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID, -- References auth.users
  approved_by UUID -- References app.users after approval
);

-- =============================================================================
-- 3. CREATE DOCUMENT METADATA TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS employee_document_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_detail_id UUID NOT NULL REFERENCES employees_details(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  original_filename TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 4. CREATE AUDIT LOG TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS employee_onboarding_logs (
  id BIGSERIAL PRIMARY KEY,
  employee_detail_id UUID NOT NULL REFERENCES employees_details(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by UUID NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Main table indexes
CREATE INDEX IF NOT EXISTS idx_employees_details_status ON employees_details(status);
CREATE INDEX IF NOT EXISTS idx_employees_details_submission_date ON employees_details(submission_date DESC);
CREATE INDEX IF NOT EXISTS idx_employees_details_app_user_id ON employees_details(app_user_id);
CREATE INDEX IF NOT EXISTS idx_employees_details_personal_email ON employees_details(personal_email);
CREATE INDEX IF NOT EXISTS idx_employees_details_created_at ON employees_details(created_at DESC);

-- Document metadata indexes
CREATE INDEX IF NOT EXISTS idx_document_metadata_employee_id ON employee_document_metadata(employee_detail_id);
CREATE INDEX IF NOT EXISTS idx_document_metadata_type ON employee_document_metadata(document_type);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_logs_employee_id ON employee_onboarding_logs(employee_detail_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_logs_created_at ON employee_onboarding_logs(created_at DESC);

-- =============================================================================
-- 6. CREATE TRIGGERS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for employees_details
DROP TRIGGER IF EXISTS set_employees_details_updated_at ON employees_details;
CREATE TRIGGER set_employees_details_updated_at
  BEFORE UPDATE ON employees_details
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- =============================================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE employees_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_document_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_onboarding_logs ENABLE ROW LEVEL SECURITY;

-- Basic policies for employees_details
DROP POLICY IF EXISTS "Users can view own applications" ON employees_details;
CREATE POLICY "Users can view own applications" ON employees_details
  FOR SELECT USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can create applications" ON employees_details;
CREATE POLICY "Users can create applications" ON employees_details
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update own draft applications" ON employees_details;
CREATE POLICY "Users can update own draft applications" ON employees_details
  FOR UPDATE USING (created_by = auth.uid() AND status = 'draft');

-- Admin policies (using app_users table)
DROP POLICY IF EXISTS "Admins have full access" ON employees_details;
CREATE POLICY "Admins have full access" ON employees_details
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM app_users 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('super_admin', 'admin')
    )
  );

-- =============================================================================
-- 8. CREATE STORAGE BUCKET
-- =============================================================================

-- Insert storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-documents', 'employee-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;
CREATE POLICY "Users can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'employee-documents' AND
    auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;
CREATE POLICY "Users can view own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'employee-documents' AND
    (
      name LIKE '%' || auth.uid()::text || '%' OR
      EXISTS (
        SELECT 1 FROM app_users 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('super_admin', 'admin')
      )
    )
  );

-- =============================================================================
-- 9. UTILITY FUNCTIONS
-- =============================================================================

-- Function to get onboarding statistics
CREATE OR REPLACE FUNCTION get_onboarding_stats()
RETURNS TABLE(
  total_applications BIGINT,
  pending_review BIGINT,
  approved BIGINT,
  rejected BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_applications,
    COUNT(*) FILTER (WHERE status IN ('submitted', 'under_review')) as pending_review,
    COUNT(*) FILTER (WHERE status = 'approved') as approved,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected
  FROM employees_details 
  WHERE status != 'draft';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- COMPLETION
-- =============================================================================

-- Test the setup by getting stats
SELECT * FROM get_onboarding_stats();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Employee Onboarding System setup completed successfully!';
  RAISE NOTICE '📋 Tables: employees_details, employee_document_metadata, employee_onboarding_logs';
  RAISE NOTICE '🔐 RLS policies enabled';
  RAISE NOTICE '📁 Storage bucket: employee-documents';
  RAISE NOTICE '🎯 Ready for use!';
END $$;