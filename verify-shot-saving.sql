-- Verification script to ensure shot data is saving correctly
-- Run this in your Supabase SQL editor to debug the issue

-- 1. Check if the new columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'shot_list' 
AND column_name IN ('props', 'talent', 'lighting_notes')
ORDER BY column_name;

-- 2. Check current data in these columns
SELECT 
    id,
    shot_number,
    description,
    talent,
    lighting_notes,
    props,
    location,
    created_at
FROM shot_list 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Test insert with new fields (replace content_id with your actual content ID)
-- First, let's see what content_ids exist:
SELECT id, title FROM content_items LIMIT 5;

-- 4. Test manual insert (REPLACE 'your-content-id' with actual ID from above)
/*
INSERT INTO shot_list (
    content_id,
    shot_number,
    description,
    talent,
    lighting_notes,
    props,
    location,
    camera,
    action,
    background,
    completed,
    order_index
) VALUES (
    'your-content-id', -- Replace this
    999,
    'Manual test shot',
    'Test talent/model',
    'Test lighting notes - soft light',
    ARRAY['test prop 1', 'test prop 2'],
    'Test location',
    'Wide shot',
    'Test action',
    'Test background',
    false,
    0
);
*/

-- 5. Verify the insert worked
SELECT 
    shot_number,
    description,
    talent,
    lighting_notes,
    props,
    location
FROM shot_list 
WHERE shot_number = 999;

-- 6. Check for any constraints or triggers that might be preventing inserts
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'shot_list';

-- 7. Check RLS policies (if enabled)
SELECT 
    schemaname,
    tablename,
    policyname,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'shot_list';

-- 8. Check for any recent errors in logs (if you have access)
-- This helps identify if there are permission issues

-- DEBUGGING TIPS:
-- 1. If columns don't exist, run the migration SQL first
-- 2. If manual insert fails, check the error message
-- 3. If RLS is enabled, make sure your policies allow INSERT
-- 4. Check that the content_id exists in content_items table