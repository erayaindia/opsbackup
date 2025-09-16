-- Create product_production table for production tab data
CREATE TABLE IF NOT EXISTS product_production (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Supplier & Pricing fields
  selected_suppliers JSONB DEFAULT '[]'::jsonb, -- Array of supplier objects with pricing and quality
  supplier_comparison_notes TEXT,
  preferred_supplier_id UUID,

  -- Product Links fields
  product_links JSONB DEFAULT '[]'::jsonb, -- Array of link objects {id, url, title, type}

  -- Sample Management fields
  sample_request_date DATE,
  sample_received_date DATE,
  sample_status TEXT DEFAULT 'not_requested', -- not_requested, requested, received, approved, rejected
  sample_notes TEXT,
  sample_quality_rating INTEGER CHECK (sample_quality_rating >= 1 AND sample_quality_rating <= 5),

  -- Production Timeline fields
  production_start_date DATE,
  production_completion_date DATE,
  production_milestones TEXT, -- Rich text for milestones and deadlines
  production_status TEXT DEFAULT 'not_started', -- not_started, planning, in_progress, completed, delayed

  -- Materials & Specifications fields
  dimensions TEXT, -- L x W x H
  weight TEXT, -- kg
  materials_specification TEXT, -- Rich text for materials description

  -- Manufacturing details
  manufacturing_method TEXT,
  quality_standards TEXT,
  compliance_requirements TEXT,

  -- Cost tracking
  estimated_unit_cost DECIMAL(10,2),
  actual_unit_cost DECIMAL(10,2),
  tooling_cost DECIMAL(10,2),
  setup_cost DECIMAL(10,2),

  -- Quality control
  qc_requirements TEXT,
  qc_status TEXT DEFAULT 'pending',
  qc_notes TEXT,

  -- Lead times
  lead_time_days INTEGER,
  minimum_order_quantity INTEGER,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_production_product_id ON product_production(product_id);
CREATE INDEX IF NOT EXISTS idx_product_production_status ON product_production(production_status);
CREATE INDEX IF NOT EXISTS idx_product_production_sample_status ON product_production(sample_status);
CREATE INDEX IF NOT EXISTS idx_product_production_supplier ON product_production(preferred_supplier_id);
CREATE INDEX IF NOT EXISTS idx_product_production_created_at ON product_production(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_product_production_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_production_updated_at
  BEFORE UPDATE ON product_production
  FOR EACH ROW
  EXECUTE FUNCTION update_product_production_updated_at();

-- Create storage bucket for production files
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-production', 'product-production', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for product-production bucket
CREATE POLICY "Allow authenticated users to upload production files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-production' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to view production files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'product-production' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to update production files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-production' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to delete production files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-production' AND
  auth.role() = 'authenticated'
);

-- Row Level Security policies for product_production table
ALTER TABLE product_production ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all production data
CREATE POLICY "Allow authenticated users to view product production data" ON product_production
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert production data
CREATE POLICY "Allow authenticated users to insert product production data" ON product_production
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update production data
CREATE POLICY "Allow authenticated users to update product production data" ON product_production
FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete production data
CREATE POLICY "Allow authenticated users to delete product production data" ON product_production
FOR DELETE USING (auth.role() = 'authenticated');

-- Create a function to get or create product production data
CREATE OR REPLACE FUNCTION get_or_create_product_production(p_product_id UUID)
RETURNS product_production AS $$
DECLARE
  result product_production;
BEGIN
  -- Try to get existing record
  SELECT * INTO result FROM product_production WHERE product_id = p_product_id;

  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO product_production (product_id, created_by, updated_by)
    VALUES (p_product_id, auth.uid(), auth.uid())
    RETURNING * INTO result;
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to add supplier to product
CREATE OR REPLACE FUNCTION add_supplier_to_product(
  p_product_id UUID,
  p_supplier_data JSONB
)
RETURNS product_production AS $$
DECLARE
  result product_production;
  current_suppliers JSONB;
BEGIN
  -- Get current suppliers array
  SELECT selected_suppliers INTO current_suppliers
  FROM product_production
  WHERE product_id = p_product_id;

  -- If no production record exists, create one
  IF NOT FOUND THEN
    INSERT INTO product_production (product_id, selected_suppliers, created_by, updated_by)
    VALUES (p_product_id, jsonb_build_array(p_supplier_data), auth.uid(), auth.uid())
    RETURNING * INTO result;
  ELSE
    -- Append new supplier to existing array
    UPDATE product_production
    SET
      selected_suppliers = COALESCE(current_suppliers, '[]'::jsonb) || jsonb_build_array(p_supplier_data),
      updated_at = NOW(),
      updated_by = auth.uid()
    WHERE product_id = p_product_id
    RETURNING * INTO result;
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to add product link
CREATE OR REPLACE FUNCTION add_product_link(
  p_product_id UUID,
  p_link_data JSONB
)
RETURNS product_production AS $$
DECLARE
  result product_production;
  current_links JSONB;
BEGIN
  -- Get current links array
  SELECT product_links INTO current_links
  FROM product_production
  WHERE product_id = p_product_id;

  -- If no production record exists, create one
  IF NOT FOUND THEN
    INSERT INTO product_production (product_id, product_links, created_by, updated_by)
    VALUES (p_product_id, jsonb_build_array(p_link_data), auth.uid(), auth.uid())
    RETURNING * INTO result;
  ELSE
    -- Append new link to existing array
    UPDATE product_production
    SET
      product_links = COALESCE(current_links, '[]'::jsonb) || jsonb_build_array(p_link_data),
      updated_at = NOW(),
      updated_by = auth.uid()
    WHERE product_id = p_product_id
    RETURNING * INTO result;
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_or_create_product_production(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_supplier_to_product(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION add_product_link(UUID, JSONB) TO authenticated;