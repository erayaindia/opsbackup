-- Content Detail Extensions for Eraya Ops Hub
-- This schema extends the content planning schema to support the new 6-tab interface

-- 1. Content Planning Data Table
CREATE TABLE content_planning_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    concept TEXT DEFAULT '',
    hook TEXT DEFAULT '',
    body TEXT DEFAULT '',
    cta TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Enhanced Shot List Table (extends existing shot_list)
-- Add additional columns to the existing shot_list table
ALTER TABLE shot_list ADD COLUMN IF NOT EXISTS camera VARCHAR(100);
ALTER TABLE shot_list ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE shot_list ADD COLUMN IF NOT EXISTS background TEXT;
ALTER TABLE shot_list ADD COLUMN IF NOT EXISTS overlays TEXT;
ALTER TABLE shot_list ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES auth.users(id);
ALTER TABLE shot_list ADD COLUMN IF NOT EXISTS references JSONB DEFAULT '[]';
ALTER TABLE shot_list ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;

-- 3. Assets Management Tables
CREATE TABLE content_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    file_url TEXT NOT NULL,
    folder_type VARCHAR(50) DEFAULT 'raw' CHECK (folder_type IN ('raw', 'selects', 'final')),
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Editing Data Table
CREATE TABLE content_editing_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    editing_guide TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Deliverables Table
CREATE TABLE content_deliverables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    version VARCHAR(50) DEFAULT 'v1',
    type VARCHAR(100),
    resolution VARCHAR(50),
    length VARCHAR(50),
    link TEXT,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'approved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Review Comments Table
CREATE TABLE content_review_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES content_review_comments(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    resolved BOOLEAN DEFAULT false,
    attachments JSONB DEFAULT '[]',
    mentions JSONB DEFAULT '[]', -- Array of user IDs mentioned in the comment
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Comment Attachments Table
CREATE TABLE content_comment_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES content_review_comments(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_content_planning_data_content_id ON content_planning_data(content_id);
CREATE INDEX idx_content_assets_content_id ON content_assets(content_id);
CREATE INDEX idx_content_assets_folder_type ON content_assets(folder_type);
CREATE INDEX idx_content_editing_data_content_id ON content_editing_data(content_id);
CREATE INDEX idx_content_deliverables_content_id ON content_deliverables(content_id);
CREATE INDEX idx_content_deliverables_status ON content_deliverables(status);
CREATE INDEX idx_content_review_comments_content_id ON content_review_comments(content_id);
CREATE INDEX idx_content_review_comments_author_id ON content_review_comments(author_id);
CREATE INDEX idx_content_review_comments_resolved ON content_review_comments(resolved);
CREATE INDEX idx_content_comment_attachments_comment_id ON content_comment_attachments(comment_id);

-- Enable Row Level Security (RLS)
ALTER TABLE content_planning_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_editing_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_comment_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view all content-related data
CREATE POLICY "Users can view content planning data" ON content_planning_data
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can edit content planning data" ON content_planning_data
    FOR ALL USING (
        auth.uid() IN (
            SELECT created_by FROM content_items WHERE content_items.id = content_planning_data.content_id
            UNION
            SELECT user_id FROM content_team_assignments WHERE content_id = content_planning_data.content_id
        )
    );

CREATE POLICY "Users can view assets" ON content_assets
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage assets" ON content_assets
    FOR ALL USING (
        auth.uid() IN (
            SELECT created_by FROM content_items WHERE content_items.id = content_assets.content_id
            UNION
            SELECT user_id FROM content_team_assignments WHERE content_id = content_assets.content_id
        )
    );

CREATE POLICY "Users can view editing data" ON content_editing_data
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can edit editing data" ON content_editing_data
    FOR ALL USING (
        auth.uid() IN (
            SELECT created_by FROM content_items WHERE content_items.id = content_editing_data.content_id
            UNION
            SELECT user_id FROM content_team_assignments WHERE content_id = content_editing_data.content_id
        )
    );

CREATE POLICY "Users can view deliverables" ON content_deliverables
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage deliverables" ON content_deliverables
    FOR ALL USING (
        auth.uid() IN (
            SELECT created_by FROM content_items WHERE content_items.id = content_deliverables.content_id
            UNION
            SELECT user_id FROM content_team_assignments WHERE content_id = content_deliverables.content_id
        )
    );

CREATE POLICY "Users can view comments" ON content_review_comments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can add comments" ON content_review_comments
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        auth.uid() = author_id
    );

CREATE POLICY "Users can edit their comments" ON content_review_comments
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their comments" ON content_review_comments
    FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Users can view comment attachments" ON content_comment_attachments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage comment attachments" ON content_comment_attachments
    FOR ALL USING (
        auth.uid() = uploaded_by OR
        auth.uid() IN (
            SELECT author_id FROM content_review_comments WHERE id = comment_attachments.comment_id
        )
    );

-- Create triggers for updated_at
CREATE TRIGGER update_content_planning_data_updated_at BEFORE UPDATE ON content_planning_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_content_editing_data_updated_at BEFORE UPDATE ON content_editing_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_content_deliverables_updated_at BEFORE UPDATE ON content_deliverables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_content_review_comments_updated_at BEFORE UPDATE ON content_review_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to get content with all related data
CREATE OR REPLACE FUNCTION get_content_with_extensions(content_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'content_item', ci.*,
        'planning_data', pd.*,
        'assets', (
            SELECT json_agg(ca.*) 
            FROM content_assets ca 
            WHERE ca.content_id = content_uuid
        ),
        'editing_data', ed.*,
        'deliverables', (
            SELECT json_agg(cd.*) 
            FROM content_deliverables cd 
            WHERE cd.content_id = content_uuid
        ),
        'comments', (
            SELECT json_agg(
                json_build_object(
                    'comment', crc.*,
                    'attachments', (
                        SELECT json_agg(cca.*)
                        FROM content_comment_attachments cca
                        WHERE cca.comment_id = crc.id
                    )
                )
            )
            FROM content_review_comments crc
            WHERE crc.content_id = content_uuid
            ORDER BY crc.created_at DESC
        ),
        'enhanced_shot_list', (
            SELECT json_agg(sl.*) 
            FROM shot_list sl 
            WHERE sl.content_id = content_uuid
            ORDER BY sl.order_index
        )
    )
    INTO result
    FROM content_items ci
    LEFT JOIN content_planning_data pd ON pd.content_id = ci.id
    LEFT JOIN content_editing_data ed ON ed.content_id = ci.id
    WHERE ci.id = content_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_content_with_extensions TO authenticated;