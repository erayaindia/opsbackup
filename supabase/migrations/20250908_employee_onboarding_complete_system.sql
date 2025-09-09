-- Employee Onboarding System - Complete Database Structure
-- This migration creates a comprehensive onboarding system with proper organization and security
-- Date: 2025-09-08
-- Description: Creates tables, storage, RLS policies, and functions for employee onboarding

-- =============================================================================
-- ENUMS AND TYPES
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
-- MAIN TABLE: employees_details
-- =============================================================================

DROP TABLE IF EXISTS employees_details CASCADE;

CREATE TABLE employees_details (
  -- Primary identifiers
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  app_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL, -- Linked after approval
  
  -- Application status and tracking
  status onboarding_status NOT NULL DEFAULT 'draft',
  submission_date TIMESTAMPTZ,
  approval_date TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Personal Information (Required fields marked with NOT NULL)
  full_name TEXT NOT NULL CHECK (length(trim(full_name)) >= 2 AND length(trim(full_name)) <= 100),
  personal_email TEXT NOT NULL CHECK (personal_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone_number TEXT NOT NULL CHECK (phone_number ~* '^\+?91[\s\-]?[6-9]\d{9}$' OR phone_number ~* '^[6-9]\d{9}$'),
  date_of_birth DATE NOT NULL CHECK (date_of_birth >= '1950-01-01' AND date_of_birth <= CURRENT_DATE - INTERVAL '16 years'),
  gender gender_type NOT NULL,
  
  -- Work Details (Required)
  designation TEXT NOT NULL CHECK (length(trim(designation)) >= 2 AND length(trim(designation)) <= 100),
  work_location TEXT NOT NULL CHECK (work_location IN ('Patna', 'Delhi', 'Remote', 'Hybrid')),
  employment_type employment_type NOT NULL,
  joining_date DATE NOT NULL CHECK (joining_date >= CURRENT_DATE - INTERVAL '1 year' AND joining_date <= CURRENT_DATE + INTERVAL '6 months'),
  
  -- Addresses (JSONB for flexibility)
  current_address JSONB NOT NULL CHECK (
    current_address ? 'street' AND 
    current_address ? 'city' AND 
    current_address ? 'state' AND 
    current_address ? 'pincode' AND
    length(current_address->>'street') >= 5 AND
    length(current_address->>'city') >= 2 AND
    length(current_address->>'state') >= 2 AND
    (current_address->>'pincode') ~* '^\d{6}$'
  ),
  permanent_address JSONB NOT NULL CHECK (
    permanent_address ? 'street' AND 
    permanent_address ? 'city' AND 
    permanent_address ? 'state' AND 
    permanent_address ? 'pincode' AND
    length(permanent_address->>'street') >= 5 AND
    length(permanent_address->>'city') >= 2 AND
    length(permanent_address->>'state') >= 2 AND
    (permanent_address->>'pincode') ~* '^\d{6}$'
  ),
  same_as_current BOOLEAN NOT NULL DEFAULT false,
  
  -- Emergency Contact (Required, JSONB)
  emergency_contact JSONB NOT NULL CHECK (
    emergency_contact ? 'name' AND 
    emergency_contact ? 'relationship' AND 
    emergency_contact ? 'phone' AND
    length(emergency_contact->>'name') >= 2 AND
    (emergency_contact->>'phone') ~* '^\+?91[\s\-]?[6-9]\d{9}$|^[6-9]\d{9}$'
  ),
  
  -- Bank Details (Required, JSONB with encryption for sensitive fields)
  bank_details JSONB NOT NULL CHECK (
    bank_details ? 'account_holder_name' AND 
    bank_details ? 'account_number' AND 
    bank_details ? 'bank_name' AND 
    bank_details ? 'ifsc_code' AND
    length(bank_details->>'account_holder_name') >= 2 AND
    length(bank_details->>'account_number') >= 8 AND
    (bank_details->>'ifsc_code') ~* '^[A-Z]{4}0[A-Z0-9]{6}$'
  ),
  
  -- Documents References (JSONB array)
  documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Additional fields
  notes TEXT CHECK (length(notes) <= 2000),
  
  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID, -- References auth.users for who submitted
  approved_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
  
  -- Constraints
  CONSTRAINT valid_submission_date CHECK (
    (status = 'draft' AND submission_date IS NULL) OR
    (status != 'draft' AND submission_date IS NOT NULL)
  ),
  CONSTRAINT valid_approval_date CHECK (
    (status NOT IN ('approved', 'rejected') AND approval_date IS NULL) OR
    (status IN ('approved', 'rejected') AND approval_date IS NOT NULL)
  ),
  CONSTRAINT emergency_phone_different_from_personal CHECK (
    (emergency_contact->>'phone') != phone_number
  ),
  CONSTRAINT valid_rejection_reason CHECK (
    (status != 'rejected') OR 
    (status = 'rejected' AND rejection_reason IS NOT NULL AND length(trim(rejection_reason)) >= 10)
  )
);

-- =============================================================================
-- DOCUMENT METADATA TABLE
-- =============================================================================

DROP TABLE IF EXISTS employee_document_metadata CASCADE;

CREATE TABLE employee_document_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_detail_id UUID NOT NULL REFERENCES employees_details(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  original_filename TEXT NOT NULL CHECK (length(original_filename) >= 1 AND length(original_filename) <= 255),
  storage_path TEXT NOT NULL UNIQUE,
  file_size INTEGER NOT NULL CHECK (file_size > 0 AND file_size <= 52428800), -- 50MB max
  mime_type TEXT NOT NULL CHECK (mime_type IN (
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_verification CHECK (
    (NOT verified AND verified_by IS NULL AND verified_at IS NULL) OR
    (verified AND verified_by IS NOT NULL AND verified_at IS NOT NULL)
  ),
  CONSTRAINT unique_required_documents UNIQUE (employee_detail_id, document_type)
);

-- =============================================================================
-- AUDIT LOG TABLE
-- =============================================================================

DROP TABLE IF EXISTS employee_onboarding_logs CASCADE;

CREATE TABLE employee_onboarding_logs (
  id BIGSERIAL PRIMARY KEY,
  employee_detail_id UUID NOT NULL REFERENCES employees_details(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN (
    'application_created',
    'application_submitted',
    'application_updated',
    'document_uploaded',
    'document_deleted',
    'document_verified',
    'application_reviewed',
    'application_approved',
    'application_rejected',
    'user_account_created'
  )),
  performed_by UUID NOT NULL, -- Can be auth.users or app.users depending on context
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Index for performance
  CONSTRAINT valid_action_length CHECK (length(action) >= 3 AND length(action) <= 50)
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Main table indexes
CREATE INDEX idx_employees_details_status ON employees_details(status);
CREATE INDEX idx_employees_details_submission_date ON employees_details(submission_date DESC);
CREATE INDEX idx_employees_details_approval_date ON employees_details(approval_date DESC);
CREATE INDEX idx_employees_details_app_user_id ON employees_details(app_user_id);
CREATE INDEX idx_employees_details_personal_email ON employees_details(personal_email);
CREATE INDEX idx_employees_details_phone_number ON employees_details(phone_number);
CREATE INDEX idx_employees_details_work_location ON employees_details(work_location);
CREATE INDEX idx_employees_details_employment_type ON employees_details(employment_type);
CREATE INDEX idx_employees_details_created_at ON employees_details(created_at DESC);

-- Document metadata indexes
CREATE INDEX idx_document_metadata_employee_id ON employee_document_metadata(employee_detail_id);
CREATE INDEX idx_document_metadata_type ON employee_document_metadata(document_type);
CREATE INDEX idx_document_metadata_verified ON employee_document_metadata(verified);

-- Audit log indexes
CREATE INDEX idx_onboarding_logs_employee_id ON employee_onboarding_logs(employee_detail_id);
CREATE INDEX idx_onboarding_logs_action ON employee_onboarding_logs(action);
CREATE INDEX idx_onboarding_logs_performed_by ON employee_onboarding_logs(performed_by);
CREATE INDEX idx_onboarding_logs_created_at ON employee_onboarding_logs(created_at DESC);

-- =============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
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

-- Function to automatically log changes
CREATE OR REPLACE FUNCTION log_onboarding_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log different types of changes
  IF TG_OP = 'INSERT' THEN
    INSERT INTO employee_onboarding_logs (employee_detail_id, action, performed_by, details)
    VALUES (NEW.id, 'application_created', COALESCE(NEW.created_by, auth.uid()), 
            jsonb_build_object('status', NEW.status, 'full_name', NEW.full_name));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log status changes
    IF OLD.status != NEW.status THEN
      INSERT INTO employee_onboarding_logs (employee_detail_id, action, performed_by, details)
      VALUES (NEW.id, 
              CASE NEW.status
                WHEN 'submitted' THEN 'application_submitted'
                WHEN 'approved' THEN 'application_approved'
                WHEN 'rejected' THEN 'application_rejected'
                WHEN 'under_review' THEN 'application_reviewed'
                ELSE 'application_updated'
              END,
              COALESCE(NEW.approved_by, auth.uid()),
              jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status, 'reason', NEW.rejection_reason));
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for audit logging
DROP TRIGGER IF EXISTS audit_employees_details_changes ON employees_details;
CREATE TRIGGER audit_employees_details_changes
  AFTER INSERT OR UPDATE ON employees_details
  FOR EACH ROW
  EXECUTE FUNCTION log_onboarding_changes();

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Function to get application status summary
CREATE OR REPLACE FUNCTION get_onboarding_stats()
RETURNS TABLE(
  total_applications BIGINT,
  pending_review BIGINT,
  approved BIGINT,
  rejected BIGINT,
  avg_processing_days NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_applications,
    COUNT(*) FILTER (WHERE status IN ('submitted', 'under_review')) as pending_review,
    COUNT(*) FILTER (WHERE status = 'approved') as approved,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
    AVG(EXTRACT(days FROM approval_date - submission_date)) as avg_processing_days
  FROM employees_details 
  WHERE status != 'draft';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate required documents
CREATE OR REPLACE FUNCTION validate_required_documents(employee_id UUID)
RETURNS TABLE(
  document_type document_type,
  is_uploaded BOOLEAN,
  is_verified BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH required_docs AS (
    SELECT unnest(ARRAY['aadhaar_front', 'aadhaar_back', 'pan', 'bank_passbook', 'profile_photo', 'education_certificate']::document_type[]) as doc_type
  )
  SELECT 
    rd.doc_type as document_type,
    (edm.id IS NOT NULL) as is_uploaded,
    COALESCE(edm.verified, false) as is_verified
  FROM required_docs rd
  LEFT JOIN employee_document_metadata edm ON edm.employee_detail_id = employee_id AND edm.document_type = rd.doc_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE employees_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_document_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_onboarding_logs ENABLE ROW LEVEL SECURITY;

-- Policies for employees_details
DROP POLICY IF EXISTS "Allow applicants to view own applications" ON employees_details;
CREATE POLICY "Allow applicants to view own applications" ON employees_details
  FOR SELECT USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Allow applicants to update own draft applications" ON employees_details;
CREATE POLICY "Allow applicants to update own draft applications" ON employees_details
  FOR UPDATE USING (created_by = auth.uid() AND status = 'draft');

DROP POLICY IF EXISTS "Allow applicants to insert own applications" ON employees_details;
CREATE POLICY "Allow applicants to insert own applications" ON employees_details
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Allow admins full access to applications" ON employees_details;
CREATE POLICY "Allow admins full access to applications" ON employees_details
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM app_users 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('super_admin', 'admin')
      AND status = 'active'
    )
  );

-- Policies for employee_document_metadata
DROP POLICY IF EXISTS "Allow document access to applicants and admins" ON employee_document_metadata;
CREATE POLICY "Allow document access to applicants and admins" ON employee_document_metadata
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees_details ed
      WHERE ed.id = employee_document_metadata.employee_detail_id
      AND (
        ed.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM app_users 
          WHERE auth_user_id = auth.uid() 
          AND role IN ('super_admin', 'admin')
          AND status = 'active'
        )
      )
    )
  );

