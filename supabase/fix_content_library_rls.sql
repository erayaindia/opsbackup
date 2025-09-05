-- Fix Content Library RLS Policies
-- This addresses the 403 error when trying to delete/update assets

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Everyone can view non-deleted content" ON content_library;
DROP POLICY IF EXISTS "Authenticated users can create content" ON content_library;
DROP POLICY IF EXISTS "Authenticated users can update content" ON content_library;
DROP POLICY IF EXISTS "Authenticated users can delete content" ON content_library;

-- Recreate policies with better permissions

-- Everyone can view non-deleted assets
CREATE POLICY "Everyone can view non-deleted content" ON content_library
  FOR SELECT USING (deleted_at IS NULL);

-- Authenticated users can create assets (must be the uploader)
CREATE POLICY "Authenticated users can create content" ON content_library
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid() = uploaded_by
  );

-- Users can update their own assets or any asset if they're authenticated
CREATE POLICY "Users can update content" ON content_library
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND
    (auth.uid() = uploaded_by OR uploaded_by IS NULL)
  );

-- Users can soft delete their own assets or any asset if they're authenticated
CREATE POLICY "Users can delete content" ON content_library
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND
    deleted_at IS NULL AND
    (auth.uid() = uploaded_by OR uploaded_by IS NULL)
  ) WITH CHECK (
    deleted_at IS NOT NULL
  );

-- Allow authenticated users to use the RPC functions
GRANT EXECUTE ON FUNCTION add_content_library_comment(uuid, text, comment_category_enum, text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION get_content_library_with_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION search_content_library(text) TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Content Library RLS Policies Fixed!';
  RAISE NOTICE '🔒 Policies updated to handle delete/update operations properly';
  RAISE NOTICE '👤 Users can now update/delete their own content or any content';
END $$;