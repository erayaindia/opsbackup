-- Check actual schema of employees_details table first
SELECT 'employees_details table columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'employees_details'
ORDER BY ordinal_position;

-- Check what data we have
SELECT 'Current employees_details records:' as info;
SELECT * FROM employees_details LIMIT 10;