-- Temporarily Remove User Foreign Key Constraints
-- This allows product creation without requiring users to exist in app_users

-- Drop the problematic foreign key constraints
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_created_by_fkey;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_assigned_to_fkey;

-- Make sure the columns are nullable
ALTER TABLE products ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE products ALTER COLUMN assigned_to DROP NOT NULL;

-- Create a simple function to get or create user info for display
CREATE OR REPLACE FUNCTION get_user_display_info(user_id UUID)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  email TEXT
) AS $$
BEGIN
  -- First try to get from app_users
  RETURN QUERY
  SELECT au.id, au.full_name as display_name, au.company_email as email
  FROM app_users au
  WHERE au.id = user_id;

  -- If found, return
  IF FOUND THEN
    RETURN;
  END IF;

  -- Otherwise try auth.users (if accessible)
  BEGIN
    RETURN QUERY
    SELECT auth_u.id, auth_u.email as display_name, auth_u.email
    FROM auth.users auth_u
    WHERE auth_u.id = user_id;
  EXCEPTION
    WHEN others THEN
      -- If auth.users not accessible, return placeholder
      RETURN QUERY
      SELECT user_id as id, 'User' as display_name, '' as email;
  END;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Foreign key constraints removed - products can now be created freely';
  RAISE NOTICE 'Use get_user_display_info(uuid) function to safely get user details';
END $$;