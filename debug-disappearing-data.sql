-- Debug script for disappearing shot list data
-- Run this step by step in Supabase SQL editor

-- 1. First, let's see what's currently in the shot_list table
SELECT 
    id,
    content_id,
    shot_number,
    description,
    camera,
    action,
    created_at
FROM shot_list 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. Check if there are any triggers that might be deleting data
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'shot_list';

-- 3. Check RLS policies on shot_list (especially SELECT policies)
SELECT 
    tablename,
    policyname,
    cmd,
    roles,
    qual as "Policy Condition"
FROM pg_policies 
WHERE tablename = 'shot_list'
ORDER BY cmd, policyname;

-- 4. Test if the current user can see shot_list data
-- Replace with your actual content_id
SET LOCAL row_security = on;
SELECT 
    id,
    content_id,
    shot_number,
    description,
    created_at
FROM shot_list 
WHERE content_id = '5f1fd377-7d45-4216-b95f-68e2c87cb2f1';

-- 5. Check if there are any cascading deletes or foreign key issues
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'shot_list';

-- 6. Test manual insert to see if it persists
-- Replace with your actual content_id
INSERT INTO shot_list (
    content_id,
    shot_number,
    description,
    camera,
    action,
    created_at
) VALUES (
    '5f1fd377-7d45-4216-b95f-68e2c87cb2f1',
    999,
    'DEBUG TEST SHOT - DO NOT DELETE',
    'Test camera',
    'Test action',
    NOW()
);

-- 7. Immediately check if the test insert is visible
SELECT 
    id,
    content_id,
    shot_number,
    description,
    created_at
FROM shot_list 
WHERE description = 'DEBUG TEST SHOT - DO NOT DELETE';

-- 8. Check database logs for any deletion activity (if available)
-- This might not work depending on your Supabase plan
-- SELECT * FROM pg_stat_user_tables WHERE relname = 'shot_list';