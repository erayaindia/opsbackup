-- Create task comments table for task collaboration and discussion
-- This allows users to comment on tasks, ask questions, provide updates, etc.

-- Create task_comments table
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES task_comments(id) ON DELETE CASCADE,
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_author_id ON task_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_parent_id ON task_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON task_comments(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_task_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.is_edited = true;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_task_comments_updated_at ON task_comments;
CREATE TRIGGER trigger_update_task_comments_updated_at
    BEFORE UPDATE ON task_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_task_comments_updated_at();

-- Row Level Security (RLS) policies - Permissive for full CRUD
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- Permissive policy: Allow all authenticated users to view all task comments
CREATE POLICY "Allow authenticated users to view all task comments" ON task_comments
    FOR SELECT USING (auth.role() = 'authenticated');

-- Permissive policy: Allow authenticated users to create comments
CREATE POLICY "Allow authenticated users to create task comments" ON task_comments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Permissive policy: Allow authenticated users to update all comments
CREATE POLICY "Allow authenticated users to update all task comments" ON task_comments
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Permissive policy: Allow authenticated users to delete all comments
CREATE POLICY "Allow authenticated users to delete all task comments" ON task_comments
    FOR DELETE USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON task_comments TO authenticated;

-- Add helpful comments
COMMENT ON TABLE task_comments IS 'Comments and discussions on tasks for collaboration and updates';
COMMENT ON COLUMN task_comments.task_id IS 'Reference to the task being commented on';
COMMENT ON COLUMN task_comments.author_id IS 'User who wrote the comment';
COMMENT ON COLUMN task_comments.content IS 'The comment text content';
COMMENT ON COLUMN task_comments.parent_comment_id IS 'Reference to parent comment for threading/replies';
COMMENT ON COLUMN task_comments.is_edited IS 'Flag indicating if the comment has been edited';