import { supabase } from '@/integrations/supabase/client';

export interface TaskFileUploadResult {
  url: string;
  path: string;
  size: number;
  name: string;
}

async function uploadTaskFile(file: File, taskId: string, folder: string): Promise<TaskFileUploadResult> {
  try {
    // Generate a unique filename with task ID and timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'file';
    const fileName = `${taskId}_${timestamp}.${fileExtension}`;
    const filePath = `${folder}/${fileName}`;

    // Debug current user and task info
    const { data: { user } } = await supabase.auth.getUser();
    console.log('🔍 Upload Debug Info:');
    console.log('  - Auth User ID:', user?.id);
    console.log('  - Task ID:', taskId);
    console.log('  - File Path:', filePath);
    console.log('  - File Name:', fileName);

    // Check if user has a matching app_users record
    const { data: appUser } = await supabase
      .from('app_users')
      .select('id, role, auth_user_id')
      .eq('auth_user_id', user?.id)
      .single();
    console.log('  - App User:', appUser);

    // Check if task exists and is assigned to this user
    const { data: task } = await supabase
      .from('tasks')
      .select('id, assigned_to, title')
      .eq('id', taskId)
      .single();
    console.log('  - Task:', task);
    console.log('  - User assigned to task:', task?.assigned_to === appUser?.id);

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('task-evidence')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Failed to upload file: ${error.message || 'Unknown storage error'}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('task-evidence')
      .getPublicUrl(data.path);

    const result = {
      url: publicUrl,
      path: data.path,
      size: file.size,
      name: file.name
    };

    return result;
  } catch (error) {
    console.error('Error uploading task file:', error);
    throw error;
  }
}

export async function uploadTaskEvidence(file: File, taskId: string): Promise<TaskFileUploadResult> {
  return uploadTaskFile(file, taskId, 'evidence');
}

export async function uploadTaskPhoto(file: File, taskId: string): Promise<TaskFileUploadResult> {
  return uploadTaskFile(file, taskId, 'photos');
}

export async function deleteTaskFile(filePath: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from('task-evidence')
      .remove([filePath]);

    if (error) {
      console.error('File deletion error:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  } catch (error) {
    console.error('Error deleting task file:', error);
    throw error;
  }
}

// Helper function to validate file types for evidence
export function validateTaskFile(file: File, evidenceType: string): string | null {
  const maxSize = 50 * 1024 * 1024; // 50MB for videos, smaller files

  if (file.size > maxSize) {
    return 'File size must be less than 50MB';
  }

  switch (evidenceType) {
    case 'photo':
      if (!file.type.startsWith('image/')) {
        return 'Please upload an image file (JPG, PNG, GIF, WebP)';
      }
      break;
    case 'file':
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        // Video types
        'video/mp4',
        'video/avi',
        'video/quicktime', // .mov
        'video/x-msvideo', // .avi
        'video/x-ms-wmv', // .wmv
        'video/webm',
        'video/x-flv', // .flv
        'video/x-matroska', // .mkv
        'video/mp4' // .m4v
      ];
      if (!allowedTypes.includes(file.type)) {
        return 'Please upload a valid document (PDF, DOC, DOCX, XLS, XLSX, TXT, CSV), image, or video file';
      }
      break;
    default:
      break;
  }

  return null;
}

// Helper function to get file icon based on type
export function getFileIcon(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'pdf':
      return '📄';
    case 'doc':
    case 'docx':
      return '📝';
    case 'xls':
    case 'xlsx':
      return '📊';
    case 'txt':
      return '📄';
    case 'csv':
      return '📊';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return '🖼️';
    default:
      return '📎';
  }
}

// Helper function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}