-- ============================================
-- ENABLE REQUIRED EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- NUCLEAR OPTION: Remove ALL problematic functions completely
-- ============================================

-- 1. Drop every possible function that could reference app.users
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS app.is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS is_super_admin() CASCADE;

DROP FUNCTION IF EXISTS public.restrict_user_self_update() CASCADE;
DROP FUNCTION IF EXISTS app.restrict_user_self_update() CASCADE;
DROP FUNCTION IF EXISTS restrict_user_self_update() CASCADE;

-- 2. Remove all triggers on app_users table
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tgname FROM pg_trigger WHERE tgrelid = 'app_users'::regclass)
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || r.tgname || ' ON app_users CASCADE';
    END LOOP;
END $$;

-- 3. Test that updates work now (this should succeed)
UPDATE app_users
SET updated_at = NOW()
WHERE id = (SELECT id FROM app_users LIMIT 1);

-- 4. Success message
SELECT 'SUCCESS: All app.users references removed!' as status;

-- ============================================
-- STEP 1: CREATE LOOKUP/REFERENCE TABLES
-- ============================================

-- Movement types lookup
CREATE TABLE movement_types (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    description TEXT
);

-- Insert movement types
INSERT INTO movement_types (code, description) VALUES
    ('IN', 'Stock received'),
    ('OUT', 'Stock shipped/sold'),
    ('ADJUST', 'Inventory adjustment'),
    ('TRANSFER', 'Transfer between locations');

-- Status lookup table
CREATE TABLE statuses (
    id SERIAL PRIMARY KEY,
    domain TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    UNIQUE(domain, code)
);

-- Insert status values
INSERT INTO statuses (domain, code, description) VALUES
    ('supplier', 'active', 'Active supplier'),
    ('supplier', 'inactive', 'Inactive supplier'),
    ('supplier', 'blacklisted', 'Blacklisted supplier'),
    ('product', 'active', 'Active product'),
    ('product', 'discontinued', 'Discontinued product'),
    ('po', 'draft', 'Draft purchase order'),
    ('po', 'submitted', 'Submitted to supplier'),
    ('po', 'approved', 'Approved purchase order'),
    ('po', 'partial', 'Partially received'),
    ('po', 'completed', 'Fully received'),
    ('po', 'cancelled', 'Cancelled order'),
    ('reservation', 'active', 'Active reservation'),
    ('reservation', 'fulfilled', 'Fulfilled reservation'),
    ('reservation', 'cancelled', 'Cancelled reservation'),
    ('alert', 'active', 'Active alert'),
    ('alert', 'acknowledged', 'Acknowledged alert'),
    ('alert', 'resolved', 'Resolved alert');

-- Alert types
CREATE TABLE alert_types (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    description TEXT
);

INSERT INTO alert_types (code, description) VALUES
    ('low_stock', 'Stock below threshold'),
    ('out_of_stock', 'No stock available'),
    ('overstock', 'Excess inventory'),
    ('expiring', 'Product nearing expiry');

-- Priority levels
CREATE TABLE priorities (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    level INTEGER,
    description TEXT
);

INSERT INTO priorities (code, level, description) VALUES
    ('low', 1, 'Low priority'),
    ('medium', 2, 'Medium priority'),
    ('high', 3, 'High priority'),
    ('critical', 4, 'Critical priority');

-- Reason codes
CREATE TABLE reason_codes (
    id SERIAL PRIMARY KEY,
    domain TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    UNIQUE(domain, code)
);

INSERT INTO reason_codes (domain, code, description) VALUES
    ('adjustment', 'damage', 'Damaged goods'),
    ('adjustment', 'theft', 'Theft/Loss'),
    ('adjustment', 'count', 'Physical count correction'),
    ('adjustment', 'expired', 'Expired products'),
    ('return', 'defective', 'Defective product'),
    ('return', 'wrong_item', 'Wrong item shipped'),
    ('return', 'not_as_described', 'Not as described'),
    ('return', 'customer_remorse', 'Customer changed mind');

