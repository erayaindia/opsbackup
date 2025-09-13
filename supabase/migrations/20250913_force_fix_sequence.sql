-- Force Fix Product Number Sequence
-- This will definitively fix the sequence issue

-- Step 1: Check current state
DO $$
DECLARE
    max_num INTEGER;
    seq_val INTEGER;
BEGIN
    SELECT COALESCE(MAX(product_number), 0) INTO max_num FROM products;

    RAISE NOTICE 'Current max product_number: %', max_num;

    -- Show current products
    FOR rec IN (SELECT id, product_number, working_title FROM products ORDER BY product_number)
    LOOP
        RAISE NOTICE 'Product: #% - %', rec.product_number, rec.working_title;
    END LOOP;
END $$;

-- Step 2: Remove the current sequence and recreate it properly
DROP SEQUENCE IF EXISTS products_product_number_seq CASCADE;

-- Step 3: Recreate the sequence with correct starting value
DO $$
DECLARE
    max_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(product_number), 0) INTO max_num FROM products;

    -- Create sequence starting from max + 1
    EXECUTE format('CREATE SEQUENCE products_product_number_seq START WITH %s INCREMENT BY 1', max_num + 1);

    RAISE NOTICE 'Created sequence starting from: %', max_num + 1;
END $$;

-- Step 4: Set the column default to use the sequence
ALTER TABLE products ALTER COLUMN product_number SET DEFAULT nextval('products_product_number_seq');

-- Step 5: Make sure the sequence is owned by the column
ALTER SEQUENCE products_product_number_seq OWNED BY products.product_number;

-- Step 6: Test the sequence
DO $$
DECLARE
    next_val INTEGER;
    max_existing INTEGER;
BEGIN
    SELECT COALESCE(MAX(product_number), 0) INTO max_existing FROM products;
    SELECT nextval('products_product_number_seq') INTO next_val;

    -- Reset the sequence (we just tested it)
    PERFORM setval('products_product_number_seq', max_existing, true);

    RAISE NOTICE '=== SEQUENCE TEST RESULTS ===';
    RAISE NOTICE 'Max existing product number: %', max_existing;
    RAISE NOTICE 'Next sequence value will be: %', max_existing + 1;

    IF next_val = max_existing + 1 THEN
        RAISE NOTICE '✅ SEQUENCE IS WORKING CORRECTLY';
    ELSE
        RAISE NOTICE '❌ SEQUENCE PROBLEM: Expected %, got %', max_existing + 1, next_val;
    END IF;
END $$;

-- Step 7: Alternative approach - use a trigger to ensure proper numbering
CREATE OR REPLACE FUNCTION assign_product_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Only assign if product_number is NULL (new insert)
    IF NEW.product_number IS NULL THEN
        -- Get the next number safely
        SELECT COALESCE(MAX(product_number), 0) + 1 INTO NEW.product_number FROM products;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new inserts
DROP TRIGGER IF EXISTS trigger_assign_product_number ON products;
CREATE TRIGGER trigger_assign_product_number
    BEFORE INSERT ON products
    FOR EACH ROW
    EXECUTE FUNCTION assign_product_number();

-- Final verification
DO $$
DECLARE
    max_num INTEGER;
    seq_info RECORD;
BEGIN
    RAISE NOTICE '=== FINAL VERIFICATION ===';

    SELECT COALESCE(MAX(product_number), 0) INTO max_num FROM products;
    RAISE NOTICE 'Current max product_number: %', max_num;

    -- Check sequence
    SELECT * INTO seq_info FROM pg_sequences WHERE sequencename = 'products_product_number_seq';
    IF FOUND THEN
        RAISE NOTICE 'Sequence last_value: %', seq_info.last_value;
        RAISE NOTICE 'Sequence increment: %', seq_info.increment_by;
    END IF;

    -- Check trigger
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_assign_product_number') THEN
        RAISE NOTICE '✅ Backup trigger is installed';
    END IF;

    RAISE NOTICE '=== NEXT PRODUCT WILL GET NUMBER: % ===', max_num + 1;
END $$;