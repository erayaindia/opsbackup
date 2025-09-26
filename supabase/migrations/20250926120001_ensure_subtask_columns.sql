-- Ensure all subtask-related columns exist in the tasks table
-- This migration will add missing columns if they don't exist

DO $$
BEGIN
    -- Check if tasks table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
        RAISE EXCEPTION 'Tasks table does not exist. Please run the base table creation migration first.';
    END IF;

    -- Add parent_task_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'parent_task_id'
    ) THEN
        ALTER TABLE tasks ADD COLUMN parent_task_id uuid REFERENCES tasks(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added parent_task_id column to tasks table';
    ELSE
        RAISE NOTICE 'parent_task_id column already exists';
    END IF;

    -- Add task_level column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'task_level'
    ) THEN
        ALTER TABLE tasks ADD COLUMN task_level integer DEFAULT 0 CHECK (task_level >= 0 AND task_level <= 3);
        RAISE NOTICE 'Added task_level column to tasks table';
    ELSE
        RAISE NOTICE 'task_level column already exists';
    END IF;

    -- Add task_order column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'task_order'
    ) THEN
        ALTER TABLE tasks ADD COLUMN task_order integer DEFAULT 0 CHECK (task_order >= 0);
        RAISE NOTICE 'Added task_order column to tasks table';
    ELSE
        RAISE NOTICE 'task_order column already exists';
    END IF;

    -- Add completion_percentage column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'completion_percentage'
    ) THEN
        ALTER TABLE tasks ADD COLUMN completion_percentage integer DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100);
        RAISE NOTICE 'Added completion_percentage column to tasks table';
    ELSE
        RAISE NOTICE 'completion_percentage column already exists';
    END IF;
END $$;

-- Create indexes for better performance (with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_level_order ON tasks(task_level, task_order);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_null ON tasks(parent_task_id) WHERE parent_task_id IS NULL;

-- Show current table structure
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '=== TASKS TABLE STRUCTURE ===';
    FOR rec IN
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'tasks'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE 'Column: % | Type: % | Nullable: % | Default: %',
            rec.column_name, rec.data_type, rec.is_nullable, rec.column_default;
    END LOOP;
END $$;

-- Ensure RLS is enabled
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Add comments for clarity
COMMENT ON COLUMN tasks.parent_task_id IS 'Reference to parent task for subtask hierarchy';
COMMENT ON COLUMN tasks.task_level IS 'Depth level in hierarchy: 0=main task, 1=subtask, 2=sub-subtask, 3=deepest level';
COMMENT ON COLUMN tasks.task_order IS 'Order within same level and parent for sorting';
COMMENT ON COLUMN tasks.completion_percentage IS 'Completion percentage: manual for leaf tasks, auto-calculated for parents';

DO $$
BEGIN
    RAISE NOTICE '=== SUBTASK MIGRATION COMPLETED ===';
END $$;