-- Check current task status enum values
DO $$
BEGIN
    -- First, let's see what status values are currently allowed
    RAISE NOTICE 'Current task status enum values:';

    -- Add the missing status values if they don't exist
    BEGIN
        ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'approved';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'approved status already exists';
    END;

    BEGIN
        ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'rejected';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'rejected status already exists';
    END;

    BEGIN
        ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'done_auto_approved';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'done_auto_approved status already exists';
    END;
END $$;

-- If the column doesn't use an enum, let's check and fix the constraint
DO $$
BEGIN
    -- Remove any existing check constraint that might be too restrictive
    ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;

    -- Add the correct status constraint
    ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
    CHECK (status IN ('pending', 'in_progress', 'submitted_for_review', 'approved', 'rejected', 'done_auto_approved'));

    RAISE NOTICE 'Task status constraint updated successfully';
END $$;