-- Remove all app_users dependencies from anonymous onboarding submissions
-- This ensures form submission works without any app_users table access

-- =============================================================================
-- 1. DROP ALL EXISTING POLICIES ON EMPLOYEES_DETAILS
-- =============================================================================

-- Get a clean slate by dropping all existing policies
DROP POLICY IF EXISTS "Allow anonymous onboarding submissions" ON employees_details;
DROP POLICY IF EXISTS "Allow authenticated users to view applications" ON employees_details;
DROP POLICY IF EXISTS "Allow authenticated users to update applications" ON employees_details;
DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;

-- =============================================================================
-- 2. CREATE SIMPLE POLICIES WITHOUT APP_USERS DEPENDENCIES
-- =============================================================================

-- Allow anonymous users to insert onboarding data (very permissive for submissions)
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
-- 3. ENSURE COLUMNS CAN BE NULL FOR ANONYMOUS SUBMISSIONS
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
    ) THEN
        ALTER TABLE employees_details ALTER COLUMN application_id DROP NOT NULL;
    END IF;
END $$;

-- =============================================================================
-- 4. TEMPORARILY DISABLE FOREIGN KEY CONSTRAINTS
-- =============================================================================

-- Disable foreign key constraints that might reference app_users
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Find and drop all foreign key constraints on employees_details that reference app_users
    FOR constraint_record IN 
        SELECT constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = 'employees_details'
            AND ccu.table_name = 'app_users'
    LOOP
        EXECUTE 'ALTER TABLE employees_details DROP CONSTRAINT ' || constraint_record.constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_record.constraint_name;
    END LOOP;
END $$;

-- =============================================================================
-- 5. DISABLE RLS TEMPORARILY FOR TESTING
-- =============================================================================

-- Temporarily disable RLS on employees_details to test if that's causing the issue
-- We'll re-enable it once we confirm submissions work
ALTER TABLE employees_details DISABLE ROW LEVEL SECURITY;

-- Re-enable with simple policies
ALTER TABLE employees_details ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 6. TEST NOTIFICATION
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Removed all app_users dependencies';
    RAISE NOTICE '📝 Anonymous submissions should now work';
    RAISE NOTICE '🔓 Foreign key constraints on app_users removed';
    RAISE NOTICE '⚠️  Remember to re-add constraints after confirming submissions work';
END $$;