-- Create simplified inventory system with just 2 tables
-- Handle existing tables safely

-- First, check if inventory_details already exists and has the right structure
DO $$
BEGIN
    -- Drop existing complex inventory tables if they exist
    DROP TABLE IF EXISTS supplier_prices CASCADE;
    DROP TABLE IF EXISTS reservations CASCADE;
    DROP TABLE IF EXISTS inventory_alerts CASCADE;
    DROP TABLE IF EXISTS inventory_balances CASCADE;
    DROP TABLE IF EXISTS stock_movements CASCADE;
    DROP TABLE IF EXISTS product_variants CASCADE;

    -- Check if inventory_details exists with old structure and drop if needed
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'inventory_details') THEN
        -- Check if it has the old structure (without our new columns)
        IF NOT EXISTS (SELECT FROM information_schema.columns
                      WHERE table_name = 'inventory_details'
                      AND column_name = 'supplier_name') THEN
            RAISE NOTICE 'Dropping existing inventory_details table with old structure';
            DROP TABLE inventory_details CASCADE;
        ELSE
            RAISE NOTICE 'inventory_details already exists with correct structure, skipping creation';
            RETURN;
        END IF;
    END IF;
END
$$;

-- Create simplified inventory_details table (main data storage) only if it doesn't exist
CREATE TABLE IF NOT EXISTS inventory_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL UNIQUE,
  barcode TEXT,
  cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  supplier_name TEXT NOT NULL DEFAULT 'No Supplier',
  supplier_contact TEXT,
  warehouse_location TEXT NOT NULL DEFAULT 'Main Warehouse',
  on_hand_qty INTEGER NOT NULL DEFAULT 0,
  allocated_qty INTEGER NOT NULL DEFAULT 0,
  available_qty INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER NOT NULL DEFAULT 10,
  reorder_point INTEGER NOT NULL DEFAULT 5,
  reorder_quantity INTEGER NOT NULL DEFAULT 20,
  attributes JSONB DEFAULT '{}',
  notes TEXT,
  last_counted_date TIMESTAMPTZ,
  last_movement_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Create inventory_logs table (movement tracking) only if it doesn't exist
CREATE TABLE IF NOT EXISTS inventory_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_detail_id UUID REFERENCES inventory_details(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'ADJUST', 'TRANSFER')),
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10,2),
  from_location TEXT,
  to_location TEXT,
  reference_type TEXT,
  reference_id TEXT,
  reason TEXT,
  performed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_inventory_details_product_id ON inventory_details(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_details_sku ON inventory_details(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_details_supplier ON inventory_details(supplier_name);
CREATE INDEX IF NOT EXISTS idx_inventory_details_warehouse ON inventory_details(warehouse_location);
CREATE INDEX IF NOT EXISTS idx_inventory_details_deleted ON inventory_details(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_logs_detail_id ON inventory_logs(inventory_detail_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_occurred_at ON inventory_logs(occurred_at);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_movement_type ON inventory_logs(movement_type);

-- Create trigger to auto-update available_qty when on_hand_qty or allocated_qty changes
CREATE OR REPLACE FUNCTION update_available_qty()
RETURNS TRIGGER AS $$
BEGIN
    NEW.available_qty = GREATEST(0, NEW.on_hand_qty - NEW.allocated_qty);
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'trigger_update_available_qty') THEN
        CREATE TRIGGER trigger_update_available_qty
            BEFORE INSERT OR UPDATE ON inventory_details
            FOR EACH ROW
            EXECUTE FUNCTION update_available_qty();
    END IF;
END
$$;

-- Create trigger to log inventory movements when quantities change
CREATE OR REPLACE FUNCTION log_inventory_movement()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if on_hand_qty actually changed
    IF OLD.on_hand_qty IS DISTINCT FROM NEW.on_hand_qty THEN
        INSERT INTO inventory_logs (
            inventory_detail_id,
            movement_type,
            quantity,
            unit_cost,
            reason,
            notes,
            occurred_at
        ) VALUES (
            NEW.id,
            CASE
                WHEN NEW.on_hand_qty > OLD.on_hand_qty THEN 'IN'
                WHEN NEW.on_hand_qty < OLD.on_hand_qty THEN 'OUT'
                ELSE 'ADJUST'
            END,
            NEW.on_hand_qty - OLD.on_hand_qty,
            NEW.cost,
            'Quantity updated',
            CASE
                WHEN NEW.on_hand_qty > OLD.on_hand_qty THEN 'Stock increased from ' || OLD.on_hand_qty || ' to ' || NEW.on_hand_qty
                WHEN NEW.on_hand_qty < OLD.on_hand_qty THEN 'Stock decreased from ' || OLD.on_hand_qty || ' to ' || NEW.on_hand_qty
                ELSE 'Stock adjusted from ' || OLD.on_hand_qty || ' to ' || NEW.on_hand_qty
            END,
            NOW()
        );

        -- Update last movement date
        NEW.last_movement_date = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'trigger_log_inventory_movement') THEN
        CREATE TRIGGER trigger_log_inventory_movement
            AFTER UPDATE ON inventory_details
            FOR EACH ROW
            EXECUTE FUNCTION log_inventory_movement();
    END IF;
END
$$;

-- Enable RLS (Row Level Security) only if not already enabled
DO $$
BEGIN
    -- Enable RLS on inventory_details if not already enabled
    IF NOT EXISTS (SELECT FROM pg_class WHERE relname = 'inventory_details' AND relrowsecurity = true) THEN
        ALTER TABLE inventory_details ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Enable RLS on inventory_logs if not already enabled
    IF NOT EXISTS (SELECT FROM pg_class WHERE relname = 'inventory_logs' AND relrowsecurity = true) THEN
        ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
    END IF;
END
$$;

-- Create RLS policies (allow all operations for authenticated users for now) only if they don't exist
DO $$
BEGIN
    -- Policy for inventory_details
    IF NOT EXISTS (SELECT FROM pg_policy WHERE polname = 'Allow all operations on inventory_details for authenticated users') THEN
        CREATE POLICY "Allow all operations on inventory_details for authenticated users" ON inventory_details
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    -- Policy for inventory_logs
    IF NOT EXISTS (SELECT FROM pg_policy WHERE polname = 'Allow all operations on inventory_logs for authenticated users') THEN
        CREATE POLICY "Allow all operations on inventory_logs for authenticated users" ON inventory_logs
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END
$$;

-- Insert some sample data for testing (only if inventory_details is empty)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM inventory_details LIMIT 1) THEN
        INSERT INTO inventory_details (product_id, sku, cost, price, supplier_name, on_hand_qty, min_stock_level)
        SELECT
          id,
          COALESCE(internal_code, 'SKU-' || SUBSTRING(id::text, 1, 8)),
          50.00,
          75.00,
          'Default Supplier',
          FLOOR(RANDOM() * 100 + 10)::INTEGER,
          10
        FROM products
        WHERE deleted_at IS NULL
        LIMIT 10;

        RAISE NOTICE 'Sample inventory data inserted successfully';
    ELSE
        RAISE NOTICE 'Inventory data already exists, skipping sample insertion';
    END IF;
END
$$;

-- Add comment for documentation
COMMENT ON TABLE inventory_details IS 'Simplified inventory table storing all product inventory information';
COMMENT ON TABLE inventory_logs IS 'Inventory movement history and tracking';