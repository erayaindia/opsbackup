-- Manual fix for missing auth_user_id links
-- Run these SQL commands directly in Supabase SQL Editor

-- First, let's check what users need fixing
SELECT 
    id,
    full_name,
    company_email,
    auth_user_id
FROM app_users 
WHERE auth_user_id IS NULL;

-- To fix the links, you need to:
-- 1. Find the auth_user_id for each email in the Authentication > Users section
-- 2. Run UPDATE commands like this:

-- Example for hello@erayastyle.com (replace 'ACTUAL_AUTH_USER_ID' with the real ID):
-- UPDATE app_users 
-- SET auth_user_id = 'ACTUAL_AUTH_USER_ID', updated_at = NOW()
-- WHERE company_email = 'hello@erayastyle.com';

-- Example for erayaemployee@erayastyle.com (replace 'ACTUAL_AUTH_USER_ID' with the real ID):
-- UPDATE app_users 
-- SET auth_user_id = 'ACTUAL_AUTH_USER_ID', updated_at = NOW() 
-- WHERE company_email = 'erayaemployee@erayastyle.com';

-- After fixing, verify the links:
SELECT 
    id,
    full_name, 
    company_email,
    auth_user_id,
    CASE 
        WHEN auth_user_id IS NOT NULL THEN 'LINKED' 
        ELSE 'NOT LINKED' 
    END as status
FROM app_users 
ORDER BY full_name;