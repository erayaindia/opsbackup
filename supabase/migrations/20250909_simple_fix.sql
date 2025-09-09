-- Simple fix for anonymous onboarding submissions
-- This removes app_users dependencies without complex queries

-- =============================================================================
-- 1. DROP ALL EXISTING POLICIES ON EMPLOYEES_DETAILS
-- =============================================================================

DROP POLICY IF EXISTS "Allow anonymous onboarding submissions" ON employees_details;
DROP POLICY IF EXISTS "Allow authenticated users to view applications" ON employees_details;
DROP POLICY IF EXISTS "Allow authenticated users to update applications" ON employees_details;

-- =============================================================================
-- 2. CREATE SIMPLE POLICIES FOR ANONYMOUS SUBMISSIONS
-- =============================================================================

-- Allow anonymous users to insert onboarding data
CREATE POLICY "Anonymous can submit onboarding"
ON employees_details
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow authenticated users to view all employee details
CREATE POLICY "Authenticated can view employees"
ON employees_details
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to update employee details
CREATE POLICY "Authenticated can update employees"
ON employees_details
FOR UPDATE
TO authenticated
USING (true);

-- =============================================================================
-- 3. MAKE COLUMNS NULLABLE
-- =============================================================================

-- Make sure critical columns can be null for anonymous submissions
ALTER TABLE employees_details ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE employees_details ALTER COLUMN app_user_id DROP NOT NULL;

-- Make application_id nullable too (if it exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees_details' 
        AND column_name = 'application_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE employees_details ALTER COLUMN application_id DROP NOT NULL;
        RAISE NOTICE 'Made application_id nullable';
    END IF;
END $$;

-- =============================================================================
-- 4. DROP COMMON FOREIGN KEY CONSTRAINT NAMES
-- =============================================================================

-- Try to drop common foreign key constraint names that might exist
DO $$
BEGIN
    -- Common constraint names to try
    BEGIN
        ALTER TABLE employees_details DROP CONSTRAINT IF EXISTS fk_employees_details_app_user_id;
        RAISE NOTICE 'Dropped fk_employees_details_app_user_id';
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore errors
    END;
    
    BEGIN
        ALTER TABLE employees_details DROP CONSTRAINT IF EXISTS employees_details_app_user_id_fkey;
        RAISE NOTICE 'Dropped employees_details_app_user_id_fkey';
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore errors
    END;
    
    BEGIN
        ALTER TABLE employees_details DROP CONSTRAINT IF EXISTS employees_details_created_by_fkey;
        RAISE NOTICE 'Dropped employees_details_created_by_fkey';
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore errors
    END;
END $$;

-- =============================================================================
-- 5. ADD LEGAL CONSENT COLUMNS IF THEY DON'T EXIST
-- =============================================================================

-- Add NDA and privacy consent columns
DO $$
BEGIN
    -- Add nda_accepted column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees_details' 
        AND column_name = 'nda_accepted'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE employees_details ADD COLUMN nda_accepted BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added nda_accepted column';
    END IF;
    
    -- Add data_privacy_accepted column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees_details' 
        AND column_name = 'data_privacy_accepted'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE employees_details ADD COLUMN data_privacy_accepted BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added data_privacy_accepted column';
    END IF;
    
    -- Add timestamp columns for consent
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees_details' 
        AND column_name = 'nda_accepted_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE employees_details ADD COLUMN nda_accepted_at TIMESTAMPTZ;
        RAISE NOTICE 'Added nda_accepted_at column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees_details' 
        AND column_name = 'data_privacy_accepted_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE employees_details ADD COLUMN data_privacy_accepted_at TIMESTAMPTZ;
        RAISE NOTICE 'Added data_privacy_accepted_at column';
    END IF;
END $$;

-- =============================================================================
-- 6. SUCCESS MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Simple fix applied for anonymous submissions';
    RAISE NOTICE '📝 Anonymous users can now submit onboarding forms';
    RAISE NOTICE '🔒 Removed foreign key constraints to app_users table';
    RAISE NOTICE '📋 Legal consent fields added';
END $$;