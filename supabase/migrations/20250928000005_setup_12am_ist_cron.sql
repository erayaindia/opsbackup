-- Phase 6: Set up automatic 12 AM IST daily task creation
-- This creates a cron job that runs daily at 12:00 AM IST (6:30 PM UTC)

-- Enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Drop existing cron job if it exists
SELECT cron.unschedule('daily-task-creation-ist');

-- Create cron job that runs at 12:00 AM IST (6:30 PM UTC)
-- Cron format: '30 18 * * *' = 6:30 PM UTC = 12:00 AM IST
SELECT cron.schedule(
    'daily-task-creation-ist',
    '30 18 * * *',
    'SELECT create_todays_daily_tasks();'
);

-- Verify the cron job was created
SELECT
    jobname,
    schedule,
    command,
    active,
    created_at
FROM cron.job
WHERE jobname = 'daily-task-creation-ist';

-- Add helpful logging function for cron job
CREATE OR REPLACE FUNCTION log_daily_task_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Log when cron job runs
    INSERT INTO cron.job_run_details (jobid, runid, job_pid, database, username, command, status, return_message, start_time, end_time)
    SELECT
        j.jobid,
        nextval('cron.jobid_seq'),
        pg_backend_pid(),
        current_database(),
        current_user,
        'Daily Task Creation - 12 AM IST',
        'CRON_TRIGGERED',
        'Automatic daily task creation started',
        NOW(),
        NOW()
    FROM cron.job j
    WHERE j.jobname = 'daily-task-creation-ist';
END;
$$;

-- Update the cron job to include logging
SELECT cron.unschedule('daily-task-creation-ist');

SELECT cron.schedule(
    'daily-task-creation-ist',
    '30 18 * * *',
    $cron$
    BEGIN;
        -- Log the cron execution
        INSERT INTO daily_task_logs (event_type, event_data, created_at)
        VALUES ('cron_triggered', '{"time": "12:00 AM IST", "trigger": "automatic"}', NOW());

        -- Run the daily task creation
        PERFORM create_todays_daily_tasks();

        -- Log completion
        INSERT INTO daily_task_logs (event_type, event_data, created_at)
        VALUES ('cron_completed', '{"time": "12:00 AM IST", "status": "success"}', NOW());
    EXCEPTION
        WHEN OTHERS THEN
            -- Log any errors
            INSERT INTO daily_task_logs (event_type, event_data, created_at)
            VALUES ('cron_error', json_build_object('error', SQLERRM, 'time', '12:00 AM IST'), NOW());
    END;
    $cron$
);

-- Create logging table for cron job monitoring
CREATE TABLE IF NOT EXISTS daily_task_logs (
    id SERIAL PRIMARY KEY,
    event_type TEXT NOT NULL,
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant permissions
GRANT INSERT ON daily_task_logs TO postgres;
GRANT SELECT ON daily_task_logs TO authenticated;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_daily_task_logs_created_at ON daily_task_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_task_logs_event_type ON daily_task_logs(event_type);

-- Add helpful comments
COMMENT ON TABLE daily_task_logs IS 'Logs for automatic daily task creation cron job - runs at 12:00 AM IST';
COMMENT ON COLUMN daily_task_logs.event_type IS 'Types: cron_triggered, cron_completed, cron_error';

-- Verify everything is set up
SELECT 'Phase 6 Setup Complete' as status,
       'Cron job scheduled for 12:00 AM IST (6:30 PM UTC)' as schedule_info;

-- Show the active cron job
SELECT
    'ACTIVE CRON JOB' as info,
    jobname,
    schedule,
    active,
    created_at
FROM cron.job
WHERE jobname = 'daily-task-creation-ist';