-- Disable automatic inventory logging trigger to prevent duplicate entries
-- We now handle logging manually through the application

DO $$
BEGIN
    -- Drop the trigger if it exists
    DROP TRIGGER IF EXISTS trigger_log_inventory_movement ON inventory_details;

    -- Drop the function if it exists
    DROP FUNCTION IF EXISTS log_inventory_movement();

    RAISE NOTICE 'Automatic inventory movement logging has been disabled';
    RAISE NOTICE 'All movement logging is now handled manually through the application';
END $$;