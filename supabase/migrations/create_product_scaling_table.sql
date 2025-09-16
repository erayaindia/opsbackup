-- Create product_scaling table for scaling tab data
CREATE TABLE IF NOT EXISTS product_scaling (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Launch Details fields
  launch_date DATE,
  marketing_channels JSONB DEFAULT '[]'::jsonb, -- Array of selected channels ['facebook', 'instagram', 'google', 'youtube']
  launch_status TEXT DEFAULT 'planned', -- planned, launching, launched, paused, ended
  launch_notes TEXT,

  -- Budget Allocation fields
  total_budget DECIMAL(12,2),
  facebook_budget DECIMAL(12,2),
  instagram_budget DECIMAL(12,2),
  google_budget DECIMAL(12,2),
  youtube_budget DECIMAL(12,2),
  other_budget DECIMAL(12,2),
  budget_period TEXT DEFAULT 'monthly', -- daily, weekly, monthly, quarterly, yearly
  budget_start_date DATE,
  budget_end_date DATE,

  -- Performance Targets fields
  target_revenue DECIMAL(12,2),
  actual_revenue DECIMAL(12,2),
  target_roas DECIMAL(8,2), -- Return on Ad Spend
  actual_roas DECIMAL(8,2),
  target_conversions INTEGER,
  actual_conversions INTEGER,
  target_cpc DECIMAL(8,2), -- Cost Per Click
  actual_cpc DECIMAL(8,2),
  target_ctr DECIMAL(5,4), -- Click Through Rate (percentage)
  actual_ctr DECIMAL(5,4),

  -- Additional Performance Metrics
  target_cpa DECIMAL(10,2), -- Cost Per Acquisition
  actual_cpa DECIMAL(10,2),
  target_aov DECIMAL(10,2), -- Average Order Value
  actual_aov DECIMAL(10,2),
  target_ltv DECIMAL(12,2), -- Lifetime Value
  actual_ltv DECIMAL(12,2),

  -- Campaign Data
  campaign_duration_days INTEGER,
  campaign_status TEXT DEFAULT 'draft', -- draft, active, paused, completed
  ad_spend_total DECIMAL(12,2),
  impressions_total BIGINT,
  clicks_total BIGINT,
  orders_total INTEGER,

  -- Learnings & Insights fields
  learnings_insights TEXT, -- Rich text content
  campaign_notes TEXT,
  optimization_notes TEXT,
  recommendations TEXT,

  -- Scaling Strategy
  scaling_stage TEXT DEFAULT 'testing', -- testing, scaling, optimizing, mature
  next_scaling_action TEXT,
  scaling_constraints TEXT,

  -- Market Analysis
  market_size_estimate DECIMAL(15,2),
  market_penetration_percent DECIMAL(5,2),
  competitive_advantage TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_scaling_product_id ON product_scaling(product_id);
CREATE INDEX IF NOT EXISTS idx_product_scaling_launch_date ON product_scaling(launch_date);
CREATE INDEX IF NOT EXISTS idx_product_scaling_launch_status ON product_scaling(launch_status);
CREATE INDEX IF NOT EXISTS idx_product_scaling_campaign_status ON product_scaling(campaign_status);
CREATE INDEX IF NOT EXISTS idx_product_scaling_scaling_stage ON product_scaling(scaling_stage);
CREATE INDEX IF NOT EXISTS idx_product_scaling_created_at ON product_scaling(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_product_scaling_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_scaling_updated_at
  BEFORE UPDATE ON product_scaling
  FOR EACH ROW
  EXECUTE FUNCTION update_product_scaling_updated_at();

-- Create storage bucket for scaling files
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-scaling', 'product-scaling', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for product-scaling bucket
CREATE POLICY "Allow authenticated users to upload scaling files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-scaling' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to view scaling files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'product-scaling' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to update scaling files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-scaling' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to delete scaling files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-scaling' AND
  auth.role() = 'authenticated'
);

-- Row Level Security policies for product_scaling table
ALTER TABLE product_scaling ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all scaling data
CREATE POLICY "Allow authenticated users to view product scaling data" ON product_scaling
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert scaling data
CREATE POLICY "Allow authenticated users to insert product scaling data" ON product_scaling
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update scaling data
CREATE POLICY "Allow authenticated users to update product scaling data" ON product_scaling
FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete scaling data
CREATE POLICY "Allow authenticated users to delete product scaling data" ON product_scaling
FOR DELETE USING (auth.role() = 'authenticated');

-- Create a function to get or create product scaling data
CREATE OR REPLACE FUNCTION get_or_create_product_scaling(p_product_id UUID)
RETURNS product_scaling AS $$
DECLARE
  result product_scaling;
BEGIN
  -- Try to get existing record
  SELECT * INTO result FROM product_scaling WHERE product_id = p_product_id;

  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO product_scaling (product_id, created_by, updated_by)
    VALUES (p_product_id, auth.uid(), auth.uid())
    RETURNING * INTO result;
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to add marketing channel
CREATE OR REPLACE FUNCTION add_marketing_channel(
  p_product_id UUID,
  p_channel TEXT
)
RETURNS product_scaling AS $$
DECLARE
  result product_scaling;
  current_channels JSONB;
BEGIN
  -- Get current channels array
  SELECT marketing_channels INTO current_channels
  FROM product_scaling
  WHERE product_id = p_product_id;

  -- If no scaling record exists, create one
  IF NOT FOUND THEN
    INSERT INTO product_scaling (product_id, marketing_channels, created_by, updated_by)
    VALUES (p_product_id, jsonb_build_array(p_channel), auth.uid(), auth.uid())
    RETURNING * INTO result;
  ELSE
    -- Add channel if not already present
    IF NOT (current_channels ? p_channel) THEN
      UPDATE product_scaling
      SET
        marketing_channels = COALESCE(current_channels, '[]'::jsonb) || jsonb_build_array(p_channel),
        updated_at = NOW(),
        updated_by = auth.uid()
      WHERE product_id = p_product_id
      RETURNING * INTO result;
    ELSE
      SELECT * INTO result FROM product_scaling WHERE product_id = p_product_id;
    END IF;
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to remove marketing channel
CREATE OR REPLACE FUNCTION remove_marketing_channel(
  p_product_id UUID,
  p_channel TEXT
)
RETURNS product_scaling AS $$
DECLARE
  result product_scaling;
  current_channels JSONB;
  new_channels JSONB;
BEGIN
  -- Get current channels array
  SELECT marketing_channels INTO current_channels
  FROM product_scaling
  WHERE product_id = p_product_id;

  IF FOUND AND current_channels IS NOT NULL THEN
    -- Remove the channel from the array
    SELECT jsonb_agg(elem)
    INTO new_channels
    FROM jsonb_array_elements_text(current_channels) elem
    WHERE elem != p_channel;

    UPDATE product_scaling
    SET
      marketing_channels = COALESCE(new_channels, '[]'::jsonb),
      updated_at = NOW(),
      updated_by = auth.uid()
    WHERE product_id = p_product_id
    RETURNING * INTO result;
  ELSE
    SELECT * INTO result FROM product_scaling WHERE product_id = p_product_id;
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to calculate performance metrics
CREATE OR REPLACE FUNCTION calculate_performance_metrics(p_product_id UUID)
RETURNS TABLE (
  roas_performance DECIMAL,
  budget_utilization_percent DECIMAL,
  conversion_rate DECIMAL,
  cpc_performance DECIMAL
) AS $$
DECLARE
  scaling_data product_scaling;
BEGIN
  SELECT * INTO scaling_data FROM product_scaling WHERE product_id = p_product_id;

  IF FOUND THEN
    RETURN QUERY SELECT
      CASE
        WHEN scaling_data.target_roas > 0 THEN
          (scaling_data.actual_roas / scaling_data.target_roas) * 100
        ELSE NULL
      END as roas_performance,

      CASE
        WHEN scaling_data.total_budget > 0 THEN
          (scaling_data.ad_spend_total / scaling_data.total_budget) * 100
        ELSE NULL
      END as budget_utilization_percent,

      CASE
        WHEN scaling_data.clicks_total > 0 THEN
          (scaling_data.actual_conversions::DECIMAL / scaling_data.clicks_total) * 100
        ELSE NULL
      END as conversion_rate,

      CASE
        WHEN scaling_data.target_cpc > 0 THEN
          (scaling_data.actual_cpc / scaling_data.target_cpc) * 100
        ELSE NULL
      END as cpc_performance;
  ELSE
    RETURN QUERY SELECT NULL::DECIMAL, NULL::DECIMAL, NULL::DECIMAL, NULL::DECIMAL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_or_create_product_scaling(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_marketing_channel(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_marketing_channel(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_performance_metrics(UUID) TO authenticated;