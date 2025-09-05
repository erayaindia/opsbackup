-- Test manual shot list insert to debug the saving issue
-- Replace the content_id with the one from your debug results

-- Test insert into shot_list table
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
    'Test shot description',
    'Wide shot',
    'Person walking towards camera',
    'Modern office background',
    'Logo overlay in corner',
    false,
    0,
    'planned',
    '[]'::jsonb
);

-- Check if the insert worked
SELECT * FROM shot_list WHERE content_id = '5f1fd377-7d45-4216-b95f-68e2c87cb2f1';