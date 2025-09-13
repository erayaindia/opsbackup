-- Fix Products with #0 Product Numbers
-- This corrects any products that were assigned product_number = 0

DO $$
DECLARE
    product_record RECORD;
    counter INTEGER;
    max_number INTEGER;
    zero_count INTEGER;
BEGIN
    RAISE NOTICE '=== FIXING PRODUCT NUMBERS STARTING WITH #0 ===';

    -- Count how many products have 0 or null product_number
    SELECT COUNT(*) INTO zero_count
    FROM products
    WHERE product_number IS NULL OR product_number <= 0;

    IF zero_count > 0 THEN
        RAISE NOTICE 'Found % products with invalid product numbers (0 or NULL)', zero_count;

        -- Get the current maximum valid product_number
        SELECT COALESCE(MAX(product_number), 0) INTO max_number
        FROM products
        WHERE product_number IS NOT NULL AND product_number > 0;

        -- Start counter from max + 1, but ensure it's at least 1
        counter := GREATEST(max_number + 1, 1);

        RAISE NOTICE 'Starting reassignment from product number %', counter;

        -- Update all products with invalid numbers, ordered by creation date
        FOR product_record IN (
            SELECT id, working_title, created_at, product_number as old_number
            FROM products
            WHERE product_number IS NULL OR product_number <= 0
            ORDER BY created_at ASC
        )
        LOOP
            -- Update the product
            UPDATE products
            SET product_number = counter
            WHERE id = product_record.id;

            RAISE NOTICE 'Updated product "%" from #% to #%',
                        COALESCE(product_record.working_title, 'Untitled'),
                        COALESCE(product_record.old_number, 0),
                        counter;

            counter := counter + 1;
        END LOOP;

        -- Update the sequence to continue from the last assigned number
        PERFORM setval('products_product_number_seq', counter - 1, true);

        RAISE NOTICE 'Updated sequence to continue from %', counter;
        RAISE NOTICE '✅ Fixed % products with invalid product numbers', zero_count;
    ELSE
        RAISE NOTICE '✅ All products already have valid product numbers (> 0)';
    END IF;

    -- Ensure sequence is properly set
    SELECT MAX(product_number) INTO max_number FROM products;
    IF max_number IS NOT NULL AND max_number > 0 THEN
        PERFORM setval('products_product_number_seq', max_number, true);
        RAISE NOTICE 'Sequence confirmed to continue from %', max_number + 1;
    END IF;

END $$;

-- Verification query
DO $$
DECLARE
    total_count INTEGER;
    min_number INTEGER;
    max_number INTEGER;
    zero_count INTEGER;
BEGIN
    SELECT COUNT(*), MIN(product_number), MAX(product_number)
    INTO total_count, min_number, max_number
    FROM products
    WHERE product_number IS NOT NULL;

    SELECT COUNT(*) INTO zero_count
    FROM products
    WHERE product_number IS NULL OR product_number <= 0;

    RAISE NOTICE '=== VERIFICATION RESULTS ===';
    RAISE NOTICE 'Total products with valid numbers: %', total_count;
    RAISE NOTICE 'Minimum product number: %', min_number;
    RAISE NOTICE 'Maximum product number: %', max_number;
    RAISE NOTICE 'Products with invalid numbers (0 or NULL): %', zero_count;

    IF zero_count = 0 AND min_number >= 1 THEN
        RAISE NOTICE '✅ SUCCESS: All products have valid sequential numbers starting from 1';
    ELSE
        RAISE NOTICE '❌ ISSUE: Some products still have invalid numbers';
    END IF;
END $$;