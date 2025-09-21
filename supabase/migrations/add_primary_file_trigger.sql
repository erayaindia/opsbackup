-- Migration: Add trigger to ensure only one primary file per product
-- This trigger automatically unsets other primary files when a new one is set

-- Function to handle primary file constraint
CREATE OR REPLACE FUNCTION handle_primary_file_constraint()
RETURNS TRIGGER AS $$
BEGIN
  -- If this file is being set as primary
  IF NEW.is_primary = true THEN
    -- Unset all other primary files for this product
    UPDATE product_files
    SET is_primary = false
    WHERE product_id = NEW.product_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that runs before update or insert
DROP TRIGGER IF EXISTS ensure_single_primary_file ON product_files;
CREATE TRIGGER ensure_single_primary_file
  BEFORE INSERT OR UPDATE ON product_files
  FOR EACH ROW
  EXECUTE FUNCTION handle_primary_file_constraint();

-- Add comment for documentation
COMMENT ON FUNCTION handle_primary_file_constraint() IS 'Ensures only one primary file exists per product by automatically unsetting other primary files';
COMMENT ON TRIGGER ensure_single_primary_file ON product_files IS 'Automatically maintains single primary file constraint per product';