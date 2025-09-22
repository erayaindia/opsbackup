// Upload utility for file handling in Rich Editor
// TODO: Replace with actual Supabase implementation when ready

export interface UploadResult {
  url: string;
  name: string;
  size: number;
  type: string;
}

// Mock implementation using createObjectURL
export async function uploadFile(file: File): Promise<UploadResult> {
  // Simulate upload delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

  // Create blob URL for preview
  const url = URL.createObjectURL(file);

  return {
    url,
    name: file.name,
    size: file.size,
    type: file.type
  };
}

// TODO: Supabase implementation (uncomment and configure when ready)
/*
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function uploadFile(file: File): Promise<UploadResult> {
  // Generate unique filename
  const uuid = crypto.randomUUID();
  const filename = `files/${uuid}-${file.name}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(filename, file, { upsert: false });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('uploads')
    .getPublicUrl(filename);

  return {
    url: publicUrl,
    name: file.name,
    size: file.size,
    type: file.type
  };
}
*/

// Utility functions
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getMimePrimary(mime: string): 'image' | 'video' | 'audio' | 'pdf' | 'text' | 'office' | 'other' {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime === 'application/pdf') return 'pdf';
  if (mime.startsWith('text/') || mime === 'application/json') return 'text';
  if (
    mime.startsWith('application/vnd.') ||
    mime === 'application/msword' ||
    mime.startsWith('application/vnd.openxmlformats-')
  ) return 'office';
  return 'other';
}

export function getFileIcon(mime: string): string {
  const type = getMimePrimary(mime);

  switch (type) {
    case 'image': return '🖼️';
    case 'video': return '🎥';
    case 'audio': return '🎵';
    case 'pdf': return '📄';
    case 'text': return '📝';
    case 'office': return '📊';
    default: return '📎';
  }
}