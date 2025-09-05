import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { RawFilesService } from "@/services/rawFilesService";
import { 
  RawFile, 
  RawFileStatus, 
  RawFilesFilter, 
  RawFilesSortConfig,
  getRawFileType,
  formatFileSize 
} from "@/types/rawFiles";
import { EnhancedRawFileCard } from "./EnhancedRawFileCard";
import { RawFilePreviewModal } from "./RawFilePreviewModal";
import { 
  Search, 
  Filter, 
  ChevronDown,
  Grid3X3,
  List,
  Download,
  Loader2,
  FileX,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  RotateCcw,
  Clock,
  Eye,
  Trash2,
  Settings,
  RefreshCw,
  Upload,
  Plus
} from "lucide-react";

interface EnhancedRawFilesGridProps {
  contentId: string;
  files: RawFile[];
  onFilesChange: (files: RawFile[]) => void;
  onFilesUploaded?: (files: RawFile[]) => void;
  loading?: boolean;
  onRefresh?: () => void;
  uploadDisabled?: boolean;
}

export function EnhancedRawFilesGrid({ 
  contentId, 
  files, 
  onFilesChange,
  onFilesUploaded,
  loading = false,
  onRefresh,
  uploadDisabled = false
}: EnhancedRawFilesGridProps) {
  console.log('🎬 EnhancedRawFilesGrid received props:', { 
    contentId, 
    filesCount: files?.length || 0, 
    loading,
    files: files?.map(f => ({ id: f.id, name: f.display_name })) 
  });

  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<RawFilesFilter>({});
  const [sortConfig, setSortConfig] = useState<RawFilesSortConfig>({
    field: 'upload_date',
    direction: 'desc'
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [previewFile, setPreviewFile] = useState<RawFile | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Scroll position preservation
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const preservedScrollPosition = useRef<number>(0);

  // Preserve scroll position during file list updates
  useEffect(() => {
    // Save scroll position before files change
    if (scrollContainerRef.current) {
      preservedScrollPosition.current = window.scrollY;
    }
  }, [loading]);

  // Restore scroll position after files update
  useEffect(() => {
    if (!loading && preservedScrollPosition.current > 0) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        window.scrollTo(0, preservedScrollPosition.current);
      });
    }
  }, [files, loading]);

  // Only clear selection on significant changes, not every update
  useEffect(() => {
    // Don't clear selection on every files change - only when really needed
    // This prevents unnecessary re-renders that cause scroll jumps
    const hasRemovedFiles = Array.from(selectedFiles).some(id => !files.find(f => f.id === id));
    
    if (hasRemovedFiles) {
      // Only clear selected files that no longer exist
      const validSelectedFiles = Array.from(selectedFiles).filter(id => files.find(f => f.id === id));
      setSelectedFiles(new Set(validSelectedFiles));
    }
  }, [files, selectedFiles]);

  // Stable files array - only update when actual content changes, not reference
  const memoizedFiles = useMemo(() => {
    return files;
  }, [files.length, files.map(f => `${f.id}-${f.status}-${f.updated_at}`).join(',')]);
  
  // Filter and sort files
  const filteredAndSortedFiles = useMemo(() => {
    let filtered = [...memoizedFiles];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(file => 
        file.display_name.toLowerCase().includes(query) ||
        file.original_name.toLowerCase().includes(query) ||
        file.file_type.toLowerCase().includes(query) ||
        (file.notes && file.notes.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (filter.status && filter.status.length > 0) {
      filtered = filtered.filter(file => filter.status!.includes(file.status));
    }

    // Apply file type filter
    if (filter.fileType && filter.fileType.length > 0) {
      filtered = filtered.filter(file => 
        filter.fileType!.includes(getRawFileType(file.file_type))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: unknown = a[sortConfig.field];
      let bVal: unknown = b[sortConfig.field];

      // Handle date sorting
      if (sortConfig.field === 'upload_date') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      // Handle string sorting
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      // Handle number sorting
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        // Already numbers, use as-is
      }

      if (sortConfig.direction === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    return filtered;
  }, [memoizedFiles, searchQuery, filter, sortConfig]);

  // Handle file update
  const handleFileUpdated = (updatedFile: RawFile) => {
    const newFiles = files.map(file => 
      file.id === updatedFile.id ? updatedFile : file
    );
    onFilesChange(newFiles);
  };

  // Handle file delete
  const handleFileDeleted = (fileId: string) => {
    const newFiles = files.filter(file => file.id !== fileId);
    onFilesChange(newFiles);
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      newSet.delete(fileId);
      return newSet;
    });
  };

  // Handle preview
  const handlePreview = (file: RawFile) => {
    setPreviewFile(file);
    setShowPreview(true);
  };

  // Handle preview navigation
  const handlePreviewNavigate = (direction: 'prev' | 'next') => {
    if (!previewFile) return;
    
    const currentIndex = filteredAndSortedFiles.findIndex(f => f.id === previewFile.id);
    let newIndex = currentIndex;
    
    if (direction === 'prev' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'next' && currentIndex < filteredAndSortedFiles.length - 1) {
      newIndex = currentIndex + 1;
    }
    
    if (newIndex !== currentIndex) {
      setPreviewFile(filteredAndSortedFiles[newIndex]);
    }
  };

  // Handle bulk selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFiles(new Set(filteredAndSortedFiles.map(f => f.id)));
    } else {
      setSelectedFiles(new Set());
    }
  };

  const handleSelectFile = (fileId: string, checked: boolean) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(fileId);
      } else {
        newSet.delete(fileId);
      }
      return newSet;
    });
  };

  // Handle bulk status update
  const handleBulkStatusUpdate = async (status: RawFileStatus, notes?: string) => {
    if (selectedFiles.size === 0) return;

    setBulkUpdating(true);
    try {
      const fileIds = Array.from(selectedFiles);
      await RawFilesService.bulkUpdateStatus(fileIds, status, notes);

      // Update local state
      const updatedFiles = files.map(file => 
        selectedFiles.has(file.id) 
          ? { ...file, status, notes, updated_at: new Date().toISOString() }
          : file
      );
      
      onFilesChange(updatedFiles);
      setSelectedFiles(new Set());

      toast({
        title: "Bulk Update Complete",
        description: `Updated ${fileIds.length} files to ${status}`,
      });

    } catch (error) {
      console.error('Bulk update error:', error);
      toast({
        title: "Bulk Update Failed",
        description: error instanceof Error ? error.message : "Failed to update files",
        variant: "destructive"
      });
    } finally {
      setBulkUpdating(false);
    }
  };

  // Handle bulk download
  const handleBulkDownload = () => {
    const selectedFileData = files.filter(file => selectedFiles.has(file.id));
    
    selectedFileData.forEach((file, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = file.file_url;
        link.download = file.display_name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 100); // Small delay between downloads
    });

    toast({
      title: "Download Started",
      description: `Downloading ${selectedFiles.size} files`,
    });
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedFiles.size} files? This cannot be undone.`)) {
      return;
    }

    setBulkUpdating(true);
    try {
      const fileIds = Array.from(selectedFiles);
      
      // Delete files one by one (could be optimized with bulk delete API)
      await Promise.all(fileIds.map(id => RawFilesService.deleteRawFile(id)));

      // Update local state
      const updatedFiles = files.filter(file => !selectedFiles.has(file.id));
      onFilesChange(updatedFiles);
      setSelectedFiles(new Set());

      toast({
        title: "Bulk Delete Complete",
        description: `Deleted ${fileIds.length} files`,
      });

    } catch (error) {
      console.error('Bulk delete error:', error);
      toast({
        title: "Bulk Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete files",
        variant: "destructive"
      });
    } finally {
      setBulkUpdating(false);
    }
  };

  // Handle upload functionality
  const handleFileUpload = useCallback(async (selectedFiles: FileList | File[]) => {
    if (uploadDisabled || isUploading) return;
    
    setIsUploading(true);
    try {
      const fileArray = Array.from(selectedFiles);
      const uploadedFiles = await Promise.all(
        fileArray.map(file => RawFilesService.uploadRawFile(file, contentId))
      );
      
      if (onFilesUploaded) {
        onFilesUploaded(uploadedFiles);
      }
      
      toast({
        title: "Upload Successful",
        description: `${fileArray.length} file(s) uploaded successfully`,
      });
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  }, [contentId, uploadDisabled, isUploading, onFilesUploaded, toast]);

  // Handle drag and drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploadDisabled) {
      setIsDragging(true);
    }
  }, [uploadDisabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (!uploadDisabled) {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileUpload(files);
      }
    }
  }, [uploadDisabled, handleFileUpload]);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
    // Reset input value so same file can be selected again
    e.target.value = '';
  };

  const allSelected = selectedFiles.size === filteredAndSortedFiles.length && filteredAndSortedFiles.length > 0;
  const someSelected = selectedFiles.size > 0;

  // Get stats
  const stats = useMemo(() => {
    const total = files.length;
    const pending = files.filter(f => f.status === 'pending').length;
    const approved = files.filter(f => f.status === 'approved').length;
    const rejected = files.filter(f => f.status === 'rejected').length;
    const reshoot = files.filter(f => f.status === 'reshoot').length;
    
    return { total, pending, approved, rejected, reshoot };
  }, [files]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading raw files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <h2 className="text-xl font-semibold">
            Raw Files {files.length > 0 && <span className="text-muted-foreground">({files.length})</span>}
          </h2>
          
          <div className="flex items-center space-x-3 text-sm">
            <Badge variant="outline" className="flex items-center space-x-1">
              <Clock className="h-3 w-3 text-yellow-600" />
              <span>{stats.pending} Pending</span>
            </Badge>
            <Badge variant="outline" className="flex items-center space-x-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>{stats.approved} Approved</span>
            </Badge>
            <Badge variant="outline" className="flex items-center space-x-1">
              <XCircle className="h-3 w-3 text-red-600" />
              <span>{stats.rejected} Rejected</span>
            </Badge>
            <Badge variant="outline" className="flex items-center space-x-1">
              <RotateCcw className="h-3 w-3 text-orange-600" />
              <span>{stats.reshoot} Reshoot</span>
            </Badge>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Upload Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadDisabled || isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
          
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search and Filter */}
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {/* View Controls */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Select
            value={`${sortConfig.field}-${sortConfig.direction}`}
            onValueChange={(value) => {
              const [field, direction] = value.split('-') as [RawFilesSortConfig['field'], 'asc' | 'desc'];
              setSortConfig({ field, direction });
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="upload_date-desc">📅 Newest First</SelectItem>
              <SelectItem value="upload_date-asc">📅 Oldest First</SelectItem>
              <SelectItem value="display_name-asc">🔤 Name A-Z</SelectItem>
              <SelectItem value="display_name-desc">🔤 Name Z-A</SelectItem>
              <SelectItem value="file_size-desc">📊 Largest First</SelectItem>
              <SelectItem value="file_size-asc">📊 Smallest First</SelectItem>
              <SelectItem value="status-asc">📋 Status A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-muted/30 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={filter.status?.[0] || 'all'}
                onValueChange={(value) => {
                  if (value === 'all') {
                    setFilter(prev => ({ ...prev, status: undefined }));
                  } else {
                    setFilter(prev => ({ ...prev, status: [value as RawFileStatus] }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">🟡 Pending</SelectItem>
                  <SelectItem value="approved">✅ Approved</SelectItem>
                  <SelectItem value="rejected">❌ Rejected</SelectItem>
                  <SelectItem value="reshoot">🔄 Reshoot</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* File Type Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">File Type</label>
              <Select
                value={filter.fileType?.[0] || 'all'}
                onValueChange={(value) => {
                  if (value === 'all') {
                    setFilter(prev => ({ ...prev, fileType: undefined }));
                  } else {
                    setFilter(prev => ({ ...prev, fileType: [value as 'video' | 'image'] }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="video">🎬 Videos</SelectItem>
                  <SelectItem value="image">🖼️ Images</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setFilter({});
                  setSearchQuery('');
                }}
                disabled={Object.keys(filter).length === 0 && !searchQuery}
              >
                Clear All
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {someSelected && (
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium">
                {selectedFiles.size} of {filteredAndSortedFiles.length} selected
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkDownload}
                disabled={bulkUpdating}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" disabled={bulkUpdating}>
                    {bulkUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Settings className="h-4 w-4 mr-2" />
                    )}
                    Bulk Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate('pending')}>
                    <Clock className="h-4 w-4 mr-2 text-yellow-600" />
                    Set to Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate('approved')}>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Approve All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate('rejected', 'Bulk rejected')}>
                    <XCircle className="h-4 w-4 mr-2 text-red-600" />
                    Reject All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate('reshoot', 'Needs reshoot')}>
                    <RotateCcw className="h-4 w-4 mr-2 text-orange-600" />
                    Mark for Reshoot
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleBulkDelete}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      )}

      {/* Files Grid/List with Drag & Drop */}
      <div 
        ref={scrollContainerRef}
        className={`
          ${isDragging && !uploadDisabled 
            ? 'ring-2 ring-primary ring-offset-2 bg-primary/5' 
            : ''
          } rounded-lg transition-all duration-200
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {filteredAndSortedFiles.length === 0 ? (
          <div className={`text-center py-12 ${isDragging && !uploadDisabled ? 'border-2 border-dashed border-primary rounded-lg bg-primary/5' : ''}`}>
            {isDragging && !uploadDisabled ? (
              <>
                <Upload className="h-12 w-12 mx-auto text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-primary">Drop Files Here</h3>
                <p className="text-muted-foreground">Release to upload your files</p>
              </>
            ) : (
              <>
                <FileX className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Files Found</h3>
                <p className="text-muted-foreground">
                  {files.length === 0 
                    ? "No raw files uploaded yet. Click Upload or drag & drop files here." 
                    : searchQuery || Object.keys(filter).length > 0
                      ? "No files match your current filters"
                      : "No files to display"
                  }
                </p>
              </>
            )}
            {(searchQuery || Object.keys(filter).length > 0) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setFilter({});
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className={`
            ${viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6' 
              : 'space-y-3'
            }
          `}>
            {filteredAndSortedFiles.map(file => (
              <EnhancedRawFileCard
                key={file.id}
                file={file}
                onFileUpdated={handleFileUpdated}
                onFileDeleted={handleFileDeleted}
                onPreview={handlePreview}
                viewMode={viewMode}
                showCheckbox={someSelected || viewMode === 'list'}
                isSelected={selectedFiles.has(file.id)}
                onToggleSelect={handleSelectFile}
              />
            ))}
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {files.length > 0 && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Showing {filteredAndSortedFiles.length} of {files.length} files
              {(searchQuery || Object.keys(filter).length > 0) && ' (filtered)'}
            </div>
            <div className="flex items-center space-x-4">
              <span>Total size: {formatFileSize(files.reduce((total, file) => total + file.file_size, 0))}</span>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="video/*,image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Preview Modal */}
      <RawFilePreviewModal
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false);
          setPreviewFile(null);
        }}
        file={previewFile}
        files={filteredAndSortedFiles}
        onFileUpdated={handleFileUpdated}
        onFileDeleted={handleFileDeleted}
        onNavigate={handlePreviewNavigate}
      />
    </div>
  );
}