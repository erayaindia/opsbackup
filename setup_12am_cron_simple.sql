-- SIMPLIFIED 12 AM IST CRON SETUP (No Errors)
-- Run this in Supabase SQL Editor

-- =================================================================
-- PHASE 6: 12 AM IST AUTOMATION - SIMPLE VERSION
-- =================================================================

-- Step 1: Check if pg_cron is available
SELECT 'Checking pg_cron availability' as step;
SELECT
    CASE WHEN EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')
         THEN '✅ pg_cron is available'
         ELSE '❌ pg_cron not available - contact Supabase support'
    END as pg_cron_status;

-- Step 2: Enable pg_cron (if available)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 3: Create logging table
CREATE TABLE IF NOT EXISTS daily_task_logs (
    id SERIAL PRIMARY KEY,
    event_type TEXT NOT NULL,
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create monitoring function
CREATE OR REPLACE FUNCTION get_cron_status()
RETURNS TABLE(
    job_name TEXT,
    schedule TEXT,
    is_active BOOLEAN,
    description TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT
        COALESCE(j.jobname, 'Not created yet')::TEXT,
        COALESCE(j.schedule, 'N/A')::TEXT,
        COALESCE(j.active, false),
        'Runs daily at 12:00 AM IST (6:30 PM UTC)'::TEXT
    FROM cron.job j
    WHERE j.jobname = 'daily-task-creation-ist'
    UNION ALL
    SELECT 'daily-task-creation-ist'::TEXT, '30 18 * * *'::TEXT, false, 'Not created yet'::TEXT
    WHERE NOT EXISTS(SELECT 1 FROM cron.job WHERE jobname = 'daily-task-creation-ist')
    LIMIT 1;
$$;

-- Step 5: Create the cron job (12:00 AM IST = 6:30 PM UTC)
-- This is the main automation that runs daily
SELECT cron.schedule(
    'daily-task-creation-ist',
    '30 18 * * *',
    $$
    DO $$
    DECLARE
        result_record RECORD;
    BEGIN
        -- Log execution start
        INSERT INTO daily_task_logs (event_type, event_data)
        VALUES ('cron_triggered', json_build_object(
            'ist_time', (NOW() AT TIME ZONE 'Asia/Kolkata')::TEXT,
            'trigger', 'automatic_12am_ist'
        ));

        -- Run daily task creation
        SELECT * INTO result_record FROM create_todays_daily_tasks();

        -- Log success
        INSERT INTO daily_task_logs (event_type, event_data)
        VALUES ('cron_completed', json_build_object(
            'ist_time', (NOW() AT TIME ZONE 'Asia/Kolkata')::TEXT,
            'instances_created', result_record.instances_created,
            'templates_found', result_record.templates_found,
            'marked_incomplete', result_record.marked_incomplete
        ));

    EXCEPTION WHEN OTHERS THEN
        -- Log errors
        INSERT INTO daily_task_logs (event_type, event_data)
        VALUES ('cron_error', json_build_object(
            'ist_time', (NOW() AT TIME ZONE 'Asia/Kolkata')::TEXT,
            'error', SQLERRM
        ));
    END $$;
    $$
) as cron_job_created;

-- Step 6: Verify setup
SELECT '✅ CRON JOB SETUP COMPLETE' as status;

-- Show the created cron job
SELECT
    jobname,
    schedule,
    active,
    '12:00 AM IST daily' as description
FROM cron.job
WHERE jobname = 'daily-task-creation-ist';

-- Show current time info
SELECT
    'CURRENT TIME' as info,
    (NOW() AT TIME ZONE 'Asia/Kolkata') as ist_now,
    EXTRACT(HOUR FROM (NOW() AT TIME ZONE 'Asia/Kolkata')) as ist_hour,
    CASE
        WHEN EXTRACT(HOUR FROM (NOW() AT TIME ZONE 'Asia/Kolkata')) >= 0
        AND EXTRACT(HOUR FROM (NOW() AT TIME ZONE 'Asia/Kolkata')) < 12
        THEN 'Next run: TODAY at 12:00 AM IST'
        ELSE 'Next run: TOMORROW at 12:00 AM IST'
    END as next_execution;

-- Grant permissions
GRANT SELECT ON daily_task_logs TO authenticated;
GRANT EXECUTE ON FUNCTION get_cron_status() TO authenticated;