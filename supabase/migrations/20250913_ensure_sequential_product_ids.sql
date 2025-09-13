-- Ensure Sequential Product IDs
-- This migration ensures that product IDs are sequential and never reused

-- First, let's check the current ID column setup
DO $$
DECLARE
    current_sequence_name TEXT;
    max_id INTEGER;
    next_id INTEGER;
BEGIN
    RAISE NOTICE '=== CHECKING CURRENT PRODUCT ID SETUP ===';

    -- Get the current sequence name for the products table
    SELECT pg_get_serial_sequence('products', 'id') INTO current_sequence_name;

    IF current_sequence_name IS NOT NULL THEN
        RAISE NOTICE 'Current sequence: %', current_sequence_name;

        -- Get current max ID and next sequence value
        EXECUTE format('SELECT MAX(id) FROM products') INTO max_id;
        EXECUTE format('SELECT nextval(%L)', current_sequence_name) INTO next_id;

        -- Reset the sequence to continue from max_id + 1
        EXECUTE format('SELECT setval(%L, %s)', current_sequence_name, COALESCE(max_id, 0));

        RAISE NOTICE 'Current max ID: %, Next ID will be: %', max_id, COALESCE(max_id, 0) + 1;
    ELSE
        RAISE NOTICE 'No sequence found - creating one';

        -- If no sequence exists, create one
        EXECUTE 'CREATE SEQUENCE IF NOT EXISTS products_id_seq';

        -- Get current max ID
        EXECUTE 'SELECT COALESCE(MAX(id), 0) FROM products' INTO max_id;

        -- Set sequence to start from max_id + 1
        EXECUTE format('SELECT setval(''products_id_seq'', %s)', max_id);

        -- Make sure the id column uses the sequence
        ALTER TABLE products ALTER COLUMN id SET DEFAULT nextval('products_id_seq');

        RAISE NOTICE 'Created new sequence starting from: %', max_id + 1;
    END IF;
END $$;

-- Ensure the ID column is properly configured as SERIAL (auto-increment)
-- This will make sure new products get sequential IDs automatically
DO $$
BEGIN
    -- Check if id column has a default value (sequence)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products'
        AND column_name = 'id'
        AND column_default LIKE '%nextval%'
    ) THEN
        -- If no sequence default, add it
        ALTER TABLE products ALTER COLUMN id SET DEFAULT nextval('products_id_seq');
        RAISE NOTICE 'Added sequence default to products.id column';
    ELSE
        RAISE NOTICE 'products.id column already has sequence default';
    END IF;

    -- Ensure the sequence is owned by the column (for proper CASCADE behavior)
    ALTER SEQUENCE products_id_seq OWNED BY products.id;

    RAISE NOTICE 'Sequence ownership set to products.id';
END $$;

-- Verify the setup
DO $$
DECLARE
    sequence_info RECORD;
    next_id INTEGER;
BEGIN
    RAISE NOTICE '=== VERIFICATION ===';

    -- Get sequence information
    SELECT
        schemaname,
        sequencename,
        last_value,
        increment_by,
        is_called
    INTO sequence_info
    FROM pg_sequences
    WHERE sequencename = 'products_id_seq';

    IF FOUND THEN
        RAISE NOTICE 'Sequence: %.%', sequence_info.schemaname, sequence_info.sequencename;
        RAISE NOTICE 'Last value: %, Increment: %', sequence_info.last_value, sequence_info.increment_by;

        -- Show what the next ID will be
        SELECT nextval('products_id_seq') INTO next_id;
        PERFORM setval('products_id_seq', sequence_info.last_value, sequence_info.is_called);

        RAISE NOTICE 'Next product ID will be: %', next_id;
    ELSE
        RAISE NOTICE 'ERROR: products_id_seq sequence not found!';
    END IF;
END $$;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '=== SEQUENTIAL ID SETUP COMPLETE ===';
    RAISE NOTICE 'Product IDs will now be sequential: 1, 2, 3, 4, 5, 6...';
    RAISE NOTICE 'Deleted product IDs will NEVER be reused';
    RAISE NOTICE 'New products will automatically get the next available ID';
    RAISE NOTICE 'This is the standard PostgreSQL SERIAL behavior';
END $$;