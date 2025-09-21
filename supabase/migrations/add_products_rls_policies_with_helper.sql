-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

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

-- Policy: Only super_admin can DELETE products (using helper function)
CREATE POLICY "Enable delete for super_admin only" ON products
    FOR DELETE USING (is_super_admin());

-- Grant permissions to authenticated users for other operations
GRANT SELECT, INSERT, UPDATE ON products TO authenticated;

-- Grant DELETE permission only to authenticated users (RLS will handle the role check)
GRANT DELETE ON products TO authenticated;