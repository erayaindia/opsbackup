-- MANUAL SETUP: 12 AM IST Automatic Daily Task Creation
-- Run this in your Supabase SQL Editor to set up automatic scheduling

-- =================================================================
-- PHASE 6: 12 AM IST AUTOMATION SETUP
-- =================================================================

-- Step 1: Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 2: Remove any existing daily task cron jobs
SELECT cron.unschedule('daily-task-creation-ist');
SELECT cron.unschedule('daily-task-creation'); -- old name if exists

-- Step 3: Create logging table for monitoring
CREATE TABLE IF NOT EXISTS daily_task_logs (
    id SERIAL PRIMARY KEY,
    event_type TEXT NOT NULL,
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create the main 12 AM IST cron job
-- Time: 12:00 AM IST = 6:30 PM UTC (previous day)
-- Cron: '30 18 * * *' = Every day at 6:30 PM UTC
SELECT cron.schedule(
    'daily-task-creation-ist',
    '30 18 * * *',
    $$
    DO $$
    DECLARE
        result_data JSONB;
    BEGIN
        -- Log cron start
        INSERT INTO daily_task_logs (event_type, event_data, created_at)
        VALUES ('cron_triggered',
                json_build_object(
                    'ist_time', (NOW() AT TIME ZONE 'Asia/Kolkata')::TEXT,
                    'utc_time', NOW()::TEXT,
                    'trigger', 'automatic_12am_ist'
                ),
                NOW());

        -- Execute daily task creation and capture result
        SELECT json_build_object(
            'instances_created', r.instances_created,
            'templates_found', r.templates_found,
            'marked_incomplete', r.marked_incomplete
        ) INTO result_data
        FROM create_todays_daily_tasks() r;

        -- Log successful completion
        INSERT INTO daily_task_logs (event_type, event_data, created_at)
        VALUES ('cron_completed',
                json_build_object(
                    'ist_time', (NOW() AT TIME ZONE 'Asia/Kolkata')::TEXT,
                    'result', result_data,
                    'status', 'success'
                ),
                NOW());

    EXCEPTION
        WHEN OTHERS THEN
            -- Log any errors
            INSERT INTO daily_task_logs (event_type, event_data, created_at)
            VALUES ('cron_error',
                    json_build_object(
                        'ist_time', (NOW() AT TIME ZONE 'Asia/Kolkata')::TEXT,
                        'error_message', SQLERRM,
                        'error_state', SQLSTATE
                    ),
                    NOW());
    END $$;
    $$
);

-- Step 5: Create monitoring functions
CREATE OR REPLACE FUNCTION get_cron_status()
RETURNS TABLE(
    job_name TEXT,
    schedule TEXT,
    is_active BOOLEAN,
    next_run_time TEXT,
    last_run_status TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT
        j.jobname::TEXT,
        j.schedule::TEXT,
        j.active,
        'Next: 12:00 AM IST (6:30 PM UTC)'::TEXT,
        COALESCE(
            (SELECT event_type FROM daily_task_logs
             WHERE event_type IN ('cron_completed', 'cron_error')
             ORDER BY created_at DESC LIMIT 1),
            'Not run yet'
        )::TEXT
    FROM cron.job j
    WHERE j.jobname = 'daily-task-creation-ist';
$$;

CREATE OR REPLACE FUNCTION get_recent_cron_logs(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
    log_time TIMESTAMP WITH TIME ZONE,
    event_type TEXT,
    ist_time TEXT,
    details JSONB
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT
        created_at,
        daily_task_logs.event_type,
        COALESCE(event_data->>'ist_time', 'N/A'),
        event_data
    FROM daily_task_logs
    WHERE event_type LIKE 'cron_%'
    ORDER BY created_at DESC
    LIMIT limit_count;
$$;

-- Step 6: Grant necessary permissions
GRANT SELECT ON daily_task_logs TO authenticated;
GRANT EXECUTE ON FUNCTION get_cron_status() TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_cron_logs(INTEGER) TO authenticated;

-- Step 7: Verify setup
SELECT 'CRON JOB SETUP COMPLETE' as status;

-- Show active cron job details
SELECT
    jobname as job_name,
    schedule,
    active,
    created_at,
    'Runs daily at 12:00 AM IST (6:30 PM UTC)' as description
FROM cron.job
WHERE jobname = 'daily-task-creation-ist';

-- Show current IST time for reference
SELECT
    'CURRENT TIME INFO' as info,
    NOW() as utc_now,
    (NOW() AT TIME ZONE 'Asia/Kolkata') as ist_now,
    EXTRACT(HOUR FROM (NOW() AT TIME ZONE 'Asia/Kolkata')) as ist_hour;

-- =================================================================
-- MONITORING COMMANDS (run these to check status):
--
-- Check cron job status:
-- SELECT * FROM get_cron_status();
--
-- View recent cron logs:
-- SELECT * FROM get_recent_cron_logs(5);
--
-- Manual test (run anytime):
-- SELECT create_todays_daily_tasks();
--
-- =================================================================