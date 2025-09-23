-- ============================================================================
-- CONTENT CREATORS DATABASE SCHEMA FOR SUPABASE
-- ============================================================================
-- Table: content_creators
-- Storage Bucket: content-creators
-- Created: 2025-09-23
-- Updated: 2025-09-23
-- ============================================================================

-- ============================================================================
-- OPTION 1: DROP AND RECREATE TABLE (USE THIS IF YOU WANT TO START FRESH)
-- WARNING: This will delete all existing data in content_creators table
-- ============================================================================

-- Uncomment the following lines if you want to recreate the table
/*
DROP TABLE IF EXISTS content_creators CASCADE;
DROP TRIGGER IF EXISTS update_content_creators_updated_at ON content_creators;
DROP FUNCTION IF EXISTS update_updated_at_column();
*/

-- ============================================================================
-- OPTION 2: CREATE TABLE ONLY IF IT DOESN'T EXIST
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_creators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- ========================================================================
    -- BASIC INFORMATION
    -- ========================================================================
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'Videographer', 'Editor', 'UGC Creator', 'Influencer', 'Agency',
        'Model', 'Designer', 'Photographer', 'Copywriter', 'Voice Actor', 'Animator'
    )),
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Onboarding', 'Paused', 'Rejected')),
    availability VARCHAR(20) NOT NULL DEFAULT 'Free' CHECK (availability IN ('Free', 'Limited', 'Busy')),
    rating DECIMAL(3,1) NOT NULL DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 10),

    -- ========================================================================
    -- PROFILE INFORMATION
    -- ========================================================================
    profile_picture_url TEXT,
    location VARCHAR(255),
    timezone VARCHAR(100),

    -- ========================================================================
    -- CONTACT INFORMATION
    -- ========================================================================
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    whatsapp VARCHAR(20) NOT NULL,
    preferred_communication VARCHAR(20) NOT NULL DEFAULT 'WhatsApp' CHECK (preferred_communication IN ('Email', 'WhatsApp', 'Phone')),

    -- ========================================================================
    -- SOCIAL MEDIA LINKS (JSONB)
    -- Structure: {"portfolio": "url", "instagram": "url", "youtube": "url"}
    -- ========================================================================
    social_links JSONB DEFAULT '{}',

    -- ========================================================================
    -- SHIPPING ADDRESS (JSONB)
    -- Structure: {"fullAddress": "string", "pincode": "string", "phone": "string", "alternatePhone": "string"}
    -- ========================================================================
    shipping_address JSONB NOT NULL DEFAULT '{}',

    -- ========================================================================
    -- RATE CARD & PAYMENT INFORMATION
    -- ========================================================================
    base_rate DECIMAL(10,2) NOT NULL,
    currency VARCHAR(5) DEFAULT 'INR',
    rate_unit VARCHAR(20) NOT NULL DEFAULT 'per deliverable' CHECK (rate_unit IN ('per hour', 'per project', 'per deliverable', 'per day')),
    payment_cycle VARCHAR(20) NOT NULL DEFAULT 'Per Project' CHECK (payment_cycle IN ('Per Project', 'Monthly', 'Weekly', 'Custom')),
    advance_percentage INTEGER DEFAULT 0 CHECK (advance_percentage >= 0 AND advance_percentage <= 100),

    -- ========================================================================
    -- PERFORMANCE METRICS (JSONB)
    -- Structure: {"avg_turnaround_days": 0, "quality_history": [], "total_projects": 0, "completion_rate": 0, "avg_rating": 0}
    -- ========================================================================
    performance_metrics JSONB DEFAULT '{
        "avg_turnaround_days": 0,
        "quality_history": [],
        "total_projects": 0,
        "completion_rate": 0,
        "avg_rating": 0
    }',

    -- ========================================================================
    -- PROJECT MANAGEMENT (JSONB ARRAYS)
    -- ========================================================================
    current_projects JSONB DEFAULT '[]',
    past_projects JSONB DEFAULT '[]',

    -- ========================================================================
    -- PAYMENT HISTORY (JSONB ARRAY)
    -- Structure: [{"id": "string", "amount": 0, "currency": "INR", "status": "Pending", "dueDate": "date", "description": "string"}]
    -- ========================================================================
    payments JSONB DEFAULT '[]',

    -- ========================================================================
    -- COLLABORATION NOTES
    -- ========================================================================
    strengths TEXT[],
    weaknesses TEXT[],
    special_requirements TEXT[],
    internal_notes TEXT,

    -- ========================================================================
    -- METADATA
    -- ========================================================================
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(255) DEFAULT 'admin'
);