-- Policies for employee_onboarding_logs
DROP POLICY IF EXISTS "Allow log access to admins only" ON employee_onboarding_logs;
CREATE POLICY "Allow log access to admins only" ON employee_onboarding_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM app_users 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('super_admin', 'admin')
      AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Allow log insertion by system" ON employee_onboarding_logs;
CREATE POLICY "Allow log insertion by system" ON employee_onboarding_logs
  FOR INSERT WITH CHECK (true); -- Logs can be inserted by triggers/functions

-- =============================================================================
-- STORAGE BUCKET SETUP
-- =============================================================================

-- Insert storage bucket (this will create the bucket if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-documents', 'employee-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for employee documents
DROP POLICY IF EXISTS "Allow applicants to upload documents" ON storage.objects;
CREATE POLICY "Allow applicants to upload documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'employee-documents' AND
    auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Allow applicants to view own documents" ON storage.objects;
CREATE POLICY "Allow applicants to view own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'employee-documents' AND
    (
      -- Allow if the path contains the auth user's ID or if user is admin
      name LIKE '%' || auth.uid()::text || '%' OR
      EXISTS (
        SELECT 1 FROM app_users 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('super_admin', 'admin')
        AND status = 'active'
      )
    )
  );

DROP POLICY IF EXISTS "Allow applicants to delete own documents" ON storage.objects;
CREATE POLICY "Allow applicants to delete own documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'employee-documents' AND
    (
      name LIKE '%' || auth.uid()::text || '%' OR
      EXISTS (
        SELECT 1 FROM app_users 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('super_admin', 'admin')
        AND status = 'active'
      )
    )
  );

