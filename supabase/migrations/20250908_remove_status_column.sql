-- Remove status column from app_users table
-- This completely removes the status field from the database

-- Check if app_users table exists and remove status column
DO $$ 
BEGIN
  -- Check if the table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'app_users' AND table_schema = 'public') THEN
    
    -- Check if status column exists
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'app_users' AND column_name = 'status' AND table_schema = 'public') THEN
      
      -- Drop the status column
      ALTER TABLE public.app_users DROP COLUMN IF EXISTS status;
      
      RAISE NOTICE 'Status column removed from app_users table';
    ELSE
      RAISE NOTICE 'Status column does not exist in app_users table';
    END IF;
    
  ELSE
    RAISE NOTICE 'app_users table does not exist, skipping status column removal';
  END IF;
END $$;