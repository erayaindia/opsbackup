-- Clean up old inventory logs with invalid IDs from previous system
-- This will remove logs that reference non-existent inventory detail IDs

DO $$
BEGIN
    -- Delete logs that don't have matching inventory details
    DELETE FROM inventory_logs
    WHERE inventory_detail_id NOT IN (
        SELECT id FROM inventory_details
    );

    -- Get count of remaining logs
    DECLARE
        remaining_count INTEGER;
    BEGIN
        SELECT COUNT(*) INTO remaining_count FROM inventory_logs;
        RAISE NOTICE 'Cleaned up old inventory logs. Remaining logs: %', remaining_count;
    END;
END $$;

-- Add a note about the cleanup
COMMENT ON TABLE inventory_logs IS 'Inventory movement history - cleaned up old invalid references';