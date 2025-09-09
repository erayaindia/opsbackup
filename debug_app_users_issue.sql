-- Debug: Check what's causing the app_users permission issue
-- Run this SQL in Supabase to identify the problem

-- 1. Check foreign key constraints on employees_details table
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='employees_details';

-- 2. Check all RLS policies on employees_details table
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'employees_details';

-- 3. Check triggers on employees_details table
SELECT trigger_name, event_manipulation, action_statement, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'employees_details'
    AND event_object_schema = 'public';

-- 4. Check if there are any functions that might be triggered
SELECT routine_name, routine_type, routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_definition ILIKE '%employees_details%'
    AND routine_definition ILIKE '%app_users%';

-- 5. Check the exact structure of employees_details table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'employees_details' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Test if we can insert into employees_details without referencing app_users
-- This is just a test query - don't actually run this, just to see if the structure allows it
SELECT 'Test query - can we insert basic employee details?' as test_purpose;

-- 7. Check if app_user_id column has any constraints
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_name = 'employees_details' 
    AND kcu.column_name = 'app_user_id';