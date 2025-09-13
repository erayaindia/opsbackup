-- Fix Trigger to Only Run on INSERT
-- This prevents product numbers from being reassigned during updates

-- First, let's see what damage was done
DO $$
DECLARE
    rec RECORD;
    duplicate_count INTEGER;
BEGIN
    RAISE NOTICE '=== CHECKING FOR DUPLICATE PRODUCT NUMBERS ===';

    -- Count duplicates
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT product_number
        FROM products
        WHERE product_number IS NOT NULL
        GROUP BY product_number
        HAVING COUNT(*) > 1
    ) duplicates;

    IF duplicate_count > 0 THEN
        RAISE NOTICE 'Found % duplicate product numbers', duplicate_count;

        -- Show the duplicates
        FOR rec IN (
            SELECT product_number, COUNT(*) as count,
                   string_agg(working_title, ', ' ORDER BY created_at) as titles
            FROM products
            WHERE product_number IS NOT NULL
            GROUP BY product_number
            HAVING COUNT(*) > 1
            ORDER BY product_number
        )
        LOOP
            RAISE NOTICE 'Product #% appears % times: %', rec.product_number, rec.count, rec.titles;
        END LOOP;
    ELSE
        RAISE NOTICE 'No duplicate product numbers found';
    END IF;
END $$;

-- Fix the trigger function to be smarter about when to assign numbers
CREATE OR REPLACE FUNCTION assign_product_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Only assign product_number during INSERT operations
    -- AND only if product_number is NULL or not provided
    IF TG_OP = 'INSERT' AND (NEW.product_number IS NULL OR NEW.product_number = 0) THEN
        -- Get the next number safely using a lock to prevent race conditions
        LOCK TABLE products IN EXCLUSIVE MODE;
        SELECT COALESCE(MAX(product_number), 0) + 1 INTO NEW.product_number FROM products;

        RAISE NOTICE 'Assigned product number % to new product: %', NEW.product_number, NEW.working_title;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger to only fire on INSERT
DROP TRIGGER IF EXISTS trigger_assign_product_number ON products;
CREATE TRIGGER trigger_assign_product_number
    BEFORE INSERT ON products
    FOR EACH ROW
    EXECUTE FUNCTION assign_product_number();

-- Clean up any duplicate product numbers that were created
DO $$
DECLARE
    rec RECORD;
    new_number INTEGER;
    max_number INTEGER;
BEGIN
    RAISE NOTICE '=== FIXING DUPLICATE PRODUCT NUMBERS ===';

    -- Get current max to continue sequence properly
    SELECT COALESCE(MAX(product_number), 0) INTO max_number FROM products;

    -- Fix duplicates by reassigning them sequential numbers
    FOR rec IN (
        SELECT id, product_number, working_title, created_at,
               ROW_NUMBER() OVER (PARTITION BY product_number ORDER BY created_at) as rn
        FROM products
        WHERE product_number IN (
            SELECT product_number
            FROM products
            WHERE product_number IS NOT NULL
            GROUP BY product_number
            HAVING COUNT(*) > 1
        )
        ORDER BY product_number, created_at
    )
    LOOP
        -- Keep the first occurrence, reassign the duplicates
        IF rec.rn > 1 THEN
            max_number := max_number + 1;

            UPDATE products
            SET product_number = max_number
            WHERE id = rec.id;

            RAISE NOTICE 'Reassigned product "%" from #% to #%', rec.working_title, rec.product_number, max_number;
        END IF;
    END LOOP;

    -- Update the sequence to continue from the new max
    PERFORM setval('products_product_number_seq', max_number, true);

    RAISE NOTICE 'Updated sequence to continue from %', max_number + 1;
END $$;

-- Final verification
DO $$
DECLARE
    total_products INTEGER;
    max_number INTEGER;
    duplicate_count INTEGER;
BEGIN
    RAISE NOTICE '=== FINAL VERIFICATION ===';

    SELECT COUNT(*) INTO total_products FROM products;
    SELECT COALESCE(MAX(product_number), 0) INTO max_number FROM products;

    -- Check for remaining duplicates
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT product_number
        FROM products
        WHERE product_number IS NOT NULL
        GROUP BY product_number
        HAVING COUNT(*) > 1
    ) duplicates;

    RAISE NOTICE 'Total products: %', total_products;
    RAISE NOTICE 'Max product number: %', max_number;
    RAISE NOTICE 'Duplicate numbers: %', duplicate_count;

    IF duplicate_count = 0 THEN
        RAISE NOTICE '✅ ALL DUPLICATES FIXED - Each product has unique number';
        RAISE NOTICE '✅ Next new product will get #%', max_number + 1;
        RAISE NOTICE '✅ Updates will NOT change existing product numbers';
    ELSE
        RAISE NOTICE '❌ Still have % duplicates - manual intervention needed', duplicate_count;
    END IF;
END $$;