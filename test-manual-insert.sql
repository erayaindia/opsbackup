-- Test manual insert to verify the fix
-- Run this in Supabase SQL editor

-- Insert a test shot that should persist
INSERT INTO shot_list (
    content_id,
    shot_number,
    description,
    camera,
    action,
    background,
    overlays,
    completed,
    order_index,
    status,
    "references"
) VALUES (
    '5f1fd377-7d45-4216-b95f-68e2c87cb2f1',
    1,
    'Test shot - should persist after fix',
    'Wide shot',
    'Person walking',
    'Office background',
    'Logo overlay',
    false,
    0,
    'planned',
    '[]'::jsonb
);

-- Verify the insert worked
SELECT 
    id,
    content_id,
    shot_number,
    description,
    camera,
    action,
    created_at
FROM shot_list 
WHERE content_id = '5f1fd377-7d45-4216-b95f-68e2c87cb2f1';

-- Also check if there are any other shot_list records
SELECT COUNT(*) as total_shot_list_records FROM shot_list;