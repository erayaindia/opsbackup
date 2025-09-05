UPDATE storage.buckets 
SET public = true 
WHERE id = 'content-assets';

DROP POLICY IF EXISTS "Give users access to own folder 1oj01fe_0" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj01fe_1" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj01fe_2" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj01fe_3" ON storage.objects;

CREATE POLICY "Allow authenticated upload" ON storage.objects
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'content-assets');

CREATE POLICY "Allow public view" ON storage.objects
FOR SELECT 
TO public 
USING (bucket_id = 'content-assets');

CREATE POLICY "Allow authenticated delete" ON storage.objects
FOR DELETE 
TO authenticated 
USING (bucket_id = 'content-assets');

CREATE POLICY "Allow authenticated update" ON storage.objects
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'content-assets')
WITH CHECK (bucket_id = 'content-assets');

CREATE TABLE IF NOT EXISTS content_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    file_url TEXT NOT NULL,
    folder_type VARCHAR(20) CHECK (folder_type IN ('raw', 'selects', 'final')),
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE content_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view assets" ON content_assets;
CREATE POLICY "Users can view assets" ON content_assets
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can insert assets" ON content_assets;
CREATE POLICY "Users can insert assets" ON content_assets
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update assets" ON content_assets;
CREATE POLICY "Users can update assets" ON content_assets
    FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can delete assets" ON content_assets;
CREATE POLICY "Users can delete assets" ON content_assets
    FOR DELETE TO authenticated USING (true);