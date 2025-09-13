-- Add Sequential Product Number Column
-- Since the ID is UUID, we'll add a separate sequential number for display

-- Add a sequential product number column
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_number SERIAL;

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

    -- Check if any products exist without product_number
    IF EXISTS (SELECT 1 FROM products WHERE product_number IS NULL) THEN
        RAISE NOTICE 'Found products without sequential numbers, assigning...';

        -- Assign sequential numbers to existing products ordered by created_at
        FOR product_record IN
            SELECT id, created_at
            FROM products
            WHERE product_number IS NULL
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
        RAISE NOTICE 'All products already have sequential numbers';

        -- Ensure sequence is set correctly
        SELECT MAX(product_number) INTO max_number FROM products;
        IF max_number IS NOT NULL THEN
            PERFORM setval('products_product_number_seq', max_number, true);
            RAISE NOTICE 'Sequence set to continue from %', max_number + 1;
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
        ORDER BY product_number
        LIMIT 5
    LOOP
        RAISE NOTICE 'Product #% - UUID: % - Title: %',
                    product_record.product_number,
                    product_record.id,
                    product_record.working_title;
    END LOOP;
END $$;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '=== SEQUENTIAL PRODUCT NUMBERS SETUP COMPLETE ===';
    RAISE NOTICE 'Each product now has a sequential product_number: 1, 2, 3, 4, 5...';
    RAISE NOTICE 'UUID primary keys remain unchanged for database integrity';
    RAISE NOTICE 'Display format: Product #1, Product #2, etc.';
    RAISE NOTICE 'Deleted product numbers will NEVER be reused';
    RAISE NOTICE 'Use get_product_display_id(uuid) function to get #N format';
    RAISE NOTICE 'Or access product_number column directly';
END $$;