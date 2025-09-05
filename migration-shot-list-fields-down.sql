-- DOWN MIGRATION: Remove new fields from shot_list table
-- Description: Remove location, props, talent, and lighting_notes columns
-- Date: 2025-01-15
-- CAUTION: This will permanently delete data in these columns!

-- ========================================
-- DOWN MIGRATION (Reverse Changes)
-- ========================================

-- Drop indexes first
DROP INDEX IF EXISTS idx_shot_list_location;
DROP INDEX IF EXISTS idx_shot_list_talent;

-- Drop the new columns (THIS WILL DELETE DATA!)
-- WARNING: Make sure to backup data before running this!
ALTER TABLE shot_list DROP COLUMN IF EXISTS location;
ALTER TABLE shot_list DROP COLUMN IF EXISTS props;
ALTER TABLE shot_list DROP COLUMN IF EXISTS talent;
ALTER TABLE shot_list DROP COLUMN IF EXISTS lighting_notes;

-- If you want to restore the overlays column that was removed in the up migration:
-- ALTER TABLE shot_list ADD COLUMN overlays TEXT;

-- ========================================
-- VALIDATION QUERIES
-- ========================================

-- Verify the down migration was applied correctly
DO $$
BEGIN
    -- Check if columns were removed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shot_list' AND column_name = 'location'
    ) THEN
        RAISE EXCEPTION 'Down migration failed: location column still exists';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shot_list' AND column_name = 'props'
    ) THEN
        RAISE EXCEPTION 'Down migration failed: props column still exists';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shot_list' AND column_name = 'talent'
    ) THEN
        RAISE EXCEPTION 'Down migration failed: talent column still exists';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shot_list' AND column_name = 'lighting_notes'
    ) THEN
        RAISE EXCEPTION 'Down migration failed: lighting_notes column still exists';
    END IF;
    
    RAISE NOTICE 'Down migration completed successfully! New columns removed from shot_list table.';
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