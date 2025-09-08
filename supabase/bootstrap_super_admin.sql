-- Phase 1.1: Bootstrap First Super Admin
-- Run this in Supabase SQL Editor after Phase 1 migration

-- ============================================================================= 
-- INSTRUCTIONS:
-- 1. Replace <AUTH_USER_ID> with your actual Supabase Auth user ID
-- 2. Replace <FULL_NAME> with your name (e.g., 'Rishav Darsh')
-- 3. Replace <COMPANY_EMAIL> with your company email (e.g., 'rishav@erayastyle.com')
-- 4. Run this SQL in Supabase SQL Editor
-- =============================================================================

-- Insert your super admin profile
INSERT INTO app.users (
  auth_user_id, 
  full_name, 
  company_email, 
  role, 
  status, 
  department,
  designation,
  work_location,
  employment_type,
  module_access
) VALUES (
  '<AUTH_USER_ID>'::uuid,     -- Replace with your auth.users.id
  '<FULL_NAME>',              -- e.g., 'Rishav Darsh'  
  '<COMPANY_EMAIL>',          -- e.g., 'rishav@erayastyle.com'
  'super_admin',
  'active',
  'Admin',
  'Founder & CEO',            -- Optional: update as needed
  'Patna',                    -- or 'Delhi' / 'Remote'
  'Full-time',
  ARRAY['content', 'orders', 'support', 'fulfillment', 'marketing', 'finance', 'admin', 'ops', 'hr', 'it']
);

-- ============================================================================= 
-- VERIFICATION QUERIES
-- Run these to verify your super admin was created correctly
-- =============================================================================

-- 1. Check your super admin record
SELECT 
  id, 
  full_name, 
  company_email, 
  role, 
  status, 
  department,
  module_access,
  created_at
FROM app.users 
WHERE role = 'super_admin';

-- 2. Test helper function (should return true now)
SELECT app.is_super_admin() as am_i_super_admin;

-- 3. Test active user function (should return true)
SELECT app.is_active_user() as am_i_active;

-- ============================================================================= 
-- HOW TO GET YOUR AUTH_USER_ID
-- If you don't know your auth_user_id, run this while logged in:
-- =============================================================================

-- This will show your current auth user ID
SELECT auth.uid() as my_auth_user_id;

-- Or check the auth.users table directly
SELECT 
  id as auth_user_id,
  email,
  created_at
FROM auth.users 
WHERE email = '<YOUR_EMAIL_HERE>';

-- ============================================================================= 
-- EXAMPLE (with placeholder values):
-- =============================================================================

-- INSERT INTO app.users (
--   auth_user_id, 
--   full_name, 
--   company_email, 
--   role, 
--   status, 
--   department,
--   designation,
--   module_access
-- ) VALUES (
--   'b7bdc18e-7f63-4f47-891a-38c262477632'::uuid,
--   'Rishav Darsh',
--   'rishav@erayastyle.com',
--   'super_admin',
--   'active',
--   'Admin',
--   'Founder & CEO',
--   ARRAY['content', 'orders', 'support', 'fulfillment', 'marketing', 'finance', 'admin', 'ops', 'hr', 'it']
-- );

-- =============================================================================