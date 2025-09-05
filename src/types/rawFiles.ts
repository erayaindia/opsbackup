export type RawFileStatus = 'pending' | 'approved' | 'rejected' | 'reshoot';

export type RawFileType = 'video' | 'image';

export interface RawFile {
  id: string;
  content_id: string;
  original_name: string;
  display_name: string;
  file_type: string; // MIME type like 'video/mp4', 'image/jpeg'
  file_size: number;
  file_url: string;
  status: RawFileStatus;
  upload_date: string;
  uploaded_by?: string;
  uploaded_by_name?: string; // Full name from profiles join
  notes?: string;
  thumbnail_url?: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number; // For videos
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface RawFileUpload {
  content_id: string;
  original_name: string;
  display_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  thumbnail_url?: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    [key: string]: any;
  };
}

export interface RawFileUpdate {
  display_name?: string;
  status?: RawFileStatus;
  notes?: string;
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  id?: string;
}

export interface RawFilesFilter {
  status?: RawFileStatus[];
  fileType?: RawFileType[];
  searchQuery?: string;
}

export interface RawFilesSortConfig {
  field: 'display_name' | 'upload_date' | 'file_size' | 'status';
  direction: 'asc' | 'desc';
}

// Helper function to determine file type from MIME type
export function getRawFileType(mimeType: string): RawFileType {
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('image/')) return 'image';
  return 'image'; // Default fallback
}

// Helper function to get user-friendly file type display name
export function getDisplayFileType(mimeType: string): string {
  const typeMap: Record<string, string> = {
    // Video types
    'video/mp4': 'MP4',
    'video/mov': 'MOV',
    'video/quicktime': 'MOV',
    'video/avi': 'AVI',
    'video/webm': 'WEBM',
    'video/mkv': 'MKV',
    // Image types
    'image/jpeg': 'JPG',
    'image/jpg': 'JPG',
    'image/png': 'PNG',
    'image/webp': 'WEBP',
    'image/gif': 'GIF',
    'image/bmp': 'BMP',
    'image/tiff': 'TIFF'
  };
  
  return typeMap[mimeType] || mimeType.split('/')[1]?.toUpperCase() || 'FILE';
}

// Helper function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper function to get status color
export function getStatusColor(status: RawFileStatus): string {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'approved': return 'bg-green-100 text-green-800 border-green-200';
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
    case 'reshoot': return 'bg-orange-100 text-orange-800 border-orange-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

// Helper function to get status icon
export function getStatusIcon(status: RawFileStatus): string {
  switch (status) {
    case 'pending': return '🟡';
    case 'approved': return '✅';
    case 'rejected': return '❌';
    case 'reshoot': return '🔄';
    default: return '⏳';
  }
}