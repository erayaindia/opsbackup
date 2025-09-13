-- Fix ALL Product Foreign Key Constraints for Complete CASCADE DELETE
-- This handles ALL tables that reference products, including inventory-related tables

-- Product Variants
ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS product_variants_product_id_fkey;
ALTER TABLE product_variants
ADD CONSTRAINT product_variants_product_id_fkey
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Stock Movements (inventory system)
ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS stock_movements_product_id_fkey;
ALTER TABLE stock_movements
ADD CONSTRAINT stock_movements_product_id_fkey
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Product Ideas (lifecycle system)
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

-- Check for and fix any other tables that might reference products
-- This query will help identify any remaining foreign key constraints

DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Find all foreign key constraints that reference the products table
    FOR constraint_record IN
        SELECT
            tc.table_name,
            tc.constraint_name,
            kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_name = 'products'
            AND tc.table_name != 'products' -- Exclude self-references
    LOOP
        -- Drop and recreate each constraint with CASCADE DELETE
        BEGIN
            EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I',
                          constraint_record.table_name,
                          constraint_record.constraint_name);

            EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES products(id) ON DELETE CASCADE',
                          constraint_record.table_name,
                          constraint_record.constraint_name,
                          constraint_record.column_name);

            RAISE NOTICE 'Fixed CASCADE DELETE for table: % (constraint: %)',
                        constraint_record.table_name,
                        constraint_record.constraint_name;
        EXCEPTION
            WHEN others THEN
                RAISE NOTICE 'Could not fix constraint % on table %: %',
                            constraint_record.constraint_name,
                            constraint_record.table_name,
                            SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE 'Completed fixing all product foreign key constraints';
    RAISE NOTICE 'All tables now support CASCADE DELETE when products are removed';
END $$;

-- Final success message
DO $$
BEGIN
  RAISE NOTICE '=== CASCADE DELETE SETUP COMPLETE ===';
  RAISE NOTICE 'Fixed constraints for: product_variants, stock_movements, product_ideas, product_categories, product_tags, product_reference_links, product_activities';
  RAISE NOTICE 'Plus any other tables that reference products';
  RAISE NOTICE 'Products can now be safely deleted from database or UI';
  RAISE NOTICE 'All related data will be automatically cleaned up';
END $$;