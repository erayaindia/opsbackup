-- Make inventory_details completely independent from products table
-- Remove product_id foreign key and add necessary product fields directly

-- First, add the new columns we need for product information
ALTER TABLE inventory_details
ADD COLUMN IF NOT EXISTS product_name TEXT NOT NULL DEFAULT 'Unnamed Product',
ADD COLUMN IF NOT EXISTS product_description TEXT,
ADD COLUMN IF NOT EXISTS product_image_url TEXT,
ADD COLUMN IF NOT EXISTS product_category TEXT DEFAULT 'Uncategorized';

-- Update existing records to copy product data before removing the foreign key
DO $$
BEGIN
    -- Only update if product_id column exists and has data
    IF EXISTS (SELECT FROM information_schema.columns
               WHERE table_name = 'inventory_details' AND column_name = 'product_id') THEN

        -- Copy product information from products table
        UPDATE inventory_details
        SET
            product_name = COALESCE(p.name, p.working_title, 'Unnamed Product'),
            product_description = p.description,
            product_image_url = p.image_url,
            product_category = COALESCE(c.name, 'Uncategorized')
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE inventory_details.product_id = p.id
        AND inventory_details.product_id IS NOT NULL;

        RAISE NOTICE 'Copied product data to inventory_details table';

        -- Remove the foreign key constraint and drop the product_id column
        ALTER TABLE inventory_details DROP CONSTRAINT IF EXISTS inventory_details_product_id_fkey;
        ALTER TABLE inventory_details DROP COLUMN IF EXISTS product_id;

        RAISE NOTICE 'Removed product_id column and foreign key constraint';
    ELSE
        RAISE NOTICE 'product_id column does not exist, inventory_details is already independent';
    END IF;
END
$$;

-- Create a sequence for auto-generating SKUs
CREATE SEQUENCE IF NOT EXISTS inventory_sku_sequence START 1000;

-- Create a function to generate SKUs automatically
CREATE OR REPLACE FUNCTION generate_inventory_sku()
RETURNS TEXT AS $$
DECLARE
    next_id INTEGER;
    sku TEXT;
BEGIN
    -- Get next sequence value
    SELECT nextval('inventory_sku_sequence') INTO next_id;

    -- Format as INV-0001000, INV-0001001, etc.
    sku := 'INV-' || LPAD(next_id::TEXT, 7, '0');

    -- Ensure uniqueness (in case of conflicts)
    WHILE EXISTS (SELECT 1 FROM inventory_details WHERE sku = sku) LOOP
        SELECT nextval('inventory_sku_sequence') INTO next_id;
        sku := 'INV-' || LPAD(next_id::TEXT, 7, '0');
    END LOOP;

    RETURN sku;
END;
$$ LANGUAGE plpgsql;

-- Update the indexes to reflect the new structure
DROP INDEX IF EXISTS idx_inventory_details_product_id;
CREATE INDEX IF NOT EXISTS idx_inventory_details_product_name ON inventory_details(product_name);
CREATE INDEX IF NOT EXISTS idx_inventory_details_product_category ON inventory_details(product_category);

-- Update the foreign key reference in inventory_logs if it exists
-- The inventory_logs should still reference inventory_details by id
-- (no changes needed there as inventory_detail_id is still valid)

-- Add some sample independent inventory data if table is nearly empty
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM inventory_details) < 5 THEN
        INSERT INTO inventory_details (
            product_name,
            product_description,
            product_category,
            sku,
            cost,
            price,
            supplier_name,
            on_hand_qty,
            min_stock_level,
            warehouse_location
        ) VALUES
        ('Wireless Headphones', 'Bluetooth wireless headphones with noise cancellation', 'Electronics', 'WH-001', 75.00, 120.00, 'TechSupply Co', 25, 10, 'Main Warehouse'),
        ('Office Chair', 'Ergonomic office chair with lumbar support', 'Furniture', 'OC-002', 150.00, 250.00, 'Office Solutions', 8, 5, 'Main Warehouse'),
        ('LED Monitor', '24-inch LED monitor with HDMI connectivity', 'Electronics', 'MON-003', 180.00, 300.00, 'Display Tech', 15, 8, 'Main Warehouse'),
        ('Desk Lamp', 'Adjustable LED desk lamp with USB charging port', 'Lighting', 'DL-004', 35.00, 60.00, 'Lighting Plus', 30, 12, 'Secondary Warehouse'),
        ('Notebook Set', 'Set of 3 lined notebooks with hardcover', 'Stationery', 'NB-005', 12.00, 25.00, 'Paper Works', 50, 20, 'Main Warehouse')
        ON CONFLICT (sku) DO NOTHING;

        RAISE NOTICE 'Added sample independent inventory data';
    END IF;
END
$$;

-- Add comments for documentation
COMMENT ON COLUMN inventory_details.product_name IS 'Product name stored directly in inventory (independent of products table)';
COMMENT ON COLUMN inventory_details.product_description IS 'Product description stored directly in inventory';
COMMENT ON COLUMN inventory_details.product_image_url IS 'Product image URL stored directly in inventory';
COMMENT ON COLUMN inventory_details.product_category IS 'Product category stored as text (independent of categories table)';

-- Final success message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: inventory_details is now completely independent from products table';
END
$$;