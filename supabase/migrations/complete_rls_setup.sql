-- COMPLETE RLS SETUP - RUN THIS ENTIRE FILE AT ONCE
-- This will set up Row Level Security to restrict product deletion to super_admin only

-- ============================================================================
-- STEP 1: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Create a helper function to check if current user is super admin
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

-- ============================================================================
-- STEP 2: SETUP PRODUCTS TABLE RLS
-- ============================================================================

-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON products;
DROP POLICY IF EXISTS "Enable insert for all authenticated users" ON products;
DROP POLICY IF EXISTS "Enable update for all authenticated users" ON products;
DROP POLICY IF EXISTS "Enable delete for super_admin only" ON products;

-- Policy: Allow all authenticated users to SELECT products
CREATE POLICY "Enable read access for all authenticated users" ON products
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Allow all authenticated users to INSERT products (anyone can create)
CREATE POLICY "Enable insert for all authenticated users" ON products
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Allow all authenticated users to UPDATE products
CREATE POLICY "Enable update for all authenticated users" ON products
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Policy: Only super_admin can DELETE products
CREATE POLICY "Enable delete for super_admin only" ON products
    FOR DELETE USING (is_super_admin());

-- Grant permissions to authenticated users for other operations
GRANT SELECT, INSERT, UPDATE ON products TO authenticated;

-- Grant DELETE permission only to authenticated users (RLS will handle the role check)
GRANT DELETE ON products TO authenticated;

-- ============================================================================
-- STEP 3: SETUP APP_USERS TABLE RLS
-- ============================================================================

-- Enable RLS on app_users table to protect user roles
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own record, super_admin can read all" ON app_users;
DROP POLICY IF EXISTS "Only super_admin can insert users" ON app_users;
DROP POLICY IF EXISTS "Restricted update access" ON app_users;
DROP POLICY IF EXISTS "Only super_admin can delete users" ON app_users;

-- Policy: Users can read their own record and super_admin can read all
CREATE POLICY "Users can read own record, super_admin can read all" ON app_users
    FOR SELECT USING (
        auth_user_id = auth.uid() OR is_super_admin()
    );

-- Policy: Only super_admin can insert new users
CREATE POLICY "Only super_admin can insert users" ON app_users
    FOR INSERT WITH CHECK (is_super_admin());

-- Policy: Users can update their own record, super_admin can update all
CREATE POLICY "Restricted update access" ON app_users
    FOR UPDATE USING (
        auth_user_id = auth.uid() OR is_super_admin()
    );

-- Policy: Only super_admin can delete users
CREATE POLICY "Only super_admin can delete users" ON app_users
    FOR DELETE USING (is_super_admin());

-- Grant necessary permissions
GRANT SELECT, UPDATE ON app_users TO authenticated;
GRANT INSERT, DELETE ON app_users TO authenticated; -- RLS will control the actual access

-- ============================================================================
-- VERIFICATION QUERIES (OPTIONAL - RUN AFTER SETUP TO TEST)
-- ============================================================================

-- Uncomment these to test after setup:
-- SELECT 'RLS Status:' as check_type, schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename IN ('products', 'app_users');
-- SELECT 'Policies:' as check_type, tablename, policyname, cmd FROM pg_policies WHERE tablename IN ('products', 'app_users');
-- SELECT 'My Role:' as check_type, current_user_role() as my_role, is_super_admin() as am_super_admin;
-- SELECT 'My User:' as check_type, auth_user_id, role FROM app_users WHERE auth_user_id = auth.uid();