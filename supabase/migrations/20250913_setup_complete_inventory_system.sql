-- Complete inventory system setup
-- This creates all necessary tables and triggers for stock movements

BEGIN;

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

-- Create movement_types table if it doesn't exist
CREATE TABLE IF NOT EXISTS movement_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert movement types if they don't exist
INSERT INTO movement_types (code, name, description) VALUES
  ('IN', 'Stock In', 'Receive inventory (purchases, returns)'),
  ('OUT', 'Stock Out', 'Remove inventory (sales, damages)'),
  ('ADJUST', 'Adjustment', 'Correct inventory counts'),
  ('TRANSFER', 'Transfer', 'Move between locations')
ON CONFLICT (code) DO NOTHING;

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

-- Create suppliers table if it doesn't exist
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create supplier_prices table if it doesn't exist
CREATE TABLE IF NOT EXISTS supplier_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_detail_id UUID NOT NULL REFERENCES inventory_details(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  unit_cost DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  moq INTEGER DEFAULT 1,
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_to DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create default supplier if none exists
INSERT INTO suppliers (name, contact_person, email, phone, is_active)
SELECT 'Default Supplier', 'Contact Person', 'supplier@example.com', '+91-9999999999', true
WHERE NOT EXISTS (SELECT 1 FROM suppliers);

COMMIT;

-- Verify setup
SELECT
  'Inventory system setup completed' as status,
  (SELECT COUNT(*) FROM warehouses) as warehouses_count,
  (SELECT COUNT(*) FROM movement_types) as movement_types_count,
  (SELECT COUNT(*) FROM inventory_details) as inventory_details_count;