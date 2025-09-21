-- SQL commands to create the product-files storage bucket in Supabase

-- 1. First create the product_files table
CREATE TABLE IF NOT EXISTS product_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  file_size BIGINT,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  caption TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_files_product_id ON product_files(product_id);
CREATE INDEX IF NOT EXISTS idx_product_files_display_order ON product_files(product_id, display_order);
CREATE INDEX IF NOT EXISTS idx_product_files_primary ON product_files(product_id, is_primary);

-- Enable RLS
ALTER TABLE product_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for the table
CREATE POLICY "Enable read access for authenticated users" ON product_files
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON product_files
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON product_files
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON product_files
FOR DELETE USING (auth.role() = 'authenticated');

-- 2. Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-files',
  'product-files',
  true,
  52428800, -- 50MB in bytes
  ARRAY[
    -- Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    -- Videos
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    -- Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    -- Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed'
  ]
);

-- 3. Create RLS policies for the storage bucket

-- Allow authenticated users to view files
CREATE POLICY "Allow authenticated users to view files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'product-files' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-files' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to update their files
CREATE POLICY "Allow authenticated users to update files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-files' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their files
CREATE POLICY "Allow authenticated users to delete files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-files' AND
  auth.role() = 'authenticated'
);

-- 4. Optional: If migrating from existing product_images table
-- UNCOMMENT ONLY if you have an existing product_images table to migrate

-- INSERT INTO product_files (
--   id, product_id, file_url, file_name, file_type, file_size,
--   display_order, is_primary, caption, uploaded_at, uploaded_by
-- )
-- SELECT
--   id, product_id, image_url as file_url,
--   SPLIT_PART(image_url, '/', -1) as file_name,
--   'image/jpeg' as file_type, -- Default, adjust as needed
--   0 as file_size, -- Will need to be updated separately
--   display_order, is_primary, caption, uploaded_at, uploaded_by
-- FROM product_images;