-- Attendance System Database Setup
-- Run these SQL commands in your Supabase SQL editor

-- 1. Create attendance_settings table
CREATE TABLE IF NOT EXISTS attendance_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    office_name TEXT NOT NULL,
    office_ip_ranges TEXT[] NOT NULL DEFAULT '{}',
    office_latitude DECIMAL(10, 7) NOT NULL,
    office_longitude DECIMAL(10, 7) NOT NULL,
    allowed_radius_meters INTEGER DEFAULT 100,
    work_start_time TIME DEFAULT '09:00:00',
    work_end_time TIME DEFAULT '17:00:00',
    late_threshold_minutes INTEGER DEFAULT 15,
    require_selfie BOOLEAN DEFAULT true,
    require_location BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create employee_profiles table
CREATE TABLE IF NOT EXISTS employee_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL UNIQUE,
    department TEXT,
    position TEXT,
    work_schedule JSONB DEFAULT '{"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "09:00", "end": "17:00"}, "wednesday": {"start": "09:00", "end": "17:00"}, "thursday": {"start": "09:00", "end": "17:00"}, "friday": {"start": "09:00", "end": "17:00"}}',
    is_active BOOLEAN DEFAULT true,
    hire_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id TEXT NOT NULL REFERENCES employee_profiles(employee_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    check_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
    check_out_time TIMESTAMP WITH TIME ZONE,
    selfie_url TEXT,
    location_verified BOOLEAN DEFAULT false,
    ip_address INET,
    gps_latitude DECIMAL(10, 7),
    gps_longitude DECIMAL(10, 7),
    status TEXT CHECK (status IN ('present', 'late', 'absent', 'checked_out')) DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_records_employee_id ON attendance_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_check_in_time ON attendance_records(check_in_time);
-- Removed date index as it requires immutable function - check_in_time index is sufficient for date queries
CREATE INDEX IF NOT EXISTS idx_employee_profiles_employee_id ON employee_profiles(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_profiles_user_id ON employee_profiles(user_id);

-- 5. Create storage bucket for attendance photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('attendance-photos', 'attendance-photos', false)
ON CONFLICT (id) DO NOTHING;

-- 6. Set up RLS (Row Level Security) policies

-- Enable RLS on all tables
ALTER TABLE attendance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Attendance settings policies (admin only)
CREATE POLICY "Admin can view attendance settings" ON attendance_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admin can manage attendance settings" ON attendance_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Employee profiles policies
CREATE POLICY "Users can view their own employee profile" ON employee_profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admin can view all employee profiles" ON employee_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin', 'hr')
        )
    );

CREATE POLICY "Admin can manage employee profiles" ON employee_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin', 'hr')
        )
    );

-- Attendance records policies
CREATE POLICY "Users can view their own attendance records" ON attendance_records
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own attendance records" ON attendance_records
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own attendance records" ON attendance_records
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admin can view all attendance records" ON attendance_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin', 'hr')
        )
    );

CREATE POLICY "Admin can manage attendance records" ON attendance_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin', 'hr')
        )
    );

-- 7. Storage policies for attendance photos
CREATE POLICY "Users can upload their own attendance photos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'attendance-photos'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own attendance photos" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'attendance-photos'
        AND (
            auth.uid()::text = (storage.foldername(name))[1]
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.user_id = auth.uid()
                AND profiles.role IN ('admin', 'super_admin', 'hr')
            )
        )
    );

-- 8. Create trigger functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Apply triggers to tables
CREATE TRIGGER update_attendance_settings_updated_at
    BEFORE UPDATE ON attendance_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_profiles_updated_at
    BEFORE UPDATE ON employee_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_records_updated_at
    BEFORE UPDATE ON attendance_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Insert default attendance settings
INSERT INTO attendance_settings (
    office_name,
    office_ip_ranges,
    office_latitude,
    office_longitude,
    allowed_radius_meters,
    work_start_time,
    work_end_time,
    late_threshold_minutes,
    require_selfie,
    require_location
) VALUES (
    'Main Office',
    ARRAY['192.168.1.', '10.0.0.'],
    40.7128,
    -74.0060,
    100,
    '09:00:00',
    '17:00:00',
    15,
    true,
    true
) ON CONFLICT DO NOTHING;

-- 11. Sample employee profiles (replace with actual data)
-- First create some sample users in auth.users, then:
/*
INSERT INTO employee_profiles (
    user_id,
    employee_id,
    department,
    position,
    hire_date
) VALUES
    -- Replace these UUIDs with actual user IDs from auth.users
    ('00000000-0000-0000-0000-000000000001', 'AB1234', 'Engineering', 'Senior Developer', '2024-01-01'),
    ('00000000-0000-0000-0000-000000000002', 'CD5678', 'Marketing', 'Marketing Manager', '2024-01-15'),
    ('00000000-0000-0000-0000-000000000003', 'EF9012', 'Sales', 'Sales Representative', '2024-02-01'),
    ('00000000-0000-0000-0000-000000000004', 'GH3456', 'HR', 'HR Specialist', '2024-02-15')
ON CONFLICT (employee_id) DO NOTHING;
*/

-- 12. Create a function to check if employee is late
CREATE OR REPLACE FUNCTION is_employee_late(check_in_time TIMESTAMP WITH TIME ZONE)
RETURNS BOOLEAN AS $$
DECLARE
    work_start TIME;
    late_threshold INTEGER;
    check_in_time_local TIME;
BEGIN
    -- Get work start time and late threshold from settings
    SELECT work_start_time, late_threshold_minutes
    INTO work_start, late_threshold
    FROM attendance_settings
    WHERE is_active = true
    LIMIT 1;

    -- Extract time from check_in_time
    check_in_time_local := check_in_time::TIME;

    -- Check if late (work_start + threshold)
    RETURN check_in_time_local > (work_start + (late_threshold || ' minutes')::INTERVAL);
END;
$$ LANGUAGE plpgsql;

-- 13. Create a function to automatically set status based on check-in time
CREATE OR REPLACE FUNCTION set_attendance_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set status on INSERT, not UPDATE
    IF TG_OP = 'INSERT' THEN
        IF is_employee_late(NEW.check_in_time) THEN
            NEW.status = 'late';
        ELSE
            NEW.status = 'present';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 14. Apply status trigger
CREATE TRIGGER set_attendance_status_trigger
    BEFORE INSERT ON attendance_records
    FOR EACH ROW EXECUTE FUNCTION set_attendance_status();

-- Setup complete!
-- Remember to:
-- 1. Create actual user accounts in auth.users
-- 2. Update employee_profiles with real user IDs
-- 3. Adjust office coordinates and IP ranges in attendance_settings
-- 4. Set up proper user roles in the profiles table