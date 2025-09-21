-- Create a helper function to check if current user is super admin
-- This improves performance by avoiding repeated subqueries
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM app_users
        WHERE auth_user_id = auth.uid()
        AND role = 'super_admin'
    );
$$;

-- Create a helper function to get current user's role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT role FROM app_users
    WHERE auth_user_id = auth.uid()
    LIMIT 1;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION current_user_role() TO authenticated;

-- Update the products delete policy to use the helper function for better performance
DROP POLICY IF EXISTS "Enable delete for super_admin only" ON products;

CREATE POLICY "Enable delete for super_admin only" ON products
    FOR DELETE USING (is_super_admin());

-- Update app_users policies to use helper functions for better performance
DROP POLICY IF EXISTS "Users can read own record, super_admin can read all" ON app_users;
DROP POLICY IF EXISTS "Only super_admin can insert users" ON app_users;
DROP POLICY IF EXISTS "Restricted update access" ON app_users;
DROP POLICY IF EXISTS "Only super_admin can delete users" ON app_users;

-- Recreate app_users policies with helper functions
CREATE POLICY "Users can read own record, super_admin can read all" ON app_users
    FOR SELECT USING (
        auth_user_id = auth.uid() OR is_super_admin()
    );

CREATE POLICY "Only super_admin can insert users" ON app_users
    FOR INSERT WITH CHECK (is_super_admin());

CREATE POLICY "Restricted update access" ON app_users
    FOR UPDATE USING (
        auth_user_id = auth.uid() OR is_super_admin()
    );

CREATE POLICY "Only super_admin can delete users" ON app_users
    FOR DELETE USING (is_super_admin());