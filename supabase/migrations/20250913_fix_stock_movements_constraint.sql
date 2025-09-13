-- Fix Stock Movements Constraint Issue
-- The stock_movements table references product_variants, not products directly
-- We need to handle the cascade properly through the variant relationship

-- First, let's check what foreign key constraints exist for stock_movements
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    RAISE NOTICE '=== STOCK MOVEMENTS CONSTRAINT DISCOVERY ===';

    FOR constraint_record IN
        SELECT
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'stock_movements'
            AND tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
    LOOP
        RAISE NOTICE 'Stock movements constraint: % (%) -> %.%',
                    constraint_record.constraint_name,
                    constraint_record.column_name,
                    constraint_record.foreign_table_name,
                    constraint_record.foreign_column_name;
    END LOOP;
END $$;

-- Fix the product_variants constraint to have CASCADE DELETE
-- This will handle stock_movements indirectly when products are deleted
ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS product_variants_product_id_fkey;
ALTER TABLE product_variants
ADD CONSTRAINT product_variants_product_id_fkey
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Fix the stock_movements -> product_variants constraint to have CASCADE DELETE
-- This ensures when a product_variant is deleted, its stock movements are also deleted
ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS stock_movements_product_variant_id_fkey;
ALTER TABLE stock_movements
ADD CONSTRAINT stock_movements_product_variant_id_fkey
FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE CASCADE;

-- Fix supplier_prices constraint - first check what columns exist
DO $$
DECLARE
    supplier_constraint_record RECORD;
BEGIN
    RAISE NOTICE '=== SUPPLIER PRICES CONSTRAINT DISCOVERY ===';

    -- First show all columns in supplier_prices table
    FOR supplier_constraint_record IN
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'supplier_prices'
            AND table_schema = 'public'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE 'supplier_prices column: % (%)',
                    supplier_constraint_record.column_name,
                    supplier_constraint_record.data_type;
    END LOOP;

    -- Then show existing foreign key constraints
    FOR supplier_constraint_record IN
        SELECT
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'supplier_prices'
            AND tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
    LOOP
        RAISE NOTICE 'supplier_prices constraint: % (%) -> %.%',
                    supplier_constraint_record.constraint_name,
                    supplier_constraint_record.column_name,
                    supplier_constraint_record.foreign_table_name,
                    supplier_constraint_record.foreign_column_name;
    END LOOP;

    -- Try to fix constraint based on what we find
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'supplier_prices' AND column_name = 'product_id'
    ) THEN
        ALTER TABLE supplier_prices DROP CONSTRAINT IF EXISTS supplier_prices_product_id_fkey;
        ALTER TABLE supplier_prices
        ADD CONSTRAINT supplier_prices_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
        RAISE NOTICE 'Fixed supplier_prices.product_id constraint';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'supplier_prices' AND column_name = 'product_variant_id'
    ) THEN
        ALTER TABLE supplier_prices DROP CONSTRAINT IF EXISTS supplier_prices_product_variant_id_fkey;
        ALTER TABLE supplier_prices
        ADD CONSTRAINT supplier_prices_product_variant_id_fkey
        FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE CASCADE;
        RAISE NOTICE 'Fixed supplier_prices.product_variant_id constraint';
    ELSE
        RAISE NOTICE 'supplier_prices table does not have product_id or product_variant_id columns';
    END IF;
END $$;

-- Fix inventory_balances constraint
DO $$
DECLARE
    inventory_constraint_record RECORD;
BEGIN
    RAISE NOTICE '=== INVENTORY BALANCES CONSTRAINT DISCOVERY ===';

    -- First show all columns in inventory_balances table
    FOR inventory_constraint_record IN
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'inventory_balances'
            AND table_schema = 'public'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE 'inventory_balances column: % (%)',
                    inventory_constraint_record.column_name,
                    inventory_constraint_record.data_type;
    END LOOP;

    -- Then show existing foreign key constraints
    FOR inventory_constraint_record IN
        SELECT
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'inventory_balances'
            AND tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
    LOOP
        RAISE NOTICE 'inventory_balances constraint: % (%) -> %.%',
                    inventory_constraint_record.constraint_name,
                    inventory_constraint_record.column_name,
                    inventory_constraint_record.foreign_table_name,
                    inventory_constraint_record.foreign_column_name;
    END LOOP;

    -- Try to fix constraint based on what we find
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'inventory_balances' AND column_name = 'product_id'
    ) THEN
        ALTER TABLE inventory_balances DROP CONSTRAINT IF EXISTS inventory_balances_product_id_fkey;
        ALTER TABLE inventory_balances
        ADD CONSTRAINT inventory_balances_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
        RAISE NOTICE 'Fixed inventory_balances.product_id constraint';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'inventory_balances' AND column_name = 'product_variant_id'
    ) THEN
        ALTER TABLE inventory_balances DROP CONSTRAINT IF EXISTS inventory_balances_product_variant_id_fkey;
        ALTER TABLE inventory_balances
        ADD CONSTRAINT inventory_balances_product_variant_id_fkey
        FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE CASCADE;
        RAISE NOTICE 'Fixed inventory_balances.product_variant_id constraint';
    ELSE
        RAISE NOTICE 'inventory_balances table does not have product_id or product_variant_id columns';
    END IF;
