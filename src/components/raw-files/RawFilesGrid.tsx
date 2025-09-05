import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { RawFilesService } from "@/services/rawFilesService";
import { 
  RawFile, 
  RawFileStatus, 
  RawFilesFilter, 
  RawFilesSortConfig,
  getRawFileType 
} from "@/types/rawFiles";
import { RawFileCard } from "./RawFileCard";
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
  SortDesc
} from "lucide-react";

interface RawFilesGridProps {
  contentId: string;
  files: RawFile[];
  onFilesChange: (files: RawFile[]) => void;
  loading?: boolean;
}

export function RawFilesGrid({ 
  contentId, 
  files, 
  onFilesChange,
  loading = false 
}: RawFilesGridProps) {
  console.log('🎬 RawFilesGrid received props:', { 
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
  const { toast } = useToast();

  // Clear selection when files change
  useEffect(() => {
    setSelectedFiles(new Set());
  }, [files]);

  // Filter and sort files
  const filteredAndSortedFiles = useMemo(() => {
    let filtered = [...files];

    // Apply search filter
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filtered = filtered.filter(file => 
        file.display_name.toLowerCase().includes(query) ||
        file.original_name.toLowerCase().includes(query)
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
      let aVal: any = a[sortConfig.field];
      let bVal: any = b[sortConfig.field];

      // Handle date sorting
      if (sortConfig.field === 'upload_date') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      // Handle string sorting
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortConfig.direction === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    return filtered;
  }, [files, filter, sortConfig]);

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
    
    selectedFileData.forEach(file => {
      const link = document.createElement('a');
      link.href = file.file_url;
      link.download = file.display_name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    toast({
      title: "Download Started",
      description: `Downloading ${selectedFiles.size} files`,
    });
  };

  const allSelected = selectedFiles.size === filteredAndSortedFiles.length && filteredAndSortedFiles.length > 0;
  const someSelected = selectedFiles.size > 0;

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
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search and Filter */}
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={filter.searchQuery || ''}
              onChange={(e) => setFilter(prev => ({ ...prev, searchQuery: e.target.value }))}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                onClick={() => setFilter({})}
                disabled={Object.keys(filter).length === 0}
              >
                Clear Filters
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

              <Select onValueChange={(value: RawFileStatus) => handleBulkStatusUpdate(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Update Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">🟡 Pending</SelectItem>
                  <SelectItem value="approved">✅ Approved</SelectItem>
                  <SelectItem value="rejected">❌ Rejected</SelectItem>
                  <SelectItem value="reshoot">🔄 Reshoot</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Files Grid/List */}
      {filteredAndSortedFiles.length === 0 ? (
        <div className="text-center py-12">
          <FileX className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Files Found</h3>
          <p className="text-muted-foreground">
            {files.length === 0 
              ? "No raw files uploaded yet" 
              : "No files match your current filters"
            }
          </p>
        </div>
      ) : (
        <div className={`
          ${viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
            : 'space-y-4'
          }
        `}>
          {filteredAndSortedFiles.map(file => (
            <div key={file.id} className="group relative">
              {/* Selection Checkbox (Grid Mode Only) */}
              {viewMode === 'grid' && (
                <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Checkbox
                    checked={selectedFiles.has(file.id)}
                    onCheckedChange={(checked) => handleSelectFile(file.id, !!checked)}
                    className="bg-white/90 border-2"
                  />
                </div>
              )}
              
              <RawFileCard
                file={file}
                onFileUpdated={handleFileUpdated}
                onFileDeleted={handleFileDeleted}
              />
            </div>
          ))}
        </div>
      )}

      {/* Status Summary */}
      {files.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          <p>
            Total: {files.length} files • 
            Pending: {files.filter(f => f.status === 'pending').length} • 
            Approved: {files.filter(f => f.status === 'approved').length} • 
            Rejected: {files.filter(f => f.status === 'rejected').length} • 
            Reshoot: {files.filter(f => f.status === 'reshoot').length}
          </p>
        </div>
      )}
    </div>
  );
}