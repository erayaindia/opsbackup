-- Simple stock movement setup - works with existing table structures
BEGIN;

-- Insert movement types with just the required code column
INSERT INTO movement_types (code) VALUES ('IN') ON CONFLICT (code) DO NOTHING;
INSERT INTO movement_types (code) VALUES ('OUT') ON CONFLICT (code) DO NOTHING;
INSERT INTO movement_types (code) VALUES ('ADJUST') ON CONFLICT (code) DO NOTHING;
INSERT INTO movement_types (code) VALUES ('TRANSFER') ON CONFLICT (code) DO NOTHING;

-- Create a default warehouse with just name (using whatever columns warehouses has)
INSERT INTO warehouses (name)
SELECT 'Default Warehouse'
WHERE NOT EXISTS (SELECT 1 FROM warehouses);

-- Update inventory_details records to have warehouse_id
UPDATE inventory_details
SET warehouse_id = (SELECT id FROM warehouses LIMIT 1)
WHERE warehouse_id IS NULL;

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

-- Create trigger function
CREATE OR REPLACE FUNCTION update_inventory_on_stock_movement()
RETURNS TRIGGER AS $$
DECLARE
  movement_code VARCHAR(20);
BEGIN
  SELECT code INTO movement_code FROM movement_types WHERE id = NEW.movement_type_id;

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

-- Show what we've set up
SELECT 'Stock movement system ready' as status;