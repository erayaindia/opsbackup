-- Add invoice file support to inventory_logs table
-- This allows uploading invoices during stock-in movements

DO $$
BEGIN
    -- Add invoice_file_url column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns
                   WHERE table_name = 'inventory_logs'
                   AND column_name = 'invoice_file_url') THEN
        ALTER TABLE inventory_logs ADD COLUMN invoice_file_url TEXT;
        RAISE NOTICE 'Added invoice_file_url column to inventory_logs';
    ELSE
        RAISE NOTICE 'invoice_file_url column already exists in inventory_logs';
    END IF;

    -- Add invoice_file_name column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns
                   WHERE table_name = 'inventory_logs'
                   AND column_name = 'invoice_file_name') THEN
        ALTER TABLE inventory_logs ADD COLUMN invoice_file_name TEXT;
        RAISE NOTICE 'Added invoice_file_name column to inventory_logs';
    ELSE
        RAISE NOTICE 'invoice_file_name column already exists in inventory_logs';
    END IF;

    -- Add invoice_file_size column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns
                   WHERE table_name = 'inventory_logs'
                   AND column_name = 'invoice_file_size') THEN
        ALTER TABLE inventory_logs ADD COLUMN invoice_file_size INTEGER;
        RAISE NOTICE 'Added invoice_file_size column to inventory_logs';
    ELSE
        RAISE NOTICE 'invoice_file_size column already exists in inventory_logs';
    END IF;
END
$$;

-- Create an index on invoice_file_url for better performance when querying by file
CREATE INDEX IF NOT EXISTS idx_inventory_logs_invoice_file ON inventory_logs(invoice_file_url) WHERE invoice_file_url IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN inventory_logs.invoice_file_url IS 'URL/path to uploaded invoice file for stock-in movements';
COMMENT ON COLUMN inventory_logs.invoice_file_name IS 'Original name of uploaded invoice file';
COMMENT ON COLUMN inventory_logs.invoice_file_size IS 'Size of uploaded invoice file in bytes';