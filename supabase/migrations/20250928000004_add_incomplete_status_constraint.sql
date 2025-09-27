-- Fix: Add 'incomplete' status to database check constraint
-- This is required for Phase 4 expiry logic to work

-- First, check current constraint
SELECT conname, consrc
FROM pg_constraint
WHERE conrelid = 'tasks'::regclass
  AND conname LIKE '%status%';

-- Drop the existing status check constraint
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;

-- Add new constraint that includes 'incomplete' status
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
CHECK (status IN (
    'pending',
    'in_progress',
    'submitted_for_review',
    'approved',
    'rejected',
    'incomplete',
    'done_auto_approved',
    'expired',
    'archived'
));

-- Verify the constraint was added
SELECT conname, consrc
FROM pg_constraint
WHERE conrelid = 'tasks'::regclass
  AND conname = 'tasks_status_check';