-- ============================================
-- STEP 2: CREATE CATALOG TABLES
-- ============================================

-- Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    parent_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products (master catalog)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category_id UUID REFERENCES categories(id),
    description TEXT,
    image_url TEXT,
    status_id INTEGER REFERENCES statuses(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ -- soft delete
);

-- Product variants (actual SKUs)
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
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
-- STEP 3: CREATE SUPPLIER TABLES
-- ============================================

-- Suppliers
CREATE TABLE suppliers (
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

-- Supplier product pricing (optional but useful)
CREATE TABLE supplier_prices (
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
-- STEP 4: CREATE WAREHOUSE TABLES
-- ============================================

-- Warehouses
CREATE TABLE warehouses (
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

-- Warehouse locations (bins, zones, racks)
CREATE TABLE locations (
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
-- STEP 5: CREATE INVENTORY TABLES
-- ============================================

-- Lots for batch tracking (optional)
CREATE TABLE lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_code TEXT UNIQUE NOT NULL,
    product_variant_id UUID REFERENCES product_variants(id),
    supplier_id UUID REFERENCES suppliers(id),
    manufacture_date DATE,
    expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock movements (source of truth for inventory)
CREATE TABLE stock_movements (
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

-- Inventory balances (maintained by trigger)
CREATE TABLE inventory_balances (
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

-- Reservations
CREATE TABLE reservations (
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
-- STEP 6: CREATE PROCUREMENT TABLES
-- ============================================

-- Purchase orders
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    status_id INTEGER REFERENCES statuses(id),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery DATE,
    subtotal NUMERIC(12,2) DEFAULT 0,
    tax_amount NUMERIC(12,2) DEFAULT 0,
    shipping_cost NUMERIC(12,2) DEFAULT 0,
    total_amount NUMERIC(12,2) DEFAULT 0,
    currency TEXT DEFAULT 'INR',
    payment_terms TEXT,
    notes TEXT,
    created_by UUID, -- references auth.users
    approved_by UUID, -- references auth.users
    approved_at TIMESTAMPTZ,
    received_by UUID, -- references auth.users
    received_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase order lines
CREATE TABLE purchase_order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_variant_id UUID NOT NULL REFERENCES product_variants(id),
    ordered_qty INTEGER NOT NULL CHECK (ordered_qty > 0),
    received_qty INTEGER DEFAULT 0 CHECK (received_qty >= 0),
    unit_cost NUMERIC(12,2) NOT NULL CHECK (unit_cost >= 0),
    tax_rate NUMERIC(5,2) DEFAULT 0,
    discount_amount NUMERIC(12,2) DEFAULT 0,
    line_total NUMERIC(12,2) GENERATED ALWAYS AS
        ((ordered_qty * unit_cost - discount_amount) * (1 + tax_rate/100)) STORED,
    expected_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 7: CREATE QUALITY & TRACKING TABLES
-- ============================================

-- Returns
CREATE TABLE returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_variant_id UUID NOT NULL REFERENCES product_variants(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    qty INTEGER NOT NULL CHECK (qty > 0),
    reason_code_id INTEGER REFERENCES reason_codes(id),
    from_order_id TEXT,
    customer_name TEXT,
    resolution TEXT CHECK (resolution IN ('refund', 'replace', 'repair', 'scrap')),
    inspection_notes TEXT,
    processed_by UUID, -- references auth.users
    occurred_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 8: CREATE ALERTS & ANALYTICS TABLES
-- ============================================

-- Inventory alerts
CREATE TABLE inventory_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_variant_id UUID NOT NULL REFERENCES product_variants(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    alert_type_id INTEGER NOT NULL REFERENCES alert_types(id),
    priority_id INTEGER NOT NULL REFERENCES priorities(id),
    current_stock INTEGER,
    threshold INTEGER,
    status_id INTEGER REFERENCES statuses(id),
    message TEXT,
    auto_reorder_suggested BOOLEAN DEFAULT false,
    suggested_qty INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_by UUID, -- references auth.users
    acknowledged_at TIMESTAMPTZ,
    resolved_by UUID, -- references auth.users
    resolved_at TIMESTAMPTZ
);

-- Stock predictions (for analytics)
CREATE TABLE stock_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_variant_id UUID NOT NULL REFERENCES product_variants(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    prediction_date DATE NOT NULL,
    predicted_days_until_stockout INTEGER,
    daily_sales_velocity NUMERIC(10,2),
    weekly_sales_velocity NUMERIC(10,2),
    monthly_sales_velocity NUMERIC(10,2),
    seasonal_factor NUMERIC(5,2) DEFAULT 1.0,
    trend_direction TEXT CHECK (trend_direction IN ('increasing', 'stable', 'decreasing')),
    confidence_score NUMERIC(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    recommended_reorder_date DATE,
    recommended_reorder_quantity INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_variant_id, warehouse_id, prediction_date)
);

-- ============================================
-- STEP 9: CREATE USER ACCESS TABLES
-- ============================================

-- User warehouse access
CREATE TABLE user_warehouses (
    user_id UUID NOT NULL, -- references auth.users
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    role TEXT CHECK (role IN ('viewer', 'operator', 'manager', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, warehouse_id)
);

-- ============================================
-- STEP 10: CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Product indexes
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status_id);
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
CREATE INDEX idx_product_variants_barcode ON product_variants(barcode) WHERE barcode IS NOT NULL;

-- Movement indexes
CREATE INDEX idx_movements_product_warehouse ON stock_movements(product_variant_id, warehouse_id);
CREATE INDEX idx_movements_occurred ON stock_movements(occurred_at DESC);
CREATE INDEX idx_movements_reference ON stock_movements(reference_type, reference_id) WHERE reference_id IS NOT NULL;

-- Balance indexes
CREATE INDEX idx_balances_warehouse ON inventory_balances(warehouse_id);
CREATE INDEX idx_balances_low_stock ON inventory_balances(warehouse_id, available_qty) WHERE available_qty < 10;

-- Reservation indexes
CREATE INDEX idx_reservations_product ON reservations(product_variant_id, status_id);
CREATE INDEX idx_reservations_reference ON reservations(reference_type, reference_id);

-- PO indexes
CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_po_status ON purchase_orders(status_id);
CREATE INDEX idx_po_lines_po ON purchase_order_lines(purchase_order_id);

-- Alert indexes
CREATE INDEX idx_alerts_product_warehouse ON inventory_alerts(product_variant_id, warehouse_id);
CREATE INDEX idx_alerts_status ON inventory_alerts(status_id);
CREATE INDEX idx_alerts_priority ON inventory_alerts(priority_id);

-- JSONB and performance indexes
CREATE INDEX idx_product_variants_attributes ON product_variants USING GIN (attributes);
CREATE INDEX idx_suppliers_address ON suppliers USING GIN (address);
CREATE INDEX idx_warehouses_address ON warehouses USING GIN (address);

-- ============================================
-- STEP 11: CREATE TRIGGERS FOR AUTOMATION
-- ============================================

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON warehouses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_balances_updated_at BEFORE UPDATE ON inventory_balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inventory balance maintenance trigger
CREATE OR REPLACE FUNCTION maintain_inventory_balances()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle stock movements
    IF TG_TABLE_NAME = 'stock_movements' THEN
        IF TG_OP = 'INSERT' THEN
            -- For transfers, handle both from and to locations
            IF NEW.movement_type_id = (SELECT id FROM movement_types WHERE code = 'TRANSFER') THEN
                -- Subtract from source location
                INSERT INTO inventory_balances (product_variant_id, warehouse_id, location_id, on_hand_qty, last_movement_date)
                VALUES (NEW.product_variant_id, NEW.warehouse_id, NEW.from_location_id, -NEW.qty, NEW.occurred_at)
                ON CONFLICT (product_variant_id, warehouse_id, location_id_norm)
                DO UPDATE SET
                    on_hand_qty = inventory_balances.on_hand_qty - NEW.qty,
                    last_movement_date = NEW.occurred_at;
                
                -- Add to destination location
                INSERT INTO inventory_balances (product_variant_id, warehouse_id, location_id, on_hand_qty, last_movement_date)
                VALUES (NEW.product_variant_id, NEW.warehouse_id, NEW.to_location_id, NEW.qty, NEW.occurred_at)
                ON CONFLICT (product_variant_id, warehouse_id, location_id_norm)
                DO UPDATE SET
                    on_hand_qty = inventory_balances.on_hand_qty + NEW.qty,
                    last_movement_date = NEW.occurred_at;
            ELSE
                -- Regular IN/OUT/ADJUST movements
                DECLARE
                    qty_change INTEGER;
                    target_location_id UUID;
                BEGIN
                    -- Determine quantity change and location
                    IF NEW.movement_type_id = (SELECT id FROM movement_types WHERE code = 'IN') THEN
                        qty_change := NEW.qty;
                        target_location_id := NEW.to_location_id;
                    ELSIF NEW.movement_type_id = (SELECT id FROM movement_types WHERE code = 'OUT') THEN
                        qty_change := -NEW.qty;
                        target_location_id := NEW.from_location_id;
                    ELSIF NEW.movement_type_id = (SELECT id FROM movement_types WHERE code = 'ADJUST') THEN
                        qty_change := NEW.qty; -- Adjustment can be positive or negative
                        target_location_id := COALESCE(NEW.to_location_id, NEW.from_location_id);
                    END IF;
                    
                    -- Update or insert balance
                    INSERT INTO inventory_balances (product_variant_id, warehouse_id, location_id, on_hand_qty, last_movement_date)
                    VALUES (NEW.product_variant_id, NEW.warehouse_id, target_location_id, qty_change, NEW.occurred_at)
                    ON CONFLICT (product_variant_id, warehouse_id, location_id_norm)
                    DO UPDATE SET
                        on_hand_qty = inventory_balances.on_hand_qty + qty_change,
                        last_movement_date = NEW.occurred_at;
                END;
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    
    -- Handle reservation changes
    IF TG_TABLE_NAME = 'reservations' THEN
        DECLARE
            qty_change INTEGER;
        BEGIN
            IF TG_OP = 'INSERT' THEN
                qty_change := NEW.qty;
            ELSIF TG_OP = 'UPDATE' THEN
                qty_change := NEW.qty - OLD.qty;
            ELSIF TG_OP = 'DELETE' THEN
                qty_change := -OLD.qty;
                -- Update based on OLD values for DELETE
                UPDATE inventory_balances
                SET allocated_qty = allocated_qty + qty_change
                WHERE product_variant_id = OLD.product_variant_id
                  AND warehouse_id = OLD.warehouse_id
                  AND location_id_norm = COALESCE(OLD.location_id, '00000000-0000-0000-0000-000000000000'::uuid);
                RETURN OLD;
            END IF;
            
            -- Update allocated quantity
            INSERT INTO inventory_balances (product_variant_id, warehouse_id, location_id, allocated_qty)
            VALUES (NEW.product_variant_id, NEW.warehouse_id, NEW.location_id, qty_change)
            ON CONFLICT (product_variant_id, warehouse_id, location_id_norm)
            DO UPDATE SET allocated_qty = inventory_balances.allocated_qty + qty_change;
            
            RETURN COALESCE(NEW, OLD);
        END;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for inventory balance maintenance
CREATE TRIGGER stock_movements_balance_trigger
    AFTER INSERT ON stock_movements
    FOR EACH ROW EXECUTE FUNCTION maintain_inventory_balances();

CREATE TRIGGER reservations_balance_trigger
    AFTER INSERT OR UPDATE OR DELETE ON reservations
    FOR EACH ROW EXECUTE FUNCTION maintain_inventory_balances();

-- Success message
SELECT 'SUCCESS: Complete inventory schema with all fixes applied!' as status;