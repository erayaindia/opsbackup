import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { AssetCardData, UploadCardData } from "../types";
import { AssetGrid } from "../components/AssetGrid";
import { AssetList } from "../components/AssetList";
import { UploadCard } from "../components/UploadCard";
import { AssetDrawer } from "../components/AssetDrawer";
import { VideoManagerProvider } from "../contexts/VideoManagerContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { 
  generateUploadId, 
  isSupportedFile, 
  validateFileSize, 
  processUploadedFile,
  checkForDuplicates,
  generateUniqueFilename
} from "../utils/upload";
import { ContentLibraryService } from "../services/contentLibraryService";
import { FilterBar } from "../components/FilterBar";
import { FilterState } from "../types";


/**
 * LibraryGridPage - Main page component for the Content Library grid view
 * Includes header with title, search, view toggle, and bulk actions
 */
export const LibraryGridPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [assets, setAssets] = useState<AssetCardData[]>([]);
  const [uploadingCards, setUploadingCards] = useState<UploadCardData[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    current: number;
    total: number;
    fileName: string;
  } | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<AssetCardData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    assetType: 'all',
    stage: 'all',
    performance: 'all',
    aspect: 'all',
    dateRange: 'all',
    searchQuery: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Fetch assets on component mount
  useEffect(() => {
    loadAssets();
    // Test Supabase connection
    testSupabaseConnection();
  }, []);

  const testSupabaseConnection = async () => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user }, error } = await supabase.auth.getUser();
      console.log('Supabase connection test:', { 
        user: user ? { id: user.id, email: user.email } : null, 
        error: error?.message 
      });
      
      // Test if environment variables are set
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      console.log('Supabase config:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        urlPreview: supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'MISSING'
      });
    } catch (error) {
      console.error('Supabase connection test failed:', error);
    }
  };

  const loadAssets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedAssets = await ContentLibraryService.fetchAssets();
      setAssets(fetchedAssets);
    } catch (error) {
      console.error('Failed to load assets:', error);
      if (error instanceof Error && error.message.includes('does not exist')) {
        setError('Database table not set up. Please run the SQL setup script in your Supabase dashboard.');
      } else {
        setError('Failed to load content library. Please check your database connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssetOpen = useCallback((id: string) => {
    const asset = assets.find(a => a.id === id);
    if (asset) {
      setSelectedAsset(asset);
      setDrawerOpen(true);
    }
  }, [assets]);

  const handleCopyLink = async (id: string) => {
    try {
      const asset = assets.find(a => a.id === id);
      if (!asset) {
        setError('Asset not found');
        return;
      }

      // Copy the actual file URL to clipboard
      const urlToCopy = asset.videoUrl || asset.thumbnailUrl || '';
      
      if (!urlToCopy) {
        setError('No shareable URL available for this asset');
        return;
      }

      await navigator.clipboard.writeText(urlToCopy);
      console.log(`Copied link for asset: ${asset.title}`);
      
      // Show success feedback (you could add a toast notification here)
      const originalTitle = document.title;
      document.title = '✓ Link copied to clipboard!';
      setTimeout(() => {
        document.title = originalTitle;
      }, 2000);
      
    } catch (error) {
      console.error('Failed to copy link:', error);
      setError('Failed to copy link to clipboard');
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const asset = assets.find(a => a.id === id);
      if (!asset) {
        setError('Asset not found');
        return;
      }

      const downloadUrl = asset.videoUrl || asset.thumbnailUrl;
      
      if (!downloadUrl) {
        setError('No downloadable file available for this asset');
        return;
      }

      console.log(`Downloading asset: ${asset.title}`);
      
      // Create temporary download link
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = asset.title;
      link.target = '_blank';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Failed to download asset:', error);
      setError('Failed to download the file. Please try again.');
    }
  };

  const handleMore = (id: string) => {
    console.log(`More actions for asset ID: ${id}`);
    // This is now handled by the dropdown menu in the AssetCard component
    // No additional action needed here
  };

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredAssets.map(asset => asset.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedItems(new Set()); // Clear selections when toggling
  };

  const handleBulkDelete = async () => {
    console.log('handleBulkDelete called, selectedItems:', Array.from(selectedItems));
    
    if (selectedItems.size === 0) {
      console.log('No items selected, aborting delete');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedItems.size} selected item${selectedItems.size > 1 ? 's' : ''}? This will remove them from the content library but keep the files in storage.`
    );

    if (!confirmed) {
      console.log('User cancelled bulk delete');
      return;
    }

    try {
      console.log('Starting bulk delete process...');
      setIsDeleting(true);
      setError(null); // Clear any previous errors
      
      const idsToDelete = Array.from(selectedItems);
      console.log('IDs to delete:', idsToDelete);
      
      const results = await ContentLibraryService.bulkDeleteAssets(idsToDelete);
      console.log('Bulk delete service returned:', results);
      
      if (results.success.length > 0) {
        console.log(`Successfully deleted ${results.success.length} assets`);
        
        // Refresh the assets list to remove deleted items
        console.log('Refreshing assets list...');
        await loadAssets();
        
        // Clear selections and exit select mode
        setSelectedItems(new Set());
        setSelectMode(false);
        
        console.log('Bulk delete completed successfully');
      }

      if (results.failed.length > 0) {
        console.error(`Failed to delete ${results.failed.length} assets:`, results.failed);
        setError(`Failed to delete ${results.failed.length} items. Please try again.`);
      }

      // If all succeeded, show success (optional)
      if (results.success.length > 0 && results.failed.length === 0) {
        console.log('All items deleted successfully');
      }

    } catch (error) {
      console.error('Exception during bulk delete:', error);
      setError('Failed to delete selected items. Please try again.');
    } finally {
      setIsDeleting(false);
      console.log('Bulk delete process finished');
    }
  };

  const handleBulkDownload = async () => {
    if (selectedItems.size === 0) return;

    try {
      setIsDownloading(true);
      setDownloadProgress(null);
      const idsToDownload = Array.from(selectedItems);
      
      const result = await ContentLibraryService.bulkDownloadAssets(
        idsToDownload,
        (progress) => {
          setDownloadProgress(progress);
        }
      );
      
      if (result.success) {
        console.log(`Successfully downloaded ${selectedItems.size} assets as ZIP`);
        // Clear selections and exit select mode after successful download
        setSelectedItems(new Set());
        setSelectMode(false);
      } else {
        console.error('Bulk download failed:', result.error);
        setError(result.error || 'Failed to download selected items. Please try again.');
      }

    } catch (error) {
      console.error('Error during bulk download:', error);
      setError('Failed to download selected items. Please try again.');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  // Individual asset handlers
  const handleDelete = async (id: string) => {
    const asset = assets.find(a => a.id === id);
    const confirmed = window.confirm(
      `Are you sure you want to delete "${asset?.title || 'this item'}"? This will remove it from the content library but keep the file in storage.`
    );

    if (!confirmed) return;

    try {
      await ContentLibraryService.deleteAsset(id);
      
      // Update local state
      setAssets(prev => prev.filter(asset => asset.id !== id));
      
      console.log(`Successfully deleted asset: ${id}`);
    } catch (error) {
      console.error('Failed to delete asset:', error);
      setError('Failed to delete the item. Please try again.');
    }
  };

  const handleRename = async (id: string, currentName: string) => {
    const newName = window.prompt('Enter new name:', currentName);
    
    if (!newName || newName.trim() === '' || newName === currentName) {
      return; // User cancelled or didn't change the name
    }

    try {
      await ContentLibraryService.updateAsset(id, { name: newName.trim() });
      
      // Update local state
      setAssets(prev => 
        prev.map(asset => 
          asset.id === id 
            ? { ...asset, title: ContentLibraryService.cleanDisplayName(newName.trim()) }
            : asset
        )
      );
      
      console.log(`Successfully renamed asset ${id} to: ${newName}`);
    } catch (error) {
      console.error('Failed to rename asset:', error);
      setError('Failed to rename the item. Please try again.');
    }
  };

  // Stage and Performance handlers
  const handleStageChange = async (id: string, newStage: import("../components/StageSelector").StageOption) => {
    try {
      await ContentLibraryService.updateAsset(id, { status: newStage });
      
      // Update local state optimistically
      setAssets(prev => 
        prev.map(asset => 
          asset.id === id 
            ? { ...asset, stage: newStage }
            : asset
        )
      );
      
      console.log(`Successfully updated stage for asset ${id} to: ${newStage}`);
    } catch (error) {
      console.error('Failed to update stage:', error);
      // Revert optimistic update by reloading assets
      await loadAssets();
      throw error; // Re-throw so component can show error toast
    }
  };

  const handlePerformanceChange = async (id: string, newPerformance: import("../components/PerformanceSelector").PerformanceOption[]) => {
    try {
      await ContentLibraryService.updateAsset(id, { performance_tags: newPerformance });
      
      // Update local state optimistically  
      setAssets(prev => 
        prev.map(asset => 
          asset.id === id 
            ? { ...asset, performance: newPerformance }
            : asset
        )
      );
      
      console.log(`Successfully updated performance for asset ${id} to:`, newPerformance);
    } catch (error) {
      console.error('Failed to update performance:', error);
      // Revert optimistic update by reloading assets
      await loadAssets();
      throw error; // Re-throw so component can show error toast
    }
  };

  // Upload functionality
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    console.log('Files selected:', files.length, files);
    if (files.length > 0) {
      console.log('Processing files...');
      processFiles(files);
    } else {
      console.log('No files selected');
    }
    // Reset input
    e.target.value = '';
  };

  const startUpload = useCallback(async (productName: string, filesToUpload: File[]) => {
    console.log('startUpload called with product:', productName);
    console.log('filesToUpload in startUpload:', filesToUpload);
    
    try {
      if (!filesToUpload || filesToUpload.length === 0) {
        console.error('No files to upload');
        setError('No files selected for upload');
        return;
      }

      // Clear any previous errors
      setError(null);

      // Generate temporary display IDs for uploading cards
      const maxDisplayId = Math.max(0, ...assets.map(asset => asset.displayId || 0));
      
      // Create optimistic upload cards
      const uploadCards: UploadCardData[] = filesToUpload.map((file, index) => ({
        id: generateUploadId(),
        displayId: maxDisplayId + index + 1, // Temporary sequential ID
        title: file.name,
        productName,
        stage: "Ready",
        isVideo: file.type.startsWith('video/'),
        thumbnailUrl: '', // Will be generated during processing
        aspect: "16:9",
        performance: [],
        createdBy: "Current User",
        createdAt: new Date(),
        isUploading: true,
        uploadProgress: 0,
      }));

      setUploadingCards(uploadCards);

      let successCount = 0;
      let errorCount = 0;

      // Process files one by one
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const uploadCard = uploadCards[i];

        try {
          console.log(`Processing file ${i + 1}/${filesToUpload.length}: ${file.name}`);
          
          // Simulate upload progress
          for (let progress = 0; progress <= 100; progress += 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
            setUploadingCards(prev => 
              prev.map(card => 
                card.id === uploadCard.id 
                  ? { ...card, uploadProgress: progress }
                  : card
              )
            );
          }

          // Process the file
          const processedAsset = await processUploadedFile(file, productName, uploadCard.id);
          
          // Check for duplicates
          const duplicate = checkForDuplicates(processedAsset.title, assets);
          if (duplicate) {
            processedAsset.title = generateUniqueFilename(processedAsset.title, assets);
          }

          // Remove from uploading cards
          setUploadingCards(prev => prev.filter(card => card.id !== uploadCard.id));

          // Auto-open the first uploaded asset (only for the first file)
          if (i === 0) {
            setTimeout(() => {
              setSelectedAsset(processedAsset);
              setDrawerOpen(true);
            }, 500);
          }

          successCount++;
          console.log(`Successfully processed file: ${file.name}`);

        } catch (error) {
          errorCount++;
          console.error(`Failed to process file ${file.name}:`, error);
          
          // Update upload card with error
          setUploadingCards(prev => 
            prev.map(card => 
              card.id === uploadCard.id 
                ? { 
                    ...card, 
                    isUploading: false, 
                    uploadError: error instanceof Error ? error.message : 'Upload failed' 
                  }
                : card
            )
          );

          // Set general error message for the first failed file
          if (errorCount === 1) {
            const errorMessage = error instanceof Error ? error.message : 'Upload failed';
            if (errorMessage.includes('Authentication required')) {
              setError('Please log in to upload files');
            } else if (errorMessage.includes('storage')) {
              setError('Storage configuration error. Please check your Supabase setup.');
            } else if (errorMessage.includes('database') || errorMessage.includes('table')) {
              setError('Database error. Please check your content library table setup.');
            } else {
              setError(`Upload failed: ${errorMessage}`);
            }
          }
        }
      }

      setPendingFiles([]);

      // Refresh assets list after upload
      try {
        await loadAssets();
      } catch (refreshError) {
        console.error('Failed to refresh assets after upload:', refreshError);
        // Don't set error here as uploads might have succeeded
      }

      // Show success/error summary
      if (successCount > 0 && errorCount === 0) {
        console.log(`Successfully uploaded ${successCount} files`);
        // Clear any previous errors on complete success
        setError(null);
      } else if (successCount > 0 && errorCount > 0) {
        console.log(`Uploaded ${successCount} files successfully, ${errorCount} files failed`);
        setError(`${errorCount} files failed to upload. Successfully uploaded ${successCount} files.`);
      } else if (successCount === 0) {
        console.error('All files failed to upload');
        if (!error) { // Only set error if not already set
          setError('All files failed to upload. Please check your connection and try again.');
        }
      }

    } catch (error) {
      console.error('Error in startUpload:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload process failed';
      setError(`Upload failed: ${errorMessage}`);
      
      // Clear any uploading cards on critical error
      setUploadingCards([]);
      setPendingFiles([]);
    }
  }, [assets, handleAssetOpen, error]);

  const processFiles = useCallback((files: File[]) => {
    console.log('Processing files:', files);
    
    try {
      if (!files || files.length === 0) {
        console.warn('No files provided to processFiles');
        setError('No files selected');
        return;
      }

      const unsupportedFiles: string[] = [];
      const oversizedFiles: string[] = [];
      
      // Filter supported files
      const supportedFiles = files.filter(file => {
        if (!isSupportedFile(file)) {
          console.warn(`Unsupported file type: ${file.name} (${file.type})`);
          unsupportedFiles.push(`${file.name} (${file.type})`);
          return false;
        }
        if (!validateFileSize(file)) {
          console.warn(`File too large: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
          oversizedFiles.push(`${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
          return false;
        }
        return true;
      });

      console.log('Supported files:', supportedFiles);

      // Show warnings for unsupported/oversized files
      if (unsupportedFiles.length > 0) {
        const message = `Unsupported file types: ${unsupportedFiles.join(', ')}. Please upload images or videos only.`;
        console.warn(message);
        if (supportedFiles.length === 0) {
          setError(message);
        }
      }

      if (oversizedFiles.length > 0) {
        const message = `Files too large: ${oversizedFiles.join(', ')}. Max size: 100MB for videos, 10MB for images.`;
        console.warn(message);
        if (supportedFiles.length === 0) {
          setError(message);
        }
      }

      if (supportedFiles.length === 0) {
        console.log('No supported files found');
        if (unsupportedFiles.length === 0 && oversizedFiles.length === 0) {
          setError('No valid files found. Please select images or videos to upload.');
        }
        return;
      }

      // Clear any previous errors if we have supported files
      if (supportedFiles.length > 0) {
        setError(null);
      }

      // Set pending files and start upload with default product
      setPendingFiles(supportedFiles);
      console.log('Starting upload with files:', supportedFiles);
      startUpload("General Assets", supportedFiles);
      
    } catch (error) {
      console.error('Error in processFiles:', error);
      setError('Failed to process selected files. Please try again.');
    }
  }, [startUpload]);

  // Filter functions
  const handleFilterChange = (filterType: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const handleClearAllFilters = () => {
    setFilters({
      assetType: 'all',
      stage: 'all',
      performance: 'all',
      aspect: 'all',
      dateRange: 'all',
      searchQuery: ''
    });
  };

  const getActiveFilterCount = () => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'customDateFrom' || key === 'customDateTo') return false;
      if (key === 'searchQuery') return value && value.trim() !== '';
      return value !== 'all';
    }).length;
  };

  const filterAssets = (assets: AssetCardData[]): AssetCardData[] => {
    return assets.filter(asset => {
      // Asset type filter
      if (filters.assetType === 'videos' && !asset.isVideo) return false;
      if (filters.assetType === 'images' && asset.isVideo) return false;

      // Stage filter
      if (filters.stage !== 'all' && asset.stage !== filters.stage) return false;

      // Performance filter
      if (filters.performance !== 'all' && !asset.performance.includes(filters.performance as any)) return false;

      // Aspect filter
      if (filters.aspect !== 'all' && asset.aspect !== filters.aspect) return false;

      // Date range filter
      if (filters.dateRange !== 'all' && asset.createdAt) {
        const assetDate = new Date(asset.createdAt);
        const today = new Date();
        const dayInMs = 24 * 60 * 60 * 1000;

        switch (filters.dateRange) {
          case 'today':
            if (assetDate.toDateString() !== today.toDateString()) return false;
            break;
          case 'week':
            if (today.getTime() - assetDate.getTime() > 7 * dayInMs) return false;
            break;
          case 'month':
            if (today.getTime() - assetDate.getTime() > 30 * dayInMs) return false;
            break;
        }
      }

      // Search query filter (comprehensive search across multiple fields)
      if (filters.searchQuery && filters.searchQuery.trim()) {
        const searchTerm = filters.searchQuery.toLowerCase().trim();
        const searchableFields = [
          asset.title?.toLowerCase() || '',
          asset.productName?.toLowerCase() || '',
          asset.stage?.toLowerCase() || '',
          asset.createdBy?.toLowerCase() || '',
          asset.versionLabel?.toLowerCase() || '',
          asset.displayId?.toString() || '',
          ...(asset.performance || []).map(p => p.toLowerCase()),
          asset.aspect?.toLowerCase() || '',
          asset.isVideo ? 'video' : 'image',
          // Format date for search
          asset.createdAt ? new Date(asset.createdAt).toLocaleDateString() : '',
          asset.createdAt ? new Date(asset.createdAt).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }) : '',
        ].filter(Boolean);

        const matches = searchableFields.some(field => 
          field.includes(searchTerm)
        );

        if (!matches) return false;
      }

      return true;
    });
  };



  const handleUploadCardCancel = (uploadId: string) => {
    setUploadingCards(prev => prev.filter(card => card.id !== uploadId));
  };

  const handleUploadRetry = async (uploadId: string) => {
    // Find the failed upload card
    const failedCard = uploadingCards.find(card => card.id === uploadId);
    if (!failedCard) return;

    // Reset the card to uploading state
    setUploadingCards(prev => 
      prev.map(card => 
        card.id === uploadId 
          ? { ...card, isUploading: true, uploadError: undefined, uploadProgress: 0 }
          : card
      )
    );

    // Find original file (this is simplified - in real app you'd store file references)
    console.log(`Retrying upload for ${failedCard.title}`);
    // TODO: Implement actual retry logic
  };

  // Drag and drop functionality
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set false if leaving the drop zone entirely
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    console.log('Files dropped:', files.length, files);
    processFiles(files);
  }, [processFiles]);

  // Apply filters to assets
  const filteredAssets = filterAssets(assets);
  
  // Combined assets (uploading cards + filtered regular assets)
  const combinedAssets = [...uploadingCards.map(card => ({
    ...card,
    isUploading: true
  }) as AssetCardData), ...filteredAssets];

  return (
    <ErrorBoundary>
    <VideoManagerProvider>
    <div 
      ref={dropZoneRef}
      className={cn(
        "flex flex-col h-full bg-background relative",
        isDragOver && "bg-primary/5"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary z-40 flex items-center justify-center">
          <div className="bg-card rounded-lg p-6 text-center border shadow-lg">
            <svg className="w-12 h-12 mx-auto mb-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div className="text-lg font-medium text-foreground">Drop files to upload</div>
            <div className="text-sm text-muted-foreground">Videos and images supported</div>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="video/*,image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Page Header */}
      <div className="border-b border-border bg-card relative">
        <div className="container mx-auto px-6 py-4">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Content Library</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Browse and manage your approved creative assets
              </p>
            </div>
            
            {/* Right-aligned controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Upload Button */}
              <Button 
                onClick={handleUploadClick}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload
              </Button>

              {/* View Toggle */}
              <div className="flex border border-border rounded-md overflow-hidden">
                <Button 
                  variant={viewMode === 'grid' ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "rounded-none",
                    viewMode === 'grid' 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                      : "hover:bg-muted"
                  )}
                  onClick={() => setViewMode('grid')}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Grid
                </Button>
                <Button 
                  variant={viewMode === 'list' ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "rounded-none",
                    viewMode === 'list' 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                      : "hover:bg-muted"
                  )}
                  onClick={() => setViewMode('list')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  List
                </Button>
              </div>

              {/* Bulk Actions */}
              <Button 
                variant={selectMode ? "default" : "outline"} 
                size="sm" 
                onClick={toggleSelectMode}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {selectMode ? 'Cancel Selection' : 'Select Items'}
              </Button>
            </div>
          </div>

        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearAll={handleClearAllFilters}
        activeFilterCount={getActiveFilterCount()}
      />

      {/* Selection Actions Bar */}
      {selectMode && (
        <div className="border-b border-border bg-muted/30">
          <div className="container mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === filteredAssets.length && filteredAssets.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium">
                    {selectedItems.size === 0
                      ? `Select all (${filteredAssets.length})`
                      : `${selectedItems.size} of ${filteredAssets.length} selected`
                    }
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {selectedItems.size > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkDownload}
                      disabled={isDownloading || isDeleting}
                    >
                      {isDownloading ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
                          {downloadProgress ? (
                            <>
                              Downloading {downloadProgress.current}/{downloadProgress.total}
                            </>
                          ) : (
                            'Preparing Download...'
                          )}
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''}
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      disabled={isDeleting || isDownloading}
                    >
                      {isDeleting ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''}
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            {/* Download Progress Indicator */}
            {isDownloading && downloadProgress && (
              <div className="mt-2 text-xs text-muted-foreground">
                Currently downloading: <span className="font-medium">{downloadProgress.fileName}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-6">
          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-destructive font-medium">{error}</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={loadAssets}
                  className="ml-auto"
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full"></div>
                <span className="text-muted-foreground">Loading content library...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Render uploading cards separately in grid view only */}
              {viewMode === 'grid' && uploadingCards.length > 0 && (
                <div className="mb-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                    {uploadingCards.map((card) => (
                      <UploadCard
                        key={card.id}
                        {...card}
                        onCancel={handleUploadCardCancel}
                        onRetry={handleUploadRetry}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && filteredAssets.length === 0 && uploadingCards.length === 0 && !error && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <svg className="w-12 h-12 text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {assets.length === 0 ? 'No content yet' : 'No content matches your filters'}
                  </h3>
                  <p className="text-muted-foreground mb-4 max-w-md">
                    {assets.length === 0 
                      ? 'Upload your first video or image to get started with your content library.'
                      : 'Try adjusting your filters or clear all filters to see more content.'
                    }
                  </p>
                  {assets.length === 0 ? (
                    <Button onClick={handleUploadClick} className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Upload Content
                    </Button>
                  ) : (
                    <Button onClick={handleClearAllFilters} variant="outline" className="flex items-center gap-2">
                      <X className="w-4 h-4" />
                      Clear All Filters
                    </Button>
                  )}
                </div>
              )}

              {/* Content Grid/List */}
              {filteredAssets.length > 0 && (
                <>
                  {viewMode === 'grid' ? (
                    <AssetGrid 
                      items={filteredAssets}
                      onOpen={handleAssetOpen}
                      onCopyLink={handleCopyLink}
                      onDownload={handleDownload}
                      onMore={handleMore}
                      onSelect={handleSelect}
                      onDelete={handleDelete}
                      onRename={handleRename}
                      onStageChange={handleStageChange}
                      onPerformanceChange={handlePerformanceChange}
                      showQuickActions={!selectMode}
                      selectMode={selectMode}
                      selectedItems={selectedItems}
                    />
                  ) : (
                    <AssetList 
                      items={combinedAssets}
                      onOpen={handleAssetOpen}
                      onCopyLink={handleCopyLink}
                      onDownload={handleDownload}
                      onMore={handleMore}
                      onSelect={handleSelect}
                      showQuickActions={!selectMode}
                      selectMode={selectMode}
                      selectedItems={selectedItems}
                    />
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Asset Detail Drawer */}
      <AssetDrawer
        asset={selectedAsset}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onStageChange={handleStageChange}
        onPerformanceChange={handlePerformanceChange}
        onDownload={handleDownload}
        onCopyLink={handleCopyLink}
        onDelete={(id) => {
          handleDelete(id);
          setDrawerOpen(false);
        }}
        onRename={handleRename}
      />
    </div>
    </VideoManagerProvider>
    </ErrorBoundary>
  );
};