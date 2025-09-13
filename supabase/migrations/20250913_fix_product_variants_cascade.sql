-- Fix Product Variants CASCADE DELETE
-- This specifically addresses the product_variants foreign key constraint issue

-- Drop the existing constraint that's preventing product deletion
ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS product_variants_product_id_fkey;

-- Re-add the constraint with CASCADE DELETE
ALTER TABLE product_variants
ADD CONSTRAINT product_variants_product_id_fkey
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Also fix any other existing tables that might have similar issues
-- (These are the ones that definitely exist based on the error logs)

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

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Fixed CASCADE DELETE constraints for existing product tables';
  RAISE NOTICE 'product_variants table constraint has been fixed';
  RAISE NOTICE 'Products can now be deleted safely from both UI and database';
END $$;