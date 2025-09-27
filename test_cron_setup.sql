-- =================================================================
-- TEST AND MONITOR 12 AM IST CRON JOB
-- Run these commands to verify your cron setup
-- =================================================================

-- Test 1: Check if pg_cron extension is available
SELECT 'Testing pg_cron extension' as test;
SELECT
    CASE WHEN EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')
         THEN '✅ pg_cron extension is installed'
         ELSE '❌ pg_cron extension not found - contact Supabase support'
    END as pg_cron_status;

-- Test 2: Check current cron job status
SELECT 'Checking cron job status' as test;
SELECT * FROM get_cron_status();

-- Test 3: View all cron jobs (to see if ours exists)
SELECT 'All active cron jobs' as test;
SELECT
    jobname,
    schedule,
    active,
    created_at
FROM cron.job
ORDER BY created_at DESC;

-- Test 4: Check current time vs next execution
SELECT 'Time check for next execution' as test;
SELECT
    NOW() as utc_now,
    (NOW() AT TIME ZONE 'Asia/Kolkata') as ist_now,
    EXTRACT(HOUR FROM (NOW() AT TIME ZONE 'Asia/Kolkata')) as current_ist_hour,
    CASE
        WHEN EXTRACT(HOUR FROM (NOW() AT TIME ZONE 'Asia/Kolkata')) < 12
        THEN 'Next execution: TODAY at 12:00 AM IST'
        ELSE 'Next execution: TOMORROW at 12:00 AM IST'
    END as next_execution;

-- Test 5: Manual test of daily task function
SELECT 'Manual test of function' as test;
SELECT create_todays_daily_tasks() as manual_test_result;

-- Test 6: Check recent cron logs (if any)
SELECT 'Recent cron execution logs' as test;
SELECT * FROM get_recent_cron_logs(5);

-- Test 7: Verify logging table exists
SELECT 'Logging table verification' as test;
SELECT
    COUNT(*) as total_logs,
    COUNT(CASE WHEN event_type = 'cron_triggered' THEN 1 END) as triggered_count,
    COUNT(CASE WHEN event_type = 'cron_completed' THEN 1 END) as completed_count,
    COUNT(CASE WHEN event_type = 'cron_error' THEN 1 END) as error_count,
    MAX(created_at) as latest_log
FROM daily_task_logs;

-- =================================================================
-- EXPECTED RESULTS:
--
-- Test 1: Should show "✅ pg_cron extension is installed"
-- Test 2: Should show job details with active=true
-- Test 3: Should show 'daily-task-creation-ist' in the list
-- Test 4: Should show current IST time and next execution info
-- Test 5: Should return task creation results (may be 0,0,0 if Sunday)
-- Test 6: May be empty if cron hasn't run yet
-- Test 7: Should show logging table exists (may have 0 logs initially)
--
-- =================================================================

-- Instructions for monitoring:
SELECT 'MONITORING INSTRUCTIONS' as info,
       'Run this query daily to check cron job health:' as instruction;

-- Daily monitoring query:
/*
SELECT
    'DAILY CRON HEALTH CHECK' as check_type,
    j.jobname,
    j.active,
    j.schedule,
    (SELECT COUNT(*) FROM daily_task_logs WHERE event_type = 'cron_completed' AND DATE(created_at) = CURRENT_DATE) as todays_executions,
    (SELECT COUNT(*) FROM daily_task_logs WHERE event_type = 'cron_error' AND DATE(created_at) = CURRENT_DATE) as todays_errors
FROM cron.job j
WHERE j.jobname = 'daily-task-creation-ist';
*/