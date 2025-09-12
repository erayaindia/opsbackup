-- Verify all tables were created successfully
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'movement_types',
        'statuses', 
        'alert_types',
        'priorities',
        'reason_codes',
        'categories',
        'products',
        'product_variants',
        'suppliers',
        'supplier_prices',
        'warehouses',
        'locations',
        'lots',
        'stock_movements',
        'inventory_balances',
        'reservations',
        'purchase_orders',
        'purchase_order_lines',
        'returns',
        'inventory_alerts',
        'stock_predictions',
        'user_warehouses'
    )
ORDER BY tablename;

-- Check table counts to verify data was inserted
SELECT 'movement_types' as table_name, COUNT(*) as row_count FROM movement_types
UNION ALL
SELECT 'statuses', COUNT(*) FROM statuses  
UNION ALL
SELECT 'alert_types', COUNT(*) FROM alert_types
UNION ALL
SELECT 'priorities', COUNT(*) FROM priorities
UNION ALL  
SELECT 'reason_codes', COUNT(*) FROM reason_codes
ORDER BY table_name;

-- Verify primary keys and constraints
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public' 
    AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE')
    AND tc.table_name IN (
        'movement_types', 'statuses', 'categories', 'products', 
        'product_variants', 'suppliers', 'warehouses', 'inventory_balances'
    )
ORDER BY tc.table_name, tc.constraint_type;

-- Verify triggers were created
SELECT 
    t.trigger_name,
    t.event_manipulation,
    t.event_object_table
FROM information_schema.triggers t
WHERE t.trigger_schema = 'public'
    AND t.trigger_name LIKE '%balance%' OR t.trigger_name LIKE '%updated_at%'
ORDER BY t.event_object_table;