-- ============================================================================
-- OPTION 3: ALTER EXISTING TABLE (ADD MISSING COLUMNS)
-- Use this if you want to keep existing data and just add new columns
-- ============================================================================

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add profile_picture_url if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_creators' AND column_name = 'profile_picture_url') THEN
        ALTER TABLE content_creators ADD COLUMN profile_picture_url TEXT;
    END IF;

    -- Add social_links if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_creators' AND column_name = 'social_links') THEN
        ALTER TABLE content_creators ADD COLUMN social_links JSONB DEFAULT '{}';
    END IF;

    -- Add shipping_address if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_creators' AND column_name = 'shipping_address') THEN
        ALTER TABLE content_creators ADD COLUMN shipping_address JSONB DEFAULT '{}';
    END IF;

    -- Add performance_metrics if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_creators' AND column_name = 'performance_metrics') THEN
        ALTER TABLE content_creators ADD COLUMN performance_metrics JSONB DEFAULT '{
            "avg_turnaround_days": 0,
            "quality_history": [],
            "total_projects": 0,
            "completion_rate": 0,
            "avg_rating": 0
        }';
    END IF;

    -- Add current_projects if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_creators' AND column_name = 'current_projects') THEN
        ALTER TABLE content_creators ADD COLUMN current_projects JSONB DEFAULT '[]';
    END IF;

    -- Add past_projects if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_creators' AND column_name = 'past_projects') THEN
        ALTER TABLE content_creators ADD COLUMN past_projects JSONB DEFAULT '[]';
    END IF;

    -- Add payments if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_creators' AND column_name = 'payments') THEN
        ALTER TABLE content_creators ADD COLUMN payments JSONB DEFAULT '[]';
    END IF;

    -- Add other missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_creators' AND column_name = 'strengths') THEN
        ALTER TABLE content_creators ADD COLUMN strengths TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_creators' AND column_name = 'weaknesses') THEN
        ALTER TABLE content_creators ADD COLUMN weaknesses TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_creators' AND column_name = 'special_requirements') THEN
        ALTER TABLE content_creators ADD COLUMN special_requirements TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_creators' AND column_name = 'internal_notes') THEN
        ALTER TABLE content_creators ADD COLUMN internal_notes TEXT;
    END IF;

    -- Add currency column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_creators' AND column_name = 'currency') THEN
        ALTER TABLE content_creators ADD COLUMN currency VARCHAR(5) DEFAULT 'INR';
    END IF;

    -- Add advance_percentage if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_creators' AND column_name = 'advance_percentage') THEN
        ALTER TABLE content_creators ADD COLUMN advance_percentage INTEGER DEFAULT 0 CHECK (advance_percentage >= 0 AND advance_percentage <= 100);
    END IF;

END $$;

-- ============================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_content_creators_email ON content_creators(email);
CREATE INDEX IF NOT EXISTS idx_content_creators_role ON content_creators(role);
CREATE INDEX IF NOT EXISTS idx_content_creators_status ON content_creators(status);
CREATE INDEX IF NOT EXISTS idx_content_creators_availability ON content_creators(availability);
CREATE INDEX IF NOT EXISTS idx_content_creators_rating ON content_creators(rating);
CREATE INDEX IF NOT EXISTS idx_content_creators_created_at ON content_creators(created_at);
CREATE INDEX IF NOT EXISTS idx_content_creators_name ON content_creators(name);

-- ============================================================================
-- 3. CREATE TRIGGER FOR AUTO-UPDATING TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_content_creators_updated_at
    BEFORE UPDATE ON content_creators
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. CREATE STORAGE BUCKET FOR PROFILE PICTURES
-- ============================================================================

-- Create storage bucket only if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'content-creators', 'content-creators', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'content-creators'
);

-- ============================================================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE content_creators ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. CREATE RLS POLICIES FOR CONTENT_CREATORS TABLE
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read content_creators" ON content_creators;
DROP POLICY IF EXISTS "Allow authenticated users to insert content_creators" ON content_creators;
DROP POLICY IF EXISTS "Allow authenticated users to update content_creators" ON content_creators;
DROP POLICY IF EXISTS "Allow authenticated users to delete content_creators" ON content_creators;

