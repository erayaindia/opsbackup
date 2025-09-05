import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { RawFilesService } from "@/services/rawFilesService";
import { 
  RawFile, 
  RawFileStatus, 
  formatFileSize, 
  getRawFileType 
} from "@/types/rawFiles";
import { 
  X, 
  ChevronLeft, 
  ChevronRight,
  Download, 
  Trash2, 
  Edit2,
  Check,
  Calendar,
  FileText,
  Video,
  Image,
  Loader2,
  User,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Maximize,
  Minimize,
  Share,
  Heart,
  Flag,
  Info
} from "lucide-react";

interface RawFilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: RawFile | null;
  files: RawFile[];
  onFileUpdated: (updatedFile: RawFile) => void;
  onFileDeleted: (fileId: string) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

export function RawFilePreviewModal({
  isOpen,
  onClose,
  file,
  files,
  onFileUpdated,
  onFileDeleted,
  onNavigate
}: RawFilePreviewModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(file?.display_name || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<RawFileStatus>(file?.status || 'pending');
  const [statusNotes, setStatusNotes] = useState(file?.notes || '');
  const [showVideoControls, setShowVideoControls] = useState(true);
  const [videoState, setVideoState] = useState({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    isBuffering: false
  });
  const [showInfo, setShowInfo] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const fileType = file ? getRawFileType(file.file_type) : null;
  const isVideo = fileType === 'video';
  const isImage = fileType === 'image';
  
  const currentIndex = files.findIndex(f => f.id === file?.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < files.length - 1;

  useEffect(() => {
    if (file) {
      setEditedName(file.display_name);
      setSelectedStatus(file.status);
      setStatusNotes(file.notes || '');
    }
  }, [file]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      
      // Prevent default for specific keys to avoid conflicts
      const preventDefaults = ['ArrowLeft', 'ArrowRight', ' ', 'f', 'F', 'm', 'M'];
      if (preventDefaults.includes(event.key)) {
        event.preventDefault();
      }
      
      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (hasPrev) onNavigate('prev');
          break;
        case 'ArrowRight':
          if (hasNext) onNavigate('next');
          break;
        case ' ':
          if (isVideo && videoRef.current) {
            togglePlayPause();
          }
          break;
        case 'f':
        case 'F':
          if (isVideo) {
            toggleFullscreen();
          }
          break;
        case 'm':
        case 'M':
          if (isVideo && videoRef.current) {
            toggleMute();
          }
          break;
        case 'a':
        case 'A':
          if (file?.status === 'pending') {
            handleStatusUpdate('approved');
          }
          break;
        case 'r':
        case 'R':
          if (file?.status === 'pending') {
            handleStatusUpdate('rejected', 'Quick reject via keyboard');
          }
          break;
        case 'd':
        case 'D':
          handleDownload();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // Note: Some dependencies omitted intentionally to prevent excessive re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, hasPrev, hasNext, isVideo, videoState.isMuted, file?.status]);

  // Video control functions
  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (videoState.isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    
    videoRef.current.muted = !videoRef.current.muted;
    setVideoState(prev => ({ 
      ...prev, 
      isMuted: videoRef.current!.muted 
    }));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const seekTo = (percentage: number) => {
    if (!videoRef.current) return;
    
    videoRef.current.currentTime = (percentage / 100) * videoRef.current.duration;
  };

  const changeVolume = (volume: number) => {
    if (!videoRef.current) return;
    
    videoRef.current.volume = volume;
    setVideoState(prev => ({ ...prev, volume }));
  };

  // File management functions
  const handleNameSave = async () => {
    if (!file || editedName.trim() === file.display_name || !editedName.trim()) {
      setIsEditingName(false);
      setEditedName(file?.display_name || '');
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

  const handleStatusUpdate = async (newStatus: RawFileStatus, notes?: string) => {
    if (!file || (newStatus === file.status && notes === file.notes)) return;

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

  const handleDelete = async () => {
    if (!file) return;
    
    setIsUpdating(true);
    try {
      await RawFilesService.deleteRawFile(file.id);
      onFileDeleted(file.id);
      onClose();
      
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

  const handleDownload = () => {
    if (!file) return;
    
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
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'reshoot': return <RotateCcw className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (!file) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-[min(90vw,1400px)] h-[calc(100vh-40px)] p-0 gap-0 overflow-hidden z-[1100]"
        onOpenAutoFocus={(e) => e.preventDefault()}
        aria-modal="true"
        role="dialog"
        aria-labelledby="preview-modal-title"
        aria-describedby="preview-modal-description"
      >
        <div className="flex flex-col h-full">
          {/* Hidden description for screen readers */}
          <div id="preview-modal-description" className="sr-only">
            Preview and manage {file.display_name}. File size: {formatFileSize(file.file_size)}. Status: {file.status}. Use arrow keys to navigate between files.
          </div>
          
          {/* Header */}
          <DialogHeader className="flex flex-row items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center space-x-4">
              <DialogTitle id="preview-modal-title" className="text-lg font-semibold">
                {isEditingName ? (
                  <div className="flex items-center space-x-2">
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
                      className="text-lg font-semibold min-w-0"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={handleNameSave}
                      disabled={isUpdating || !editedName.trim()}
                    >
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
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
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setIsEditingName(true)}>
                    <span>{file.display_name}</span>
                    <Edit2 className="h-4 w-4 opacity-50 hover:opacity-100" />
                  </div>
                )}
              </DialogTitle>
              
              <Badge className={`border ${getStatusBadgeStyle(file.status)}`}>
                {getStatusIcon(file.status)}
                <span className="ml-2 capitalize">{file.status}</span>
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} of {files.length}
              </span>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInfo(!showInfo)}
                className={showInfo ? 'bg-muted' : ''}
              >
                <Info className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex flex-1 min-h-0">
            {/* Media Preview */}
            <div className="flex-1 flex flex-col bg-black relative">
              {/* Navigation Arrows */}
              {hasPrev && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate('prev')}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/70 hover:bg-black/90 text-white border-0 rounded-full w-12 h-12"
                  title="Previous (←)"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}
              
              {hasNext && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate('next')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/70 hover:bg-black/90 text-white border-0 rounded-full w-12 h-12"
                  title="Next (→)"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              )}

              {/* Media Container with proper sizing */}
              <div className="flex-1 flex items-center justify-center p-4 min-h-0">
                <div className="relative w-full h-full max-w-full max-h-[calc(100vh-160px)] flex items-center justify-center">
                  {isImage && (
                    <img 
                      src={file.file_url} 
                      alt={file.display_name}
                      className="max-w-full max-h-full object-contain w-full h-full"
                      style={{ objectFit: 'contain' }}
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.src = '/placeholder-image.png'; // Fallback
                      }}
                    />
                  )}
                  
                  {isVideo && (
                    <div className="relative w-full h-full flex items-center justify-center">
                      {videoState.isBuffering && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                          <Loader2 className="h-8 w-8 animate-spin text-white" />
                        </div>
                      )}
                      <video 
                        ref={videoRef}
                        src={file.file_url}
                        className="max-w-full max-h-full w-full h-full object-contain"
                        style={{ objectFit: 'contain' }}
                        controls={showVideoControls}
                        playsInline
                        preload="metadata"
                        onPlay={() => setVideoState(prev => ({ ...prev, isPlaying: true }))}
                        onPause={() => setVideoState(prev => ({ ...prev, isPlaying: false }))}
                        onTimeUpdate={(e) => {
                          const video = e.target as HTMLVideoElement;
                          setVideoState(prev => ({ 
                            ...prev, 
                            currentTime: video.currentTime,
                            duration: video.duration || 0
                          }));
                        }}
                        onLoadStart={() => setVideoState(prev => ({ ...prev, isBuffering: true }))}
                        onCanPlay={() => setVideoState(prev => ({ ...prev, isBuffering: false }))}
                        onError={() => setVideoState(prev => ({ ...prev, isBuffering: false }))}
                      >
                        Your browser does not support the video tag.
                      </video>

                    {/* Custom Video Controls */}
                    <div className="absolute bottom-4 left-4 right-4 bg-black/80 rounded-lg p-4 space-y-3">
                      {/* Progress Bar */}
                      <div className="w-full">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={(videoState.currentTime / videoState.duration) * 100 || 0}
                          onChange={(e) => seekTo(Number(e.target.value))}
                          className="w-full accent-white"
                        />
                      </div>
                      
                      {/* Controls */}
                      <div className="flex items-center justify-between text-white">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={togglePlayPause}
                            className="text-white hover:text-white hover:bg-white/20"
                          >
                            {videoState.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleMute}
                            className="text-white hover:text-white hover:bg-white/20"
                          >
                            {videoState.isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                          </Button>
                          
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={videoState.volume}
                            onChange={(e) => changeVolume(Number(e.target.value))}
                            className="w-20 accent-white"
                          />
                          
                          <span className="text-sm">
                            {Math.floor(videoState.currentTime / 60)}:{String(Math.floor(videoState.currentTime % 60)).padStart(2, '0')} / 
                            {Math.floor(videoState.duration / 60)}:{String(Math.floor(videoState.duration % 60)).padStart(2, '0')}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleFullscreen}
                            className="text-white hover:text-white hover:bg-white/20"
                          >
                            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  )}
                </div>
              </div>

              {/* Media Info Overlay */}
              <div className="absolute bottom-4 left-4 bg-black/80 text-white rounded-lg p-3 text-sm z-10">
                <div className="space-y-1">
                  <div>{formatFileSize(file.file_size)} • {file.file_type.split('/')[1]?.toUpperCase()}</div>
                  {file.metadata?.width && file.metadata?.height && (
                    <div>{file.metadata.width} × {file.metadata.height}</div>
                  )}
                  {file.metadata?.duration && (
                    <div>{Math.floor(file.metadata.duration / 60)}:{String(Math.floor(file.metadata.duration % 60)).padStart(2, '0')}</div>
                  )}
                </div>
              </div>
              
              {/* Quick Action Buttons */}
              <div className="absolute top-4 right-4 flex space-x-2 z-10">
                {file.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate('approved')}
                      disabled={isUpdating}
                      className="bg-green-600 hover:bg-green-700 text-white border-0"
                      title="Approve"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate('rejected', 'Quick reject from preview')}
                      disabled={isUpdating}
                      className="bg-red-600 hover:bg-red-700 text-white border-0"
                      title="Reject"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  onClick={handleDownload}
                  className="bg-blue-600 hover:bg-blue-700 text-white border-0"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Sidebar */}
            {showInfo && (
              <div className="w-80 border-l bg-card p-6 space-y-6 overflow-y-auto">
                <div>
                  <h3 className="font-semibold mb-4">File Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Size</span>
                      <span>{formatFileSize(file.file_size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <span>{file.file_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Uploaded</span>
                      <span>{new Date(file.upload_date).toLocaleDateString()}</span>
                    </div>
                    {file.uploaded_by && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">By</span>
                        <span>{file.uploaded_by}</span>
                      </div>
                    )}
                    {file.metadata?.width && file.metadata?.height && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dimensions</span>
                        <span>{file.metadata.width} × {file.metadata.height}</span>
                      </div>
                    )}
                    {file.metadata?.duration && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration</span>
                        <span>{Math.floor(file.metadata.duration / 60)}:{String(Math.floor(file.metadata.duration % 60)).padStart(2, '0')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Management */}
                <div>
                  <h3 className="font-semibold mb-4">Status & Review</h3>
                  <div className="space-y-3">
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
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-yellow-600" />
                            <span>Pending</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="approved">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>Approved</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="rejected">
                          <div className="flex items-center space-x-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span>Rejected</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="reshoot">
                          <div className="flex items-center space-x-2">
                            <RotateCcw className="h-4 w-4 text-orange-600" />
                            <span>Reshoot</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Notes for rejection/reshoot */}
                    {(selectedStatus === 'rejected' || selectedStatus === 'reshoot') && selectedStatus !== file.status && (
                      <div className="space-y-2">
                        <Textarea
                          placeholder={`Enter ${selectedStatus} notes...`}
                          value={statusNotes}
                          onChange={(e) => setStatusNotes(e.target.value)}
                          className="min-h-[80px] resize-none"
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
                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update'}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Existing Notes */}
                    {file.notes && (
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <FileText className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground font-medium mb-1">Notes:</p>
                            <p className="text-sm">{file.notes}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div>
                  <h3 className="font-semibold mb-4">Actions</h3>
                  <div className="space-y-2">
                    <Button
                      onClick={handleDownload}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete File</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{file.display_name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Keyboard Shortcuts */}
                <div>
                  <h3 className="font-semibold mb-4">Keyboard Shortcuts</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Previous/Next</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">← →</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Close</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Esc</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Download</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">D</kbd>
                    </div>
                    {file.status === 'pending' && (
                      <>
                        <div className="flex justify-between">
                          <span>Approve</span>
                          <kbd className="px-2 py-1 bg-muted rounded text-xs">A</kbd>
                        </div>
                        <div className="flex justify-between">
                          <span>Reject</span>
                          <kbd className="px-2 py-1 bg-muted rounded text-xs">R</kbd>
                        </div>
                      </>
                    )}
                    {isVideo && (
                      <>
                        <div className="flex justify-between">
                          <span>Play/Pause</span>
                          <kbd className="px-2 py-1 bg-muted rounded text-xs">Space</kbd>
                        </div>
                        <div className="flex justify-between">
                          <span>Mute/Unmute</span>
                          <kbd className="px-2 py-1 bg-muted rounded text-xs">M</kbd>
                        </div>
                        <div className="flex justify-between">
                          <span>Fullscreen</span>
                          <kbd className="px-2 py-1 bg-muted rounded text-xs">F</kbd>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}