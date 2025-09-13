-- Fix User Foreign Key Constraints
-- This migration makes user references nullable and adds user sync functionality

-- First, let's make the foreign key constraints nullable so products can be created
-- even if user isn't synced to app_users yet

-- Drop existing foreign key constraints
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_created_by_fkey;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_assigned_to_fkey;

-- Make columns nullable (they probably already are, but let's be sure)
ALTER TABLE products ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE products ALTER COLUMN assigned_to DROP NOT NULL;

-- Re-add constraints but make them more flexible (ON DELETE SET NULL)
ALTER TABLE products
ADD CONSTRAINT products_created_by_fkey
FOREIGN KEY (created_by) REFERENCES app_users(id) ON DELETE SET NULL;

ALTER TABLE products
ADD CONSTRAINT products_assigned_to_fkey
FOREIGN KEY (assigned_to) REFERENCES app_users(id) ON DELETE SET NULL;

-- Create function to sync auth user to app_users table
CREATE OR REPLACE FUNCTION sync_user_to_app_users()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into app_users if user doesn't exist
  INSERT INTO app_users (
    id,
    full_name,
    company_email,
    status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Unknown User'),
    NEW.email,
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    company_email = EXCLUDED.company_email,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-sync users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_user_to_app_users();

-- Also create a function to ensure user exists before product operations
CREATE OR REPLACE FUNCTION ensure_user_exists(user_id UUID)
RETURNS UUID AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Check if user exists in app_users
  IF EXISTS (SELECT 1 FROM app_users WHERE id = user_id) THEN
    RETURN user_id;
  END IF;

  -- Get user email from auth.users
  SELECT email INTO user_email FROM auth.users WHERE id = user_id;

  -- If user exists in auth but not in app_users, sync them
  IF user_email IS NOT NULL THEN
    INSERT INTO app_users (
      id,
      full_name,
      company_email,
      status,
      created_at,
      updated_at
    )
    VALUES (
      user_id,
      user_email,
      user_email,
      'active',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      updated_at = NOW();

    RETURN user_id;
  END IF;

  -- If user doesn't exist anywhere, return NULL
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sync existing auth users to app_users
INSERT INTO app_users (
  id,
  full_name,
  company_email,
  status,
  created_at,
  updated_at
)
SELECT
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email, 'Unknown User'),
  au.email,
  'active',
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN app_users ap ON au.id = ap.id
WHERE ap.id IS NULL
ON CONFLICT (id) DO UPDATE SET
  updated_at = NOW();

-- Final status messages
DO $$
BEGIN
  RAISE NOTICE 'User foreign key constraints fixed and user sync enabled';
  RAISE NOTICE 'All authenticated users have been synced to app_users table';
END $$;