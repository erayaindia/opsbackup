-- Fix movement_types table structure and data
BEGIN;

-- First, let's check what columns exist in movement_types
-- If the table structure is different, we'll work with what exists

-- Check if movement_types table exists and what columns it has
DO $$
BEGIN
  -- Try to add missing columns if they don't exist
  BEGIN
    ALTER TABLE movement_types ADD COLUMN IF NOT EXISTS name VARCHAR(100);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add name column: %', SQLERRM;
  END;

  BEGIN
    ALTER TABLE movement_types ADD COLUMN IF NOT EXISTS description TEXT;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add description column: %', SQLERRM;
  END;

  BEGIN
    ALTER TABLE movement_types ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add is_active column: %', SQLERRM;
  END;
END $$;

-- Insert movement types with just the code column if that's all that exists
INSERT INTO movement_types (code) VALUES ('IN') ON CONFLICT (code) DO NOTHING;
INSERT INTO movement_types (code) VALUES ('OUT') ON CONFLICT (code) DO NOTHING;
INSERT INTO movement_types (code) VALUES ('ADJUST') ON CONFLICT (code) DO NOTHING;
INSERT INTO movement_types (code) VALUES ('TRANSFER') ON CONFLICT (code) DO NOTHING;

-- Update with names and descriptions if columns exist
UPDATE movement_types SET name = 'Stock In' WHERE code = 'IN' AND name IS NULL;
UPDATE movement_types SET name = 'Stock Out' WHERE code = 'OUT' AND name IS NULL;
UPDATE movement_types SET name = 'Adjustment' WHERE code = 'ADJUST' AND name IS NULL;
UPDATE movement_types SET name = 'Transfer' WHERE code = 'TRANSFER' AND name IS NULL;

UPDATE movement_types SET description = 'Receive inventory (purchases, returns)' WHERE code = 'IN' AND description IS NULL;
UPDATE movement_types SET description = 'Remove inventory (sales, damages)' WHERE code = 'OUT' AND description IS NULL;
UPDATE movement_types SET description = 'Correct inventory counts' WHERE code = 'ADJUST' AND description IS NULL;
UPDATE movement_types SET description = 'Move between locations' WHERE code = 'TRANSFER' AND description IS NULL;

-- Create warehouses table if it doesn't exist
CREATE TABLE IF NOT EXISTS warehouses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stock_movements table if it doesn't exist
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_detail_id UUID NOT NULL REFERENCES inventory_details(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  movement_type_id UUID NOT NULL REFERENCES movement_types(id),
  qty INTEGER NOT NULL,
  unit_cost DECIMAL(10,2),
  reference_type VARCHAR(50),
  reference_id VARCHAR(100),
  notes TEXT,
  user_id UUID,
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_inventory_detail ON stock_movements(inventory_detail_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_warehouse ON stock_movements(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_occurred_at ON stock_movements(occurred_at);

-- Create default warehouse if none exists
INSERT INTO warehouses (name, code, location, is_active)
SELECT 'Default Warehouse', 'DWH001', 'Main Location', true
WHERE NOT EXISTS (SELECT 1 FROM warehouses);

-- Update any inventory_details records that don't have warehouse_id
UPDATE inventory_details
SET warehouse_id = (SELECT id FROM warehouses LIMIT 1)
WHERE warehouse_id IS NULL;

-- Create function to update inventory quantities
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
  CASE movement_code
    WHEN 'IN' THEN
      UPDATE inventory_details
      SET
        on_hand_qty = COALESCE(on_hand_qty, 0) + NEW.qty,
        available_qty = COALESCE(on_hand_qty, 0) + NEW.qty - COALESCE(allocated_qty, 0),
        last_movement_date = NEW.occurred_at
      WHERE id = NEW.inventory_detail_id;

    WHEN 'OUT' THEN
      UPDATE inventory_details
      SET
        on_hand_qty = GREATEST(0, COALESCE(on_hand_qty, 0) - NEW.qty),
        available_qty = GREATEST(0, COALESCE(on_hand_qty, 0) - NEW.qty - COALESCE(allocated_qty, 0)),
        last_movement_date = NEW.occurred_at
      WHERE id = NEW.inventory_detail_id;

    WHEN 'ADJUST' THEN
      UPDATE inventory_details
      SET
        on_hand_qty = NEW.qty,
        available_qty = GREATEST(0, NEW.qty - COALESCE(allocated_qty, 0)),
        last_movement_date = NEW.occurred_at
      WHERE id = NEW.inventory_detail_id;

    ELSE
      -- For TRANSFER and other types, just update timestamp
      UPDATE inventory_details
      SET last_movement_date = NEW.occurred_at
      WHERE id = NEW.inventory_detail_id;
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_inventory_on_movement ON stock_movements;

-- Create trigger
CREATE TRIGGER trigger_update_inventory_on_movement
  AFTER INSERT ON stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_stock_movement();

COMMIT;

-- Verify the setup
SELECT
  'Fixed inventory system setup' as status,
  (SELECT COUNT(*) FROM movement_types) as movement_types_count,
  (SELECT COUNT(*) FROM warehouses) as warehouses_count;