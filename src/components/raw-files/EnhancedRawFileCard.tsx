import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { RawFilesService } from "@/services/rawFilesService";
import { 
  RawFile, 
  RawFileStatus, 
  formatFileSize, 
  getRawFileType,
  getDisplayFileType
} from "@/types/rawFiles";
import { 
  Edit2, 
  Check, 
  X, 
  Calendar,
  FileText,
  Video,
  Image,
  Loader2,
  MoreVertical,
  Play,
  User,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  AlertCircle
} from "lucide-react";

interface EnhancedRawFileCardProps {
  file: RawFile;
  onFileUpdated: (updatedFile: RawFile) => void;
  onFileDeleted: (fileId: string) => void;
  onPreview: (file: RawFile) => void;
  viewMode?: 'grid' | 'list';
  showCheckbox?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (fileId: string, selected: boolean) => void;
}

export function EnhancedRawFileCard({ 
  file, 
  onFileUpdated, 
  onFileDeleted,
  onPreview,
  viewMode = 'grid',
  showCheckbox = false,
  isSelected = false,
  onToggleSelect
}: EnhancedRawFileCardProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(file.display_name);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<RawFileStatus>(file.status);
  const [statusNotes, setStatusNotes] = useState(file.notes || '');
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const { toast } = useToast();

  const fileType = getRawFileType(file.file_type);
  const isVideo = fileType === 'video';
  const isImage = fileType === 'image';

  // Generate video thumbnail if not available
  const generateVideoThumbnail = async (videoUrl: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.crossOrigin = 'anonymous';
      video.currentTime = 1; // Seek to 1 second
      
      video.addEventListener('loadedmetadata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      });
      
      video.addEventListener('seeked', () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob) {
              const thumbnailUrl = URL.createObjectURL(blob);
              resolve(thumbnailUrl);
            } else {
              resolve(null);
            }
          }, 'image/jpeg', 0.8);
        } else {
          resolve(null);
        }
      });
      
      video.addEventListener('error', () => resolve(null));
      video.src = videoUrl;
    });
  };

  // Handle quick status actions
  const handleQuickAction = async (action: 'approve' | 'reject') => {
    const status = action === 'approve' ? 'approved' : 'rejected';
    await handleStatusUpdate(status, action === 'reject' ? 'Quick reject' : undefined);
  };

  // Handle name save
  const handleNameSave = async () => {
    if (editedName.trim() === file.display_name || !editedName.trim()) {
      setIsEditingName(false);
      setEditedName(file.display_name);
      return;
    }

    setIsUpdating(true);
    try {
      await RawFilesService.updateFileName(file.id, editedName.trim());
      
      const updatedFile = { 
        ...file, 
        display_name: editedName.trim(),
        updated_at: new Date().toISOString()
      };
      
      onFileUpdated(updatedFile);
      setIsEditingName(false);
      
      toast({
        title: "Name Updated",
        description: "File name updated successfully",
      });
    } catch (error) {
      console.error('Error updating name:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update file name",
        variant: "destructive"
      });
      setEditedName(file.display_name);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (newStatus: RawFileStatus, notes?: string) => {
    if (newStatus === file.status && notes === file.notes) return;

    setIsUpdating(true);
    try {
      await RawFilesService.updateFileStatus(file.id, newStatus, notes);
      
      const updatedFile = { 
        ...file, 
        status: newStatus,
        notes: notes,
        updated_at: new Date().toISOString()
      };
      
      onFileUpdated(updatedFile);
      setSelectedStatus(newStatus);
      setStatusNotes(notes || '');
      
      toast({
        title: "Status Updated",
        description: `File status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive"
      });
      setSelectedStatus(file.status);
      setStatusNotes(file.notes || '');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle file delete
  const handleDelete = async () => {
    setIsUpdating(true);
    try {
      await RawFilesService.deleteRawFile(file.id);
      onFileDeleted(file.id);
      
      toast({
        title: "File Deleted",
        description: "File deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete file",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle file download
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.file_url;
    link.download = file.display_name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadgeStyle = (status: RawFileStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      case 'approved': return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-700 border-red-500/30';
      case 'reshoot': return 'bg-orange-500/20 text-orange-700 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: RawFileStatus) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-3 w-3" />;
      case 'rejected': return <XCircle className="h-3 w-3" />;
      case 'reshoot': return <RotateCcw className="h-3 w-3" />;
      case 'pending': return <Clock className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  // List view component
  if (viewMode === 'list') {
    return (
      <div 
        className="bg-card border rounded-lg p-4 hover:shadow-md transition-all duration-200 group cursor-pointer"
        onClick={(e) => {
          // Don't trigger preview if clicking on status dropdown or more menu
          const target = e.target as HTMLElement;
          if (
            target.closest('[data-prevent-card-click]') ||
            target.closest('button') ||
            target.closest('[role="combobox"]') ||
            target.closest('[role="menu"]')
          ) {
            return;
          }
          onPreview(file);
        }}
      >
        <div className="flex items-center space-x-4">
          {/* Checkbox */}
          {showCheckbox && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onToggleSelect?.(file.id, e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              data-prevent-card-click="true"
            />
          )}

          {/* Thumbnail */}
          <div className="w-16 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden relative">
            {/* Loading state */}
            {!thumbnailLoaded && !thumbnailError && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            
            {isImage && (
              <img 
                src={file.file_url} 
                alt={file.display_name}
                className="w-full h-full object-cover"
                loading="lazy"
                onLoad={() => setThumbnailLoaded(true)}
                onError={() => setThumbnailError(true)}
              />
            )}
            
            {isVideo && (
              <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
                {file.thumbnail_url && !thumbnailError ? (
                  <img 
                    src={file.thumbnail_url} 
                    alt={`${file.display_name} thumbnail`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onLoad={() => setThumbnailLoaded(true)}
                    onError={() => setThumbnailError(true)}
                  />
                ) : (
                  <Video className="h-6 w-6 text-gray-400" />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/60 rounded-full p-1">
                    <Play className="h-3 w-3 text-white ml-0.5" />
                  </div>
                </div>
              </div>
            )}
            
            {/* Error state for small thumbnail */}
            {thumbnailError && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <h4 className="font-medium text-sm truncate">{file.display_name}</h4>
              <Badge className={`text-xs border ${getStatusBadgeStyle(file.status)}`}>
                {getStatusIcon(file.status)}
                <span className="ml-1 capitalize">{file.status}</span>
              </Badge>
            </div>
            <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
              <span>{formatFileSize(file.file_size)}</span>
              <span>{getDisplayFileType(file.file_type)}</span>
              <span>{new Date(file.upload_date).toLocaleDateString()}</span>
            </div>
            {file.notes && (
              <p className="text-xs text-muted-foreground mt-1 truncate">{file.notes}</p>
            )}
          </div>

          {/* Actions - Status Dropdown and More Menu */}
          <div className="flex items-center space-x-2">
            {/* Status Dropdown */}
            <div data-prevent-card-click="true">
              <Select 
                value={selectedStatus} 
                onValueChange={(value: RawFileStatus) => {
                  setSelectedStatus(value);
                  if (value === 'rejected' || value === 'reshoot') {
                    // Will show notes input below
                  } else {
                    handleStatusUpdate(value);
                  }
                }}
                disabled={isUpdating}
              >
                <SelectTrigger className="h-8 w-24 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-3 w-3 text-yellow-600" />
                      <span>Pending</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="approved">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span>Approved</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="rejected">
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-3 w-3 text-red-600" />
                      <span>Rejected</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="reshoot">
                    <div className="flex items-center space-x-2">
                      <RotateCcw className="h-3 w-3 text-orange-600" />
                      <span>Reshoot</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* More Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 p-0 opacity-60 hover:opacity-100 transition-opacity"
                  data-prevent-card-click="true"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                side="bottom"
                sideOffset={4}
                className="z-[1050] w-40"
                portal={true}
                avoidCollisions={true}
              >
                <DropdownMenuItem onClick={handleDownload}>
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsEditingName(true)}>
                  Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-red-600 focus:text-red-600"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Edit name inline */}
        {isEditingName && (
          <div className="mt-3 flex items-center space-x-2" data-prevent-card-click="true">
            <Input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSave();
                if (e.key === 'Escape') {
                  setIsEditingName(false);
                  setEditedName(file.display_name);
                }
              }}
              disabled={isUpdating}
              className="text-sm"
              autoFocus
            />
            <Button
              size="sm"
              onClick={handleNameSave}
              disabled={isUpdating || !editedName.trim()}
            >
              {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsEditingName(false);
                setEditedName(file.display_name);
              }}
              disabled={isUpdating}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Grid view component (enhanced)
  return (
    <div 
      className="bg-card border rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 group relative cursor-pointer"
      onClick={(e) => {
        // Don't trigger preview if clicking on status dropdown or more menu
        const target = e.target as HTMLElement;
        if (
          target.closest('[data-prevent-card-click]') ||
          target.closest('button') ||
          target.closest('[role="combobox"]') ||
          target.closest('[role="menu"]')
        ) {
          return;
        }
        onPreview(file);
      }}
    >
      {/* Checkbox */}
      {showCheckbox && (
        <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onToggleSelect?.(file.id, e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary bg-white/90"
            data-prevent-card-click="true"
          />
        </div>
      )}

      {/* File Preview/Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-muted to-muted/70 flex items-center justify-center overflow-hidden rounded-t-xl">
        {/* Loading state */}
        {!thumbnailLoaded && !thumbnailError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        
        {isImage && (
          <img 
            src={file.file_url} 
            alt={file.display_name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onLoad={() => setThumbnailLoaded(true)}
            onError={() => setThumbnailError(true)}
          />
        )}
        
        {isVideo && (
          <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center relative">
            {file.thumbnail_url && !thumbnailError ? (
              <img 
                src={file.thumbnail_url} 
                alt={`${file.display_name} thumbnail`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onLoad={() => setThumbnailLoaded(true)}
                onError={() => setThumbnailError(true)}
              />
            ) : (
              <Video className="h-12 w-12 text-gray-400" />
            )}
            
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/60 backdrop-blur-sm rounded-full p-4 transition-transform duration-200 group-hover:scale-110">
                <Play className="h-6 w-6 text-white ml-1" />
              </div>
            </div>
            
            {/* Video duration badge (if available) */}
            {file.metadata?.duration && (
              <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-mono">
                {Math.floor(file.metadata.duration / 60)}:{String(Math.floor(file.metadata.duration % 60)).padStart(2, '0')}
              </div>
            )}
          </div>
        )}

        {/* File Type Icon */}
        <div className="absolute top-2 right-2">
          <div className="bg-black/60 backdrop-blur-sm rounded-full p-2">
            {isVideo ? (
              <Video className="h-4 w-4 text-white" />
            ) : (
              <Image className="h-4 w-4 text-white" />
            )}
          </div>
        </div>
        
        {/* Error state */}
        {thumbnailError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Preview unavailable</p>
            </div>
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="p-4 space-y-3">
        {/* Header - Status Badge and More Menu */}
        <div className="flex items-center justify-between">
          <Badge className={`text-xs border ${getStatusBadgeStyle(file.status)} shadow-sm`}>
            {getStatusIcon(file.status)}
            <span className="ml-1 capitalize">{file.status}</span>
          </Badge>
          
          {/* More Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 p-0 opacity-60 hover:opacity-100 transition-opacity"
                data-prevent-card-click="true"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              side="bottom"
              sideOffset={4}
              className="z-[1050] w-40"
              portal={true}
              avoidCollisions={true}
            >
              <DropdownMenuItem onClick={handleDownload}>
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsEditingName(true)}>
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-red-600 focus:text-red-600"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* File Name */}
        <div className="space-y-2">
          {isEditingName ? (
            <div className="flex items-center space-x-2" data-prevent-card-click="true">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameSave();
                  if (e.key === 'Escape') {
                    setIsEditingName(false);
                    setEditedName(file.display_name);
                  }
                }}
                disabled={isUpdating}
                className="text-sm"
                autoFocus
              />
              <Button
                size="sm"
                onClick={handleNameSave}
                disabled={isUpdating || !editedName.trim()}
              >
                {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsEditingName(false);
                  setEditedName(file.display_name);
                }}
                disabled={isUpdating}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <h4 
                className="font-medium text-sm truncate flex-1" 
                title={file.display_name}
              >
                {file.display_name}
              </h4>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditingName(true)}
                disabled={isUpdating}
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                data-prevent-card-click="true"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* File Details */}
        <div className="text-xs text-muted-foreground space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">{formatFileSize(file.file_size)}</span>
            <span className="px-2 py-1 bg-muted rounded text-[10px] font-mono">
              {file.file_type.split('/')[1]?.toUpperCase()}
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{new Date(file.upload_date).toLocaleDateString()}</span>
          </div>
          
          {file.uploaded_by_name && (
            <div className="flex items-center space-x-1">
              <User className="h-3 w-3" />
              <span>Uploaded by {file.uploaded_by_name}</span>
            </div>
          )}
        </div>

        {/* Status Selector */}
        <div className="space-y-2" data-prevent-card-click="true">
          <Select 
            value={selectedStatus} 
            onValueChange={(value: RawFileStatus) => {
              setSelectedStatus(value);
              if (value === 'rejected' || value === 'reshoot') {
                // Will show notes input below
              } else {
                handleStatusUpdate(value);
              }
            }}
            disabled={isUpdating}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">
                <div className="flex items-center space-x-2">
                  <Clock className="h-3 w-3 text-yellow-600" />
                  <span>Pending</span>
                </div>
              </SelectItem>
              <SelectItem value="approved">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Approved</span>
                </div>
              </SelectItem>
              <SelectItem value="rejected">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-3 w-3 text-red-600" />
                  <span>Rejected</span>
                </div>
              </SelectItem>
              <SelectItem value="reshoot">
                <div className="flex items-center space-x-2">
                  <RotateCcw className="h-3 w-3 text-orange-600" />
                  <span>Reshoot</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Notes for rejection/reshoot */}
          {(selectedStatus === 'rejected' || selectedStatus === 'reshoot') && selectedStatus !== file.status && (
            <div className="space-y-2" data-prevent-card-click="true">
              <Textarea
                placeholder={`Enter ${selectedStatus} notes...`}
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                className="text-xs min-h-[60px] resize-none"
              />
              <div className="flex justify-end space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedStatus(file.status);
                    setStatusNotes(file.notes || '');
                  }}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleStatusUpdate(selectedStatus, statusNotes)}
                  disabled={isUpdating}
                >
                  {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Update'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Existing Notes */}
        {file.notes && (
          <div className="bg-muted/50 p-3 rounded-lg text-xs border">
            <div className="flex items-start space-x-2">
              <FileText className="h-3 w-3 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <p className="text-muted-foreground leading-relaxed">{file.notes}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}