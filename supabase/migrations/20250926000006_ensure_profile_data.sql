-- Ensure profile data is correctly set up for all users
-- This will fix any missing profile data issues

-- First, let's see what we have in the tables
SELECT 'Current auth users:' as info;
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;

SELECT 'Current app users:' as info;
SELECT id, auth_user_id, email, role, status, full_name, created_at FROM app_users ORDER BY created_at DESC;

SELECT 'Current employee details:' as info;
SELECT id, personal_email, full_name, employee_id, created_at FROM employees_details ORDER BY created_at DESC LIMIT 5;

-- Fix any missing app_user records for existing auth users
INSERT INTO app_users (id, auth_user_id, email, role, status, full_name)
SELECT
  gen_random_uuid() as id,
  auth.id as auth_user_id,
  auth.email,
  'super_admin' as role,
  'active' as status,
  COALESCE(auth.raw_user_meta_data->>'full_name', split_part(auth.email, '@', 1)) as full_name
FROM auth.users auth
WHERE NOT EXISTS (
  SELECT 1 FROM app_users au
  WHERE au.auth_user_id = auth.id OR au.email = auth.email
)
ON CONFLICT DO NOTHING;

-- Update existing app users to ensure they have auth_user_id linked
UPDATE app_users
SET auth_user_id = (
  SELECT auth.id
  FROM auth.users auth
  WHERE auth.email = app_users.email
)
WHERE auth_user_id IS NULL
  AND EXISTS (
    SELECT 1 FROM auth.users auth
    WHERE auth.email = app_users.email
  );

-- Ensure at least one user is super_admin
UPDATE app_users
SET role = 'super_admin', status = 'active'
WHERE id = (
  SELECT id FROM app_users
  WHERE auth_user_id IS NOT NULL
  ORDER BY created_at ASC
  LIMIT 1
);

-- Create employee_details records for users who don't have them
INSERT INTO employees_details (
  id,
  personal_email,
  full_name,
  employee_id,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid() as id,
  au.email as personal_email,
  au.full_name,
  'EMP-' || LPAD(nextval('employees_details_id_seq'::regclass)::text, 4, '0') as employee_id,
  NOW() as created_at,
  NOW() as updated_at
FROM app_users au
WHERE NOT EXISTS (
  SELECT 1 FROM employees_details ed
  WHERE ed.personal_email = au.email
)
AND au.auth_user_id IS NOT NULL
ON CONFLICT (personal_email) DO NOTHING;

-- Show final results
SELECT 'FINAL RESULTS:' as status;

SELECT 'Auth users with app_users:' as info;
SELECT
  auth.id as auth_id,
  auth.email as auth_email,
  au.id as app_user_id,
  au.role,
  au.status,
  au.full_name
FROM auth.users auth
LEFT JOIN app_users au ON au.auth_user_id = auth.id
ORDER BY auth.created_at DESC;

SELECT 'App users with employee details:' as info;
SELECT
  au.id as app_user_id,
  au.email as app_email,
  au.role,
  au.status,
  au.full_name as app_full_name,
  ed.id as employee_id,
  ed.full_name as employee_full_name,
  ed.employee_id
FROM app_users au
LEFT JOIN employees_details ed ON ed.personal_email = au.email
WHERE au.auth_user_id IS NOT NULL
ORDER BY au.created_at DESC;