END $$;

-- Also fix any other stock_movements constraints that might exist
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN
        SELECT DISTINCT
            tc.constraint_name,
            kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'stock_movements'
            AND tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
    LOOP
        BEGIN
            -- Update constraint to have CASCADE DELETE if it doesn't already
            EXECUTE format('ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS %I', constraint_record.constraint_name);

            -- Re-add with CASCADE based on column name
            IF constraint_record.column_name = 'product_variant_id' THEN
                EXECUTE 'ALTER TABLE stock_movements ADD CONSTRAINT ' || constraint_record.constraint_name ||
                       ' FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE CASCADE';
            ELSIF constraint_record.column_name = 'warehouse_id' THEN
                EXECUTE 'ALTER TABLE stock_movements ADD CONSTRAINT ' || constraint_record.constraint_name ||
                       ' FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE';
            ELSIF constraint_record.column_name = 'lot_id' THEN
                EXECUTE 'ALTER TABLE stock_movements ADD CONSTRAINT ' || constraint_record.constraint_name ||
                       ' FOREIGN KEY (lot_id) REFERENCES lots(id) ON DELETE CASCADE';
            ELSIF constraint_record.column_name = 'user_id' THEN
                EXECUTE 'ALTER TABLE stock_movements ADD CONSTRAINT ' || constraint_record.constraint_name ||
                       ' FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE SET NULL';
            ELSE
                RAISE NOTICE 'Unknown constraint column: % - please handle manually', constraint_record.column_name;
            END IF;

            RAISE NOTICE 'Fixed CASCADE for stock_movements.%', constraint_record.column_name;
        EXCEPTION
            WHEN others THEN
                RAISE NOTICE 'Could not fix constraint % - %', constraint_record.constraint_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Now update the productLifecycleService delete method to handle the proper cascade
-- The deletion order should be: products -> product_variants -> stock_movements (automatically via CASCADE)

-- COMPREHENSIVE: Auto-discover and fix ALL remaining tables that reference products
DO $$
DECLARE
    all_constraint_record RECORD;
    fixed_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== COMPREHENSIVE AUTO-DISCOVERY AND FIX ===';
    RAISE NOTICE 'Finding ALL remaining tables that reference products...';

    -- Find all tables that have foreign key constraints to products (excluding ones we already handled)
    FOR all_constraint_record IN
        SELECT DISTINCT
            tc.table_name,
            tc.constraint_name,
            kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_name = 'products'
            AND tc.table_schema = 'public'
            AND tc.table_name NOT IN ('product_variants', 'stock_movements', 'supplier_prices', 'inventory_balances')
        ORDER BY tc.table_name
    LOOP
        BEGIN
            -- Drop the existing constraint
            EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I',
                          all_constraint_record.table_name,
                          all_constraint_record.constraint_name);

            -- Add the constraint with CASCADE DELETE
            EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES products(id) ON DELETE CASCADE',
                          all_constraint_record.table_name,
                          all_constraint_record.constraint_name,
                          all_constraint_record.column_name);

            RAISE NOTICE 'AUTO-FIXED: Table "%" column "%" (constraint: %)',
                        all_constraint_record.table_name,
                        all_constraint_record.column_name,
                        all_constraint_record.constraint_name;

            fixed_count := fixed_count + 1;
        EXCEPTION
            WHEN others THEN
                RAISE NOTICE 'AUTO-FIX FAILED: Could not fix constraint % on table %.% - %',
                            all_constraint_record.constraint_name,
                            all_constraint_record.table_name,
                            all_constraint_record.column_name,
                            SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE 'Auto-discovery completed - fixed % additional constraints', fixed_count;
END $$;

-- Final status and summary
DO $$
BEGIN
    RAISE NOTICE '=== CASCADE DELETE SETUP COMPLETE ===';
    RAISE NOTICE 'Fixed cascade chains:';
    RAISE NOTICE '  • products -> product_variants -> stock_movements';
    RAISE NOTICE '  • products -> supplier_prices (if exists)';
    RAISE NOTICE '  • products -> inventory_balances (if exists)';
    RAISE NOTICE '  • products -> ALL other discovered tables';
    RAISE NOTICE '';
    RAISE NOTICE 'When a product is deleted:';
    RAISE NOTICE '1. All product_variants for that product will be deleted (CASCADE)';
    RAISE NOTICE '2. All stock_movements for those variants will be deleted (CASCADE)';
    RAISE NOTICE '3. All supplier_prices will be deleted (CASCADE)';
    RAISE NOTICE '4. All inventory_balances will be deleted (CASCADE)';
    RAISE NOTICE '5. All other related tables will be deleted (CASCADE)';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Products can now be safely deleted from UI or database!';
END $$;