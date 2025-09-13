-- Product Lifecycle Management Schema Migration
-- Created: 2025-09-13
-- Description: Extends existing products table for lifecycle management from idea to scaling

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types/enums (only if they don't exist)
DO $$ BEGIN
    CREATE TYPE product_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE product_stage AS ENUM ('idea', 'production', 'content', 'scaling', 'inventory');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE link_type AS ENUM ('competitor', 'ad');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE media_type AS ENUM ('image', 'video', 'document');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE media_category AS ENUM ('product_photo', 'reference_image', 'reference_video', 'attachment', 'technical_drawing');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE deliverable_status AS ENUM ('planned', 'in_progress', 'done');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sample_approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE asset_link_type AS ENUM ('drive', 'dropbox', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- EXTEND EXISTING PRODUCTS TABLE
-- =============================================

-- Add lifecycle management columns to existing products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS internal_code VARCHAR(50) UNIQUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS working_title VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(500);
ALTER TABLE products ADD COLUMN IF NOT EXISTS priority product_priority DEFAULT 'medium';
ALTER TABLE products ADD COLUMN IF NOT EXISTS stage product_stage DEFAULT 'inventory';
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES app_users(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES app_users(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS idle_days INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS potential_score INTEGER DEFAULT 0;

-- Add constraint to potential_score if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'products_potential_score_check'
    ) THEN
        ALTER TABLE products ADD CONSTRAINT products_potential_score_check
        CHECK (potential_score >= 0 AND potential_score <= 100);
    END IF;
END $$;

-- Update working_title for existing products (use name as working_title)
UPDATE products
SET working_title = name
WHERE working_title IS NULL AND name IS NOT NULL;

-- Update thumbnail_url for existing products (use image_url as thumbnail_url)
UPDATE products
SET thumbnail_url = image_url
WHERE thumbnail_url IS NULL AND image_url IS NOT NULL;

-- =============================================
-- STAGE-SPECIFIC DATA TABLES
-- =============================================

-- 2. Product ideas table (stage = 'idea')
CREATE TABLE IF NOT EXISTS product_ideas (
    product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    notes TEXT,
    problem_statement TEXT,
    opportunity_statement TEXT,
    market_research_notes TEXT,
    estimated_source_price_min DECIMAL(10,2),
    estimated_source_price_max DECIMAL(10,2),
    estimated_selling_price DECIMAL(10,2),
    selected_supplier_id UUID,
    margin_min DECIMAL(5,2),
    margin_max DECIMAL(5,2),
    feasibility_demand INTEGER CHECK (feasibility_demand >= 1 AND feasibility_demand <= 5),
    feasibility_difficulty INTEGER CHECK (feasibility_difficulty >= 1 AND feasibility_difficulty <= 5),
    feasibility_profit_potential INTEGER CHECK (feasibility_profit_potential >= 1 AND feasibility_profit_potential <= 5),
    target_persona_demographics TEXT,
    target_persona_interests JSONB DEFAULT '[]',
    target_persona_pain_points JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Product production table (stage = 'production')
CREATE TABLE IF NOT EXISTS product_production (
    product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    materials JSONB DEFAULT '[]',
    dimensions VARCHAR(100),
    weight VARCHAR(50),
    finish_options JSONB DEFAULT '[]',
    certifications_needed JSONB DEFAULT '[]',
    certifications_received JSONB DEFAULT '[]',
    sample_request_date DATE,
    sample_received_date DATE,
    sample_approval_status sample_approval_status DEFAULT 'pending',
    sample_notes TEXT,
    production_start_date DATE,
    production_end_date DATE,
    production_timeline_milestones JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Product content table (stage = 'content')
CREATE TABLE IF NOT EXISTS product_content (
    product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    moodboard_link VARCHAR(500),
    brief_link VARCHAR(500),
    script_hero TEXT,
    script_lifestyle TEXT,
    script_unboxing TEXT,
    script_15sec TEXT,
    script_30sec TEXT,
    agency_user_id UUID REFERENCES app_users(id),
    influencer_user_id UUID REFERENCES app_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Product scaling table (stage = 'scaling')
CREATE TABLE IF NOT EXISTS product_scaling (
    product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    launch_date DATE,
    channels JSONB DEFAULT '[]',
    budget_total DECIMAL(12,2),
    budget_facebook DECIMAL(12,2),
    budget_instagram DECIMAL(12,2),
    budget_google DECIMAL(12,2),
    budget_youtube DECIMAL(12,2),
    target_revenue DECIMAL(12,2),
    actual_revenue DECIMAL(12,2),
    target_roas DECIMAL(5,2),
    actual_roas DECIMAL(5,2),
    target_conversions INTEGER,
    actual_conversions INTEGER,
    learnings TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SUPPORTING TABLES
-- =============================================

-- 6. Product categories (Many-to-Many)
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, category)
);

-- Migrate existing category data from products.category_id to product_categories table
INSERT INTO product_categories (product_id, category)
SELECT p.id, c.name
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE p.category_id IS NOT NULL
ON CONFLICT (product_id, category) DO NOTHING;

-- 7. Product tags (Many-to-Many)
CREATE TABLE IF NOT EXISTS product_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, tag)
);

-- 8. Product suppliers (Many-to-Many with enhanced data)
CREATE TABLE IF NOT EXISTS product_suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    supplier_id UUID,
    supplier_name VARCHAR(255),
    supplier_contact VARCHAR(255),
    quote_link VARCHAR(500),
    moq INTEGER,
    target_landed_cost DECIMAL(10,2),
    lead_time_days INTEGER,
    cost_breakdown JSONB DEFAULT '[]',
    is_selected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Product reference links
CREATE TABLE IF NOT EXISTS product_reference_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    url VARCHAR(1000) NOT NULL,
    link_type link_type NOT NULL,
    title VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Product media
CREATE TABLE IF NOT EXISTS product_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type media_type NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    media_category media_category NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID REFERENCES app_users(id)
);

-- 11. Product activities
CREATE TABLE IF NOT EXISTS product_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES app_users(id),
    action VARCHAR(255) NOT NULL,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Product tasks
CREATE TABLE IF NOT EXISTS product_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    assigned_to UUID REFERENCES app_users(id),
    due_date DATE,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Product deliverables (for content stage)
CREATE TABLE IF NOT EXISTS product_deliverables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    status deliverable_status DEFAULT 'planned',
    assigned_to UUID REFERENCES app_users(id),
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Product experiments (for scaling stage)
CREATE TABLE IF NOT EXISTS product_experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    result TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. Product asset links (for content stage)
CREATE TABLE IF NOT EXISTS product_asset_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(1000) NOT NULL,
    link_type asset_link_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. Saved product views
CREATE TABLE IF NOT EXISTS saved_product_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    filters JSONB DEFAULT '{}',
    search_query VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Main products table indexes
CREATE INDEX IF NOT EXISTS idx_products_stage ON products(stage);
CREATE INDEX IF NOT EXISTS idx_products_priority ON products(priority);
CREATE INDEX IF NOT EXISTS idx_products_created_by ON products(created_by);
CREATE INDEX IF NOT EXISTS idx_products_assigned_to ON products(assigned_to);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_internal_code ON products(internal_code);

-- Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_product_categories_product_id ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_product_id ON product_tags(product_id);
CREATE INDEX IF NOT EXISTS idx_product_suppliers_product_id ON product_suppliers(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reference_links_product_id ON product_reference_links(product_id);
CREATE INDEX IF NOT EXISTS idx_product_media_product_id ON product_media(product_id);
CREATE INDEX IF NOT EXISTS idx_product_activities_product_id ON product_activities(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tasks_product_id ON product_tasks(product_id);
CREATE INDEX IF NOT EXISTS idx_product_deliverables_product_id ON product_deliverables(product_id);
CREATE INDEX IF NOT EXISTS idx_product_experiments_product_id ON product_experiments(product_id);
CREATE INDEX IF NOT EXISTS idx_product_asset_links_product_id ON product_asset_links(product_id);

-- Search and filter indexes
CREATE INDEX IF NOT EXISTS idx_product_tags_tag ON product_tags(tag);
CREATE INDEX IF NOT EXISTS idx_product_categories_category ON product_categories(category);
CREATE INDEX IF NOT EXISTS idx_product_activities_timestamp ON product_activities(timestamp);

-- =============================================
-- TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns (skip products if trigger already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'update_products_updated_at'
        AND event_object_table = 'products'
    ) THEN
        CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
DROP TRIGGER IF EXISTS update_product_ideas_updated_at ON product_ideas;
CREATE TRIGGER update_product_ideas_updated_at BEFORE UPDATE ON product_ideas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_product_production_updated_at ON product_production;
CREATE TRIGGER update_product_production_updated_at BEFORE UPDATE ON product_production FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_product_content_updated_at ON product_content;
CREATE TRIGGER update_product_content_updated_at BEFORE UPDATE ON product_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_product_scaling_updated_at ON product_scaling;
CREATE TRIGGER update_product_scaling_updated_at BEFORE UPDATE ON product_scaling FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_product_suppliers_updated_at ON product_suppliers;
CREATE TRIGGER update_product_suppliers_updated_at BEFORE UPDATE ON product_suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_product_tasks_updated_at ON product_tasks;
CREATE TRIGGER update_product_tasks_updated_at BEFORE UPDATE ON product_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_product_deliverables_updated_at ON product_deliverables;
CREATE TRIGGER update_product_deliverables_updated_at BEFORE UPDATE ON product_deliverables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_product_experiments_updated_at ON product_experiments;
CREATE TRIGGER update_product_experiments_updated_at BEFORE UPDATE ON product_experiments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_saved_product_views_updated_at ON saved_product_views;
CREATE TRIGGER update_saved_product_views_updated_at BEFORE UPDATE ON saved_product_views FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCTION TO GENERATE INTERNAL CODES
-- =============================================

-- Function to generate internal product codes
CREATE OR REPLACE FUNCTION generate_internal_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate code: PRD-YYYY-NNNN (e.g., PRD-2025-0001)
        new_code := 'PRD-' || EXTRACT(YEAR FROM NOW()) || '-' ||
                   LPAD((
                       SELECT COALESCE(MAX(CAST(SPLIT_PART(internal_code, '-', 3) AS INTEGER)), 0) + 1
                       FROM products
                       WHERE internal_code LIKE 'PRD-' || EXTRACT(YEAR FROM NOW()) || '-%'
                   )::TEXT, 4, '0');

        -- Check if code exists
        SELECT EXISTS(SELECT 1 FROM products WHERE internal_code = new_code) INTO code_exists;

        -- If code doesn't exist, we can use it
        IF NOT code_exists THEN
            EXIT;
        END IF;
    END LOOP;

    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_scaling ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reference_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_asset_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_product_views ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (full access)
-- Note: Skip products table policies since it already has RLS from inventory system

-- Stage-specific table policies
CREATE POLICY "Authenticated users can access product_ideas" ON product_ideas FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access product_production" ON product_production FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access product_content" ON product_content FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access product_scaling" ON product_scaling FOR ALL TO authenticated USING (true);

-- Supporting table policies
CREATE POLICY "Authenticated users can access product_categories" ON product_categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access product_tags" ON product_tags FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access product_suppliers" ON product_suppliers FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access product_reference_links" ON product_reference_links FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access product_media" ON product_media FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access product_activities" ON product_activities FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access product_tasks" ON product_tasks FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access product_deliverables" ON product_deliverables FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access product_experiments" ON product_experiments FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access product_asset_links" ON product_asset_links FOR ALL TO authenticated USING (true);

-- Saved views policies (users can only access their own views)
CREATE POLICY "Users can view their own saved views" ON saved_product_views FOR SELECT TO authenticated USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert their own saved views" ON saved_product_views FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update their own saved views" ON saved_product_views FOR UPDATE TO authenticated USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete their own saved views" ON saved_product_views FOR DELETE TO authenticated USING (auth.uid()::text = user_id::text);

-- =============================================
-- STORAGE BUCKETS
-- =============================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
('product-images', 'product-images', true),
('product-media', 'product-media', false),
('product-attachments', 'product-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product-images (public bucket)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE policyname = 'Authenticated users can upload to product-images'
    ) THEN
        CREATE POLICY "Authenticated users can upload to product-images"
        ON storage.objects FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'product-images');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE policyname = 'Anyone can view product images'
    ) THEN
        CREATE POLICY "Anyone can view product images"
        ON storage.objects FOR SELECT TO public
        USING (bucket_id = 'product-images');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE policyname = 'Authenticated users can update product images'
    ) THEN
        CREATE POLICY "Authenticated users can update product images"
        ON storage.objects FOR UPDATE TO authenticated
        USING (bucket_id = 'product-images');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE policyname = 'Authenticated users can delete product images'
    ) THEN
        CREATE POLICY "Authenticated users can delete product images"
        ON storage.objects FOR DELETE TO authenticated
        USING (bucket_id = 'product-images');
    END IF;
