-- RLS Policies for content_creators table
-- Choose one of the approaches below based on your security requirements

-- =============================================================================
-- APPROACH 1: AUTHENTICATED USERS CAN DO EVERYTHING (Recommended for development)
-- =============================================================================

-- Enable RLS on the table
ALTER TABLE content_creators ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to SELECT all creators
CREATE POLICY "Authenticated users can view all creators" ON content_creators
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to INSERT creators
CREATE POLICY "Authenticated users can create creators" ON content_creators
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to UPDATE all creators
CREATE POLICY "Authenticated users can update all creators" ON content_creators
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to DELETE all creators
CREATE POLICY "Authenticated users can delete all creators" ON content_creators
    FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================================================
-- APPROACH 2: COMPLETELY OPEN (No restrictions - for development/testing only)
-- =============================================================================

-- Uncomment these if you want to allow anyone (even anonymous users) to do everything
-- WARNING: Only use this for development/testing environments!

-- CREATE POLICY "Anyone can view all creators" ON content_creators
--     FOR SELECT USING (true);

-- CREATE POLICY "Anyone can create creators" ON content_creators
--     FOR INSERT WITH CHECK (true);

-- CREATE POLICY "Anyone can update all creators" ON content_creators
--     FOR UPDATE USING (true);

-- CREATE POLICY "Anyone can delete all creators" ON content_creators
--     FOR DELETE USING (true);

-- =============================================================================
-- APPROACH 3: USER-SPECIFIC ACCESS (More secure for production)
-- =============================================================================

-- If you want users to only manage their own creators (assuming created_by field exists):

-- CREATE POLICY "Users can view their own creators" ON content_creators
--     FOR SELECT USING (auth.uid()::text = created_by);

-- CREATE POLICY "Users can create their own creators" ON content_creators
--     FOR INSERT WITH CHECK (auth.uid()::text = created_by);

-- CREATE POLICY "Users can update their own creators" ON content_creators
--     FOR UPDATE USING (auth.uid()::text = created_by);

-- CREATE POLICY "Users can delete their own creators" ON content_creators
--     FOR DELETE USING (auth.uid()::text = created_by);

-- =============================================================================
-- APPROACH 4: ADMIN-ONLY ACCESS (Most secure)
-- =============================================================================

-- If you want only admin users to manage creators:
-- (This assumes you have a way to identify admin users, like a role in auth.jwt())

-- CREATE POLICY "Only admins can view creators" ON content_creators
--     FOR SELECT USING (
--         auth.jwt() ->> 'role' = 'admin' OR 
--         auth.jwt() ->> 'user_role' = 'admin'
--     );

-- CREATE POLICY "Only admins can create creators" ON content_creators
--     FOR INSERT WITH CHECK (
--         auth.jwt() ->> 'role' = 'admin' OR 
--         auth.jwt() ->> 'user_role' = 'admin'
--     );

-- CREATE POLICY "Only admins can update creators" ON content_creators
--     FOR UPDATE USING (
--         auth.jwt() ->> 'role' = 'admin' OR 
--         auth.jwt() ->> 'user_role' = 'admin'
--     );

-- CREATE POLICY "Only admins can delete creators" ON content_creators
--     FOR DELETE USING (
--         auth.jwt() ->> 'role' = 'admin' OR 
--         auth.jwt() ->> 'user_role' = 'admin'
--     );

-- =============================================================================
-- UTILITY COMMANDS
-- =============================================================================

-- To see current policies on the table:
-- SELECT * FROM pg_policies WHERE tablename = 'content_creators';

-- To drop all existing policies (use with caution):
-- DROP POLICY IF EXISTS "Authenticated users can view all creators" ON content_creators;
-- DROP POLICY IF EXISTS "Authenticated users can create creators" ON content_creators;
-- DROP POLICY IF EXISTS "Authenticated users can update all creators" ON content_creators;
-- DROP POLICY IF EXISTS "Authenticated users can delete all creators" ON content_creators;

-- To disable RLS entirely (not recommended for production):
-- ALTER TABLE content_creators DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RECOMMENDED FOR YOUR CURRENT SITUATION
-- =============================================================================
-- Use APPROACH 1 (Authenticated users can do everything) since you want easy deletion
-- and you're in development mode. This will allow your authenticated users to 
-- delete any creator from the database easily.