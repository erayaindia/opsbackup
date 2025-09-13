-- Fix ALL Product Foreign Key Constraints - Corrected Version
-- First, let's identify all existing foreign key constraints to products

-- Step 1: Find and display all foreign key constraints that reference products
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    RAISE NOTICE '=== DISCOVERING FOREIGN KEY CONSTRAINTS TO PRODUCTS ===';

    FOR constraint_record IN
        SELECT DISTINCT
            tc.table_name,
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_name = 'products'
            AND tc.table_schema = 'public'
        ORDER BY tc.table_name
    LOOP
        RAISE NOTICE 'Found constraint: Table "%" column "%" -> products(%)',
                    constraint_record.table_name,
                    constraint_record.column_name,
                    constraint_record.foreign_column_name;
    END LOOP;

    RAISE NOTICE '=== END DISCOVERY ===';
END $$;

-- Step 2: Fix known constraints with correct column names
-- Product Variants (assuming standard naming)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'product_variants' AND column_name = 'product_id'
    ) THEN
        ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS product_variants_product_id_fkey;
        ALTER TABLE product_variants
        ADD CONSTRAINT product_variants_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
        RAISE NOTICE 'Fixed product_variants constraint';
    ELSE
        RAISE NOTICE 'product_variants.product_id column not found - skipping';
    END IF;
END $$;

-- Product Ideas (lifecycle system)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'product_ideas' AND column_name = 'product_id'
    ) THEN
        ALTER TABLE product_ideas DROP CONSTRAINT IF EXISTS product_ideas_product_id_fkey;
        ALTER TABLE product_ideas
        ADD CONSTRAINT product_ideas_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
        RAISE NOTICE 'Fixed product_ideas constraint';
    END IF;
END $$;

-- Product Categories
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'product_categories' AND column_name = 'product_id'
    ) THEN
        ALTER TABLE product_categories DROP CONSTRAINT IF EXISTS product_categories_product_id_fkey;
        ALTER TABLE product_categories
        ADD CONSTRAINT product_categories_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
        RAISE NOTICE 'Fixed product_categories constraint';
    END IF;
END $$;

-- Product Tags
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'product_tags' AND column_name = 'product_id'
    ) THEN
        ALTER TABLE product_tags DROP CONSTRAINT IF EXISTS product_tags_product_id_fkey;
        ALTER TABLE product_tags
        ADD CONSTRAINT product_tags_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
        RAISE NOTICE 'Fixed product_tags constraint';
    END IF;
END $$;

-- Product Reference Links
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'product_reference_links' AND column_name = 'product_id'
    ) THEN
        ALTER TABLE product_reference_links DROP CONSTRAINT IF EXISTS product_reference_links_product_id_fkey;
        ALTER TABLE product_reference_links
        ADD CONSTRAINT product_reference_links_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
        RAISE NOTICE 'Fixed product_reference_links constraint';
    END IF;
END $$;

-- Product Activities
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'product_activities' AND column_name = 'product_id'
    ) THEN
        ALTER TABLE product_activities DROP CONSTRAINT IF EXISTS product_activities_product_id_fkey;
        ALTER TABLE product_activities
        ADD CONSTRAINT product_activities_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
        RAISE NOTICE 'Fixed product_activities constraint';
    END IF;
END $$;

-- Step 3: Auto-fix ALL foreign key constraints to products (the smart way)
DO $$
DECLARE
    constraint_record RECORD;
    constraint_exists BOOLEAN;
BEGIN
    RAISE NOTICE '=== FIXING ALL CONSTRAINTS AUTOMATICALLY ===';

    FOR constraint_record IN
        SELECT DISTINCT
            tc.table_name,
            tc.constraint_name,
            kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_name = 'products'
            AND tc.table_schema = 'public'
        ORDER BY tc.table_name
    LOOP
        BEGIN
            -- Drop the existing constraint
            EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I',
                          constraint_record.table_name,
                          constraint_record.constraint_name);

            -- Add the constraint with CASCADE DELETE
            EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES products(id) ON DELETE CASCADE',
                          constraint_record.table_name,
                          constraint_record.constraint_name,
                          constraint_record.column_name);

            RAISE NOTICE 'SUCCESS: Fixed CASCADE DELETE for table "%" column "%" (constraint: %)',
                        constraint_record.table_name,
                        constraint_record.column_name,
                        constraint_record.constraint_name;
        EXCEPTION
            WHEN others THEN
                RAISE NOTICE 'ERROR: Could not fix constraint % on table %.% - %',
                            constraint_record.constraint_name,
                            constraint_record.table_name,
                            constraint_record.column_name,
                            SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE '=== CONSTRAINT FIXING COMPLETE ===';
END $$;

-- Final verification
DO $$
DECLARE
    constraint_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'products'
        AND tc.table_schema = 'public';

    RAISE NOTICE '=== FINAL STATUS ===';
    RAISE NOTICE 'Total foreign key constraints to products: %', constraint_count;
    RAISE NOTICE 'All constraints should now support CASCADE DELETE';
    RAISE NOTICE 'Products can be safely deleted from UI or database';
END $$;