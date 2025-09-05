import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export interface ContentLibraryAsset {
  id: string;
  name: string;
  description?: string;
  file_url: string;
  file_type: 'image' | 'video' | 'doc';
  file_size?: number;
  mime_type?: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  dimensions?: Record<string, any>;
  status: 'Approved' | 'Pending' | 'Rejected' | 'Reshoot';
  version_number: number;
  uploaded_by: string;
  uploaded_at: string;
  updated_at?: string;
  campaign_name?: string;
  campaign_description?: string;
  product_name?: string;
  product_category?: string;
  tags: string[];
  comments: Comment[];
  activity_log: ActivityLogEntry[];
  metadata: Record<string, any>;
  deleted_at?: string;
}

export interface Comment {
  id: string;
  author_id: string;
  author_name: string;
  body: string;
  category: 'Fix' | 'Good' | 'Optional';
  timestamp_sec?: number;
  parent_id?: string;
  created_at: string;
  replies: Comment[];
}

export interface ActivityLogEntry {
  id: string;
  actor_id: string;
  actor_name: string;
  action: string;
  timestamp: string;
}

class ContentLibraryService {
  private readonly BUCKET_NAME = 'content-library';

  // Get all assets with stats
  async getAssetsWithStats(): Promise<ContentLibraryAsset[]> {
    try {
      const { data, error } = await supabase.rpc('get_content_library_with_stats');
      
      if (error) {
        console.error('Error fetching content library assets:', error);
        throw error;
      }

      // If no data or empty, return sample data for preview
      if (!data || data.length === 0) {
        console.log('No assets found, returning sample data for preview');
        return this.getSampleData();
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAssetsWithStats:', error);
      // Fallback to sample data if database error
      console.log('Database error, returning sample data for preview');
      return this.getSampleData();
    }
  }

  // Upload file with progress tracking
  async uploadAssetWithProgress(
    file: File,
    metadata?: {
      campaign_name?: string;
      product_name?: string;
      description?: string;
      tags?: string[];
    },
    onProgress?: (progress: number) => void,
    signal?: AbortSignal
  ): Promise<ContentLibraryAsset> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Generate unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log('Uploading file to storage with progress:', filePath);

      // Upload file to Supabase Storage with progress tracking
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      // Simulate progress for now since Supabase client doesn't expose upload progress
      // In a real implementation, you might use a custom upload with XMLHttpRequest
      if (onProgress) {
        for (let i = 0; i <= 100; i += 20) {
          onProgress(i);
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      // Get public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded file');
      }

      const publicUrl = publicUrlData.publicUrl;

      console.log('File uploaded successfully, creating database entry...');

      // Determine file type
      const fileType = this.getFileType(file.type);
      
      // Get file dimensions for images/videos if possible
      const dimensions = await this.getFileDimensions(file);

      // Create database entry
      const assetData = {
        name: file.name,
        description: metadata?.description || null,
        file_url: publicUrl,
        file_type: fileType,
        file_size: file.size,
        mime_type: file.type,
        thumbnail_url: fileType === 'image' ? publicUrl : null,
        dimensions: dimensions,
        status: 'Pending' as const,
        version_number: 1,
        uploaded_by: user.id,
        campaign_name: metadata?.campaign_name || null,
        product_name: metadata?.product_name || null,
        tags: metadata?.tags || [],
        comments: [],
        activity_log: [],
        metadata: {
          original_name: file.name,
          upload_path: filePath
        }
      };

      const { data: dbData, error: dbError } = await supabase
        .from('content_library')
        .insert(assetData)
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        // Clean up uploaded file if database insert fails
        await supabase.storage.from(this.BUCKET_NAME).remove([filePath]);
        throw dbError;
      }

      console.log('Asset created successfully:', dbData);
      return dbData;
    } catch (error) {
      console.error('Error uploading asset with progress:', error);
      throw error;
    }
  }

  // Upload file to storage and create database entry
  async uploadAsset(
    file: File,
    metadata?: {
      campaign_name?: string;
      product_name?: string;
      description?: string;
      tags?: string[];
    }
  ): Promise<ContentLibraryAsset> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Generate unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log('Uploading file to storage:', filePath);

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded file');
      }

      console.log('File uploaded successfully, creating database entry...');

      // Determine file type
      const fileType = this.getFileType(file.type);
      
      // Get file dimensions for images/videos if possible
      const dimensions = await this.getFileDimensions(file);

      // Create database entry
      const assetData = {
        name: file.name,
        description: metadata?.description || null,
        file_url: publicUrlData.publicUrl,
        file_type: fileType,
        file_size: file.size,
        mime_type: file.type,
        thumbnail_url: fileType === 'image' ? publicUrlData.publicUrl : null,
        dimensions: dimensions,
        status: 'Pending' as const,
        version_number: 1,
        uploaded_by: user.id,
        campaign_name: metadata?.campaign_name || null,
        product_name: metadata?.product_name || null,
        tags: metadata?.tags || [],
        comments: [],
        activity_log: [],
        metadata: {
          original_name: file.name,
          upload_path: filePath
        }
      };

      const { data: dbData, error: dbError } = await supabase
        .from('content_library')
        .insert(assetData)
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        // Clean up uploaded file if database insert fails
        await supabase.storage.from(this.BUCKET_NAME).remove([filePath]);
        throw dbError;
      }

      console.log('Asset created successfully:', dbData);
      return dbData;
    } catch (error) {
      console.error('Error uploading asset:', error);
      throw error;
    }
  }

  // Update asset status
  async updateAssetStatus(assetId: string, status: ContentLibraryAsset['status']): Promise<void> {
    try {
      // Handle sample data - don't try to update database
      if (assetId.startsWith('sample-')) {
        console.log('Updating sample asset status:', assetId, status);
        this.saveModifiedSampleAsset(assetId, { status });
        return; // Just return success for sample data
      }

      const { error } = await supabase
        .from('content_library')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', assetId);

      if (error) {
        console.error('Error updating asset status:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateAssetStatus:', error);
      throw error;
    }
  }

  // Delete asset (soft delete)
  async deleteAsset(assetId: string): Promise<void> {
    try {
      // Handle sample data - don't try to delete from database
      if (assetId.startsWith('sample-')) {
        console.log('Deleting sample asset:', assetId);
        this.addDeletedSampleAsset(assetId);
        return; // Just return success for sample data
      }

      // First check if the asset exists and get current user
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Try soft delete first (UPDATE approach)
      let { error } = await supabase
        .from('content_library')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', assetId)
        .is('deleted_at', null); // Only update if not already deleted

      // If soft delete fails due to RLS, try hard delete as fallback
      if (error && (error.code === '42501' || error.message?.includes('403'))) {
        console.log('Soft delete failed, attempting hard delete...');
        
        const { error: deleteError } = await supabase
          .from('content_library')
          .delete()
          .eq('id', assetId);
          
        error = deleteError; // Use the delete error if it exists
      }

      if (error) {
        console.error('Error deleting asset:', {
          error,
          details: error.details,
          hint: error.hint,
          code: error.code,
          assetId,
          userId: currentUser.id
        });
        
        // Provide more helpful error messages
        if (error.code === '42501' || error.message?.includes('403')) {
          throw new Error('You do not have permission to delete this asset. Please check your access rights.');
        }
        
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteAsset:', error);
      throw error;
    }
  }

  // Duplicate asset
  async duplicateAsset(assetId: string): Promise<ContentLibraryAsset> {
    try {
      // Handle sample data duplication
      if (assetId.startsWith('sample-')) {
        const sampleData = this.getSampleData();
        const originalAsset = sampleData.find(asset => asset.id === assetId);
        
        if (!originalAsset) {
          throw new Error('Sample asset not found');
        }

        // Create a duplicate of the sample asset with a new ID
        const duplicatedAsset: ContentLibraryAsset = {
          ...originalAsset,
          id: `sample-${Date.now()}`, // Generate unique sample ID
          name: `${originalAsset.name} (Copy)`,
          uploaded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          comments: [], // Reset comments for duplicate
          activity_log: [] // Reset activity log for duplicate
        };

        console.log('Duplicating sample asset:', duplicatedAsset);
        this.addSampleAsset(duplicatedAsset);
        return duplicatedAsset;
      }

      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get original asset from database
      const { data: originalAsset, error: fetchError } = await supabase
        .from('content_library')
        .select('*')
        .eq('id', assetId)
        .single();

      if (fetchError || !originalAsset) {
        throw new Error('Failed to fetch original asset');
      }

      // Create duplicate with new ID and updated name
      const duplicateData = {
        ...originalAsset,
        id: undefined, // Let database generate new ID
        name: `${originalAsset.name} (Copy)`,
        uploaded_by: user.id,
        uploaded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        comments: [], // Reset comments for duplicate
        activity_log: [] // Reset activity log for duplicate
      };

      const { data: duplicatedAsset, error: duplicateError } = await supabase
        .from('content_library')
        .insert(duplicateData)
        .select()
        .single();

      if (duplicateError) {
        console.error('Error duplicating asset:', duplicateError);
        throw duplicateError;
      }

      return duplicatedAsset;
    } catch (error) {
      console.error('Error in duplicateAsset:', error);
      throw error;
    }
  }

  // Add comment to asset
  async addComment(
    assetId: string,
    body: string,
    category: Comment['category'] = 'Fix',
    parentId?: string,
    timestampSec?: number
  ): Promise<string> {
    try {
      // Handle sample data - just return a mock comment ID
      if (assetId.startsWith('sample-')) {
        console.log('Adding comment to sample asset:', assetId, body);
        return `comment-${Date.now()}`; // Return mock comment ID
      }

      const { data, error } = await supabase.rpc('add_content_library_comment', {
        asset_id: assetId,
        comment_body: body,
        comment_category: category,
        parent_comment_id: parentId || null,
        timestamp_sec: timestampSec || null
      });

      if (error) {
        console.error('Error adding comment:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in addComment:', error);
      throw error;
    }
  }

  // Search assets
  async searchAssets(query: string): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('search_content_library', {
        search_query: query
      });

      if (error) {
        console.error('Error searching assets:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchAssets:', error);
      throw error;
    }
  }

  // Rename asset
  async renameAsset(assetId: string, newName: string): Promise<void> {
    try {
      // Handle sample data - don't try to update database
      if (assetId.startsWith('sample-')) {
        console.log('Renaming sample asset:', assetId, newName);
        this.saveModifiedSampleAsset(assetId, { name: newName });
        return; // Just return success for sample data
      }

      const { error } = await supabase
        .from('content_library')
        .update({ name: newName, updated_at: new Date().toISOString() })
        .eq('id', assetId);

      if (error) {
        console.error('Error renaming asset:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in renameAsset:', error);
      throw error;
    }
  }

  // Subscribe to real-time changes
  subscribeToChanges(callback: (payload: any) => void) {
    return supabase
      .channel('content_library_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content_library'
        },
        callback
      )
      .subscribe();
  }

  // Helper methods
  private async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  // Helper methods for sample data persistence
  private getDeletedSampleAssets(): string[] {
    try {
      const deleted = localStorage.getItem('deletedSampleAssets');
      return deleted ? JSON.parse(deleted) : [];
    } catch {
      return [];
    }
  }

  private addDeletedSampleAsset(assetId: string): void {
    try {
      const deleted = this.getDeletedSampleAssets();
      if (!deleted.includes(assetId)) {
        deleted.push(assetId);
        localStorage.setItem('deletedSampleAssets', JSON.stringify(deleted));
      }
    } catch (error) {
      console.error('Failed to save deleted sample asset:', error);
    }
  }

  private getModifiedSampleAssets(): Record<string, Partial<ContentLibraryAsset>> {
    try {
      const modified = localStorage.getItem('modifiedSampleAssets');
      return modified ? JSON.parse(modified) : {};
    } catch {
      return {};
    }
  }

  private saveModifiedSampleAsset(assetId: string, changes: Partial<ContentLibraryAsset>): void {
    try {
      const modified = this.getModifiedSampleAssets();
      modified[assetId] = { ...modified[assetId], ...changes };
      localStorage.setItem('modifiedSampleAssets', JSON.stringify(modified));
    } catch (error) {
      console.error('Failed to save modified sample asset:', error);
    }
  }

  private getAdditionalSampleAssets(): ContentLibraryAsset[] {
    try {
      const additional = localStorage.getItem('additionalSampleAssets');
      return additional ? JSON.parse(additional) : [];
    } catch {
      return [];
    }
  }

  private addSampleAsset(asset: ContentLibraryAsset): void {
    try {
      const additional = this.getAdditionalSampleAssets();
      additional.push(asset);
      localStorage.setItem('additionalSampleAssets', JSON.stringify(additional));
    } catch (error) {
      console.error('Failed to save additional sample asset:', error);
    }
  }

  // Public method to reset all sample data modifications (for testing)
  public resetSampleData(): void {
    try {
      localStorage.removeItem('deletedSampleAssets');
      localStorage.removeItem('modifiedSampleAssets');
      localStorage.removeItem('additionalSampleAssets');
      console.log('Sample data reset successfully');
    } catch (error) {
      console.error('Failed to reset sample data:', error);
    }
  }

  // Sample data for preview when database is empty
  private getSampleData(): ContentLibraryAsset[] {
    const sampleUserId = '00000000-0000-0000-0000-000000000000';
    const now = new Date().toISOString();
    
    const baseAssets = [
      {
        id: 'sample-1',
        name: 'Product Hero Banner.jpg',
        description: 'Main hero banner for summer campaign',
        file_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=800&fit=crop',
        file_type: 'image',
        file_size: 245760,
        mime_type: 'image/jpeg',
        thumbnail_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
        dimensions: { width: 1200, height: 800 },
        status: 'Approved',
        version_number: 1,
        uploaded_by: sampleUserId,
        uploaded_at: now,
        updated_at: now,
        campaign_name: 'Summer Sale 2024',
        product_name: 'Featured Products',
        tags: ['hero', 'banner', 'summer', 'sale'],
        comments: [
          {
            id: 'comment-1',
            author_id: sampleUserId,
            author_name: 'Design Team',
            body: 'Great composition! The colors really pop.',
            category: 'Good',
            created_at: now,
            replies: []
          }
        ],
        activity_log: [
          {
            id: 'activity-1',
            actor_id: sampleUserId,
            actor_name: 'Design Team',
            action: 'Asset approved',
            timestamp: now
          }
        ],
        metadata: { original_name: 'hero-banner-final.jpg' }
      },
      {
        id: 'sample-2',
        name: 'Product Demo Video.mp4',
        description: 'Product demonstration video for landing page',
        file_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        file_type: 'video',
        file_size: 15728640,
        mime_type: 'video/mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=300&fit=crop',
        duration_seconds: 90,
        dimensions: { width: 1920, height: 1080 },
        status: 'Pending',
        version_number: 1,
        uploaded_by: sampleUserId,
        uploaded_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        campaign_name: 'Product Launch',
        product_name: 'Premium Package',
        tags: ['video', 'demo', 'product', 'launch'],
        comments: [
          {
            id: 'comment-2',
            author_id: sampleUserId,
            author_name: 'Marketing Team',
            body: 'Can we make the intro shorter? Maybe cut the first 10 seconds.',
            category: 'Fix',
            timestamp_sec: 15,
            created_at: now,
            replies: []
          }
        ],
        activity_log: [
          {
            id: 'activity-2',
            actor_id: sampleUserId,
            actor_name: 'Marketing Team',
            action: 'Asset uploaded',
            timestamp: new Date(Date.now() - 86400000).toISOString()
          }
        ],
        metadata: { original_name: 'product-demo-v1.mp4' }
      },
      {
        id: 'sample-3',
        name: 'Brand Guidelines.pdf',
        description: 'Updated brand guidelines document',
        file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        file_type: 'doc',
        file_size: 1048576,
        mime_type: 'application/pdf',
        status: 'Approved',
        version_number: 2,
        uploaded_by: sampleUserId,
        uploaded_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        campaign_name: 'Brand Refresh',
        tags: ['brand', 'guidelines', 'documentation'],
        comments: [],
        activity_log: [
          {
            id: 'activity-3',
            actor_id: sampleUserId,
            actor_name: 'Brand Team',
            action: 'Asset approved',
            timestamp: new Date(Date.now() - 86400000).toISOString()
          }
        ],
        metadata: { original_name: 'brand-guidelines-v2.pdf' }
      },
      {
        id: 'sample-4',
        name: 'Social Media Carousel.jpg',
        description: 'Instagram carousel post for new collection',
        file_url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=1200&fit=crop',
        file_type: 'image',
        file_size: 189440,
        mime_type: 'image/jpeg',
        thumbnail_url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop',
        dimensions: { width: 1200, height: 1200 },
        status: 'Reshoot',
        version_number: 1,
        uploaded_by: sampleUserId,
        uploaded_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        campaign_name: 'New Collection Launch',
        product_name: 'Fashion Line',
        tags: ['social', 'instagram', 'carousel', 'fashion'],
        comments: [
          {
            id: 'comment-3',
            author_id: sampleUserId,
            author_name: 'Social Media Manager',
            body: 'The lighting needs improvement. Can we reshoot with better studio lighting?',
            category: 'Fix',
            created_at: now,
            replies: [
              {
                id: 'comment-3-reply',
                author_id: sampleUserId,
                author_name: 'Photography Team',
                body: 'Agreed, we can schedule a reshoot for tomorrow.',
                category: 'Good',
                created_at: now,
                replies: []
              }
            ]
          }
        ],
        activity_log: [
          {
            id: 'activity-4',
            actor_id: sampleUserId,
            actor_name: 'Social Media Manager',
            action: 'Status changed to Reshoot',
            timestamp: now
          }
        ],
        metadata: { original_name: 'social-carousel-v1.jpg' }
      }
    ];

    // Filter out deleted sample assets
    const deletedAssets = this.getDeletedSampleAssets();
    const filteredAssets = baseAssets.filter(asset => !deletedAssets.includes(asset.id));

    // Apply any modifications (like renames, status changes)
    const modifications = this.getModifiedSampleAssets();
    const modifiedAssets = filteredAssets.map(asset => {
      const mods = modifications[asset.id];
      return mods ? { ...asset, ...mods } : asset;
    });

    // Add any additional sample assets (like duplicated ones)
    const additionalAssets = this.getAdditionalSampleAssets();
    const allAdditionalAssets = additionalAssets.map(asset => {
      const mods = modifications[asset.id];
      return mods ? { ...asset, ...mods } : asset;
    });

    return [...modifiedAssets, ...allAdditionalAssets];
  }

  private getFileType(mimeType: string): 'image' | 'video' | 'doc' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'doc';
  }

  private async getFileDimensions(file: File): Promise<Record<string, any> | null> {
    if (file.type.startsWith('image/')) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.width, height: img.height });
        };
        img.onerror = () => resolve(null);
        img.src = URL.createObjectURL(file);
      });
    }
    return null;
  }
}

export const contentLibraryService = new ContentLibraryService();