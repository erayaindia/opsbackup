-- Create content_planning_data table to store planning form data
CREATE TABLE IF NOT EXISTS content_planning_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  concept text DEFAULT '',
  body text DEFAULT '',
  cta text DEFAULT '',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Ensure one planning record per content item
  UNIQUE(content_id)
);

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_content_planning_data_content_id ON content_planning_data(content_id);

-- Add RLS policy if needed
ALTER TABLE content_planning_data ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage planning data
CREATE POLICY "Users can manage content planning data" ON content_planning_data
FOR ALL USING (auth.role() = 'authenticated');