-- Policy for authenticated users to read all creators
CREATE POLICY "Allow authenticated users to read content_creators"
ON content_creators FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy for authenticated users to insert creators
CREATE POLICY "Allow authenticated users to insert content_creators"
ON content_creators FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated users to update creators
CREATE POLICY "Allow authenticated users to update content_creators"
ON content_creators FOR UPDATE
USING (auth.role() = 'authenticated');

-- Policy for authenticated users to delete creators
CREATE POLICY "Allow authenticated users to delete content_creators"
ON content_creators FOR DELETE
USING (auth.role() = 'authenticated');

-- ============================================================================
-- 7. CREATE STORAGE BUCKET POLICIES
-- ============================================================================

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads to content-creators bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to content-creators bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to content-creators bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from content-creators bucket" ON storage.objects;

-- Allow authenticated users to upload profile pictures
CREATE POLICY "Allow authenticated uploads to content-creators bucket"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'content-creators'
    AND auth.role() = 'authenticated'
);

-- Allow public access to view profile pictures
CREATE POLICY "Allow public access to content-creators bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'content-creators');

-- Allow authenticated users to update their uploads
CREATE POLICY "Allow authenticated updates to content-creators bucket"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'content-creators'
    AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their uploads
CREATE POLICY "Allow authenticated deletes from content-creators bucket"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'content-creators'
    AND auth.role() = 'authenticated'
);

-- ============================================================================
-- 8. SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ============================================================================

-- Uncomment the following to insert sample data
/*
INSERT INTO content_creators (
    name, role, status, availability, rating, email, phone, whatsapp,
    preferred_communication, social_links, shipping_address, base_rate,
    rate_unit, payment_cycle
) VALUES
(
    'John Doe',
    'Videographer',
    'Active',
    'Free',
    8.5,
    'john.doe@example.com',
    '+91 9876543210',
    '+91 9876543210',
    'WhatsApp',
    '{"portfolio": "https://johndoe.com", "instagram": "@johndoe"}',
    '{"fullAddress": "123 Main St, Mumbai, Maharashtra", "pincode": "400001", "phone": "+91 9876543210", "alternatePhone": "+91 9876543211"}',
    5000.00,
    'per project',
    'Per Project'
),
(
    'Jane Smith',
    'UGC Creator',
    'Active',
    'Limited',
    9.2,
    'jane.smith@example.com',
    '+91 8765432109',
    '+91 8765432109',
    'WhatsApp',
    '{"portfolio": "https://janesmith.com", "instagram": "@janesmith", "youtube": "@janesmith"}',
    '{"fullAddress": "456 Creator Lane, Delhi, Delhi", "pincode": "110001", "phone": "+91 8765432109"}',
    3000.00,
    'per deliverable',
    'Per Project'
),
(
    'Mike Johnson',
    'Editor',
    'Active',
    'Free',
    7.8,
    'mike.johnson@example.com',
    '+91 7654321098',
    '+91 7654321098',
    'Email',
    '{"portfolio": "https://mikejohnson.com"}',
    '{"fullAddress": "789 Edit Street, Bangalore, Karnataka", "pincode": "560001", "phone": "+91 7654321098"}',
    2500.00,
    'per hour',
    'Weekly'
);
*/

-- ============================================================================
-- 9. HELPFUL QUERIES FOR DEVELOPMENT
-- ============================================================================

-- Query to get all creators with their basic info
-- SELECT id, name, role, status, availability, rating, email, created_at FROM content_creators ORDER BY created_at DESC;

-- Query to get creators by role
-- SELECT * FROM content_creators WHERE role = 'UGC Creator';

-- Query to get creators by availability
-- SELECT * FROM content_creators WHERE availability = 'Free' AND status = 'Active';

-- Query to get top-rated creators
-- SELECT * FROM content_creators WHERE rating >= 8.0 ORDER BY rating DESC;

-- Query to get creator social links
-- SELECT name, social_links FROM content_creators WHERE social_links IS NOT NULL;

-- Query to get creator shipping addresses
-- SELECT name, shipping_address FROM content_creators;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================