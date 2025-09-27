-- Add auto-incrementing task_id column to tasks table
-- This will assign unique task IDs starting from 1, 2, 3, etc.

-- Create a sequence for task IDs
CREATE SEQUENCE IF NOT EXISTS task_id_sequence START 1 INCREMENT 1;

-- Add task_id column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_id INTEGER;

-- Create a function to get the next task ID
CREATE OR REPLACE FUNCTION get_next_task_id()
RETURNS INTEGER AS $$
BEGIN
  RETURN nextval('task_id_sequence');
END;
$$ LANGUAGE plpgsql;

-- Update existing tasks with sequential task IDs (for existing data)
DO $$
DECLARE
  task_record RECORD;
  counter INTEGER := 1;
BEGIN
  -- Only update tasks that don't have task_id yet
  FOR task_record IN
    SELECT id FROM tasks
    WHERE task_id IS NULL
    ORDER BY created_at ASC
  LOOP
    UPDATE tasks
    SET task_id = counter
    WHERE id = task_record.id;
    counter := counter + 1;
  END LOOP;

  -- Set the sequence to continue from where we left off
  PERFORM setval('task_id_sequence', counter);
END $$;

-- Create a trigger function to automatically assign task_id to new tasks
CREATE OR REPLACE FUNCTION assign_task_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Only assign task_id if it's not already set
  IF NEW.task_id IS NULL THEN
    NEW.task_id := get_next_task_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically assign task_id on insert
DROP TRIGGER IF EXISTS trigger_assign_task_id ON tasks;
CREATE TRIGGER trigger_assign_task_id
  BEFORE INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION assign_task_id();

-- Add a unique constraint on task_id
ALTER TABLE tasks ADD CONSTRAINT unique_task_id UNIQUE (task_id);

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tasks_task_id ON tasks(task_id);