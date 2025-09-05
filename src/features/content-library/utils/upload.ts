import { AssetCardData, UploadFile } from "../types";

/**
 * Upload utility functions for file handling and processing
 */

/**
 * Generate a unique ID for uploads
 */
export const generateUploadId = (): string => {
  return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Check if a file is a video based on MIME type
 */
export const isVideoFile = (file: File): boolean => {
  return file.type.startsWith('video/');
};

/**
 * Check if a file is an image based on MIME type
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * Validate if file is supported (video or image)
 */
export const isSupportedFile = (file: File): boolean => {
  return isVideoFile(file) || isImageFile(file);
};

/**
 * Generate video thumbnail from first frame
 */
export const generateVideoThumbnail = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      // Fallback to file URL if canvas not available
      const fallbackUrl = URL.createObjectURL(file);
      resolve(fallbackUrl);
      return;
    }

    video.preload = 'metadata';
    video.muted = true;
    video.crossOrigin = 'anonymous';

    // Set a timeout to avoid hanging
    const timeout = setTimeout(() => {
      video.src = '';
      video.load();
      // Return fallback URL on timeout
      const fallbackUrl = URL.createObjectURL(file);
      resolve(fallbackUrl);
    }, 5000);

    video.onloadedmetadata = () => {
      // Set canvas dimensions to video dimensions with max limits
      const maxWidth = 400;
      const maxHeight = 300;
      let { videoWidth, videoHeight } = video;
      
      // Scale down if too large
      if (videoWidth > maxWidth || videoHeight > maxHeight) {
        const ratio = Math.min(maxWidth / videoWidth, maxHeight / videoHeight);
        videoWidth = Math.floor(videoWidth * ratio);
        videoHeight = Math.floor(videoHeight * ratio);
      }
      
      canvas.width = videoWidth;
      canvas.height = videoHeight;

      // Seek to 1 second or 10% of duration, whichever is smaller
      const seekTime = Math.min(1, video.duration * 0.1);
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      try {
        clearTimeout(timeout);
        
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to blob and create URL
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            resolve(url);
          } else {
            // Fallback to file URL if blob creation fails
            const fallbackUrl = URL.createObjectURL(file);
            resolve(fallbackUrl);
          }
        }, 'image/jpeg', 0.8);

        // Clean up
        video.src = '';
        video.load();
      } catch (error) {
        clearTimeout(timeout);
        // Fallback to file URL if drawing fails
        const fallbackUrl = URL.createObjectURL(file);
        resolve(fallbackUrl);
      }
    };

    video.onerror = (error) => {
      clearTimeout(timeout);
      console.warn('Video thumbnail generation failed, using fallback:', error);
      // Return fallback URL instead of rejecting
      const fallbackUrl = URL.createObjectURL(file);
      resolve(fallbackUrl);
    };

    // Load the video file
    try {
      video.src = URL.createObjectURL(file);
    } catch (error) {
      clearTimeout(timeout);
      // If URL creation fails, return a generic video icon
      resolve('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE1IDEwTDQuNTUzLTIuMjc2QTEgMSAwIDAwMyA4LjYxOFY2Ljc2NEExIDEgMCAwMDEuNDQ3IDcuNjE4TDE1IDE0TTUtMkgyQTIgMiAwIDAwMDAyVjEyQTIgMiAwIDAwMiAxNEg4QTIgMiAwIDAwMTAgMTJWMkEyIDIgMCAwMDggMFoiIGZpbGw9IiM2MzYzNzAiLz4KPC9zdmc+');
    }
  });
};

/**
 * Generate image thumbnail/preview URL
 */
export const generateImageThumbnail = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    resolve(url);
  });
};

/**
 * Get video duration in seconds
 */
export const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    
    video.preload = 'metadata';
    video.muted = true;

    // Set a timeout to avoid hanging
    const timeout = setTimeout(() => {
      video.src = '';
      video.load();
      // Return default duration on timeout
      resolve(30); // Default 30 seconds
    }, 3000);

    video.onloadedmetadata = () => {
      clearTimeout(timeout);
      const duration = video.duration || 30; // Fallback to 30 seconds
      resolve(isFinite(duration) ? duration : 30);
      video.src = '';
      video.load();
    };

    video.onerror = () => {
      clearTimeout(timeout);
      console.warn('Could not load video to get duration, using default');
      // Return default duration instead of rejecting
      resolve(30); // Default 30 seconds
    };

    try {
      video.src = URL.createObjectURL(file);
    } catch (error) {
      clearTimeout(timeout);
      console.warn('Could not create URL for video duration detection');
      resolve(30); // Default 30 seconds
    }
  });
};

