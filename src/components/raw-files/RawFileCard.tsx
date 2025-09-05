import { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { RawFilesService } from "@/services/rawFilesService";
import { 
  RawFile, 
  RawFileStatus, 
  formatFileSize, 
  getStatusColor, 
  getStatusIcon,
  getRawFileType 
} from "@/types/rawFiles";
import { 
  Edit2, 
  Check, 
  X, 
  Download, 
  Trash2, 
  Eye, 
  Calendar,
  FileText,
  Video,
  Image,
  Loader2
} from "lucide-react";

interface RawFileCardProps {
  file: RawFile;
  onFileUpdated: (updatedFile: RawFile) => void;
  onFileDeleted: (fileId: string) => void;
}

export function RawFileCard({ 
  file, 
  onFileUpdated, 
  onFileDeleted 
}: RawFileCardProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(file.display_name);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<RawFileStatus>(file.status);
  const [statusNotes, setStatusNotes] = useState(file.notes || '');
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const fileType = getRawFileType(file.file_type);
  const isVideo = fileType === 'video';
  const isImage = fileType === 'image';

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

  // Handle name cancel
  const handleNameCancel = () => {
    setEditedName(file.display_name);
    setIsEditingName(false);
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
    if (!confirm(`Are you sure you want to delete "${file.display_name}"? This cannot be undone.`)) {
      return;
    }

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

  return (
    <div className="bg-card border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* File Preview/Thumbnail */}
      <div className="relative aspect-video bg-muted flex items-center justify-center">
        {isImage && (
          <img 
            src={file.file_url} 
            alt={file.display_name}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => setShowPreview(true)}
          />
        )}
        
        {isVideo && (
          <div 
            className="w-full h-full bg-gray-900 flex items-center justify-center cursor-pointer relative"
            onClick={() => setShowPreview(true)}
          >
            {file.thumbnail_url ? (
              <img 
                src={file.thumbnail_url} 
                alt={file.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Video className="h-12 w-12 text-gray-400" />
            )}
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="bg-black/60 rounded-full p-3">
                <Video className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        )}

        {/* File Type Icon */}
        <div className="absolute top-2 left-2">
          <div className="bg-black/60 rounded-full p-2">
            {isVideo ? (
              <Video className="h-4 w-4 text-white" />
            ) : (
              <Image className="h-4 w-4 text-white" />
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          <Badge className={`text-xs ${getStatusColor(file.status)}`}>
            {getStatusIcon(file.status)} {file.status}
          </Badge>
        </div>
      </div>

      {/* File Info */}
      <div className="p-4 space-y-3">
        {/* File Name */}
        <div className="space-y-2">
          {isEditingName ? (
            <div className="flex items-center space-x-2">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleNameSave();
                  if (e.key === 'Escape') handleNameCancel();
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
                onClick={handleNameCancel}
                disabled={isUpdating}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-sm truncate flex-1" title={file.display_name}>
                {file.display_name}
              </h4>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditingName(true)}
                disabled={isUpdating}
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* File Details */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center space-x-4">
            <span>{formatFileSize(file.file_size)}</span>
            <span>{file.file_type}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{new Date(file.upload_date).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Status Selector */}
        <div className="space-y-2">
          <Select 
            value={selectedStatus} 
            onValueChange={(value: RawFileStatus) => {
              if (value === 'rejected' || value === 'reshoot') {
                // Open dialog for notes
                setSelectedStatus(value);
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
              <SelectItem value="pending">🟡 Pending</SelectItem>
              <SelectItem value="approved">✅ Approved</SelectItem>
              <SelectItem value="rejected">❌ Rejected</SelectItem>
              <SelectItem value="reshoot">🔄 Reshoot</SelectItem>
            </SelectContent>
          </Select>

          {/* Notes for rejection/reshoot */}
          {(selectedStatus === 'rejected' || selectedStatus === 'reshoot') && selectedStatus !== file.status && (
            <div className="space-y-2">
              <Textarea
                placeholder={`Enter ${selectedStatus} notes...`}
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                className="text-xs min-h-[60px]"
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
          <div className="bg-muted p-2 rounded text-xs">
            <div className="flex items-start space-x-2">
              <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <p className="text-muted-foreground">{file.notes}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-2 border-t">
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowPreview(true)}
              className="h-8 px-2"
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDownload}
              className="h-8 px-2"
            >
              <Download className="h-3 w-3" />
            </Button>
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            disabled={isUpdating}
            className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{file.display_name}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            {isImage && (
              <img 
                src={file.file_url} 
                alt={file.display_name}
                className="max-w-full max-h-[70vh] object-contain"
              />
            )}
            {isVideo && (
              <video 
                src={file.file_url}
                controls
                className="max-w-full max-h-[70vh]"
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}