END $$;

-- Storage policies for product-media (private bucket)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE policyname = 'Authenticated users can access product-media'
    ) THEN
        CREATE POLICY "Authenticated users can access product-media"
        ON storage.objects FOR ALL TO authenticated
        USING (bucket_id = 'product-media');
    END IF;
END $$;

-- Storage policies for product-attachments (private bucket)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE policyname = 'Authenticated users can access product-attachments'
    ) THEN
        CREATE POLICY "Authenticated users can access product-attachments"
        ON storage.objects FOR ALL TO authenticated
        USING (bucket_id = 'product-attachments');
    END IF;
END $$;

-- =============================================
-- HELPFUL VIEWS
-- =============================================

-- View to get products with all their related data
CREATE VIEW products_with_details AS
SELECT
    p.*,
    pi.notes as idea_notes,
    pi.problem_statement,
    pi.opportunity_statement,
    pi.estimated_source_price_min,
    pi.estimated_source_price_max,
    pi.estimated_selling_price,
    creator.full_name as created_by_name,
    assignee.full_name as assigned_to_name,
    ARRAY_AGG(DISTINCT pc.category) FILTER (WHERE pc.category IS NOT NULL) as categories,
    ARRAY_AGG(DISTINCT pt.tag) FILTER (WHERE pt.tag IS NOT NULL) as tags
