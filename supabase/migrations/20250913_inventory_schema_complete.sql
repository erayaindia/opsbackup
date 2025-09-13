-- ============================================
-- COMPLETE INVENTORY MANAGEMENT SYSTEM SCHEMA
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- STEP 1: CREATE LOOKUP/REFERENCE TABLES
-- ============================================

-- Movement types lookup
CREATE TABLE IF NOT EXISTS movement_types (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    description TEXT
);

-- Insert movement types
INSERT INTO movement_types (code, description) VALUES
    ('IN', 'Stock In (Receive)'),
    ('OUT', 'Stock Out (Issue)'),
    ('ADJUST', 'Adjustment'),
    ('TRANSFER', 'Transfer')
ON CONFLICT (code) DO NOTHING;

-- Alert types lookup
CREATE TABLE IF NOT EXISTS alert_types (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    description TEXT
);

-- Insert alert types
INSERT INTO alert_types (code, description) VALUES
    ('LOW_STOCK', 'Stock below minimum level'),
    ('OUT_OF_STOCK', 'Stock depleted'),
    ('REORDER', 'Reorder suggested'),
    ('EXPIRY', 'Items approaching expiry')
ON CONFLICT (code) DO NOTHING;

-- Priorities lookup
CREATE TABLE IF NOT EXISTS priorities (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    description TEXT
);

-- Insert priorities
INSERT INTO priorities (code, description) VALUES
    ('low', 'Low Priority'),
    ('medium', 'Medium Priority'),
    ('high', 'High Priority'),
    ('urgent', 'Urgent')
ON CONFLICT (code) DO NOTHING;

-- Reason codes lookup
CREATE TABLE IF NOT EXISTS reason_codes (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    description TEXT
);

-- Insert reason codes
INSERT INTO reason_codes (code, description) VALUES
    ('PURCHASE', 'Purchase receipt'),
    ('SALE', 'Sales order'),
    ('RETURN', 'Customer return'),
    ('DAMAGE', 'Damaged goods'),
    ('THEFT', 'Theft/Loss'),
    ('COUNT', 'Cycle count adjustment'),
    ('TRANSFER_IN', 'Transfer in'),
    ('TRANSFER_OUT', 'Transfer out')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- STEP 2: CREATE WAREHOUSES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    address JSONB,
    manager_id UUID, -- references auth.users
    capacity INTEGER,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default warehouse
INSERT INTO warehouses (name, code, address) VALUES
    ('Main Warehouse', 'MW001', '{"street": "123 Main St", "city": "Mumbai", "state": "Maharashtra", "country": "India"}')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- STEP 3: CREATE LOCATIONS TABLE (warehouse zones/bins)
-- ============================================

CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    code TEXT NOT NULL,
    type TEXT CHECK (type IN ('zone', 'rack', 'shelf', 'bin')),
    parent_location_id UUID REFERENCES locations(id),
    capacity INTEGER,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(warehouse_id, code)
);

-- ============================================
-- STEP 4: CREATE SUPPLIERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address JSONB, -- {street, city, state, country, postal_code}
    payment_terms TEXT,
    lead_time_days INTEGER DEFAULT 0,
    minimum_order_value NUMERIC(12,2),
    rating NUMERIC(3,2) CHECK (rating >= 0 AND rating <= 5),
    status_id INTEGER REFERENCES statuses(id),
    tax_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default supplier
INSERT INTO suppliers (name, code, contact_person, email, phone) VALUES
    ('Default Supplier', 'SUP001', 'John Doe', 'supplier@example.com', '+91-9876543210')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- STEP 5: CREATE PRODUCT VARIANTS TABLE (Enhanced)
-- ============================================

CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku TEXT UNIQUE NOT NULL,
    barcode TEXT,
    attributes JSONB DEFAULT '{}', -- size, color, etc.
    cost NUMERIC(12,2) CHECK (cost >= 0),
    price NUMERIC(12,2) CHECK (price >= 0),
    weight NUMERIC(10,3), -- in kg
    dimensions JSONB, -- {length, width, height}
    status_id INTEGER REFERENCES statuses(id),
    min_stock_level INTEGER DEFAULT 0,
    reorder_point INTEGER DEFAULT 0,
    reorder_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ -- soft delete
);

