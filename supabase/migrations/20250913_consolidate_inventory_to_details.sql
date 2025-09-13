-- Consolidate inventory data into inventory_details table
-- This migration adds stock quantity columns to inventory_details and migrates data from inventory_balances

BEGIN;

-- Add new columns to inventory_details if they don't exist
ALTER TABLE inventory_details
ADD COLUMN IF NOT EXISTS on_hand_qty INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS allocated_qty INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS available_qty INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(id),
ADD COLUMN IF NOT EXISTS last_counted_date TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_movement_date TIMESTAMPTZ DEFAULT NOW();

-- Create index for warehouse lookups
CREATE INDEX IF NOT EXISTS idx_inventory_details_warehouse_id ON inventory_details(warehouse_id);

-- Migrate data from inventory_balances if it exists
DO $$
BEGIN
  -- Check if inventory_balances table exists and has data
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'inventory_balances') THEN
    -- Update inventory_details with data from inventory_balances
    UPDATE inventory_details
    SET
      on_hand_qty = COALESCE(ib.on_hand_qty, 0),
      allocated_qty = COALESCE(ib.allocated_qty, 0),
      available_qty = COALESCE(ib.available_qty, 0),
      warehouse_id = ib.warehouse_id,
      last_counted_date = COALESCE(ib.last_counted_date, NOW()),
      last_movement_date = COALESCE(ib.last_movement_date, NOW())
    FROM inventory_balances ib
    WHERE inventory_details.id = ib.inventory_detail_id;

    RAISE NOTICE 'Migrated data from inventory_balances to inventory_details';
  ELSE
    RAISE NOTICE 'inventory_balances table does not exist, skipping data migration';
  END IF;
END $$;

-- Update any NULL warehouse_id with a default warehouse
DO $$
DECLARE
  default_warehouse_id UUID;
BEGIN
  -- Get or create a default warehouse
  SELECT id INTO default_warehouse_id FROM warehouses LIMIT 1;

  IF default_warehouse_id IS NULL THEN
    INSERT INTO warehouses (name, location, is_active)
    VALUES ('Default Warehouse', 'Main Location', true)
    RETURNING id INTO default_warehouse_id;
  END IF;

  -- Update NULL warehouse_id values
  UPDATE inventory_details
  SET warehouse_id = default_warehouse_id
  WHERE warehouse_id IS NULL;
END $$;

-- Add NOT NULL constraint to warehouse_id now that all records have values
ALTER TABLE inventory_details ALTER COLUMN warehouse_id SET NOT NULL;

-- Update stock movement triggers to work with inventory_details directly
-- Drop old trigger if it exists
DROP TRIGGER IF EXISTS update_inventory_balances ON stock_movements;

-- Create new trigger function for inventory_details
CREATE OR REPLACE FUNCTION update_inventory_details_on_movement()
RETURNS TRIGGER AS $$
BEGIN
  -- Update inventory quantities directly in inventory_details
  IF TG_OP = 'INSERT' THEN
    -- Handle different movement types
    CASE
      WHEN (SELECT code FROM movement_types WHERE id = NEW.movement_type_id) = 'IN' THEN
        UPDATE inventory_details
        SET
          on_hand_qty = on_hand_qty + NEW.qty,
          available_qty = on_hand_qty + NEW.qty - allocated_qty,
          last_movement_date = NEW.occurred_at
        WHERE id = NEW.inventory_detail_id;

      WHEN (SELECT code FROM movement_types WHERE id = NEW.movement_type_id) = 'OUT' THEN
        UPDATE inventory_details
        SET
          on_hand_qty = GREATEST(0, on_hand_qty - NEW.qty),
          available_qty = GREATEST(0, on_hand_qty - NEW.qty - allocated_qty),
          last_movement_date = NEW.occurred_at
        WHERE id = NEW.inventory_detail_id;

      WHEN (SELECT code FROM movement_types WHERE id = NEW.movement_type_id) = 'ADJUST' THEN
        UPDATE inventory_details
        SET
          on_hand_qty = NEW.qty,
          available_qty = GREATEST(0, NEW.qty - allocated_qty),
          last_movement_date = NEW.occurred_at
        WHERE id = NEW.inventory_detail_id;

      ELSE
        -- For other movement types (TRANSFER, etc.), update timestamp only
        UPDATE inventory_details
        SET last_movement_date = NEW.occurred_at
        WHERE id = NEW.inventory_detail_id;
    END CASE;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER update_inventory_details_on_movement
  AFTER INSERT ON stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_details_on_movement();

-- Optional: Drop inventory_balances table if you want to completely remove it
-- Uncomment the following lines if you're sure you want to remove inventory_balances
-- DROP TABLE IF EXISTS inventory_balances CASCADE;

COMMIT;

-- Summary of changes
SELECT
  'inventory_details consolidation completed' as status,
  COUNT(*) as total_inventory_records
FROM inventory_details;