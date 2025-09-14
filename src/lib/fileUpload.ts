import { supabase } from '@/integrations/supabase/client';

export interface FileUploadResult {
  url: string;
  path: string;
  size: number;
  name: string;
}

// Generic file upload function
async function uploadFileToStorage(file: File, movementId: string, folder: string): Promise<FileUploadResult> {
  try {
    // Generate a unique filename with movement ID and timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    const fileName = `${movementId}_${timestamp}.${fileExtension}`;
    const filePath = `${folder}/${fileName}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('inventory-docs')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Failed to upload file: ${error.message || 'Unknown storage error'}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('inventory-docs')
      .getPublicUrl(data.path);

    const result = {
      url: publicUrl,
      path: data.path,
      size: file.size,
      name: file.name
    };

    return result;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

// Specific function for invoice file uploads
export async function uploadInvoiceFile(file: File, movementId: string): Promise<FileUploadResult> {
  return uploadFileToStorage(file, movementId, 'invoices');
}

// Specific function for product image uploads
export async function uploadProductImage(file: File, movementId: string): Promise<FileUploadResult> {
  return uploadFileToStorage(file, movementId, 'product-images');
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