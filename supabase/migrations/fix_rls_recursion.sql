-- FIX RLS RECURSION ISSUE
-- This removes the problematic recursive policies and creates a working RLS setup

-- ============================================================================
-- STEP 1: DISABLE RLS ON APP_USERS TO BREAK RECURSION
-- ============================================================================

-- First, disable RLS on app_users to break the infinite recursion
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;

-- Drop all app_users policies that cause recursion
DROP POLICY IF EXISTS "Users can read own record, super_admin can read all" ON app_users;
DROP POLICY IF EXISTS "Only super_admin can insert users" ON app_users;
DROP POLICY IF EXISTS "Restricted update access" ON app_users;
DROP POLICY IF EXISTS "Only super_admin can delete users" ON app_users;

-- ============================================================================
-- STEP 2: CREATE FIXED HELPER FUNCTION (NO RECURSION)
-- ============================================================================

-- Create a simple helper function that works without RLS on app_users
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;

-- ============================================================================
-- STEP 3: SETUP PRODUCTS TABLE RLS (THIS IS WHAT WE ACTUALLY NEED)
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

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON products TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES (RUN THESE TO TEST)
-- ============================================================================

-- Test the function
SELECT is_super_admin() as am_i_super_admin;

-- Check your user role directly (bypassing RLS since it's disabled)
SELECT auth_user_id, role, full_name
FROM app_users
WHERE auth_user_id = auth.uid();

-- Check RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('products', 'app_users');

-- Check policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'products';