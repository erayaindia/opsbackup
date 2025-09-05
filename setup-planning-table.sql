-- Quick setup for planning data table
-- Run this in your Supabase SQL editor

-- 1. Create the planning data table
CREATE TABLE IF NOT EXISTS content_planning_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    concept TEXT DEFAULT '',
    hook TEXT DEFAULT '',
    body TEXT DEFAULT '',
    cta TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create index
CREATE INDEX IF NOT EXISTS idx_content_planning_data_content_id ON content_planning_data(content_id);

-- 3. Enable RLS
ALTER TABLE content_planning_data ENABLE ROW LEVEL SECURITY;

-- 4. Create policies (only if they don't exist)
DO $$
BEGIN
    -- Create view policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'content_planning_data' 
        AND policyname = 'Users can view planning data'
    ) THEN
        CREATE POLICY "Users can view planning data" ON content_planning_data
            FOR SELECT USING (auth.role() = 'authenticated');
    END IF;

    -- Create manage policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'content_planning_data' 
        AND policyname = 'Users can manage planning data'
    ) THEN
        CREATE POLICY "Users can manage planning data" ON content_planning_data
            FOR ALL USING (
                auth.uid() IN (
                    SELECT created_by FROM content_items WHERE content_items.id = content_planning_data.content_id
                    UNION
                    SELECT user_id FROM content_team_assignments WHERE content_id = content_planning_data.content_id
                )
            );
    END IF;
END
$$;

-- 5. Create trigger for updated_at (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_content_planning_data_updated_at'
    ) THEN
        CREATE TRIGGER update_content_planning_data_updated_at 
            BEFORE UPDATE ON content_planning_data
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
END
$$;