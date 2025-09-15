-- Create storage bucket for attendance photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('attendance-photos', 'attendance-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Set up storage policy to allow public read access
CREATE POLICY "Public read access for attendance photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'attendance-photos');

-- Allow authenticated users to upload attendance photos
CREATE POLICY "Authenticated users can upload attendance photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'attendance-photos' AND auth.role() = 'authenticated');

-- Allow users to update their own attendance photos
CREATE POLICY "Users can update attendance photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'attendance-photos' AND auth.role() = 'authenticated');

-- Allow users to delete attendance photos (optional, for cleanup)
CREATE POLICY "Users can delete attendance photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'attendance-photos' AND auth.role() = 'authenticated');