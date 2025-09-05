-- Migration: Add new fields to shot_list table
-- Description: Add location, props, talent, and lighting_notes columns; remove overlays
-- Date: 2025-01-15

-- ========================================
-- UP MIGRATION (Apply Changes)
-- ========================================

-- Add new columns to shot_list table
ALTER TABLE shot_list 
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS props TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
ADD COLUMN IF NOT EXISTS talent TEXT,
ADD COLUMN IF NOT EXISTS lighting_notes TEXT;

-- Update RLS policies to include new columns (if RLS is enabled)
-- The existing policies should automatically apply to new columns,
-- but we'll explicitly ensure they're covered

-- Check if RLS is enabled and update policies if needed
-- Note: This assumes existing policies use (*) or similar broad column access

-- Optional: Add indexes for better query performance on new columns
CREATE INDEX IF NOT EXISTS idx_shot_list_location ON shot_list(location) WHERE location IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shot_list_talent ON shot_list(talent) WHERE talent IS NOT NULL;

-- Optional: Add check constraint for props array
-- ALTER TABLE shot_list ADD CONSTRAINT check_props_not_null CHECK (props IS NOT NULL);

-- Note: We're not dropping the 'overlays' column to maintain backward compatibility
-- If you want to drop it later, uncomment the following line:
-- ALTER TABLE shot_list DROP COLUMN IF EXISTS overlays;

-- ========================================
-- DOWN MIGRATION (Reverse Changes)
-- ========================================

/*
-- To reverse this migration, run the following commands:

-- Drop the new columns
ALTER TABLE shot_list DROP COLUMN IF EXISTS location;
ALTER TABLE shot_list DROP COLUMN IF EXISTS props;
ALTER TABLE shot_list DROP COLUMN IF EXISTS talent;
ALTER TABLE shot_list DROP COLUMN IF EXISTS lighting_notes;

-- Drop indexes
DROP INDEX IF EXISTS idx_shot_list_location;
DROP INDEX IF EXISTS idx_shot_list_talent;

-- If you dropped overlays column in the up migration, restore it:
-- ALTER TABLE shot_list ADD COLUMN overlays TEXT;

*/

-- ========================================
-- VALIDATION QUERIES
-- ========================================

-- Verify the migration was applied correctly
DO $$
BEGIN
    -- Check if new columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shot_list' AND column_name = 'location'
    ) THEN
        RAISE EXCEPTION 'Migration failed: location column not created';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shot_list' AND column_name = 'props'
    ) THEN
        RAISE EXCEPTION 'Migration failed: props column not created';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shot_list' AND column_name = 'talent'
    ) THEN
        RAISE EXCEPTION 'Migration failed: talent column not created';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shot_list' AND column_name = 'lighting_notes'
    ) THEN
        RAISE EXCEPTION 'Migration failed: lighting_notes column not created';
    END IF;
    
    RAISE NOTICE 'Migration completed successfully! New columns added to shot_list table.';
END
$$;

-- Display updated table structure for verification
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'shot_list'
ORDER BY ordinal_position;