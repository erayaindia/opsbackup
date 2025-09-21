-- First, let's see all DELETE policies on products table
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'products' AND cmd = 'DELETE';

-- Remove the conflicting policy (try different possible names)
DROP POLICY IF EXISTS "Authenticated users can delete products" ON products;
DROP POLICY IF EXISTS "Enable delete access for all authenticated users" ON products;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON products;
DROP POLICY IF EXISTS "delete_policy" ON products;

-- Verify only the super_admin policy remains
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'products' AND cmd = 'DELETE';