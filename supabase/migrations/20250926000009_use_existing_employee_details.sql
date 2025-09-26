-- Use existing employee_details table and fix profile loading
-- First, let's see what's in employee_details table

SELECT 'Current employee_details table structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'employees_details'
ORDER BY ordinal_position;

SELECT 'Current employee_details data:' as info;
SELECT * FROM employees_details LIMIT 5;

-- Check if we need to add any missing columns to employee_details
-- Add auth_user_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'employees_details' AND column_name = 'auth_user_id') THEN
        ALTER TABLE employees_details ADD COLUMN auth_user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Add role column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'employees_details' AND column_name = 'role') THEN
        ALTER TABLE employees_details ADD COLUMN role TEXT DEFAULT 'employee'
        CHECK (role IN ('employee', 'admin', 'manager', 'team_lead', 'super_admin'));
    END IF;
END $$;

-- Add status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'employees_details' AND column_name = 'status') THEN
        ALTER TABLE employees_details ADD COLUMN status TEXT DEFAULT 'active'
        CHECK (status IN ('active', 'inactive', 'pending'));
    END IF;
END $$;

-- Update your user record to be super_admin
UPDATE employees_details
SET
    auth_user_id = '384c0dad-f79b-44cb-a752-3b289902fa9e',
    role = 'super_admin',
    status = 'active'
WHERE personal_email = 'rishav@erayastyle.com'
   OR company_email = 'rishav@erayastyle.com'
   OR email = 'rishav@erayastyle.com';

-- If no record exists, create one
INSERT INTO employees_details (
    auth_user_id,
    personal_email,
    company_email,
    full_name,
    employee_id,
    role,
    status,
    created_at,
    updated_at
)
SELECT
    '384c0dad-f79b-44cb-a752-3b289902fa9e',
    'rishav@erayastyle.com',
    'rishav@erayastyle.com',
    'Rishav',
    'EMP-0001',
    'super_admin',
    'active',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM employees_details
    WHERE personal_email = 'rishav@erayastyle.com'
       OR company_email = 'rishav@erayastyle.com'
       OR email = 'rishav@erayastyle.com'
);

-- Enable RLS and create permissive policy
ALTER TABLE employees_details ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and create new ones
DROP POLICY IF EXISTS "employees_details_all_access" ON employees_details;
CREATE POLICY "employees_details_all_access" ON employees_details
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON employees_details TO authenticated;

-- Show final results
SELECT 'FINAL RESULTS - employees_details:' as status;
SELECT * FROM employees_details WHERE personal_email = 'rishav@erayastyle.com' OR company_email = 'rishav@erayastyle.com' OR email = 'rishav@erayastyle.com';