/**
 * Get image dimensions
 */
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };

    img.onerror = () => {
      reject(new Error('Could not load image to get dimensions'));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Determine aspect ratio from dimensions
 */
export const getAspectRatioFromDimensions = (width: number, height: number): AssetCardData['aspect'] => {
  const ratio = width / height;
  
  // 16:9 (1.77)
  if (ratio >= 1.7 && ratio <= 1.85) return "16:9";
  
  // 9:16 (0.56)
  if (ratio >= 0.5 && ratio <= 0.65) return "9:16";
  
  // 1:1 (1.0)
  if (ratio >= 0.9 && ratio <= 1.1) return "1:1";
  
  // 4:5 (0.8)
  if (ratio >= 0.75 && ratio <= 0.85) return "4:5";
  
  // Default to 16:9 for other ratios
  return "16:9";
};

/**
 * Generate asset filename with product and date
 */
export const generateAssetFilename = (originalName: string, productName: string): string => {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const extension = originalName.split('.').pop() || '';
  const baseName = originalName.replace(/\.[^/.]+$/, ""); // Remove extension
  
  // Clean product name for filename
  const cleanProduct = productName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  
  return `${cleanProduct}_${timestamp}_${baseName}.${extension}`;
};

/**
 * Check for duplicate filenames
 */
export const checkForDuplicates = (fileName: string, existingAssets: AssetCardData[]): AssetCardData | null => {
  return existingAssets.find(asset => asset.title.toLowerCase() === fileName.toLowerCase()) || null;
};

/**
 * Generate unique filename to avoid duplicates
 */
export const generateUniqueFilename = (fileName: string, existingAssets: AssetCardData[]): string => {
  let uniqueName = fileName;
  let counter = 2;
  
  while (checkForDuplicates(uniqueName, existingAssets)) {
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
    const extension = fileName.split('.').pop() || '';
    uniqueName = `${nameWithoutExt} (${counter}).${extension}`;
    counter++;
  }
  
  return uniqueName;
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * Validate file size (max 100MB for videos, 10MB for images)
 */
export const validateFileSize = (file: File): boolean => {
  const maxVideoSize = 100 * 1024 * 1024; // 100MB
  const maxImageSize = 10 * 1024 * 1024;  // 10MB
  
  if (isVideoFile(file)) {
    return file.size <= maxVideoSize;
  }
  
  if (isImageFile(file)) {
    return file.size <= maxImageSize;
  }
  
  return false;
};

/**
 * Process uploaded file and create asset data with Supabase storage
 */
export const processUploadedFile = async (
  file: File, 
  productName: string,
  uploadId: string
): Promise<AssetCardData> => {
  const { ContentLibraryService } = await import('../services/contentLibraryService');
  const { supabase } = await import('@/integrations/supabase/client');
  
  const isVideo = isVideoFile(file);
  let durationSec: number | undefined;
  let aspect: AssetCardData['aspect'] = "16:9";
  let dimensions: { width: number; height: number } | undefined;

  // Get user ID
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  // Generate file path for storage
  const filePath = ContentLibraryService.generateFilePath(file.name, userId);
  
  // Upload main file to Supabase storage
  const fileUrl = await ContentLibraryService.uploadFile(file, filePath);

  // Generate thumbnail
  let thumbnailUrl: string | undefined;
  if (isVideo) {
    // Get duration with fallback
    try {
      durationSec = await getVideoDuration(file);
    } catch (error) {
      console.warn('Failed to get video duration, using default:', error);
      durationSec = 30; // Default fallback
    }
    
    // Generate video thumbnail and upload to storage
    try {
      const thumbnailDataUrl = await generateVideoThumbnail(file);
      if (thumbnailDataUrl && !thumbnailDataUrl.startsWith('data:image/svg')) {
        try {
          // Convert data URL to blob
          const response = await fetch(thumbnailDataUrl);
          const thumbnailBlob = await response.blob();
          
          const thumbnailPath = ContentLibraryService.generateThumbnailPath(filePath);
          thumbnailUrl = await ContentLibraryService.uploadThumbnail(thumbnailBlob, thumbnailPath);
        } catch (uploadError) {
          console.warn('Failed to upload video thumbnail, using video file as fallback:', uploadError);
          thumbnailUrl = fileUrl; // Use video file as thumbnail fallback
        }
      } else {
        console.warn('Invalid thumbnail generated, using video file as fallback');
        thumbnailUrl = fileUrl; // Use video file as thumbnail fallback
      }
    } catch (thumbnailError) {
      console.warn('Failed to generate video thumbnail, using video file as fallback:', thumbnailError);
      thumbnailUrl = fileUrl; // Use video file as thumbnail fallback
    }
  } else {
    try {
      dimensions = await getImageDimensions(file);
      aspect = getAspectRatioFromDimensions(dimensions.width, dimensions.height);
    } catch (error) {
      console.warn('Failed to get image dimensions, using defaults:', error);
      dimensions = { width: 1920, height: 1080 }; // Default dimensions
      aspect = "16:9"; // Default aspect ratio
    }
    
    // For images, the main file serves as the thumbnail
    thumbnailUrl = fileUrl;
  }

  // Create database record
  const dbRecord = await ContentLibraryService.createAsset({
    name: file.name,
    file_url: fileUrl,
    file_type: isVideo ? 'video' : 'image',
    file_size: file.size,
    mime_type: file.type,
    thumbnail_url: thumbnailUrl,
    duration_seconds: durationSec,
    dimensions,
    aspect_ratio: aspect,
    status: 'Ready to Test',
    version_number: 1,
    product_name: productName,
    performance_tags: [],
    comment_markers: [],
    tags: []
  });

  // Return AssetCardData format
  return {
    id: dbRecord.id,
    title: dbRecord.name,
    productName: dbRecord.product_name,
    stage: dbRecord.status as AssetCardData['stage'],
    isVideo: dbRecord.file_type === 'video',
    thumbnailUrl: dbRecord.thumbnail_url || '',
    videoUrl: dbRecord.file_type === 'video' ? dbRecord.file_url : undefined,
    aspect: dbRecord.aspect_ratio as AssetCardData['aspect'] || '16:9',
    performance: dbRecord.performance_tags as AssetCardData['performance'] || [],
    createdBy: dbRecord.uploaded_by,
    createdAt: new Date(dbRecord.uploaded_at),
    durationSec: dbRecord.duration_seconds,
    commentMarkers: dbRecord.comment_markers || [],
    versionLabel: dbRecord.version_label,
  };
};