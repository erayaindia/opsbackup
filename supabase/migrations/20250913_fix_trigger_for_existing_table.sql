-- Fix trigger to work with existing stock_movements table structure
BEGIN;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_inventory_on_movement ON stock_movements;
DROP FUNCTION IF EXISTS update_inventory_on_stock_movement();

-- Create corrected trigger function that works with product_variant_id
CREATE OR REPLACE FUNCTION update_inventory_on_stock_movement()
RETURNS TRIGGER AS $$
DECLARE
  movement_code VARCHAR(20);
BEGIN
  -- Get the movement type code
  SELECT code INTO movement_code
  FROM movement_types
  WHERE id = NEW.movement_type_id;

  -- Update inventory quantities based on movement type
  -- Note: Using product_variant_id from stock_movements to update inventory_details
  CASE movement_code
    WHEN 'IN' THEN
      UPDATE inventory_details
      SET
        on_hand_qty = COALESCE(on_hand_qty, 0) + NEW.qty,
        available_qty = COALESCE(on_hand_qty, 0) + NEW.qty - COALESCE(allocated_qty, 0),
        last_movement_date = NEW.occurred_at
      WHERE id = NEW.product_variant_id; -- Use product_variant_id from stock_movements

    WHEN 'OUT' THEN
      UPDATE inventory_details
      SET
        on_hand_qty = GREATEST(0, COALESCE(on_hand_qty, 0) - NEW.qty),
        available_qty = GREATEST(0, COALESCE(on_hand_qty, 0) - NEW.qty - COALESCE(allocated_qty, 0)),
        last_movement_date = NEW.occurred_at
      WHERE id = NEW.product_variant_id; -- Use product_variant_id from stock_movements

    WHEN 'ADJUST' THEN
      UPDATE inventory_details
      SET
        on_hand_qty = NEW.qty,
        available_qty = GREATEST(0, NEW.qty - COALESCE(allocated_qty, 0)),
        last_movement_date = NEW.occurred_at
      WHERE id = NEW.product_variant_id; -- Use product_variant_id from stock_movements

    ELSE
      -- For TRANSFER and other types, just update timestamp
      UPDATE inventory_details
      SET last_movement_date = NEW.occurred_at
      WHERE id = NEW.product_variant_id; -- Use product_variant_id from stock_movements
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_inventory_on_movement
  AFTER INSERT ON stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_stock_movement();

COMMIT;

SELECT 'Fixed trigger to work with product_variant_id column' as status;