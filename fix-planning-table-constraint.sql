-- Fix Content Planning Schema Issues
-- This script creates missing tables and adds missing columns

-- 1. Create missing tables

-- Content Editing Data table
CREATE TABLE IF NOT EXISTS content_editing_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    editing_guide TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(content_id)
);

-- Content Assets table  
CREATE TABLE IF NOT EXISTS content_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    file_url TEXT,
    folder_type VARCHAR(20) CHECK (folder_type IN ('raw', 'selects', 'final')),
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Content Deliverables table
CREATE TABLE IF NOT EXISTS content_deliverables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    version VARCHAR(100),
    type VARCHAR(100),
    resolution VARCHAR(100),
    length VARCHAR(100),
    link TEXT,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'review', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Content Planning Data table (for basic planning functionality)
CREATE TABLE IF NOT EXISTS content_planning_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    concept TEXT,
    hook TEXT,
    body TEXT,
    cta TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(content_id)
);

-- 2. Add missing columns to shot_list table

-- Add action column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shot_list' AND column_name = 'action'
    ) THEN
        ALTER TABLE shot_list ADD COLUMN action TEXT;
    END IF;
END $$;

-- Add camera column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shot_list' AND column_name = 'camera'
    ) THEN
        ALTER TABLE shot_list ADD COLUMN camera TEXT;
    END IF;
END $$;

-- Add background column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shot_list' AND column_name = 'background'
    ) THEN
        ALTER TABLE shot_list ADD COLUMN background TEXT;
    END IF;
END $$;

-- Add overlays column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shot_list' AND column_name = 'overlays'
    ) THEN
        ALTER TABLE shot_list ADD COLUMN overlays TEXT;
    END IF;
END $$;

-- Add assignee_id column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shot_list' AND column_name = 'assignee_id'
    ) THEN
        ALTER TABLE shot_list ADD COLUMN assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add references column (for storing reference image URLs/links as JSON array)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shot_list' AND column_name = 'references'
    ) THEN
        ALTER TABLE shot_list ADD COLUMN "references" JSONB DEFAULT '[]';
    END IF;
END $$;

-- Add completed column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shot_list' AND column_name = 'completed'
    ) THEN
        ALTER TABLE shot_list ADD COLUMN completed BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_editing_data_content_id ON content_editing_data(content_id);
CREATE INDEX IF NOT EXISTS idx_content_assets_content_id ON content_assets(content_id);
CREATE INDEX IF NOT EXISTS idx_content_deliverables_content_id ON content_deliverables(content_id);
CREATE INDEX IF NOT EXISTS idx_content_planning_data_content_id ON content_planning_data(content_id);
CREATE INDEX IF NOT EXISTS idx_shot_list_assignee_id ON shot_list(assignee_id);
CREATE INDEX IF NOT EXISTS idx_shot_list_completed ON shot_list(completed);

-- 4. Enable Row Level Security on new tables
ALTER TABLE content_editing_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_planning_data ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for new tables (only if they don't exist)
-- Content Editing Data policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'content_editing_data' 
        AND policyname = 'Users can view editing data'
    ) THEN
        CREATE POLICY "Users can view editing data" ON content_editing_data
            FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'content_editing_data' 
        AND policyname = 'Users can edit editing data'
    ) THEN
        CREATE POLICY "Users can edit editing data" ON content_editing_data
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM content_items 
                    WHERE content_items.id = content_editing_data.content_id 
                    AND (content_items.created_by = auth.uid() OR 
                         auth.uid() IN (
                             SELECT user_id FROM content_team_assignments 
                             WHERE content_id = content_items.id
                         ))
                )
            );
    END IF;
END $$;

-- Content Assets policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'content_assets' 
        AND policyname = 'Users can view assets'
    ) THEN
        CREATE POLICY "Users can view assets" ON content_assets
            FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'content_assets' 
        AND policyname = 'Users can manage assets'
    ) THEN
        CREATE POLICY "Users can manage assets" ON content_assets
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM content_items 
                    WHERE content_items.id = content_assets.content_id 
                    AND (content_items.created_by = auth.uid() OR 
                         auth.uid() IN (
                             SELECT user_id FROM content_team_assignments 
                             WHERE content_id = content_items.id
                         ))
                )
            );
    END IF;
END $$;

-- Content Deliverables policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'content_deliverables' 
        AND policyname = 'Users can view deliverables'
    ) THEN
        CREATE POLICY "Users can view deliverables" ON content_deliverables
            FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'content_deliverables' 
        AND policyname = 'Users can manage deliverables'
    ) THEN
        CREATE POLICY "Users can manage deliverables" ON content_deliverables
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM content_items 
                    WHERE content_items.id = content_deliverables.content_id 
                    AND (content_items.created_by = auth.uid() OR 
                         auth.uid() IN (
                             SELECT user_id FROM content_team_assignments 
                             WHERE content_id = content_items.id
                         ))
                )
            );
    END IF;
END $$;

-- Content Planning Data policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'content_planning_data' 
        AND policyname = 'Users can view planning data'
    ) THEN
        CREATE POLICY "Users can view planning data" ON content_planning_data
            FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'content_planning_data' 
        AND policyname = 'Users can manage planning data'
    ) THEN
        CREATE POLICY "Users can manage planning data" ON content_planning_data
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM content_items 
                    WHERE content_items.id = content_planning_data.content_id 
                    AND (content_items.created_by = auth.uid() OR 
                         auth.uid() IN (
                             SELECT user_id FROM content_team_assignments 
                             WHERE content_id = content_items.id
                         ))
                )
            );
    END IF;
END $$;

-- 6. Create triggers for updated_at on new tables (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_content_editing_data_updated_at'
    ) THEN
        CREATE TRIGGER update_content_editing_data_updated_at BEFORE UPDATE ON content_editing_data
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_content_assets_updated_at'
    ) THEN
        CREATE TRIGGER update_content_assets_updated_at BEFORE UPDATE ON content_assets
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_content_deliverables_updated_at'
    ) THEN
        CREATE TRIGGER update_content_deliverables_updated_at BEFORE UPDATE ON content_deliverables
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_content_planning_data_updated_at'
    ) THEN
        CREATE TRIGGER update_content_planning_data_updated_at BEFORE UPDATE ON content_planning_data
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
END $$;