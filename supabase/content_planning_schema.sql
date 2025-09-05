-- Content Planning Database Schema for Supabase
-- This schema supports the entire content planning workflow

-- 1. Content Items Table (Main content records)
CREATE TABLE content_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'review', 'published', 'archived')),
    platform VARCHAR(50) DEFAULT 'YouTube',
    thumbnail_url TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}' -- For flexible additional data
);

-- 2. Content Hooks Table (Opening hooks for content)
CREATE TABLE content_hooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    hook_type VARCHAR(50) DEFAULT 'question', -- question, statistic, story, bold_statement
    text TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Content Scripts Table (Rich text scripts)
CREATE TABLE content_scripts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    section_type VARCHAR(50) NOT NULL, -- introduction, body, conclusion, call_to_action
    content TEXT NOT NULL, -- HTML content from rich text editor
    plain_text TEXT, -- Plain text version for search
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Shot List Table
CREATE TABLE shot_list (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    shot_number INTEGER NOT NULL,
    shot_type VARCHAR(100), -- wide, medium, close-up, b-roll, etc.
    description TEXT,
    duration INTEGER, -- in seconds
    location VARCHAR(255),
    equipment JSONB DEFAULT '[]', -- Array of equipment needed
    notes TEXT,
    status VARCHAR(50) DEFAULT 'planned' CHECK (status IN ('planned', 'shot', 'editing', 'completed')),
    order_index INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Content Team Assignments
CREATE TABLE content_team_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(100) NOT NULL, -- director, camera, editor, producer, etc.
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(content_id, user_id, role)
);

-- 6. Content Body Sections (for structured content)
CREATE TABLE content_body_sections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    section_title VARCHAR(255),
    bullet_points JSONB DEFAULT '[]', -- Array of bullet points
    details TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Content Comments/Notes
CREATE TABLE content_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    parent_comment_id UUID REFERENCES content_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Content Versions (for tracking changes)
CREATE TABLE content_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    changes JSONB NOT NULL, -- Stores the entire content state at this version
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    change_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(content_id, version_number)
);

-- 9. Content Tags
CREATE TABLE content_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    tag VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(content_id, tag)
);

-- 10. Content Attachments/Assets
CREATE TABLE content_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_content_items_status ON content_items(status);
CREATE INDEX idx_content_items_created_by ON content_items(created_by);
CREATE INDEX idx_content_items_created_at ON content_items(created_at DESC);
CREATE INDEX idx_content_hooks_content_id ON content_hooks(content_id);
CREATE INDEX idx_content_scripts_content_id ON content_scripts(content_id);
CREATE INDEX idx_shot_list_content_id ON shot_list(content_id);
CREATE INDEX idx_content_team_assignments_content_id ON content_team_assignments(content_id);
CREATE INDEX idx_content_team_assignments_user_id ON content_team_assignments(user_id);
CREATE INDEX idx_content_body_sections_content_id ON content_body_sections(content_id);
CREATE INDEX idx_content_comments_content_id ON content_comments(content_id);
CREATE INDEX idx_content_tags_content_id ON content_tags(content_id);
CREATE INDEX idx_content_tags_tag ON content_tags(tag);

-- Enable Row Level Security (RLS)
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_hooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shot_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_team_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_body_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies (adjust based on your needs)
-- Example: All authenticated users can view content
CREATE POLICY "Users can view all content" ON content_items
    FOR SELECT USING (auth.role() = 'authenticated');

-- Example: Users can edit content they created or are assigned to
CREATE POLICY "Users can edit their content" ON content_items
    FOR ALL USING (
        auth.uid() = created_by OR
        auth.uid() IN (
            SELECT user_id FROM content_team_assignments 
            WHERE content_id = content_items.id
        )
    );

-- Similar policies for other tables
CREATE POLICY "Users can view content details" ON content_hooks
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can edit content details" ON content_hooks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM content_items 
            WHERE content_items.id = content_hooks.content_id 
            AND (content_items.created_by = auth.uid() OR 
                 auth.uid() IN (
                     SELECT user_id FROM content_team_assignments 
                     WHERE content_id = content_items.id
                 ))
        )
    );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_content_items_updated_at BEFORE UPDATE ON content_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_content_hooks_updated_at BEFORE UPDATE ON content_hooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_content_scripts_updated_at BEFORE UPDATE ON content_scripts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_shot_list_updated_at BEFORE UPDATE ON shot_list
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_content_body_sections_updated_at BEFORE UPDATE ON content_body_sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_content_comments_updated_at BEFORE UPDATE ON content_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to create a new version when content is updated
CREATE OR REPLACE FUNCTION create_content_version()
RETURNS TRIGGER AS $$
DECLARE
    next_version INTEGER;
BEGIN
    -- Get the next version number
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version
    FROM content_versions
    WHERE content_id = NEW.id;
    
    -- Insert a new version record
    INSERT INTO content_versions (content_id, version_number, changes, changed_by)
    VALUES (NEW.id, next_version, to_jsonb(NEW), auth.uid());
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Optional: Create trigger for versioning (comment out if not needed immediately)
-- CREATE TRIGGER create_content_version_trigger AFTER UPDATE ON content_items
--     FOR EACH ROW EXECUTE FUNCTION create_content_version();