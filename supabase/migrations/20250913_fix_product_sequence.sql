-- Fix Product Number Sequence
-- This ensures the sequence continues from the correct number

DO $$
DECLARE
    max_number INTEGER;
    current_seq_value INTEGER;
    duplicate_record RECORD;
BEGIN
    RAISE NOTICE '=== FIXING PRODUCT NUMBER SEQUENCE ===';

    -- Get the current maximum product number
    SELECT COALESCE(MAX(product_number), 0) INTO max_number FROM products;
    RAISE NOTICE 'Current maximum product number: %', max_number;

    -- Get the current sequence value
    SELECT last_value INTO current_seq_value FROM products_product_number_seq;
    RAISE NOTICE 'Current sequence value: %', current_seq_value;

    -- Reset the sequence to the correct value
    -- This ensures the next product gets max_number + 1
    PERFORM setval('products_product_number_seq', max_number, true);

    -- Show what the next number will be
    RAISE NOTICE 'Next product will get number: %', max_number + 1;

    -- Verify no duplicate product numbers exist
    IF EXISTS (
        SELECT product_number, COUNT(*)
        FROM products
        WHERE product_number IS NOT NULL
        GROUP BY product_number
        HAVING COUNT(*) > 1
    ) THEN
        RAISE WARNING 'FOUND DUPLICATE PRODUCT NUMBERS - This needs manual fixing!';

        -- Show duplicates
        FOR duplicate_record IN
            SELECT product_number, COUNT(*) as count
            FROM products
            WHERE product_number IS NOT NULL
            GROUP BY product_number
            HAVING COUNT(*) > 1
            ORDER BY product_number
        LOOP
            RAISE NOTICE 'Duplicate: Product number % appears % times', duplicate_record.product_number, duplicate_record.count;
        END LOOP;

    ELSE
        RAISE NOTICE 'No duplicate product numbers found - sequence is clean';
    END IF;

END $$;

-- Test the sequence by showing what the next few numbers would be
DO $$
DECLARE
    test_number INTEGER;
BEGIN
    RAISE NOTICE '=== TESTING SEQUENCE ===';

    -- Test next 3 sequence values (without actually using them)
    FOR i IN 1..3 LOOP
        SELECT nextval('products_product_number_seq') INTO test_number;
        RAISE NOTICE 'Test: Next number would be: %', test_number;
    END LOOP;

    -- Reset sequence back to correct position
    PERFORM setval('products_product_number_seq', (SELECT COALESCE(MAX(product_number), 0) FROM products), true);

    RAISE NOTICE 'Sequence reset back to correct position';
END $$;

-- Final verification
DO $$
DECLARE
    max_number INTEGER;
    seq_value INTEGER;
BEGIN
    SELECT COALESCE(MAX(product_number), 0) INTO max_number FROM products;
    SELECT last_value INTO seq_value FROM products_product_number_seq;

    RAISE NOTICE '=== FINAL STATUS ===';
    RAISE NOTICE 'Max product number in database: %', max_number;
    RAISE NOTICE 'Current sequence value: %', seq_value;
    RAISE NOTICE 'Next new product will get: %', seq_value + 1;

    IF seq_value = max_number THEN
        RAISE NOTICE '✅ SEQUENCE IS CORRECTLY ALIGNED';
    ELSE
        RAISE NOTICE '❌ SEQUENCE MISMATCH - May cause duplicate numbers!';
    END IF;
END $$;