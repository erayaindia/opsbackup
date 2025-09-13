-- Debug Product Number Issue
-- Let's find the real root cause

-- Check the products table structure
DO $$
DECLARE
    col_info RECORD;
BEGIN
    RAISE NOTICE '=== PRODUCTS TABLE STRUCTURE ===';

    FOR col_info IN (
        SELECT column_name, data_type, column_default, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'products'
        AND table_schema = 'public'
        ORDER BY ordinal_position
    )
    LOOP
        RAISE NOTICE 'Column: % | Type: % | Default: % | Nullable: %',
                    col_info.column_name,
                    col_info.data_type,
                    COALESCE(col_info.column_default, 'NULL'),
                    col_info.is_nullable;
    END LOOP;
END $$;

-- Check triggers on products table
DO $$
DECLARE
    trigger_info RECORD;
BEGIN
    RAISE NOTICE '=== TRIGGERS ON PRODUCTS TABLE ===';

    FOR trigger_info IN (
        SELECT trigger_name, event_manipulation, action_timing, action_statement
        FROM information_schema.triggers
        WHERE event_object_table = 'products'
        AND event_object_schema = 'public'
    )
    LOOP
        RAISE NOTICE 'Trigger: % | Event: % | Timing: %',
                    trigger_info.trigger_name,
                    trigger_info.event_manipulation,
                    trigger_info.action_timing;
        RAISE NOTICE 'Action: %', trigger_info.action_statement;
    END LOOP;
END $$;

-- Check RLS policies
DO $$
DECLARE
    policy_info RECORD;
BEGIN
    RAISE NOTICE '=== RLS POLICIES ON PRODUCTS TABLE ===';

    FOR policy_info IN (
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies
        WHERE tablename = 'products'
    )
    LOOP
        RAISE NOTICE 'Policy: % | Command: % | Roles: %',
                    policy_info.policyname,
                    policy_info.cmd,
                    array_to_string(policy_info.roles, ', ');
        RAISE NOTICE 'Qualifier: %', COALESCE(policy_info.qual, 'None');
        RAISE NOTICE 'With Check: %', COALESCE(policy_info.with_check, 'None');
    END LOOP;
END $$;

-- Test sequence directly
DO $$
DECLARE
    seq_test INTEGER;
    max_existing INTEGER;
BEGIN
    RAISE NOTICE '=== SEQUENCE TEST ===';

    SELECT COALESCE(MAX(product_number), 0) INTO max_existing FROM products;
    SELECT nextval('products_product_number_seq') INTO seq_test;

    RAISE NOTICE 'Max existing product_number: %', max_existing;
    RAISE NOTICE 'Next sequence value: %', seq_test;

    -- Reset sequence
    PERFORM setval('products_product_number_seq', max_existing, true);

    IF seq_test = max_existing + 1 THEN
        RAISE NOTICE '✅ Sequence is working correctly';
    ELSE
        RAISE NOTICE '❌ Sequence problem - expected %, got %', max_existing + 1, seq_test;
    END IF;
END $$;

-- Show current products and their numbers
DO $$
DECLARE
    product_info RECORD;
BEGIN
    RAISE NOTICE '=== CURRENT PRODUCTS ===';

    FOR product_info IN (
        SELECT id, product_number, working_title, created_at, updated_at
        FROM products
        ORDER BY COALESCE(product_number, 999999), created_at
    )
    LOOP
        RAISE NOTICE 'Product #% (%) - Created: % - Updated: %',
                    COALESCE(product_number::text, 'NULL'),
                    product_info.working_title,
                    product_info.created_at::date,
                    product_info.updated_at::date;
    END LOOP;
END $$;

-- Test manual insert to see what happens
DO $$
DECLARE
    test_id UUID;
    assigned_number INTEGER;
BEGIN
    RAISE NOTICE '=== TESTING MANUAL INSERT ===';

    -- Insert a test product without specifying product_number
    INSERT INTO products (working_title, name, stage, priority, created_by)
    VALUES ('TEST PRODUCT - DELETE ME', 'TEST PRODUCT - DELETE ME', 'idea', 'medium', '00000000-0000-0000-0000-000000000000')
    RETURNING id, product_number INTO test_id, assigned_number;

    RAISE NOTICE 'Test insert - ID: % got product_number: %', test_id, assigned_number;

    -- Clean up
    DELETE FROM products WHERE id = test_id;
    RAISE NOTICE 'Test product deleted';

EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Test insert failed: %', SQLERRM;
END $$;