FROM products p
LEFT JOIN product_ideas pi ON p.id = pi.product_id
LEFT JOIN app_users creator ON p.created_by = creator.id
LEFT JOIN app_users assignee ON p.assigned_to = assignee.id
LEFT JOIN product_categories pc ON p.id = pc.product_id
LEFT JOIN product_tags pt ON p.id = pt.product_id
GROUP BY p.id, pi.notes, pi.problem_statement, pi.opportunity_statement,
         pi.estimated_source_price_min, pi.estimated_source_price_max,
         pi.estimated_selling_price, creator.full_name, assignee.full_name;

-- =============================================
-- SEED DATA (Optional)
-- =============================================

-- Insert some sample data (uncomment if needed)
/*
INSERT INTO products (internal_code, working_title, priority, stage, created_by, assigned_to)
VALUES
    (generate_internal_code(), 'Smart Water Bottle', 'high', 'idea',
     (SELECT id FROM app_users LIMIT 1),
     (SELECT id FROM app_users LIMIT 1)),
    (generate_internal_code(), 'Eco Phone Case', 'medium', 'idea',
     (SELECT id FROM app_users LIMIT 1),
     (SELECT id FROM app_users LIMIT 1)),
    (generate_internal_code(), 'Wireless Charging Desk Organizer', 'high', 'production',
     (SELECT id FROM app_users LIMIT 1),
     (SELECT id FROM app_users LIMIT 1));
*/

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

-- Insert a completion log
DO $$
BEGIN
    RAISE NOTICE 'Product Lifecycle Management Schema Migration Completed Successfully!';
    RAISE NOTICE 'Created % tables and % storage buckets', 16, 3;
    RAISE NOTICE 'All tables have RLS enabled with authenticated user access';
    RAISE NOTICE 'Storage buckets: product-images (public), product-media (private), product-attachments (private)';
END $$;