-- ============================================
-- STEP 6: CREATE LOTS TABLE (batch tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_code TEXT UNIQUE NOT NULL,
    product_variant_id UUID REFERENCES product_variants(id),
    supplier_id UUID REFERENCES suppliers(id),
    manufacture_date DATE,
    expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 7: CREATE INVENTORY BALANCES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS inventory_balances (
    product_variant_id UUID NOT NULL REFERENCES product_variants(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    location_id UUID REFERENCES locations(id),
    location_id_norm UUID GENERATED ALWAYS AS (COALESCE(location_id, '00000000-0000-0000-0000-000000000000'::uuid)) STORED,
    on_hand_qty INTEGER DEFAULT 0 CHECK (on_hand_qty >= 0),
    allocated_qty INTEGER DEFAULT 0 CHECK (allocated_qty >= 0),
    available_qty INTEGER GENERATED ALWAYS AS (on_hand_qty - allocated_qty) STORED,
    last_counted_date DATE,
    last_movement_date TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (product_variant_id, warehouse_id, location_id_norm)
);

-- ============================================
-- STEP 8: CREATE STOCK MOVEMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_variant_id UUID NOT NULL REFERENCES product_variants(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    lot_id UUID REFERENCES lots(id),
    from_location_id UUID REFERENCES locations(id),
    to_location_id UUID REFERENCES locations(id),
    movement_type_id INTEGER NOT NULL REFERENCES movement_types(id),
    qty INTEGER NOT NULL CHECK (qty > 0),
    unit_cost NUMERIC(12,2),
    reference_type TEXT, -- 'purchase_order', 'sales_order', 'adjustment', 'transfer'
    reference_id TEXT,
    reason_code_id INTEGER REFERENCES reason_codes(id),
    user_id UUID, -- references auth.users
    notes TEXT,
    occurred_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 9: CREATE RESERVATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_variant_id UUID NOT NULL REFERENCES product_variants(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    location_id UUID REFERENCES locations(id),
    qty INTEGER NOT NULL CHECK (qty > 0),
    reference_type TEXT NOT NULL, -- 'sales_order', 'transfer_order', 'production_order'
    reference_id TEXT NOT NULL,
    status_id INTEGER REFERENCES statuses(id),
    expires_at TIMESTAMPTZ,
    created_by UUID, -- references auth.users
    created_at TIMESTAMPTZ DEFAULT NOW(),
    fulfilled_at TIMESTAMPTZ
);

-- ============================================
-- STEP 10: CREATE SUPPLIER PRICES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS supplier_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    product_variant_id UUID NOT NULL REFERENCES product_variants(id),
    moq INTEGER DEFAULT 1, -- minimum order quantity
    tier_qty INTEGER DEFAULT 1,
    unit_cost NUMERIC(12,2) NOT NULL CHECK (unit_cost >= 0),
    currency TEXT DEFAULT 'INR',
    valid_from DATE,
    valid_to DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(supplier_id, product_variant_id, tier_qty)
);

-- ============================================
-- STEP 11: CREATE INVENTORY ALERTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS inventory_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_variant_id UUID NOT NULL REFERENCES product_variants(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    alert_type_id INTEGER NOT NULL REFERENCES alert_types(id),
    priority_id INTEGER NOT NULL REFERENCES priorities(id),
    current_stock INTEGER,
    threshold INTEGER,
    message TEXT,
    auto_reorder_suggested BOOLEAN DEFAULT false,
    suggested_qty INTEGER,
    status_id INTEGER REFERENCES statuses(id),
    acknowledged_by UUID, -- references auth.users
    acknowledged_at TIMESTAMPTZ,
    resolved_by UUID, -- references auth.users
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 12: CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Product variants indexes
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_deleted_at ON product_variants(deleted_at);

-- Inventory balances indexes
CREATE INDEX IF NOT EXISTS idx_inventory_balances_product_variant ON inventory_balances(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_balances_warehouse ON inventory_balances(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_balances_location ON inventory_balances(location_id);

-- Stock movements indexes
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_variant ON stock_movements(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_warehouse ON stock_movements(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_occurred_at ON stock_movements(occurred_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_movement_type ON stock_movements(movement_type_id);

-- Reservations indexes
CREATE INDEX IF NOT EXISTS idx_reservations_product_variant ON reservations(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_reservations_reference ON reservations(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_reservations_expires_at ON reservations(expires_at);

-- Supplier prices indexes
CREATE INDEX IF NOT EXISTS idx_supplier_prices_supplier ON supplier_prices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_prices_product_variant ON supplier_prices(product_variant_id);

-- Inventory alerts indexes
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_product_variant ON inventory_alerts(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_warehouse ON inventory_alerts(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_status ON inventory_alerts(status_id);

-- ============================================
-- STEP 13: CREATE TRIGGERS FOR AUTO-UPDATE
-- ============================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_warehouses_updated_at ON warehouses;
CREATE TRIGGER update_warehouses_updated_at
    BEFORE UPDATE ON warehouses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_product_variants_updated_at ON product_variants;
CREATE TRIGGER update_product_variants_updated_at
    BEFORE UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_inventory_balances_updated_at ON inventory_balances;
CREATE TRIGGER update_inventory_balances_updated_at
    BEFORE UPDATE ON inventory_balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- STEP 14: CREATE INVENTORY BALANCE MAINTENANCE FUNCTIONS
-- ============================================

-- Function to update inventory balances when stock movements occur
CREATE OR REPLACE FUNCTION update_inventory_balance_on_movement()
RETURNS TRIGGER AS $$
DECLARE
    movement_code TEXT;
    location_to_use UUID;
BEGIN
    -- Get movement type code
    SELECT code INTO movement_code FROM movement_types WHERE id = NEW.movement_type_id;

    -- Determine location to use (prefer to_location, then from_location, then null)
    location_to_use := COALESCE(NEW.to_location_id, NEW.from_location_id);

    -- Ensure inventory balance record exists
    INSERT INTO inventory_balances (product_variant_id, warehouse_id, location_id, on_hand_qty, allocated_qty)
    VALUES (NEW.product_variant_id, NEW.warehouse_id, location_to_use, 0, 0)
    ON CONFLICT (product_variant_id, warehouse_id, location_id_norm) DO NOTHING;

    -- Update inventory based on movement type
    IF movement_code = 'IN' THEN
        -- Increase stock
        UPDATE inventory_balances
        SET
            on_hand_qty = on_hand_qty + NEW.qty,
            last_movement_date = NEW.occurred_at
        WHERE product_variant_id = NEW.product_variant_id
          AND warehouse_id = NEW.warehouse_id
          AND location_id_norm = COALESCE(location_to_use, '00000000-0000-0000-0000-000000000000'::uuid);

    ELSIF movement_code = 'OUT' THEN
        -- Decrease stock
        UPDATE inventory_balances
        SET
            on_hand_qty = GREATEST(0, on_hand_qty - NEW.qty),
            last_movement_date = NEW.occurred_at
        WHERE product_variant_id = NEW.product_variant_id
          AND warehouse_id = NEW.warehouse_id
          AND location_id_norm = COALESCE(location_to_use, '00000000-0000-0000-0000-000000000000'::uuid);

    ELSIF movement_code = 'ADJUST' THEN
        -- Set stock to exact quantity (NEW.qty represents the new total, not change)
        UPDATE inventory_balances
        SET
            on_hand_qty = NEW.qty,
            last_movement_date = NEW.occurred_at
        WHERE product_variant_id = NEW.product_variant_id
          AND warehouse_id = NEW.warehouse_id
          AND location_id_norm = COALESCE(location_to_use, '00000000-0000-0000-0000-000000000000'::uuid);

    ELSIF movement_code = 'TRANSFER' THEN
        -- Handle transfers between locations
        IF NEW.from_location_id IS NOT NULL THEN
            -- Decrease from source location
            UPDATE inventory_balances
            SET
                on_hand_qty = GREATEST(0, on_hand_qty - NEW.qty),
                last_movement_date = NEW.occurred_at
            WHERE product_variant_id = NEW.product_variant_id
              AND warehouse_id = NEW.warehouse_id
              AND location_id_norm = COALESCE(NEW.from_location_id, '00000000-0000-0000-0000-000000000000'::uuid);
        END IF;

        IF NEW.to_location_id IS NOT NULL THEN
            -- Increase to destination location
            INSERT INTO inventory_balances (product_variant_id, warehouse_id, location_id, on_hand_qty, allocated_qty)
            VALUES (NEW.product_variant_id, NEW.warehouse_id, NEW.to_location_id, NEW.qty, 0)
            ON CONFLICT (product_variant_id, warehouse_id, location_id_norm)
            DO UPDATE SET
                on_hand_qty = inventory_balances.on_hand_qty + NEW.qty,
                last_movement_date = NEW.occurred_at;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory balance maintenance
DROP TRIGGER IF EXISTS trigger_update_inventory_balance ON stock_movements;
CREATE TRIGGER trigger_update_inventory_balance
    AFTER INSERT ON stock_movements
    FOR EACH ROW EXECUTE FUNCTION update_inventory_balance_on_movement();

-- ============================================
-- STEP 15: CREATE VIEWS FOR EASIER QUERYING
-- ============================================

-- View for product variants with current stock
CREATE OR REPLACE VIEW product_variants_with_stock AS
SELECT
    pv.*,
    COALESCE(SUM(ib.on_hand_qty), 0) as total_on_hand,
    COALESCE(SUM(ib.allocated_qty), 0) as total_allocated,
    COALESCE(SUM(ib.available_qty), 0) as total_available,
    COUNT(DISTINCT ib.warehouse_id) as warehouse_count
FROM product_variants pv
LEFT JOIN inventory_balances ib ON pv.id = ib.product_variant_id
WHERE pv.deleted_at IS NULL
GROUP BY pv.id;

-- ============================================
-- STEP 16: ENABLE ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE movement_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE reason_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Authenticated users can access all inventory data" ON movement_types FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access all inventory data" ON alert_types FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access all inventory data" ON priorities FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access all inventory data" ON reason_codes FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access all inventory data" ON warehouses FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access all inventory data" ON locations FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access all inventory data" ON suppliers FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access all inventory data" ON product_variants FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access all inventory data" ON lots FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access all inventory data" ON inventory_balances FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access all inventory data" ON stock_movements FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access all inventory data" ON reservations FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access all inventory data" ON supplier_prices FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access all inventory data" ON inventory_alerts FOR ALL TO authenticated USING (true);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

SELECT 'SUCCESS: Complete Inventory Management System Schema Applied!' as status;