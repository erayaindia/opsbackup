-- Simple fix for task status validation
-- Remove any restrictive check constraint and add the correct one

-- First, drop any existing check constraint on status
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS check_tasks_status;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_enum;

-- Add the correct status constraint with all valid values
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
CHECK (status::text = ANY (ARRAY[
    'pending'::text,
    'in_progress'::text,
    'submitted_for_review'::text,
    'approved'::text,
    'rejected'::text,
    'done_auto_approved'::text
]));

-- Update any existing tasks with 'completed' status to 'approved'
UPDATE tasks SET status = 'approved' WHERE status = 'completed';

-- Update any existing tasks with 'cancelled' status to 'rejected'
UPDATE tasks SET status = 'rejected' WHERE status = 'cancelled';