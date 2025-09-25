-- Add subtask support to tasks table
-- This migration adds parent-child relationships for hierarchical task structure

-- Add columns for subtask functionality (with IF NOT EXISTS equivalent)
DO $$
BEGIN
    -- Add parent_task_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'parent_task_id'
    ) THEN
        ALTER TABLE tasks ADD COLUMN parent_task_id uuid REFERENCES tasks(id) ON DELETE CASCADE;
    END IF;

    -- Add task_level column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'task_level'
    ) THEN
        ALTER TABLE tasks ADD COLUMN task_level integer DEFAULT 0 CHECK (task_level >= 0 AND task_level <= 3);
    END IF;

    -- Add task_order column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'task_order'
    ) THEN
        ALTER TABLE tasks ADD COLUMN task_order integer DEFAULT 0 CHECK (task_order >= 0);
    END IF;

    -- Add completion_percentage column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'completion_percentage'
    ) THEN
        ALTER TABLE tasks ADD COLUMN completion_percentage integer DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100);
    END IF;
END $$;

-- Create indexes for better performance (with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_level_order ON tasks(task_level, task_order);

-- RLS policies for subtasks are handled by existing task policies
-- The existing task policies already cover subtask access through the normal task permissions
-- No additional policies needed since subtasks are just tasks with parent_task_id set

-- Function to calculate parent task completion based on subtasks
CREATE OR REPLACE FUNCTION calculate_parent_completion(parent_id uuid)
RETURNS integer AS $$
DECLARE
    total_subtasks integer;
    completed_subtasks integer;
    completion_percent integer;
BEGIN
    -- Count total subtasks
    SELECT COUNT(*) INTO total_subtasks
    FROM tasks
    WHERE parent_task_id = parent_id;

    -- If no subtasks, return current completion
    IF total_subtasks = 0 THEN
        SELECT completion_percentage INTO completion_percent
        FROM tasks WHERE id = parent_id;
        RETURN COALESCE(completion_percent, 0);
    END IF;

    -- Count completed subtasks (status = 'approved' or 'done_auto_approved')
    SELECT COUNT(*) INTO completed_subtasks
    FROM tasks
    WHERE parent_task_id = parent_id
    AND status IN ('approved', 'done_auto_approved');

    -- Calculate percentage
    completion_percent := (completed_subtasks * 100) / total_subtasks;

    RETURN completion_percent;
END;
$$ LANGUAGE plpgsql;

-- Function to update parent task completion when subtasks change
CREATE OR REPLACE FUNCTION update_parent_task_completion()
RETURNS trigger AS $$
BEGIN
    -- Update parent task completion if this task has a parent
    IF NEW.parent_task_id IS NOT NULL THEN
        UPDATE tasks
        SET completion_percentage = calculate_parent_completion(NEW.parent_task_id),
            updated_at = now()
        WHERE id = NEW.parent_task_id;
    END IF;

    -- Also handle the old parent if parent_task_id changed
    IF TG_OP = 'UPDATE' AND OLD.parent_task_id IS NOT NULL AND OLD.parent_task_id != NEW.parent_task_id THEN
        UPDATE tasks
        SET completion_percentage = calculate_parent_completion(OLD.parent_task_id),
            updated_at = now()
        WHERE id = OLD.parent_task_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle parent task completion on delete
CREATE OR REPLACE FUNCTION update_parent_on_subtask_delete()
RETURNS trigger AS $$
BEGIN
    -- Update parent task completion when subtask is deleted
    IF OLD.parent_task_id IS NOT NULL THEN
        UPDATE tasks
        SET completion_percentage = calculate_parent_completion(OLD.parent_task_id),
            updated_at = now()
        WHERE id = OLD.parent_task_id;
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic parent task completion updates (with existence checks)
DO $$
BEGIN
    -- Drop and recreate insert trigger
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_parent_completion_on_insert') THEN
        DROP TRIGGER update_parent_completion_on_insert ON tasks;
    END IF;
    CREATE TRIGGER update_parent_completion_on_insert
        AFTER INSERT ON tasks
        FOR EACH ROW
        EXECUTE FUNCTION update_parent_task_completion();

    -- Drop and recreate update trigger
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_parent_completion_on_update') THEN
        DROP TRIGGER update_parent_completion_on_update ON tasks;
    END IF;
    CREATE TRIGGER update_parent_completion_on_update
        AFTER UPDATE OF status, completion_percentage ON tasks
        FOR EACH ROW
        EXECUTE FUNCTION update_parent_task_completion();

    -- Drop and recreate delete trigger
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_parent_completion_on_delete') THEN
        DROP TRIGGER update_parent_completion_on_delete ON tasks;
    END IF;
    CREATE TRIGGER update_parent_completion_on_delete
        AFTER DELETE ON tasks
        FOR EACH ROW
        EXECUTE FUNCTION update_parent_on_subtask_delete();
END $$;

-- Add constraint to prevent circular references
CREATE OR REPLACE FUNCTION check_task_hierarchy()
RETURNS trigger AS $$
DECLARE
    current_id uuid := NEW.parent_task_id;
    depth integer := 0;
BEGIN
    -- Prevent self-reference
    IF NEW.id = NEW.parent_task_id THEN
        RAISE EXCEPTION 'Task cannot be its own parent';
    END IF;

    -- Check for circular references and depth limit
    WHILE current_id IS NOT NULL AND depth < 10 LOOP
        IF current_id = NEW.id THEN
            RAISE EXCEPTION 'Circular reference detected in task hierarchy';
        END IF;

        SELECT parent_task_id INTO current_id
        FROM tasks
        WHERE id = current_id;

        depth := depth + 1;
    END LOOP;

    -- Enforce maximum depth of 3 levels
    IF depth > 3 THEN
        RAISE EXCEPTION 'Task hierarchy cannot exceed 3 levels deep';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create hierarchy check trigger (with existence check)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'check_task_hierarchy_trigger') THEN
        DROP TRIGGER check_task_hierarchy_trigger ON tasks;
    END IF;
    CREATE TRIGGER check_task_hierarchy_trigger
        BEFORE INSERT OR UPDATE OF parent_task_id ON tasks
        FOR EACH ROW
        EXECUTE FUNCTION check_task_hierarchy();
END $$;

COMMENT ON COLUMN tasks.parent_task_id IS 'Reference to parent task for subtask hierarchy';
COMMENT ON COLUMN tasks.task_level IS 'Depth level in hierarchy: 0=main task, 1=subtask, 2=sub-subtask, 3=deepest level';
COMMENT ON COLUMN tasks.task_order IS 'Order within same level and parent for sorting';
COMMENT ON COLUMN tasks.completion_percentage IS 'Completion percentage: manual for leaf tasks, auto-calculated for parents';