-- Fix profile data setup with correct column names
-- First let's see the actual schema

SELECT 'app_users table schema:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'app_users'
ORDER BY ordinal_position;

SELECT 'employees_details table schema:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'employees_details'
ORDER BY ordinal_position;

-- Check current data
SELECT 'Current app users:' as info;
SELECT * FROM app_users LIMIT 5;

SELECT 'Current employee details:' as info;
SELECT * FROM employees_details LIMIT 5;

SELECT 'Current auth users:' as info;
SELECT id, email FROM auth.users LIMIT 5;