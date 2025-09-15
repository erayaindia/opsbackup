-- Attendance System Database Setup (Using existing app_users table)
-- Run these SQL commands in your Supabase SQL editor

-- 1. First, let's add employee_id to app_users table if it doesn't exist
ALTER TABLE app_users
ADD COLUMN IF NOT EXISTS employee_id TEXT UNIQUE;

-- 2. Create attendance_settings table
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

-- 3. Create attendance_records table (linking to app_users)
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    app_user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id TEXT, -- Will be populated from app_users.employee_id
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
CREATE INDEX IF NOT EXISTS idx_attendance_records_app_user_id ON attendance_records(app_user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_employee_id ON attendance_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_check_in_time ON attendance_records(check_in_time);
CREATE INDEX IF NOT EXISTS idx_app_users_employee_id ON app_users(employee_id);
CREATE INDEX IF NOT EXISTS idx_app_users_auth_user_id ON app_users(auth_user_id);

-- 5. Create storage bucket for attendance photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('attendance-photos', 'attendance-photos', false)
ON CONFLICT (id) DO NOTHING;

-- 6. Set up RLS (Row Level Security) policies

-- Enable RLS on new tables
ALTER TABLE attendance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Attendance settings policies (admin only)
CREATE POLICY "Admin can view attendance settings" ON attendance_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE app_users.auth_user_id = auth.uid()
            AND app_users.role IN ('admin', 'super_admin')
            AND app_users.status = 'active'
        )
    );

CREATE POLICY "Admin can manage attendance settings" ON attendance_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE app_users.auth_user_id = auth.uid()
            AND app_users.role IN ('admin', 'super_admin')
            AND app_users.status = 'active'
        )
    );

-- Attendance records policies
CREATE POLICY "Users can view their own attendance records" ON attendance_records
    FOR SELECT USING (
        auth_user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM app_users
            WHERE app_users.auth_user_id = auth.uid()
            AND app_users.role IN ('admin', 'super_admin', 'hr')
            AND app_users.status = 'active'
        )
    );

CREATE POLICY "Users can insert their own attendance records" ON attendance_records
    FOR INSERT WITH CHECK (
        auth_user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM app_users
            WHERE app_users.auth_user_id = auth.uid()
            AND app_users.status = 'active'
        )
    );

CREATE POLICY "Users can update their own attendance records" ON attendance_records
    FOR UPDATE USING (
        auth_user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM app_users
            WHERE app_users.auth_user_id = auth.uid()
            AND app_users.role IN ('admin', 'super_admin', 'hr')
            AND app_users.status = 'active'
        )
    );

-- 7. Storage policies for attendance photos
CREATE POLICY "Users can upload their own attendance photos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'attendance-photos'
        AND EXISTS (
            SELECT 1 FROM app_users
            WHERE app_users.auth_user_id = auth.uid()
            AND app_users.status = 'active'
        )
    );

CREATE POLICY "Users can view attendance photos" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'attendance-photos'
        AND (
            -- Users can view their own photos or admins can view all
            EXISTS (
                SELECT 1 FROM app_users
                WHERE app_users.auth_user_id = auth.uid()
                AND (
                    app_users.status = 'active'
                    AND (
                        auth.uid()::text = (storage.foldername(name))[1]
                        OR app_users.role IN ('admin', 'super_admin', 'hr')
                    )
                )
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
    25.5941,  -- Patna latitude
    85.1376,  -- Patna longitude
    100,
    '09:00:00',
    '17:00:00',
    15,
    true,
    true
) ON CONFLICT DO NOTHING;

-- 11. Update existing app_users with employee IDs (you can modify these)
-- Generate employee IDs based on existing data
UPDATE app_users SET employee_id =
    CASE
        WHEN full_name = 'Rishav Darsh' THEN 'RD001'
        WHEN full_name = 'Eraya Employee' THEN 'EE001'
        WHEN full_name = 'Priyanshi Bisht' THEN 'PB001'
        ELSE UPPER(LEFT(SPLIT_PART(full_name, ' ', 1), 2)) || UPPER(LEFT(COALESCE(SPLIT_PART(full_name, ' ', 2), 'X'), 1)) || '001'
    END
WHERE employee_id IS NULL;

-- If you need unique sequential IDs for additional users, run this after the above:
-- UPDATE app_users SET employee_id = 'EMP' || LPAD(id::text, 3, '0')
-- WHERE employee_id IS NULL OR employee_id = '';

-- Alternative: Set specific employee IDs manually
-- UPDATE app_users SET employee_id = 'RD001' WHERE full_name = 'Rishav Darsh';
-- UPDATE app_users SET employee_id = 'EE001' WHERE full_name = 'Eraya Employee';
-- UPDATE app_users SET employee_id = 'PB001' WHERE full_name = 'Priyanshi Bisht';

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
        -- Set employee_id from app_users
        SELECT employee_id INTO NEW.employee_id
        FROM app_users
        WHERE auth_user_id = NEW.auth_user_id;

        -- Set status based on time
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

-- 15. Create a view for easy attendance queries with employee details
CREATE OR REPLACE VIEW attendance_with_employee_details AS
SELECT
    ar.*,
    au.full_name,
    au.company_email,
    au.phone,
    au.department,
    au.designation,
    au.work_location,
    au.employment_type
FROM attendance_records ar
JOIN app_users au ON ar.app_user_id = au.id
WHERE au.status = 'active';

-- 16. Grant permissions on the view
GRANT SELECT ON attendance_with_employee_details TO authenticated;

-- Setup complete!
-- Your app_users table structure is perfect for this integration:
-- - auth_user_id: Links to Supabase auth
-- - full_name: Employee name for display
-- - company_email: Official email
-- - department: For filtering and organization
-- - role: For permissions (super_admin, admin, employee)
-- - status: To check if employee is active
-- - employee_id: Now added for attendance system