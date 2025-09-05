import { useState, useEffect, useCallback } from 'react';
import { contentLibraryService, ContentLibraryAsset } from '@/services/contentLibraryService';
import { useToast } from '@/hooks/use-toast';

interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

interface BatchUploadMetadata {
  campaign_name?: string;
  product_name?: string;
  description?: string;
  tags?: string[];
}

interface UseContentLibraryReturn {
  assets: ContentLibraryAsset[];
  loading: boolean;
  error: string | null;
  uploadAsset: (
    file: File,
    metadata?: BatchUploadMetadata
  ) => Promise<void>;
  batchUploadAssets: (
    files: File[],
    metadata?: BatchUploadMetadata
  ) => Promise<void>;
  updateAssetStatus: (assetId: string, status: ContentLibraryAsset['status']) => Promise<void>;
  deleteAsset: (assetId: string) => Promise<void>;
  duplicateAsset: (assetId: string) => Promise<void>;
  renameAsset: (assetId: string, newName: string) => Promise<void>;
  addComment: (
    assetId: string,
    body: string,
    category?: 'Fix' | 'Good' | 'Optional',
    parentId?: string,
    timestampSec?: number
  ) => Promise<void>;
  searchAssets: (query: string) => Promise<void>;
  refreshAssets: () => Promise<void>;
  isUploading: boolean;
  uploadProgress: UploadProgress[];
  cancelUpload: (fileId: string) => void;
}

