import { supabase } from '@/integrations/supabase/client';

export async function checkStorageBucket() {
  try {
    console.log('🚀 Checking Supabase Storage buckets...');

    // List all buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return false;
    }

    console.log('📁 Available buckets:', buckets);

    // Check if inventory-docs bucket exists
    const inventoryDocsBucket = buckets?.find(bucket => bucket.id === 'inventory-docs');

    if (inventoryDocsBucket) {
      console.log('✅ inventory-docs bucket exists:', inventoryDocsBucket);

      // Try to list files in the bucket to test permissions
      const { data: files, error: filesError } = await supabase.storage
        .from('inventory-docs')
        .list();

      if (filesError) {
        console.error('❌ Error accessing inventory-docs bucket:', filesError);
        return false;
      }

      console.log('✅ Successfully accessed inventory-docs bucket. Files:', files);
      return true;
    } else {
      console.error('❌ inventory-docs bucket does not exist!');
      console.log('💡 Available buckets:', buckets?.map(b => b.id) || []);
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking storage bucket:', error);
    return false;
  }
}

// Utility to create the bucket if it doesn't exist
export async function createInventoryDocsBucket() {
  try {
    console.log('🚀 Creating inventory-docs bucket...');

    const { data, error } = await supabase.storage.createBucket('inventory-docs', {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
    });

    if (error) {
      console.error('❌ Error creating bucket:', error);
      return false;
    }

    console.log('✅ Bucket created successfully:', data);
    return true;
  } catch (error) {
    console.error('❌ Error creating bucket:', error);
    return false;
  }
}