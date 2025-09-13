-- Add Sequential Product ID System
-- This creates a permanent, sequential ID system where deleted IDs are never reused

-- Add the sequential product number column starting from 1
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_number SERIAL;

-- Ensure the sequence starts at 1
ALTER SEQUENCE products_product_number_seq RESTART WITH 1;

-- Create a unique index on product_number for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_product_number ON products(product_number);

-- Update existing products to have sequential numbers if they don't already
DO $$
DECLARE
    product_record RECORD;
    counter INTEGER := 1;
    max_number INTEGER;
BEGIN
    RAISE NOTICE '=== ASSIGNING SEQUENTIAL NUMBERS TO EXISTING PRODUCTS ===';

    -- Check if any products exist without product_number or with 0 values
    IF EXISTS (SELECT 1 FROM products WHERE product_number IS NULL OR product_number <= 0) THEN
        RAISE NOTICE 'Found products without proper sequential numbers, assigning...';

        -- Get the current maximum valid product_number to continue from there
        SELECT COALESCE(MAX(product_number), 0) INTO max_number FROM products WHERE product_number IS NOT NULL AND product_number > 0;
        counter := GREATEST(max_number + 1, 1); -- Ensure we start at least from 1

        -- Assign sequential numbers to existing products ordered by created_at
        FOR product_record IN
            SELECT id, created_at
            FROM products
            WHERE product_number IS NULL OR product_number <= 0
            ORDER BY created_at ASC
        LOOP
            UPDATE products
            SET product_number = counter
            WHERE id = product_record.id;

            RAISE NOTICE 'Assigned product number % to product ID %', counter, product_record.id;
            counter := counter + 1;
        END LOOP;

        -- Update the sequence to continue from the last assigned number
        PERFORM setval('products_product_number_seq', counter - 1, true);
        RAISE NOTICE 'Set sequence to continue from %', counter;
    ELSE
        RAISE NOTICE 'All products already have proper sequential numbers';

        -- Ensure sequence is set correctly
        SELECT MAX(product_number) INTO max_number FROM products WHERE product_number > 0;
        IF max_number IS NOT NULL AND max_number > 0 THEN
            PERFORM setval('products_product_number_seq', max_number, true);
            RAISE NOTICE 'Sequence set to continue from %', max_number + 1;
        ELSE
            -- No valid product numbers exist, reset sequence to start at 1
            PERFORM setval('products_product_number_seq', 1, false);
            RAISE NOTICE 'No valid product numbers found, sequence reset to start at 1';
        END IF;
    END IF;
END $$;

-- Create a function to display product with sequential number
CREATE OR REPLACE FUNCTION get_product_display_id(product_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    display_number INTEGER;
BEGIN
    SELECT product_number INTO display_number
    FROM products
    WHERE id = product_uuid;

    IF display_number IS NOT NULL THEN
        RETURN '#' || display_number::TEXT;
    ELSE
        RETURN 'N/A';
    END IF;
END;
$$;

-- Verify the setup
DO $$
DECLARE
    total_products INTEGER;
    max_number INTEGER;
    next_number INTEGER;
    product_record RECORD;
BEGIN
    RAISE NOTICE '=== VERIFICATION ===';

    SELECT COUNT(*), MAX(product_number) INTO total_products, max_number FROM products;

    RAISE NOTICE 'Total products: %', total_products;
    RAISE NOTICE 'Highest product number: %', max_number;

    -- Show what the next number will be
    SELECT nextval('products_product_number_seq') INTO next_number;
    PERFORM setval('products_product_number_seq', COALESCE(max_number, 0), true);

    RAISE NOTICE 'Next product will get number: %', COALESCE(max_number, 0) + 1;

    -- Show some examples
    FOR product_record IN
        SELECT id, product_number, working_title, created_at
        FROM products
        WHERE product_number IS NOT NULL
        ORDER BY product_number
        LIMIT 5
    LOOP
        RAISE NOTICE 'Product #% - UUID: % - Title: %',
                    product_record.product_number,
                    product_record.id,
                    COALESCE(product_record.working_title, 'Untitled');
    END LOOP;
END $$;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '=== SEQUENTIAL PRODUCT ID SYSTEM SETUP COMPLETE ===';
    RAISE NOTICE 'Each product now has a sequential product_number: 1, 2, 3, 4, 5...';
    RAISE NOTICE 'UUID primary keys remain unchanged for database integrity';
    RAISE NOTICE 'Display format: Product #1, Product #2, etc.';
    RAISE NOTICE 'Deleted product numbers will NEVER be reused (permanent gaps)';
    RAISE NOTICE 'Use get_product_display_id(uuid) function to get #N format';
    RAISE NOTICE 'Or access product_number column directly';
    RAISE NOTICE 'The SERIAL sequence ensures new products get the next available number';
END $$;