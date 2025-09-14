-- Create inventory-docs storage bucket for invoice uploads
-- This bucket will store invoices and other inventory-related documents

DO $$
BEGIN
    -- Create the bucket if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'inventory-docs') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'inventory-docs',
            'inventory-docs',
            true,
            10485760,  -- 10MB limit
            ARRAY[
                'application/pdf',
                'image/jpeg',
                'image/jpg',
                'image/png',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ]
        );
        RAISE NOTICE 'Created inventory-docs storage bucket';
    ELSE
        RAISE NOTICE 'inventory-docs bucket already exists';
    END IF;
END
$$;

-- Create storage policy to allow authenticated users to read files
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to view inventory docs' AND schemaname = 'storage' AND tablename = 'objects') THEN
        CREATE POLICY "Allow authenticated users to view inventory docs"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (bucket_id = 'inventory-docs');
        RAISE NOTICE 'Created read policy for inventory-docs bucket';
    ELSE
        RAISE NOTICE 'Read policy for inventory-docs bucket already exists';
    END IF;
END
$$;

-- Create storage policy to allow authenticated users to upload files
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to upload inventory docs' AND schemaname = 'storage' AND tablename = 'objects') THEN
        CREATE POLICY "Allow authenticated users to upload inventory docs"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'inventory-docs');
        RAISE NOTICE 'Created upload policy for inventory-docs bucket';
    ELSE
        RAISE NOTICE 'Upload policy for inventory-docs bucket already exists';
    END IF;
END
$$;

-- Create storage policy to allow authenticated users to delete their own files
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to delete inventory docs' AND schemaname = 'storage' AND tablename = 'objects') THEN
        CREATE POLICY "Allow authenticated users to delete inventory docs"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (bucket_id = 'inventory-docs');
        RAISE NOTICE 'Created delete policy for inventory-docs bucket';
    ELSE
        RAISE NOTICE 'Delete policy for inventory-docs bucket already exists';
    END IF;
END
$$;