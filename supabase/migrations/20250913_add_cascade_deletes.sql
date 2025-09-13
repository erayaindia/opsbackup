-- Add CASCADE DELETE constraints to product lifecycle tables
-- This ensures that when a product is deleted, all related data is automatically deleted

-- Drop existing foreign key constraints and recreate with CASCADE
-- Note: Some of these may not exist yet, but we use IF EXISTS to be safe

-- Product Ideas
ALTER TABLE product_ideas DROP CONSTRAINT IF EXISTS product_ideas_product_id_fkey;
ALTER TABLE product_ideas
ADD CONSTRAINT product_ideas_product_id_fkey
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Product Categories
ALTER TABLE product_categories DROP CONSTRAINT IF EXISTS product_categories_product_id_fkey;
ALTER TABLE product_categories
ADD CONSTRAINT product_categories_product_id_fkey
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Product Tags
ALTER TABLE product_tags DROP CONSTRAINT IF EXISTS product_tags_product_id_fkey;
ALTER TABLE product_tags
ADD CONSTRAINT product_tags_product_id_fkey
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Product Reference Links
ALTER TABLE product_reference_links DROP CONSTRAINT IF EXISTS product_reference_links_product_id_fkey;
ALTER TABLE product_reference_links
ADD CONSTRAINT product_reference_links_product_id_fkey
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Product Activities
ALTER TABLE product_activities DROP CONSTRAINT IF EXISTS product_activities_product_id_fkey;
ALTER TABLE product_activities
ADD CONSTRAINT product_activities_product_id_fkey
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Product Variants (this is the main one causing the constraint error)
ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS product_variants_product_id_fkey;
ALTER TABLE product_variants
ADD CONSTRAINT product_variants_product_id_fkey
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Product Media (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_media') THEN
        ALTER TABLE product_media DROP CONSTRAINT IF EXISTS product_media_product_id_fkey;
        ALTER TABLE product_media
        ADD CONSTRAINT product_media_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Product Samples (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_samples') THEN
        ALTER TABLE product_samples DROP CONSTRAINT IF EXISTS product_samples_product_id_fkey;
        ALTER TABLE product_samples
        ADD CONSTRAINT product_samples_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Product Experiments (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_experiments') THEN
        ALTER TABLE product_experiments DROP CONSTRAINT IF EXISTS product_experiments_product_id_fkey;
        ALTER TABLE product_experiments
        ADD CONSTRAINT product_experiments_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Product Deliverables (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_deliverables') THEN
        ALTER TABLE product_deliverables DROP CONSTRAINT IF EXISTS product_deliverables_product_id_fkey;
        ALTER TABLE product_deliverables
        ADD CONSTRAINT product_deliverables_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Product Asset Links (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_asset_links') THEN
        ALTER TABLE product_asset_links DROP CONSTRAINT IF EXISTS product_asset_links_product_id_fkey;
        ALTER TABLE product_asset_links
        ADD CONSTRAINT product_asset_links_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Product Milestones (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_milestones') THEN
        ALTER TABLE product_milestones DROP CONSTRAINT IF EXISTS product_milestones_product_id_fkey;
        ALTER TABLE product_milestones
        ADD CONSTRAINT product_milestones_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Product KPIs (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_kpis') THEN
        ALTER TABLE product_kpis DROP CONSTRAINT IF EXISTS product_kpis_product_id_fkey;
        ALTER TABLE product_kpis
        ADD CONSTRAINT product_kpis_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'CASCADE DELETE constraints added to all product lifecycle tables';
  RAISE NOTICE 'Products can now be safely deleted manually from database or via application';
  RAISE NOTICE 'All related data will be automatically deleted when a product is removed';
END $$;