import { supabase } from "@/integrations/supabase/client";
import { RawFile, RawFileUpload, RawFileUpdate } from "@/types/rawFiles";

export class RawFilesService {
  
  // Upload a raw file to storage and save metadata to database
  static async uploadRawFile(file: File, contentId: string): Promise<RawFile> {
    console.log('🚀 Starting raw file upload:', { fileName: file.name, contentId });
    
    try {
      // Get current user
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError || !userData.user) {
        throw new Error('User not authenticated');
      }

      // Generate unique file name to avoid conflicts
      const fileExtension = file.name.split('.').pop();
      const timestamp = Date.now();
      const uniqueFileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const storagePath = `${contentId}/${uniqueFileName}`;

      console.log('☁️ Uploading to storage:', storagePath);

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('raw-content-files')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Storage upload failed:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('raw-content-files')
        .getPublicUrl(storagePath);

      console.log('🌐 File uploaded to:', urlData.publicUrl);

      // Generate thumbnail for videos
      let thumbnailUrl: string | undefined;
      if (file.type.startsWith('video/')) {
        thumbnailUrl = await this.generateVideoThumbnail(file, contentId);
      }

      // Prepare metadata
      const metadata: any = {};
      if (file.type.startsWith('image/')) {
        // Get image dimensions (would need additional implementation)
        // For now, we'll skip this and add it later
      }

      // Save metadata to database
      const fileData: RawFileUpload = {
        content_id: contentId,
        original_name: file.name,
        display_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_url: urlData.publicUrl,
        thumbnail_url: thumbnailUrl,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined
      };

      console.log('💾 Saving metadata to database:', fileData);

      const { data: dbData, error: dbError } = await supabase
        .from('raw_files')
        .insert({
          ...fileData,
          uploaded_by: userData.user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (dbError) {
        console.error('❌ Database save failed:', dbError);
        // Clean up uploaded file if database save fails
        await supabase.storage
          .from('raw-content-files')
          .remove([storagePath]);
        throw new Error(`Database save failed: ${dbError.message}`);
      }

      console.log('✅ Raw file upload completed:', dbData);
      return dbData as RawFile;

    } catch (error) {
      console.error('❌ Raw file upload error:', error);
      throw error;
    }
  }

  // Get all raw files for a content ID with user information
  static async getRawFiles(contentId: string): Promise<RawFile[]> {
    console.log('📂 Loading raw files for content:', contentId);
    console.log('📊 Query details:', { table: 'raw_files', filter: 'content_id', value: contentId });

    try {
      // First, get the raw files
      const { data: filesData, error: filesError } = await supabase
        .from('raw_files')
        .select('*')
        .eq('content_id', contentId)
        .order('upload_date', { ascending: false });

      console.log('🔍 Raw files response:', { data: filesData, error: filesError });

      if (filesError) {
        console.error('❌ Error loading raw files:', filesError);
        throw new Error(`Failed to load raw files: ${filesError.message}`);
      }

      if (!filesData || filesData.length === 0) {
        console.log('📂 No raw files found for content:', contentId);
        return [];
      }

      // Get unique user IDs from the files
      const userIds = [...new Set(filesData.map(file => file.uploaded_by).filter(Boolean))];
      console.log('👥 User IDs to fetch:', userIds);

      let profilesData: any[] = [];
      if (userIds.length > 0) {
        // Fetch user profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        if (profilesError) {
          console.warn('⚠️ Error loading user profiles:', profilesError);
          // Continue without profiles if they don't exist or error occurs
        } else {
          profilesData = profiles || [];
        }
      }

      console.log('👤 Profiles fetched:', profilesData);

      // Transform data to include user full name
      const transformedData = filesData.map(file => {
        const userProfile = profilesData.find(profile => profile.id === file.uploaded_by);
        return {
          ...file,
          uploaded_by_name: userProfile?.full_name || userProfile?.email || file.uploaded_by,
          uploaded_by: file.uploaded_by // Keep original ID for compatibility
        };
      });

      console.log(`✅ Loaded ${transformedData?.length || 0} raw files from database`);
      console.log('📄 Files found:', transformedData?.map(f => ({ 
        id: f.id, 
        display_name: f.display_name, 
        content_id: f.content_id,
        uploaded_by_name: f.uploaded_by_name 
      })));
      
      return transformedData as RawFile[];

    } catch (error) {
      console.error('❌ getRawFiles error:', error);
      throw error;
    }
  }

  // Update file name (display name only)
  static async updateFileName(fileId: string, newDisplayName: string): Promise<void> {
    console.log('✏️ Updating file name:', { fileId, newDisplayName });

    try {
      const { error } = await supabase
        .from('raw_files')
        .update({ 
          display_name: newDisplayName,
          updated_at: new Date().toISOString()
        })
        .eq('id', fileId);

      if (error) {
        console.error('❌ Error updating file name:', error);
        throw new Error(`Failed to update file name: ${error.message}`);
      }

      console.log('✅ File name updated successfully');

    } catch (error) {
      console.error('❌ updateFileName error:', error);
      throw error;
    }
  }

