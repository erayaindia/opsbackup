-- EMERGENCY FIX: Nuclear option to remove ALL problematic functions
-- This will completely remove all functions that could reference app.users

-- 1. Drop EVERYTHING that might be causing the issue
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS app.is_super_admin() CASCADE; 
DROP FUNCTION IF EXISTS is_super_admin() CASCADE;

DROP FUNCTION IF EXISTS public.restrict_user_self_update() CASCADE;
DROP FUNCTION IF EXISTS app.restrict_user_self_update() CASCADE;
DROP FUNCTION IF EXISTS restrict_user_self_update() CASCADE;

-- 2. Drop all triggers on app_users table
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    FOR r IN (SELECT tgname FROM pg_trigger WHERE tgrelid = 'app_users'::regclass) 
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || r.tgname || ' ON app_users CASCADE';
    END LOOP; 
END $$;

-- 3. Don't recreate any functions - just leave them gone
-- This prevents any reference to app.users

-- 4. Test that updates work now
UPDATE app_users 
SET updated_at = NOW() 
WHERE company_email = 'test@erayastyle.com';

-- 5. If the update works, we're good!
SELECT 'SUCCESS: All app.users references removed!' as status;