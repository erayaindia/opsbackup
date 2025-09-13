-- Debug script to test stock movements manually

-- Step 1: Check if we have the required tables and data
SELECT 'Checking required tables...' as step;

-- Check movement types
SELECT 'Movement Types:' as table_name, code, id FROM movement_types;

-- Check warehouses
SELECT 'Warehouses:' as table_name, name, id FROM warehouses;

-- Check inventory details
SELECT 'Inventory Details:' as table_name,
       sku, on_hand_qty, available_qty, warehouse_id, product_id
FROM inventory_details LIMIT 3;

-- Step 2: Test manual stock movement insert
-- Replace 'YOUR_INVENTORY_DETAIL_ID' with an actual ID from your inventory_details table
-- Replace 'YOUR_WAREHOUSE_ID' with an actual ID from your warehouses table

-- First, let's get actual IDs:
SELECT
  'Use these IDs for manual test:' as info,
  id.id as inventory_detail_id,
  id.sku,
  w.id as warehouse_id,
  w.name as warehouse_name,
  mt.id as movement_type_id,
  mt.code as movement_code
FROM inventory_details id
CROSS JOIN warehouses w
CROSS JOIN movement_types mt
WHERE mt.code = 'IN'
LIMIT 1;

-- Manual stock movement test (uncomment and run after getting IDs above)
/*
INSERT INTO stock_movements (
  inventory_detail_id,
  warehouse_id,
  movement_type_id,
  qty,
  notes,
  occurred_at
) VALUES (
  'YOUR_INVENTORY_DETAIL_ID',  -- Replace with actual ID
  'YOUR_WAREHOUSE_ID',         -- Replace with actual ID
  (SELECT id FROM movement_types WHERE code = 'IN'),
  10,
  'Manual test movement',
  NOW()
);
*/

-- Step 3: Check if trigger function exists
SELECT
  'Checking trigger function...' as step,
  proname as function_name
FROM pg_proc
WHERE proname = 'update_inventory_on_stock_movement';

-- Step 4: Check if trigger exists
SELECT
  'Checking trigger...' as step,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_inventory_on_movement';