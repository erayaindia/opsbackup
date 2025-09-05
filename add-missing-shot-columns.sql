-- Add missing columns to shot_list table
-- Based on current columns: id, content_id, shot_number, shot_type, description, duration, 
-- location, equipment, notes, status, order_index, created_at, updated_at, action, camera, 
-- background, overlays, assignee_id, references, completed

-- ========================================
-- ADD MISSING COLUMNS
-- ========================================

-- Add the missing columns that we implemented in the UI
ALTER TABLE shot_list 
ADD COLUMN IF NOT EXISTS props TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
ADD COLUMN IF NOT EXISTS talent TEXT,
ADD COLUMN IF NOT EXISTS lighting_notes TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shot_list_props ON shot_list USING GIN(props);
CREATE INDEX IF NOT EXISTS idx_shot_list_talent ON shot_list(talent) WHERE talent IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shot_list_lighting_notes ON shot_list(lighting_notes) WHERE lighting_notes IS NOT NULL;

-- ========================================
-- VERIFY ALL COLUMNS EXIST
-- ========================================

-- Display all columns to verify structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'shot_list'
ORDER BY ordinal_position;

-- ========================================
-- VALIDATION
-- ========================================

DO $$
BEGIN
    -- Check all required columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shot_list' AND column_name = 'props') THEN
        RAISE EXCEPTION 'Missing column: props';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shot_list' AND column_name = 'talent') THEN
        RAISE EXCEPTION 'Missing column: talent';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shot_list' AND column_name = 'lighting_notes') THEN
        RAISE EXCEPTION 'Missing column: lighting_notes';
    END IF;
    
    RAISE NOTICE 'All required columns exist in shot_list table!';
END
$$;