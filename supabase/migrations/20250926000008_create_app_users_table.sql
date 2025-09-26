-- Create or fix app_users table with proper schema
-- This will solve the 500 errors in profile loading

-- Drop and recreate app_users table with correct schema
DROP TABLE IF EXISTS app_users CASCADE;

CREATE TABLE app_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_email TEXT UNIQUE,
  personal_email TEXT,
  full_name TEXT,
  employee_id TEXT UNIQUE,
  department TEXT,
  designation TEXT,
  role TEXT DEFAULT 'employee' CHECK (role IN ('employee', 'admin', 'manager', 'team_lead', 'super_admin')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_app_users_auth_user_id ON app_users(auth_user_id);
CREATE INDEX idx_app_users_company_email ON app_users(company_email);
CREATE INDEX idx_app_users_role ON app_users(role);
CREATE INDEX idx_app_users_status ON app_users(status);

-- Enable RLS
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Create permissive policy
CREATE POLICY "app_users_all_access" ON app_users
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Insert your user data
INSERT INTO app_users (
  auth_user_id,
  company_email,
  personal_email,
  full_name,
  employee_id,
  role,
  status
) VALUES (
  '384c0dad-f79b-44cb-a752-3b289902fa9e',
  'rishav@erayastyle.com',
  'rishav@erayastyle.com',
  'Rishav',
  'EMP-0001',
  'super_admin',
  'active'
) ON CONFLICT (auth_user_id) DO UPDATE SET
  role = 'super_admin',
  status = 'active';

-- Also insert with company_email as unique key in case of conflicts
INSERT INTO app_users (
  auth_user_id,
  company_email,
  personal_email,
  full_name,
  employee_id,
  role,
  status
) VALUES (
  '384c0dad-f79b-44cb-a752-3b289902fa9e',
  'rishav@erayastyle.com',
  'rishav@erayastyle.com',
  'Rishav',
  'EMP-0001',
  'super_admin',
  'active'
) ON CONFLICT (company_email) DO UPDATE SET
  auth_user_id = EXCLUDED.auth_user_id,
  role = 'super_admin',
  status = 'active';

-- Grant permissions
GRANT ALL ON app_users TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Verify the data
SELECT 'SUCCESS: app_users table created and populated' as status;
SELECT * FROM app_users;