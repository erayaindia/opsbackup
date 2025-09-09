-- Create separate table for anonymous onboarding submissions
-- This completely bypasses any issues with employees_details table

-- =============================================================================
-- 1. CREATE ANONYMOUS ONBOARDING TABLE
-- =============================================================================

-- Create a separate table for anonymous submissions that doesn't have any constraints to app_users
CREATE TABLE IF NOT EXISTS anonymous_onboarding_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Information
    full_name TEXT NOT NULL,
    personal_email TEXT NOT NULL,
    phone_number TEXT,
    date_of_birth DATE,
    gender TEXT,
    
    -- Work Details
    designation TEXT,
    work_location TEXT NOT NULL,
    employment_type TEXT NOT NULL,
    joining_date DATE,
    
    -- Addresses (JSON)
    current_address JSONB,
    permanent_address JSONB,
    same_as_current BOOLEAN DEFAULT FALSE,
    
    -- Emergency Contact (JSON)
    emergency_contact JSONB,
    
    -- Bank Details (JSON)
    bank_details JSONB,
    
    -- Documents (JSON array)
    documents JSONB DEFAULT '[]'::jsonb,
    
    -- Additional Info
    notes TEXT,
    
    -- Legal Consents
    nda_accepted BOOLEAN DEFAULT FALSE,
    data_privacy_accepted BOOLEAN DEFAULT FALSE,
    nda_accepted_at TIMESTAMPTZ,
    data_privacy_accepted_at TIMESTAMPTZ,
    
    -- Status and Timestamps
    status TEXT DEFAULT 'submitted',
    submission_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Processing Info (filled when admin processes the application)
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMPTZ,
    migrated_to_employees_details_id UUID,
    
    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('submitted', 'processing', 'approved', 'rejected')),
    CONSTRAINT valid_gender CHECK (gender IN ('Male', 'Female')),
    CONSTRAINT consents_required CHECK (nda_accepted = true AND data_privacy_accepted = true)
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_anonymous_submissions_status ON anonymous_onboarding_submissions(status);
CREATE INDEX IF NOT EXISTS idx_anonymous_submissions_email ON anonymous_onboarding_submissions(personal_email);
CREATE INDEX IF NOT EXISTS idx_anonymous_submissions_created ON anonymous_onboarding_submissions(created_at);

-- =============================================================================
-- 2. CREATE RLS POLICIES FOR ANONYMOUS SUBMISSIONS TABLE
-- =============================================================================

-- Enable RLS on the new table
ALTER TABLE anonymous_onboarding_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert submissions
CREATE POLICY "Anonymous users can submit applications"
ON anonymous_onboarding_submissions
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow authenticated users to view all submissions (for admin)
CREATE POLICY "Authenticated users can view submissions"
ON anonymous_onboarding_submissions
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to update submissions (for processing)
CREATE POLICY "Authenticated users can update submissions"
ON anonymous_onboarding_submissions
FOR UPDATE
TO authenticated
USING (true);

-- =============================================================================
-- 3. CREATE FUNCTION TO MIGRATE APPROVED SUBMISSIONS
-- =============================================================================

-- Function to migrate approved anonymous submission to employees_details
CREATE OR REPLACE FUNCTION migrate_anonymous_submission_to_employees(
    submission_id UUID,
    admin_user_id UUID
) RETURNS UUID AS $$
DECLARE
    submission_record RECORD;
    new_employee_id UUID;
BEGIN
    -- Get the anonymous submission
    SELECT * INTO submission_record
    FROM anonymous_onboarding_submissions
    WHERE id = submission_id AND status = 'submitted';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Submission not found or already processed';
    END IF;
    
    -- Insert into employees_details (this will be done by admin with proper permissions)
    INSERT INTO employees_details (
        full_name, personal_email, phone_number, date_of_birth, gender,
        designation, work_location, employment_type, joining_date,
        current_address, permanent_address, same_as_current,
        emergency_contact, bank_details, documents, notes,
        nda_accepted, data_privacy_accepted, nda_accepted_at, data_privacy_accepted_at,
        status, submission_date, created_by
    ) VALUES (
        submission_record.full_name, submission_record.personal_email, 
        submission_record.phone_number, submission_record.date_of_birth, submission_record.gender,
        submission_record.designation, submission_record.work_location, 
        submission_record.employment_type, submission_record.joining_date,
        submission_record.current_address, submission_record.permanent_address, 
        submission_record.same_as_current,
        submission_record.emergency_contact, submission_record.bank_details, 
        submission_record.documents, submission_record.notes,
        submission_record.nda_accepted, submission_record.data_privacy_accepted,
        submission_record.nda_accepted_at, submission_record.data_privacy_accepted_at,
        'migrated_from_anonymous', submission_record.submission_date, admin_user_id
    ) RETURNING id INTO new_employee_id;
    
    -- Update the anonymous submission to mark it as processed
    UPDATE anonymous_onboarding_submissions
    SET 
        status = 'processing',
        processed_by = admin_user_id,
        processed_at = NOW(),
        migrated_to_employees_details_id = new_employee_id,
        updated_at = NOW()
    WHERE id = submission_id;
    
    RETURN new_employee_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 4. SUCCESS MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Anonymous onboarding submissions table created';
    RAISE NOTICE '📝 Anonymous users can now submit directly to anonymous_onboarding_submissions';
    RAISE NOTICE '👨‍💼 Admins can migrate submissions to employees_details when processing';
    RAISE NOTICE '🔒 No dependencies on app_users table for anonymous submissions';
END $$;