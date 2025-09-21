-- Create product_images table for multiple product images with carousel support
CREATE TABLE IF NOT EXISTS product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  caption TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_display_order ON product_images(product_id, display_order);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(product_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_product_images_uploaded_at ON product_images(uploaded_at);

-- Add RLS policies
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all product images
CREATE POLICY "Anyone can view product images" ON product_images
  FOR SELECT USING (true);

-- Policy: Authenticated users can insert product images
CREATE POLICY "Authenticated users can insert product images" ON product_images
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Policy: Users can update their own uploaded images or if they have product access
CREATE POLICY "Users can update product images" ON product_images
  FOR UPDATE TO authenticated USING (
    auth.uid() = uploaded_by OR
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_images.product_id
      AND (p.assigned_to = auth.uid() OR p.created_by = auth.uid())
    )
  );

-- Policy: Users can delete their own uploaded images or if they have product access
CREATE POLICY "Users can delete product images" ON product_images
  FOR DELETE TO authenticated USING (
    auth.uid() = uploaded_by OR
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_images.product_id
      AND (p.assigned_to = auth.uid() OR p.created_by = auth.uid())
    )
  );

-- Function to ensure only one primary image per product
CREATE OR REPLACE FUNCTION ensure_single_primary_image()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a new primary image, unset all others for this product
  IF NEW.is_primary = TRUE THEN
    UPDATE product_images
    SET is_primary = FALSE
    WHERE product_id = NEW.product_id
    AND id != NEW.id
    AND is_primary = TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain single primary image constraint
CREATE TRIGGER trigger_ensure_single_primary_image
  BEFORE INSERT OR UPDATE ON product_images
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_image();

-- Function to auto-update display_order for new images
CREATE OR REPLACE FUNCTION auto_set_display_order()
RETURNS TRIGGER AS $$
BEGIN
  -- If display_order is not set, set it to the next highest value
  IF NEW.display_order = 0 OR NEW.display_order IS NULL THEN
    SELECT COALESCE(MAX(display_order), 0) + 1
    INTO NEW.display_order
    FROM product_images
    WHERE product_id = NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set display_order
CREATE TRIGGER trigger_auto_set_display_order
  BEFORE INSERT ON product_images
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_display_order();

-- Grant necessary permissions
GRANT ALL ON product_images TO authenticated;