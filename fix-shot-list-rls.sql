-- Fix shot_list Row Level Security policies
-- Run this in Supabase SQL editor

-- Check current RLS policies on shot_list
SELECT tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'shot_list';

-- Drop existing restrictive policies if they exist and create proper ones
DO $$
BEGIN
    -- Drop existing policies that might be too restrictive
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shot_list' AND policyname = 'Users can edit their content') THEN
        DROP POLICY "Users can edit their content" ON shot_list;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shot_list' AND policyname = 'Users can view content details') THEN
        DROP POLICY "Users can view content details" ON shot_list;
    END IF;
END $$;

-- Create proper RLS policies for shot_list
-- Allow all authenticated users to view shot list items
CREATE POLICY "Users can view shot list items" ON shot_list
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to insert shot list items for content they created or are assigned to
CREATE POLICY "Users can insert shot list items" ON shot_list
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM content_items 
            WHERE content_items.id = shot_list.content_id 
            AND (content_items.created_by = auth.uid() OR 
                 auth.uid() IN (
                     SELECT user_id FROM content_team_assignments 
                     WHERE content_id = content_items.id
                 ))
        )
    );

-- Allow users to update shot list items for content they created or are assigned to
CREATE POLICY "Users can update shot list items" ON shot_list
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM content_items 
            WHERE content_items.id = shot_list.content_id 
            AND (content_items.created_by = auth.uid() OR 
                 auth.uid() IN (
                     SELECT user_id FROM content_team_assignments 
                     WHERE content_id = content_items.id
                 ))
        )
    );

-- Allow users to delete shot list items for content they created or are assigned to
CREATE POLICY "Users can delete shot list items" ON shot_list
    FOR DELETE USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM content_items 
            WHERE content_items.id = shot_list.content_id 
            AND (content_items.created_by = auth.uid() OR 
                 auth.uid() IN (
                     SELECT user_id FROM content_team_assignments 
                     WHERE content_id = content_items.id
                 ))
        )
    );

-- Verify the new policies were created
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'shot_list'
ORDER BY policyname;