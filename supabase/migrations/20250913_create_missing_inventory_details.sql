-- Create missing inventory_details records for existing products
BEGIN;

-- First, let's see what we're working with
SELECT 'Before creating missing records:' as status;
SELECT
  COUNT(*) as total_products
FROM products;

SELECT
  COUNT(*) as total_inventory_details
FROM inventory_details;

-- Create inventory_details for products that don't have them
INSERT INTO inventory_details (
  product_id,
  sku,
  cost,
  price,
  min_stock_level,
  reorder_point,
  reorder_quantity,
  on_hand_qty,
  allocated_qty,
  available_qty,
  warehouse_id,
  status_id
)
SELECT
  p.id as product_id,
  'SKU-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD((ROW_NUMBER() OVER())::text, 4, '0') as sku,
  0 as cost,
  0 as price,
  10 as min_stock_level,
  5 as reorder_point,
  50 as reorder_quantity,
  0 as on_hand_qty,
  0 as allocated_qty,
  0 as available_qty,
  (SELECT id FROM warehouses LIMIT 1) as warehouse_id,
  1 as status_id
FROM products p
LEFT JOIN inventory_details id_det ON p.id = id_det.product_id
WHERE id_det.id IS NULL;

-- Show what we created
SELECT 'After creating missing records:' as status;
SELECT
  COUNT(*) as total_inventory_details_now
FROM inventory_details;

-- Show products and their inventory_details
SELECT
  p.id as product_id,
  p.name as product_name,
  id_det.id as inventory_detail_id,
  id_det.sku,
  CASE
    WHEN id_det.id IS NULL THEN 'MISSING INVENTORY_DETAILS'
    ELSE 'HAS INVENTORY_DETAILS'
  END as status
FROM products p
LEFT JOIN inventory_details id_det ON p.id = id_det.product_id
ORDER BY p.created_at DESC
LIMIT 10;

COMMIT;