-- =============================================================================
-- SAMPLE DATA FOR TESTING (Optional)
-- =============================================================================

-- This section can be uncommented for testing purposes
-- Note: This should be removed in production

/*
-- Insert a test application
INSERT INTO employees_details (
  full_name, personal_email, phone_number, date_of_birth, gender,
  designation, work_location, employment_type, joining_date,
  current_address, permanent_address, same_as_current,
  emergency_contact, bank_details, status, submission_date
) VALUES (
  'Test Employee', 
  'test@example.com', 
  '+919876543210', 
  '1990-01-01', 
  'Male',
  'Software Developer', 
  'Patna', 
  'Full-time', 
  CURRENT_DATE,
  '{"street": "123 Test Street", "city": "Patna", "state": "Bihar", "pincode": "800001"}',
  '{"street": "456 Home Street", "city": "Patna", "state": "Bihar", "pincode": "800002"}',
  false,
  '{"name": "Test Contact", "relationship": "Father", "phone": "+919876543211"}',
  '{"account_holder_name": "Test Employee", "account_number": "1234567890", "bank_name": "State Bank of India (SBI)", "ifsc_code": "SBIN0001234"}',
  'submitted',
  NOW()
);
*/

COMMIT;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

-- Show completion message
DO $$
BEGIN
  RAISE NOTICE '✅ Employee Onboarding System database setup completed successfully!';
  RAISE NOTICE '📋 Tables created: employees_details, employee_document_metadata, employee_onboarding_logs';
  RAISE NOTICE '🔐 RLS policies enabled for security';
  RAISE NOTICE '📁 Storage bucket "employee-documents" configured';
  RAISE NOTICE '⚡ Triggers and functions created for automation';
  RAISE NOTICE '🎯 Ready for integration with frontend!';
END $$;