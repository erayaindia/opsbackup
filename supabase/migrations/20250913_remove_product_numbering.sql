-- Remove Product Numbering System Completely
-- This removes all traces of the product_number system

-- Drop the trigger and function if they exist
DROP TRIGGER IF EXISTS trigger_assign_product_number ON products;
DROP FUNCTION IF EXISTS assign_product_number();
DROP FUNCTION IF EXISTS get_product_display_id(UUID);

-- Drop the sequence if it exists
DROP SEQUENCE IF EXISTS products_product_number_seq CASCADE;

-- Drop the product_number column if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'product_number'
    ) THEN
        ALTER TABLE products DROP COLUMN product_number;
        RAISE NOTICE 'Dropped product_number column';
    ELSE
        RAISE NOTICE 'product_number column does not exist';
    END IF;
END $$;

-- Drop the index if it exists
DROP INDEX IF EXISTS idx_products_product_number;

-- Clean up any orphaned sequences
DO $$
DECLARE
    seq_name TEXT;
BEGIN
    FOR seq_name IN (
        SELECT sequencename
        FROM pg_sequences
        WHERE sequencename LIKE '%product%number%'
    )
    LOOP
        EXECUTE format('DROP SEQUENCE IF EXISTS %I CASCADE', seq_name);
        RAISE NOTICE 'Dropped sequence: %', seq_name;
    END LOOP;
END $$;

-- Verification
DO $$
BEGIN
    RAISE NOTICE '=== PRODUCT NUMBERING SYSTEM REMOVAL COMPLETE ===';

    -- Check if column still exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'product_number'
    ) THEN
        RAISE NOTICE '❌ product_number column still exists';
    ELSE
        RAISE NOTICE '✅ product_number column successfully removed';
    END IF;

    -- Check if triggers still exist
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE event_object_table = 'products'
        AND trigger_name LIKE '%product_number%'
    ) THEN
        RAISE NOTICE '❌ Product number triggers still exist';
    ELSE
        RAISE NOTICE '✅ Product number triggers removed';
    END IF;

    -- Check if sequences still exist
    IF EXISTS (
        SELECT 1 FROM pg_sequences
        WHERE sequencename LIKE '%product%number%'
    ) THEN
        RAISE NOTICE '❌ Product number sequences still exist';
    ELSE
        RAISE NOTICE '✅ Product number sequences removed';
    END IF;

    RAISE NOTICE 'Products will now use UUID IDs and internal_code for identification';
END $$;