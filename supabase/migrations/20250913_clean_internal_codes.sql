-- Clean Up Old Internal Codes
-- This removes the #1, #2, etc. internal codes and replaces them with proper PRD codes

DO $$
DECLARE
    product_record RECORD;
    new_code TEXT;
    updated_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== CLEANING UP OLD INTERNAL CODES ===';

    -- Find products with old numbering format (#1, #2, etc.)
    FOR product_record IN (
        SELECT id, internal_code, working_title
        FROM products
        WHERE internal_code IS NOT NULL
        AND (internal_code ~ '^#[0-9]+$' OR internal_code = '' OR internal_code IS NULL)
        ORDER BY created_at
    )
    LOOP
        -- Generate new PRD code
        new_code := 'PRD-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD((RANDOM() * 9999)::INTEGER::TEXT, 4, '0');

        -- Make sure the new code is unique
        WHILE EXISTS (SELECT 1 FROM products WHERE internal_code = new_code) LOOP
            new_code := 'PRD-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD((RANDOM() * 9999)::INTEGER::TEXT, 4, '0');
        END LOOP;

        -- Update the product
        UPDATE products
        SET internal_code = new_code
        WHERE id = product_record.id;

        RAISE NOTICE 'Updated product "%" from "%" to "%"',
                    product_record.working_title,
                    COALESCE(product_record.internal_code, 'NULL'),
                    new_code;

        updated_count := updated_count + 1;
    END LOOP;

    RAISE NOTICE 'Updated % products with new internal codes', updated_count;
END $$;

-- Also clean up any products with NULL internal_code
DO $$
DECLARE
    product_record RECORD;
    new_code TEXT;
    null_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== FIXING NULL INTERNAL CODES ===';

    FOR product_record IN (
        SELECT id, working_title
        FROM products
        WHERE internal_code IS NULL
        ORDER BY created_at
    )
    LOOP
        -- Generate new PRD code
        new_code := 'PRD-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD((RANDOM() * 9999)::INTEGER::TEXT, 4, '0');

        -- Make sure the new code is unique
        WHILE EXISTS (SELECT 1 FROM products WHERE internal_code = new_code) LOOP
            new_code := 'PRD-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD((RANDOM() * 9999)::INTEGER::TEXT, 4, '0');
        END LOOP;

        -- Update the product
        UPDATE products
        SET internal_code = new_code
        WHERE id = product_record.id;

        RAISE NOTICE 'Assigned internal code "%" to product "%"',
                    new_code,
                    product_record.working_title;

        null_count := null_count + 1;
    END LOOP;

    RAISE NOTICE 'Assigned internal codes to % products', null_count;
END $$;

-- Verification
DO $$
DECLARE
    total_products INTEGER;
    products_with_codes INTEGER;
    old_format_count INTEGER;
    sample_record RECORD;
BEGIN
    RAISE NOTICE '=== VERIFICATION ===';

    SELECT COUNT(*) INTO total_products FROM products;
    SELECT COUNT(*) INTO products_with_codes FROM products WHERE internal_code IS NOT NULL;
    SELECT COUNT(*) INTO old_format_count FROM products WHERE internal_code ~ '^#[0-9]+$';

    RAISE NOTICE 'Total products: %', total_products;
    RAISE NOTICE 'Products with internal codes: %', products_with_codes;
    RAISE NOTICE 'Products still with old #N format: %', old_format_count;

    IF old_format_count = 0 THEN
        RAISE NOTICE '✅ ALL OLD FORMAT CODES CLEANED UP';
    ELSE
        RAISE NOTICE '❌ Still have % products with old format', old_format_count;
    END IF;

    -- Show some examples
    RAISE NOTICE '=== SAMPLE INTERNAL CODES ===';
    FOR sample_record IN (
        SELECT internal_code, working_title
        FROM products
        WHERE internal_code IS NOT NULL
        ORDER BY created_at
        LIMIT 5
    )
    LOOP
        RAISE NOTICE 'Product: % - Code: %', sample_record.working_title, sample_record.internal_code;
    END LOOP;
END $$;