-- =====================================================
-- RLS Policies for calendar_holidays table
-- Super Admin has full CRUD access
-- Others can only view holidays
-- =====================================================

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admin can view holidays" ON calendar_holidays;
DROP POLICY IF EXISTS "Admin can manage holidays" ON calendar_holidays;
DROP POLICY IF EXISTS "Authenticated users can view holidays" ON calendar_holidays;
DROP POLICY IF EXISTS "Admin can insert holidays" ON calendar_holidays;
DROP POLICY IF EXISTS "Admin can update holidays" ON calendar_holidays;
DROP POLICY IF EXISTS "Admin can delete holidays" ON calendar_holidays;
DROP POLICY IF EXISTS "Anyone can view holidays" ON calendar_holidays;
DROP POLICY IF EXISTS "Authenticated can insert holidays" ON calendar_holidays;
DROP POLICY IF EXISTS "Authenticated can update holidays" ON calendar_holidays;
DROP POLICY IF EXISTS "Authenticated can delete holidays" ON calendar_holidays;
DROP POLICY IF EXISTS "public_read_holidays" ON calendar_holidays;
DROP POLICY IF EXISTS "authenticated_insert_holidays" ON calendar_holidays;
DROP POLICY IF EXISTS "authenticated_update_holidays" ON calendar_holidays;
DROP POLICY IF EXISTS "authenticated_delete_holidays" ON calendar_holidays;
DROP POLICY IF EXISTS "public_select_holidays" ON calendar_holidays;
DROP POLICY IF EXISTS "superadmin_insert_holidays" ON calendar_holidays;
DROP POLICY IF EXISTS "superadmin_update_holidays" ON calendar_holidays;
DROP POLICY IF EXISTS "superadmin_delete_holidays" ON calendar_holidays;

-- Ensure RLS is enabled
ALTER TABLE calendar_holidays ENABLE ROW LEVEL SECURITY;

-- Create new policies

-- Policy 1: Everyone can VIEW holidays (public read access)
CREATE POLICY "public_select_holidays"
ON calendar_holidays
FOR SELECT
USING (true);

-- Policy 2: Only super_admin can INSERT holidays
CREATE POLICY "superadmin_insert_holidays"
ON calendar_holidays
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role = 'super_admin'
  )
);

-- Policy 3: Only super_admin can UPDATE holidays
CREATE POLICY "superadmin_update_holidays"
ON calendar_holidays
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role = 'super_admin'
  )
);

-- Policy 4: Only super_admin can DELETE holidays
CREATE POLICY "superadmin_delete_holidays"
ON calendar_holidays
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role = 'super_admin'
  )
);

-- Grant necessary permissions
GRANT SELECT ON calendar_holidays TO authenticated;
GRANT SELECT ON calendar_holidays TO anon;
GRANT ALL ON calendar_holidays TO authenticated;

-- Create a function to check if user can manage holidays
CREATE OR REPLACE FUNCTION can_manage_holidays()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM app_users
    WHERE id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;