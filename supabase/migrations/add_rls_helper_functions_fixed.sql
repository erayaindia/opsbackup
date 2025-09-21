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