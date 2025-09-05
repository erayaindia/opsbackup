-- Debug script to check shot_list table structure and test saving
-- Run this in Supabase SQL editor to debug the issue

-- 1. Check current shot_list table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'shot_list'
ORDER BY ordinal_position;

-- 2. Check if there are any existing shot_list records
SELECT COUNT(*) as total_records FROM shot_list;

-- 3. Check RLS policies on shot_list table
SELECT tablename, policyname, cmd, roles
FROM pg_policies 
WHERE tablename = 'shot_list';

-- 4. Test insert (replace with actual content_id from your database)
-- First, let's see what content_items exist
SELECT id, title FROM content_items LIMIT 5;