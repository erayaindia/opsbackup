-- Update the inventory SKU generation function to use ERPR- prefix instead of INV-
CREATE OR REPLACE FUNCTION generate_inventory_sku()
RETURNS TEXT AS $$
DECLARE
    next_id INTEGER;
    sku TEXT;
BEGIN
    -- Get next sequence value
    SELECT nextval('inventory_sku_sequence') INTO next_id;

    -- Format as ERPR-0001000, ERPR-0001001, etc. (changed from INV- to ERPR-)
    sku := 'ERPR-' || LPAD(next_id::TEXT, 7, '0');

    -- Ensure uniqueness (in case of conflicts)
    WHILE EXISTS (SELECT 1 FROM inventory_details WHERE sku = sku) LOOP
        SELECT nextval('inventory_sku_sequence') INTO next_id;
        sku := 'ERPR-' || LPAD(next_id::TEXT, 7, '0');
    END LOOP;

    RETURN sku;
END;
$$ LANGUAGE plpgsql;