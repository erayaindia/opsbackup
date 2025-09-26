-- Add work duration tracking to tasks table
ALTER TABLE tasks ADD COLUMN work_duration_seconds INTEGER DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN tasks.work_duration_seconds IS 'Total time spent working on this task in seconds';

-- Update existing tasks to have 0 duration
UPDATE tasks SET work_duration_seconds = 0 WHERE work_duration_seconds IS NULL;