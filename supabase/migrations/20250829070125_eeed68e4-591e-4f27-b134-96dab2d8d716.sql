-- Create a default admin profile for the current user
-- This will allow access to support tickets
INSERT INTO profiles (clerk_user_id, name, email, role)
VALUES (
  'temp_admin', -- This should be replaced with actual user ID
  'Admin User',
  'admin@company.com',
  'admin'
)
ON CONFLICT (clerk_user_id) DO UPDATE SET
  role = 'admin';