import { supabase } from '@/integrations/supabase/client';
import { AssetCardData } from '../types';
import JSZip from 'jszip';

export interface ContentLibraryRecord {
  id: string;
  name: string;
  description?: string;
  file_url: string;
  file_type: 'image' | 'video';
  file_size: number;
  mime_type: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  dimensions?: { width: number; height: number };
  aspect_ratio?: '16:9' | '9:16' | '1:1' | '4:5';
  status: 'Live' | 'Ready to Test' | 'Re-edit' | 'Archived';
  version_number: number;
  version_label?: string;
  uploaded_by?: string;
  uploaded_at: string;
  updated_at: string;
  campaign_name?: string;
  campaign_description?: string;
  product_name: string;
  product_category?: string;
  performance_tags?: string[];
  comment_markers?: number[];
  tags?: string[];
  comments?: any[];
  activity_log?: any[];
  metadata?: any;
}

/**
 * Content Library Service
 * Handles all database operations for the content library
 */
export class ContentLibraryService {
  /**
   * Fetch all content library items
   */
  static async fetchAssets(): Promise<AssetCardData[]> {
    try {
      const { data, error } = await supabase
        .from('content_library')
        .select('*')
        .is('deleted_at', null)
        .order('uploaded_at', { ascending: false });

      if (error) {
        // Check if it's a table doesn't exist error
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          console.warn('Content library table does not exist. Please run the SQL setup script.');
          return []; // Return empty array instead of throwing
        }
        console.error('Error fetching content library assets:', error);
        throw error;
      }

      return data?.map(this.mapRecordToAssetCard) || [];
    } catch (error) {
      console.error('Error in fetchAssets:', error);
      // Check if it's a network or connection error
      if (error instanceof Error && (
        error.message.includes('NetworkError') || 
        error.message.includes('Failed to fetch') ||
        error.message.includes('does not exist')
      )) {
        console.warn('Database connection issue or table not set up. Returning empty results.');
        return [];
      }
      throw error;
    }
  }

  /**
   * Create a new content library item
   */
  static async createAsset(assetData: Partial<ContentLibraryRecord>): Promise<ContentLibraryRecord> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Prepare clean data for insertion
      const insertData = {
        name: assetData.name,
        description: assetData.description,
        file_url: assetData.file_url,
        file_type: assetData.file_type,
        file_size: assetData.file_size,
        mime_type: assetData.mime_type,
        thumbnail_url: assetData.thumbnail_url,
        duration_seconds: assetData.duration_seconds ? Math.round(assetData.duration_seconds) : null,
        dimensions: assetData.dimensions,
        aspect_ratio: assetData.aspect_ratio,
        status: assetData.status || 'Ready to Test',
        version_number: assetData.version_number || 1,
        version_label: assetData.version_label,
        product_name: assetData.product_name,
        product_category: assetData.product_category,
        performance_tags: assetData.performance_tags || [],
        comment_markers: assetData.comment_markers || [],
        tags: assetData.tags || [],
        uploaded_by: user?.id
      };

      console.log('Inserting asset data:', insertData);

      const { data, error } = await supabase
        .from('content_library')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Error creating content library asset:', error);
        console.error('Error details:', error.details, error.hint, error.message);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createAsset:', error);
      throw error;
    }
  }

  /**
   * Update an existing content library item
   */
  static async updateAsset(id: string, updates: Partial<ContentLibraryRecord>): Promise<ContentLibraryRecord> {
    try {
      const { data, error } = await supabase
        .from('content_library')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating content library asset:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateAsset:', error);
      throw error;
    }
  }

  /**
   * Soft delete an asset
   */
  static async deleteAsset(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('content_library')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error deleting content library asset:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteAsset:', error);
      throw error;
    }
  }

  /**
   * Bulk delete multiple assets (soft delete)
   */
  static async bulkDeleteAssets(ids: string[]): Promise<{ success: string[], failed: string[] }> {
    const results = { success: [], failed: [] };
    
    try {
      console.log('Starting bulk delete for assets:', ids);
      
      if (!ids || ids.length === 0) {
        console.warn('No IDs provided for bulk delete');
        return results;
      }

      const { data, error } = await supabase
        .from('content_library')
        .update({ deleted_at: new Date().toISOString() })
        .in('id', ids)
        .select('id');

      console.log('Supabase response - data:', data, 'error:', error);

      if (error) {
        console.error('Error bulk deleting content library assets:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        // If bulk operation fails, mark all as failed
        results.failed = [...ids];
        return results;
      }

      // Track which ones succeeded
      const deletedIds = data?.map(item => item.id) || [];
      results.success = deletedIds;
      results.failed = ids.filter(id => !deletedIds.includes(id));

      console.log('Bulk delete completed:', {
        requested: ids.length,
        success: results.success.length,
        failed: results.failed.length,
        successIds: results.success,
        failedIds: results.failed
      });

      return results;

    } catch (error) {
      console.error('Exception in bulkDeleteAssets:', error);
      results.failed = [...ids];
      return results;
    }
  }

  /**
   * Bulk download multiple assets as a ZIP file
   */
  static async bulkDownloadAssets(
    ids: string[], 
    onProgress?: (progress: { current: number; total: number; fileName: string }) => void
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Bulk downloading assets:', ids);

      // Fetch asset details
      const { data: assets, error } = await supabase
        .from('content_library')
        .select('id, name, file_url, file_type')
        .in('id', ids)
        .is('deleted_at', null);

      if (error) {
        console.error('Error fetching assets for download:', error);
        return { success: false, error: error.message };
      }

      if (!assets || assets.length === 0) {
        return { success: false, error: 'No assets found to download' };
      }

      const zip = new JSZip();
      let downloadedCount = 0;

      // Download and add each file to the zip
      for (const asset of assets) {
        try {
          onProgress?.({ 
            current: downloadedCount + 1, 
            total: assets.length, 
            fileName: asset.name 
          });

          console.log(`Downloading ${asset.name} from ${asset.file_url}`);
          
          const response = await fetch(asset.file_url);
          if (!response.ok) {
            console.warn(`Failed to download ${asset.name}: ${response.statusText}`);
            continue;
          }

          const fileBlob = await response.blob();
          
          // Add file to zip with a clean filename
          const cleanFileName = asset.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          zip.file(cleanFileName, fileBlob);
          
          downloadedCount++;
        } catch (error) {
          console.warn(`Error downloading ${asset.name}:`, error);
          continue;
        }
      }

      if (downloadedCount === 0) {
        return { success: false, error: 'Failed to download any files' };
      }

      // Generate the ZIP file
      console.log('Generating ZIP file...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Create download link
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `content_library_${new Date().toISOString().split('T')[0]}_${downloadedCount}_files.zip`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up object URL
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);

      console.log(`Successfully downloaded ${downloadedCount} files as ZIP`);
      return { success: true };

    } catch (error) {
      console.error('Error in bulkDownloadAssets:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error during download' 
      };
    }
  }

  /**
   * Search assets by query
   */
  static async searchAssets(query: string): Promise<AssetCardData[]> {
    try {
      const { data, error } = await supabase
        .from('content_library')
        .select('*')
        .is('deleted_at', null)
        .textSearch('search_vector', query)
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Error searching content library assets:', error);
        throw error;
      }

      return data?.map(this.mapRecordToAssetCard) || [];
    } catch (error) {
      console.error('Error in searchAssets:', error);
      throw error;
    }
  }

  /**
   * Upload file to Supabase storage
   */
  static async uploadFile(file: File, path: string): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from('content-library')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading file to storage:', error);
        throw error;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('content-library')
        .getPublicUrl(data.path);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadFile:', error);
      throw error;
    }
  }

  /**
   * Upload thumbnail to Supabase storage
   */
  static async uploadThumbnail(thumbnailBlob: Blob, path: string): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from('content-library')
        .upload(path, thumbnailBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        });

      if (error) {
        console.error('Error uploading thumbnail to storage:', error);
        throw error;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('content-library')
        .getPublicUrl(data.path);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadThumbnail:', error);
      throw error;
    }
  }

  /**
   * Generate unique file path for storage
   */
  static generateFilePath(fileName: string, userId?: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2);
    const extension = fileName.split('.').pop();
    const baseName = fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, '_');
    
    return `${userId || 'anonymous'}/${timestamp}_${randomString}_${baseName}.${extension}`;
  }

  /**
   * Generate unique thumbnail path for storage
   */
  static generateThumbnailPath(originalPath: string): string {
    const pathWithoutExt = originalPath.replace(/\.[^/.]+$/, "");
    return `${pathWithoutExt}_thumb.jpg`;
  }

  /**
   * Clean up filename for display by removing file extension and UUID parts
   */
  private static cleanDisplayName(filename: string): string {
    if (!filename) return '';
    
    // Remove file extension
    let cleanName = filename.replace(/\.[^/.]+$/, '');
    
    // Remove UUID patterns (32 character hex strings)
    cleanName = cleanName.replace(/[a-f0-9]{32}/gi, '');
    
    // Remove timestamp patterns (13 digit numbers)
    cleanName = cleanName.replace(/\b\d{13}\b/g, '');
    
    // Remove random string patterns (underscore followed by alphanumeric)
    cleanName = cleanName.replace(/_[a-z0-9]{9}_/gi, '_');
    
    // Remove multiple underscores and clean up
    cleanName = cleanName.replace(/_+/g, ' ').trim();
    
    // Remove leading/trailing underscores or dashes
    cleanName = cleanName.replace(/^[-_\s]+|[-_\s]+$/g, '');
    
    // If the name is too short or empty after cleaning, use original filename without extension
    if (cleanName.length < 3) {
      cleanName = filename.replace(/\.[^/.]+$/, '');
    }
    
    return cleanName || 'Untitled';
  }

  /**
   * Map database record to AssetCardData
   */
  private static mapRecordToAssetCard(record: ContentLibraryRecord): AssetCardData {
    return {
      id: record.id,
      title: ContentLibraryService.cleanDisplayName(record.name),
      productName: record.product_name,
      stage: record.status as AssetCardData['stage'],
      isVideo: record.file_type === 'video',
      thumbnailUrl: record.thumbnail_url || '',
      videoUrl: record.file_type === 'video' ? record.file_url : undefined,
      aspect: record.aspect_ratio as AssetCardData['aspect'] || '16:9',
      performance: record.performance_tags as AssetCardData['performance'] || [],
      createdBy: record.uploaded_by,
      createdAt: new Date(record.uploaded_at),
      durationSec: record.duration_seconds,
      commentMarkers: record.comment_markers || [],
      versionLabel: record.version_label,
    };
  }
}