export const useContentLibrary = (): UseContentLibraryReturn => {
  const [assets, setAssets] = useState<ContentLibraryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [abortControllers, setAbortControllers] = useState<Map<string, AbortController>>(new Map());
  const { toast } = useToast();

  // Load assets from database
  const loadAssets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await contentLibraryService.getAssetsWithStats();
      setAssets(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load assets';
      setError(errorMessage);
      console.error('Error loading assets:', err);
      
      toast({
        title: "Error Loading Assets",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Cancel upload
  const cancelUpload = useCallback((fileId: string) => {
    const controller = abortControllers.get(fileId);
    if (controller) {
      controller.abort();
      setAbortControllers(prev => {
        const next = new Map(prev);
        next.delete(fileId);
        return next;
      });
      setUploadProgress(prev => prev.filter(p => p.fileId !== fileId));
    }
  }, [abortControllers]);

  // Upload single asset with progress tracking
  const uploadAsset = useCallback(async (
    file: File,
    metadata?: BatchUploadMetadata
  ) => {
    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const abortController = new AbortController();
    
    try {
      setIsUploading(true);
      setError(null);
      
      // Add to abort controllers
      setAbortControllers(prev => new Map(prev).set(fileId, abortController));
      
      // Initialize progress
      setUploadProgress(prev => [...prev, {
        fileId,
        fileName: file.name,
        progress: 0,
        status: 'uploading'
      }]);

      console.log('Starting upload for file:', file.name);
      
      const newAsset = await contentLibraryService.uploadAssetWithProgress(
        file, 
        metadata,
        (progress) => {
          setUploadProgress(prev => prev.map(p => 
            p.fileId === fileId ? { ...p, progress } : p
          ));
        },
        abortController.signal
      );
      
      // Mark as processing
      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId ? { ...p, status: 'processing' } : p
      ));
      
      // Add the new asset to the beginning of the list
      setAssets(prev => [newAsset, ...prev]);
      
      // Mark as completed
      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId ? { ...p, status: 'completed', progress: 100 } : p
      ));
      
      // Remove from progress after 3 seconds
      setTimeout(() => {
        setUploadProgress(prev => prev.filter(p => p.fileId !== fileId));
        setAbortControllers(prev => {
          const next = new Map(prev);
          next.delete(fileId);
          return next;
        });
      }, 3000);
      
      toast({
        title: "Upload Successful",
        description: `${file.name} has been uploaded successfully.`,
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Upload was cancelled
        setUploadProgress(prev => prev.filter(p => p.fileId !== fileId));
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload asset';
      
      // Mark as error
      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId ? { ...p, status: 'error', error: errorMessage } : p
      ));
      
      setError(errorMessage);
      console.error('Error uploading asset:', err);
      
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsUploading(false);
      setAbortControllers(prev => {
        const next = new Map(prev);
        next.delete(fileId);
        return next;
      });
    }
  }, [toast]);

  // Batch upload assets
  const batchUploadAssets = useCallback(async (
    files: File[],
    metadata?: BatchUploadMetadata
  ) => {
    try {
      setIsUploading(true);
      setError(null);
      
      // Upload files in parallel with a limit of 3 concurrent uploads
      const CONCURRENT_LIMIT = 3;
      const batches = [];
      
      for (let i = 0; i < files.length; i += CONCURRENT_LIMIT) {
        batches.push(files.slice(i, i + CONCURRENT_LIMIT));
      }
      
      for (const batch of batches) {
        await Promise.all(
          batch.map(file => uploadAsset(file, metadata).catch(err => {
            console.error(`Failed to upload ${file.name}:`, err);
            return null; // Continue with other uploads even if one fails
          }))
        );
      }
      
      toast({
        title: "Batch Upload Complete",
        description: `Successfully processed ${files.length} files.`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to batch upload assets';
      setError(errorMessage);
      console.error('Error batch uploading assets:', err);
      
      toast({
        title: "Batch Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [uploadAsset, toast]);

  // Update asset status
  const updateAssetStatus = useCallback(async (
    assetId: string,
    status: ContentLibraryAsset['status']
  ) => {
    try {
      await contentLibraryService.updateAssetStatus(assetId, status);
      
      // Update local state
      setAssets(prev => prev.map(asset =>
        asset.id === assetId ? { ...asset, status } : asset
      ));
      
      toast({
        title: "Status Updated",
        description: `Asset status changed to ${status}.`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update status';
      console.error('Error updating status:', err);
      
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  // Delete asset
  const deleteAsset = useCallback(async (assetId: string) => {
    try {
      await contentLibraryService.deleteAsset(assetId);
      
      // Remove from local state
      setAssets(prev => prev.filter(asset => asset.id !== assetId));
      
      toast({
        title: "Asset Deleted",
        description: "Asset has been successfully deleted.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete asset';
      console.error('Error deleting asset:', err);
      
      toast({
        title: "Delete Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  // Duplicate asset
  const duplicateAsset = useCallback(async (assetId: string) => {
    try {
      const duplicatedAsset = await contentLibraryService.duplicateAsset(assetId);
      
      // Add duplicated asset to the beginning of the list
      setAssets(prev => [duplicatedAsset, ...prev]);
      
      toast({
        title: "Asset Duplicated",
        description: "Asset has been successfully duplicated.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to duplicate asset';
      console.error('Error duplicating asset:', err);
      
      toast({
        title: "Duplicate Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  // Rename asset
  const renameAsset = useCallback(async (assetId: string, newName: string) => {
    try {
      await contentLibraryService.renameAsset(assetId, newName);
      
      // Update local state
      setAssets(prev => prev.map(asset =>
        asset.id === assetId ? { ...asset, name: newName } : asset
      ));
      
      toast({
        title: "Asset Renamed",
        description: `Asset renamed to "${newName}" successfully.`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to rename asset';
      console.error('Error renaming asset:', err);
      
      toast({
        title: "Rename Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  // Add comment
  const addComment = useCallback(async (
    assetId: string,
    body: string,
    category: 'Fix' | 'Good' | 'Optional' = 'Fix',
    parentId?: string,
    timestampSec?: number
  ) => {
    try {
      await contentLibraryService.addComment(assetId, body, category, parentId, timestampSec);
      
      // Refresh the specific asset to get updated comments
      await loadAssets();
      
      toast({
        title: "Comment Added",
        description: "Your comment has been added successfully.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add comment';
      console.error('Error adding comment:', err);
      
      toast({
        title: "Comment Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  }, [loadAssets, toast]);

  // Search assets
  const searchAssets = useCallback(async (query: string) => {
    try {
      if (!query.trim()) {
        await loadAssets();
        return;
      }
      
      setLoading(true);
      const results = await contentLibraryService.searchAssets(query);
      setAssets(results);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search assets';
      console.error('Error searching assets:', err);
      
      toast({
        title: "Search Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [loadAssets, toast]);

  // Refresh assets
  const refreshAssets = useCallback(async () => {
    await loadAssets();
  }, [loadAssets]);

  // Set up real-time subscription
  useEffect(() => {
    // Initial load
    loadAssets();

    // Subscribe to real-time changes
    const subscription = contentLibraryService.subscribeToChanges((payload) => {
      console.log('Real-time change detected:', payload);
      
      switch (payload.eventType) {
        case 'INSERT':
          setAssets(prev => {
            // Check if asset already exists (avoid duplicates)
            const exists = prev.some(asset => asset.id === payload.new.id);
            return exists ? prev : [payload.new, ...prev];
          });
          break;
          
        case 'UPDATE':
          setAssets(prev => prev.map(asset =>
            asset.id === payload.new.id ? payload.new : asset
          ));
          break;
          
        case 'DELETE':
          setAssets(prev => prev.filter(asset => asset.id !== payload.old.id));
          break;
      }
    });

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [loadAssets]);

  return {
    assets,
    loading,
    error,
    uploadAsset,
    batchUploadAssets,
    updateAssetStatus,
    deleteAsset,
    duplicateAsset,
    renameAsset,
    addComment,
    searchAssets,
    refreshAssets,
    isUploading,
    uploadProgress,
    cancelUpload,
  };
};