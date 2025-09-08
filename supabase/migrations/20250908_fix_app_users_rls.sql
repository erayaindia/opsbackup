-- Fix RLS policies for app_users table to ensure user updates work
-- This addresses the 404 error when updating users

-- Check if app_users table exists and add RLS policies
DO $$ 
BEGIN
  -- Check if the table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'app_users' AND table_schema = 'public') THEN
    
    -- Disable RLS temporarily to add policies safely
    ALTER TABLE public.app_users DISABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if any
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.app_users;
    DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.app_users;
    DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.app_users;
    DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.app_users;
    
    -- Create comprehensive RLS policies for app_users
    CREATE POLICY "Enable read access for authenticated users" 
    ON public.app_users FOR SELECT 
    TO authenticated 
    USING (true);

    CREATE POLICY "Enable insert access for authenticated users" 
    ON public.app_users FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

    CREATE POLICY "Enable update access for authenticated users" 
    ON public.app_users FOR UPDATE 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

    CREATE POLICY "Enable delete access for authenticated users" 
    ON public.app_users FOR DELETE 
    TO authenticated 
    USING (true);
    
    -- Re-enable RLS with proper policies in place
    ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'RLS policies added successfully to app_users table';
  ELSE
    RAISE NOTICE 'app_users table does not exist, skipping RLS setup';
  END IF;
END $$;