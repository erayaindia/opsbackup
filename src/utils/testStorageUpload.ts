import { supabase } from '@/integrations/supabase/client';

export async function testStorageUpload() {
  try {
    console.log('🧪 Testing storage upload...');

    // Create a simple test file
    const testContent = 'This is a test file for invoice upload functionality';
    const testFile = new File([testContent], 'test-invoice.txt', {
      type: 'text/plain',
      lastModified: Date.now()
    });

    console.log('🧪 Test file created:', {
      name: testFile.name,
      size: testFile.size,
      type: testFile.type
    });

    // Try to upload to the inventory-docs bucket
    const { data, error } = await supabase.storage
      .from('inventory-docs')
      .upload(`test/test-${Date.now()}.txt`, testFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Test upload failed:', error);
      console.error('❌ Error details:', {
        message: error.message,
        statusCode: (error as any).statusCode,
        error: (error as any).error
      });
      return false;
    }

    console.log('✅ Test upload successful:', data);

    // Try to get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('inventory-docs')
      .getPublicUrl(data.path);

    console.log('✅ Public URL generated:', publicUrl);

    // Try to delete the test file
    const { error: deleteError } = await supabase.storage
      .from('inventory-docs')
      .remove([data.path]);

    if (deleteError) {
      console.warn('⚠️ Failed to delete test file:', deleteError);
    } else {
      console.log('✅ Test file cleaned up successfully');
    }

    return true;
  } catch (error) {
    console.error('❌ Test upload error:', error);
    return false;
  }
}

// Function to call from console
(window as any).testStorageUpload = testStorageUpload;