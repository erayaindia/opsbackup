-- Create product_design table for design tab data
CREATE TABLE IF NOT EXISTS product_design (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Design Brief fields
  product_vision TEXT,
  target_audience TEXT,
  design_style TEXT,

  -- Visual Identity fields
  primary_colors TEXT,
  secondary_colors TEXT,
  material_preferences TEXT,

  -- Design Assets fields
  mood_board_url TEXT,
  design_files_url TEXT,
  technical_drawings TEXT,
  cad_files TEXT,

  -- Design Progress fields
  design_status TEXT DEFAULT 'not_started',
  current_phase TEXT,
  completion_percentage INTEGER DEFAULT 0,
  next_milestone TEXT,

  -- Design Feedback fields
  design_feedback TEXT,

  -- Packing Design fields
  packaging_concept TEXT,
  packaging_approval_status TEXT DEFAULT 'pending',
  packaging_approval_date TIMESTAMPTZ,

  -- Design Ideas Repository fields
  design_ideas JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_design_product_id ON product_design(product_id);
CREATE INDEX IF NOT EXISTS idx_product_design_status ON product_design(design_status);
CREATE INDEX IF NOT EXISTS idx_product_design_created_at ON product_design(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_product_design_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_design_updated_at
  BEFORE UPDATE ON product_design
  FOR EACH ROW
  EXECUTE FUNCTION update_product_design_updated_at();

-- Create storage bucket for design files
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-design', 'product-design', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for product-design bucket
CREATE POLICY "Allow authenticated users to upload design files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-design' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to view design files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'product-design' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to update design files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-design' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to delete design files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-design' AND
  auth.role() = 'authenticated'
);

-- Row Level Security policies for product_design table
ALTER TABLE product_design ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all design data
CREATE POLICY "Allow authenticated users to view product design data" ON product_design
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert design data
CREATE POLICY "Allow authenticated users to insert product design data" ON product_design
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update design data
CREATE POLICY "Allow authenticated users to update product design data" ON product_design
FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete design data
CREATE POLICY "Allow authenticated users to delete product design data" ON product_design
FOR DELETE USING (auth.role() = 'authenticated');

-- Create a function to get or create product design data
CREATE OR REPLACE FUNCTION get_or_create_product_design(p_product_id UUID)
RETURNS product_design AS $$
DECLARE
  result product_design;
BEGIN
  -- Try to get existing record
  SELECT * INTO result FROM product_design WHERE product_id = p_product_id;

  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO product_design (product_id, created_by, updated_by)
    VALUES (p_product_id, auth.uid(), auth.uid())
    RETURNING * INTO result;
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_or_create_product_design(UUID) TO authenticated;