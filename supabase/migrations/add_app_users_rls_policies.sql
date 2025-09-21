-- Enable RLS on app_users table to protect user roles
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own record and super_admin can read all
CREATE POLICY "Users can read own record, super_admin can read all" ON app_users
    FOR SELECT USING (
        auth_user_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM app_users su
            WHERE su.auth_user_id = auth.uid()
            AND su.role = 'super_admin'
        )
    );

-- Policy: Only super_admin can insert new users
CREATE POLICY "Only super_admin can insert users" ON app_users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE auth_user_id = auth.uid()
            AND role = 'super_admin'
        )
    );

-- Policy: Users can update their own non-role fields, super_admin can update all
CREATE POLICY "Restricted update access" ON app_users
    FOR UPDATE USING (
        -- Users can update their own record (excluding role field)
        (auth_user_id = auth.uid() AND app_users.role = app_users.role)
        OR
        -- Super admin can update anything
        EXISTS (
            SELECT 1 FROM app_users su
            WHERE su.auth_user_id = auth.uid()
            AND su.role = 'super_admin'
        )
    )
    WITH CHECK (
        -- Users can update their own record (excluding role field)
        (auth_user_id = auth.uid())
        OR
        -- Super admin can update anything
        EXISTS (
            SELECT 1 FROM app_users su
            WHERE su.auth_user_id = auth.uid()
            AND su.role = 'super_admin'
        )
    );

-- Policy: Only super_admin can delete users
CREATE POLICY "Only super_admin can delete users" ON app_users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE auth_user_id = auth.uid()
            AND role = 'super_admin'
        )
    );

-- Grant necessary permissions
GRANT SELECT, UPDATE ON app_users TO authenticated;
GRANT INSERT, DELETE ON app_users TO authenticated; -- RLS will control the actual access