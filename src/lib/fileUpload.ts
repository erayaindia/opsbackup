import { supabase } from '@/integrations/supabase/client';

export interface FileUploadResult {
  url: string;
  path: string;
  size: number;
  name: string;
}

export async function uploadInvoiceFile(file: File, movementId: string): Promise<FileUploadResult> {
  console.log('🚀 uploadInvoiceFile called with:', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    movementId
  });

  try {
    // Alert to make sure this function is being called
    alert('🚀 Upload function called! Check console for details.');

    // Skip bucket check for now since we know it exists
    console.log('🚀 Skipping bucket check - we know inventory-docs exists');

    // Generate a unique filename with movement ID and timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    const fileName = `${movementId}_${timestamp}.${fileExtension}`;
    const filePath = `invoices/${fileName}`;

    console.log('🚀 Generated file path:', filePath);

    // Upload file to Supabase Storage
    console.log('🚀 Uploading to Supabase Storage bucket: inventory-docs');
    console.log('🚀 File path:', filePath);
    console.log('🚀 File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });

    const { data, error } = await supabase.storage
      .from('inventory-docs')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    console.log('🚀 Upload response - data:', data);
    console.log('🚀 Upload response - error:', error);

    if (error) {
      console.error('❌ File upload error:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error properties:', Object.keys(error));
      alert(`❌ Supabase upload error: ${error.message || 'Unknown error'}`);
      throw new Error(`Failed to upload file: ${error.message || 'Unknown storage error'}`);
    }

    console.log('✅ File uploaded successfully to:', data.path);

    // Get public URL
    console.log('🚀 Getting public URL...');
    const { data: { publicUrl } } = supabase.storage
      .from('inventory-docs')
      .getPublicUrl(data.path);

    console.log('✅ Public URL generated:', publicUrl);

    const result = {
      url: publicUrl,
      path: data.path,
      size: file.size,
      name: file.name
    };

    console.log('✅ File upload complete:', result);
    return result;
  } catch (error) {
    console.error('❌ Error uploading invoice file:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    alert(`❌ Upload failed: ${error.message}`);
    throw error;
  }
}

export async function deleteInvoiceFile(filePath: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from('inventory-docs')
      .remove([filePath]);

    if (error) {
      console.error('File deletion error:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  } catch (error) {
    console.error('Error deleting invoice file:', error);
    throw error;
  }
}