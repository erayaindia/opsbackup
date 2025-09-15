-- Fix RLS policy for attendance_records to allow cross user checkins
-- This enables both self checkins and admin/kiosk checkins for other employees

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert their own attendance records" ON attendance_records;

-- Create a new INSERT policy that allows:
-- 1. Users to checkin for themselves (auth_user_id = auth.uid())
-- 2. Admins/HR to checkin for any employee
-- 3. Any active user to checkin for any employee (kiosk mode)
CREATE POLICY "Users can insert attendance records" ON attendance_records
    FOR INSERT WITH CHECK (
        -- Allow if inserting their own record
        auth_user_id = auth.uid()
        OR
        -- Allow if user is admin/hr/super_admin (can checkin anyone)
        EXISTS (
            SELECT 1 FROM app_users
            WHERE app_users.auth_user_id = auth.uid()
            AND app_users.role IN ('admin', 'super_admin', 'hr')
            AND app_users.status = 'active'
        )
        OR
        -- Allow any active user to checkin for any employee (kiosk mode)
        -- This enables the attendance kiosk functionality
        EXISTS (
            SELECT 1 FROM app_users
            WHERE app_users.auth_user_id = auth.uid()
            AND app_users.status = 'active'
        )
    );

-- Also update the SELECT policy to ensure proper read access
DROP POLICY IF EXISTS "Users can view their own attendance records" ON attendance_records;

CREATE POLICY "Users can view attendance records" ON attendance_records
    FOR SELECT USING (
        -- Users can view their own records
        auth_user_id = auth.uid()
        OR
        -- Admins/HR can view all records
        EXISTS (
            SELECT 1 FROM app_users
            WHERE app_users.auth_user_id = auth.uid()
            AND app_users.role IN ('admin', 'super_admin', 'hr')
            AND app_users.status = 'active'
        )
        OR
        -- Users can view records they created (for kiosk scenarios)
        EXISTS (
            SELECT 1 FROM app_users
            WHERE app_users.auth_user_id = auth.uid()
            AND app_users.status = 'active'
        )
    );