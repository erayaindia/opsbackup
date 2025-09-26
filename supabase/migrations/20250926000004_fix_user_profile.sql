-- Fix user profile and ensure super admin role is set correctly
-- This will help debug and fix the profile loading issue

-- First, let's see what's in your auth.users table and app_users table
-- Run these queries one by one to debug:

-- 1. Check current auth user
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- 2. Check app_users table to see the relationship
SELECT id, auth_user_id, email, role, status, full_name FROM app_users;

-- 3. Update the current user to be super_admin (replace with your actual auth user ID)
-- First, we need to find your auth user ID and update the corresponding app_users record

-- If you know your email, you can update like this:
-- UPDATE app_users
-- SET role = 'super_admin', status = 'active'
-- WHERE email = 'your-email@domain.com';

-- Or if you want to make the first admin user a super_admin:
UPDATE app_users
SET role = 'super_admin', status = 'active'
WHERE id = (
  SELECT id FROM app_users
  ORDER BY created_at ASC
  LIMIT 1
);

-- Also ensure the auth_user_id is properly linked
-- This query will show any mismatched records:
SELECT
  au.id as app_user_id,
  au.auth_user_id,
  au.email as app_email,
  au.role,
  au.status,
  auth.email as auth_email,
  auth.id as auth_id
FROM app_users au
FULL OUTER JOIN auth.users auth ON au.auth_user_id = auth.id
WHERE au.auth_user_id IS NULL OR auth.id IS NULL OR au.email != auth.email;