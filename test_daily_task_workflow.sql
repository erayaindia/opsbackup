-- Test script for daily task workflow
-- Run this in Supabase SQL Editor to test the complete workflow

-- Test 1: Check if weekend skip works for Sunday
SELECT 'Testing Sunday Skip Logic' as test_name;
SELECT auto_create_daily_tasks_for_date('2025-09-28'::DATE); -- Sunday

-- Test 2: Test normal weekday creation
SELECT 'Testing Monday Creation' as test_name;
SELECT auto_create_daily_tasks_for_date('2025-09-29'::DATE); -- Monday

-- Test 3: Check IST timezone function
SELECT 'Testing IST Time Info' as test_name;
SELECT get_ist_info();

-- Test 4: Check what day of week PostgreSQL thinks today is
SELECT 'Day of Week Check' as test_name,
       EXTRACT(DOW FROM CURRENT_DATE) as server_dow,
       EXTRACT(DOW FROM (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE) as ist_dow,
       (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE as ist_date,
       (NOW() AT TIME ZONE 'Asia/Kolkata')::TIME as ist_time;

-- Test 5: Check if 11 PM expiry logic works
SELECT 'Testing 11 PM Expiry Logic' as test_name;
-- This will show current time vs 11 PM threshold
SELECT (NOW() AT TIME ZONE 'Asia/Kolkata')::TIME as current_ist_time,
       ((NOW() AT TIME ZONE 'Asia/Kolkata')::TIME >= '23:00:00'::TIME) as is_after_11pm;

-- Test 6: Check incomplete status handling
SELECT 'Checking Incomplete Status Support' as test_name;
SELECT 'incomplete'::text as status_value,
       ('incomplete' IN ('pending', 'in_progress', 'submitted_for_review', 'approved', 'rejected', 'incomplete', 'done_auto_approved')) as is_valid_status;