  // Update file status and notes
  static async updateFileStatus(
    fileId: string, 
    status: RawFile['status'], 
    notes?: string
  ): Promise<void> {
    console.log('🔄 Updating file status:', { fileId, status, notes });

    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (notes !== undefined) {
        updateData.notes = notes;
      }

      const { error } = await supabase
        .from('raw_files')
        .update(updateData)
        .eq('id', fileId);

      if (error) {
        console.error('❌ Error updating file status:', error);
        throw new Error(`Failed to update file status: ${error.message}`);
      }

      console.log('✅ File status updated successfully');

    } catch (error) {
      console.error('❌ updateFileStatus error:', error);
      throw error;
    }
  }

  // Delete raw file from both storage and database
  static async deleteRawFile(fileId: string): Promise<void> {
    console.log('🗑️ Deleting raw file:', fileId);

    try {
      // First get the file info to know storage path
      const { data: fileData, error: fetchError } = await supabase
        .from('raw_files')
        .select('file_url, content_id, original_name')
        .eq('id', fileId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch file info: ${fetchError.message}`);
      }

      // Extract storage path from URL
      const urlParts = fileData.file_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const storagePath = `${fileData.content_id}/${fileName}`;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('raw-content-files')
        .remove([storagePath]);

      if (storageError) {
        console.warn('⚠️ Storage deletion warning:', storageError);
        // Don't throw error for storage deletion failures
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('raw_files')
        .delete()
        .eq('id', fileId);

      if (dbError) {
        console.error('❌ Database deletion failed:', dbError);
        throw new Error(`Failed to delete from database: ${dbError.message}`);
      }

      console.log('✅ Raw file deleted successfully');

    } catch (error) {
      console.error('❌ deleteRawFile error:', error);
      throw error;
    }
  }

  // Generate and upload video thumbnail
  static async generateVideoThumbnail(videoFile: File, contentId: string): Promise<string | undefined> {
    console.log('🎬 Generating video thumbnail for:', videoFile.name);

    return new Promise(async (resolve) => {
      try {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        video.addEventListener('loadedmetadata', () => {
          // Set canvas size - scale down large videos for smaller thumbnails
          const maxSize = 400; // Max width/height for thumbnail
          const aspectRatio = video.videoWidth / video.videoHeight;
          
          if (video.videoWidth > video.videoHeight) {
            canvas.width = Math.min(maxSize, video.videoWidth);
            canvas.height = canvas.width / aspectRatio;
          } else {
            canvas.height = Math.min(maxSize, video.videoHeight);
            canvas.width = canvas.height * aspectRatio;
          }
          
          // Seek to 1 second or 10% of video, whichever is smaller
          const seekTime = Math.min(1, video.duration * 0.1);
          video.currentTime = seekTime;
        });

        video.addEventListener('seeked', async () => {
          if (ctx) {
            try {
              // Draw video frame to canvas
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              
              // Convert to blob
              canvas.toBlob(async (blob) => {
                if (blob) {
                  try {
                    // Upload thumbnail to storage
                    const timestamp = Date.now();
                    const thumbnailPath = `${contentId}/thumbnails/${timestamp}_thumbnail.jpg`;
                    
                    const { data: uploadData, error: uploadError } = await supabase.storage
                      .from('raw-content-files')
                      .upload(thumbnailPath, blob, {
                        cacheControl: '3600',
                        upsert: false,
                        contentType: 'image/jpeg'
                      });

                    if (uploadError) {
                      console.warn('⚠️ Thumbnail upload failed:', uploadError);
                      resolve(undefined);
                      return;
                    }

                    // Get public URL for thumbnail
                    const { data: urlData } = supabase.storage
                      .from('raw-content-files')
                      .getPublicUrl(thumbnailPath);

                    console.log('✅ Video thumbnail uploaded:', urlData.publicUrl);
                    resolve(urlData.publicUrl);
                  } catch (error) {
                    console.warn('⚠️ Thumbnail upload error:', error);
                    resolve(undefined);
                  }
                } else {
                  resolve(undefined);
                }
              }, 'image/jpeg', 0.8);
            } catch (error) {
              console.warn('⚠️ Canvas drawing error:', error);
              resolve(undefined);
            }
          } else {
            resolve(undefined);
          }
        });

        video.addEventListener('error', () => {
          console.warn('⚠️ Video thumbnail generation failed');
          resolve(undefined);
        });

        // Add timeout to prevent hanging
        setTimeout(() => {
          console.warn('⚠️ Video thumbnail generation timeout');
          resolve(undefined);
        }, 10000);

        // Load the video file
        const url = URL.createObjectURL(videoFile);
        video.src = url;
        video.load();

        // Cleanup URL after some time
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 15000);

      } catch (error) {
        console.warn('⚠️ Video thumbnail error:', error);
        resolve(undefined);
      }
    });
  }

  // Bulk update file statuses
  static async bulkUpdateStatus(
    fileIds: string[], 
    status: RawFile['status'], 
    notes?: string
  ): Promise<void> {
    console.log('🔄 Bulk updating file statuses:', { fileIds, status });

    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (notes !== undefined) {
        updateData.notes = notes;
      }

      const { error } = await supabase
        .from('raw_files')
        .update(updateData)
        .in('id', fileIds);

      if (error) {
        console.error('❌ Error bulk updating statuses:', error);
        throw new Error(`Failed to bulk update statuses: ${error.message}`);
      }

      console.log('✅ Bulk status update completed');

    } catch (error) {
      console.error('❌ bulkUpdateStatus error:', error);
      throw error;
    }
  }

  // Validate file before upload
  static validateFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    const allowedTypes = [
      'video/mp4', 'video/mov', 'video/avi', 'video/quicktime',
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} not allowed. Please upload videos (MP4, MOV, AVI) or images (JPG, PNG, WEBP, GIF).`
      };
    }

    // Check file size (500MB limit)
    const maxSize = 500 * 1024 * 1024; // 500MB in bytes
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds the 500MB limit.`
      };
    }

    return { valid: true };
  }
}