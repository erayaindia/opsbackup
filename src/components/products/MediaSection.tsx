import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  Plus,
  X,
  Star,
  StarOff,
  Eye,
  FileIcon,
  ImageIcon,
  FileVideo,
  Upload,
  Loader2
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface MediaFile {
  id: string
  file_name: string
  file_url: string
  file_type: string
  file_size: number
  is_primary: boolean
  display_order: number
  caption?: string
}

interface MediaSectionProps {
  files: MediaFile[]
  onFilesChange: (files: MediaFile[]) => void
  maxFiles?: number
  uploading?: boolean
  onUpload: (files: File[]) => Promise<void>
  onDelete: (fileId: string) => Promise<void>
  onSetPrimary: (fileId: string) => Promise<void>
  onPreview: (file: MediaFile) => void
}

// Helper function to get file type icon
const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('video/')) return FileVideo
  if (fileType.startsWith('image/')) return ImageIcon
  return FileIcon
}

// Helper function to render file preview
const renderFilePreview = (file: MediaFile) => {
  if (file.file_type?.startsWith('image/')) {
    return (
      <img
        src={file.file_url}
        alt={file.caption || 'Media file'}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    )
  }

  if (file.file_type?.startsWith('video/')) {
    return (
      <div className="relative w-full h-full">
        <video
          src={file.file_url}
          className="w-full h-full object-cover"
          muted
          preload="metadata"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <FileVideo className="h-8 w-8 text-white drop-shadow-lg" />
        </div>
      </div>
    )
  }

  // For other file types, show icon
  const IconComponent = getFileIcon(file.file_type || '')
  return (
    <div className="w-full h-full flex items-center justify-center bg-muted/10">
      <IconComponent className="h-8 w-8 text-muted-foreground" />
    </div>
  )
}

// Media Card Component
const MediaCard: React.FC<{
  file: MediaFile
  onDelete: (id: string) => void
  onSetPrimary: (id: string) => void
  onPreview: (file: MediaFile) => void
}> = ({ file, onDelete, onSetPrimary, onPreview }) => {
  return (
    <div
      className={cn(
        'relative group w-48 h-48 bg-muted rounded-lg overflow-hidden border-2 transition-all cursor-pointer',
        {
          'border-primary ring-2 ring-primary/20': file.is_primary,
          'border-border hover:border-primary/50': !file.is_primary
        }
      )}
      onClick={() => onPreview(file)}
    >
      {/* File Display */}
      <div className="w-full h-full">
        {renderFilePreview(file)}
      </div>

      {/* Primary badge */}
      {file.is_primary && (
        <div className="absolute top-2 left-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
          <Star className="h-3 w-3 text-black fill-current" />
        </div>
      )}

      {/* Action buttons - visible on hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors">
        {/* Delete button */}
        <Button
          variant="destructive"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(file.id)
          }}
        >
          <X className="h-3 w-3" />
        </Button>

        {/* Set primary button */}
        {!file.is_primary && (
          <Button
            variant="secondary"
            size="sm"
            className="absolute bottom-2 left-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-yellow-500/80 hover:bg-yellow-600"
            onClick={(e) => {
              e.stopPropagation()
              onSetPrimary(file.id)
            }}
          >
            <StarOff className="h-3 w-3 text-black" />
          </Button>
        )}

        {/* Preview button */}
        <Button
          variant="secondary"
          size="sm"
          className="absolute bottom-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 hover:bg-black/80"
          onClick={(e) => {
            e.stopPropagation()
            onPreview(file)
          }}
        >
          <Eye className="h-3 w-3 text-white" />
        </Button>
      </div>
    </div>
  )
}

// Upload Card Component
const UploadCard: React.FC<{
  onUpload: (files: File[]) => void
  uploading: boolean
  disabled: boolean
}> = ({ onUpload, uploading, disabled }) => {
  const handleClick = () => {
    if (disabled || uploading) return

    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = 'image/*,video/*,application/pdf,.doc,.docx,.txt'
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files && files.length > 0) {
        onUpload(Array.from(files))
      }
    }
    input.click()
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || uploading}
      className={cn(
        'w-48 h-48 bg-transparent rounded-lg border-2 border-dashed transition-all',
        'flex flex-col items-center justify-center gap-3',
        {
          'border-muted-foreground/30 hover:border-muted-foreground/50 cursor-pointer': !disabled && !uploading,
          'border-muted-foreground/20 cursor-not-allowed opacity-50': disabled || uploading
        }
      )}
    >
      {uploading ? (
        <>
          <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
          <span className="text-sm text-muted-foreground">Uploading...</span>
        </>
      ) : (
        <>
          <Plus className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Upload Files</span>
        </>
      )}
    </button>
  )
}

// Main Media Section Component
export const MediaSection: React.FC<MediaSectionProps> = ({
  files,
  onFilesChange,
  maxFiles = 10,
  uploading = false,
  onUpload,
  onDelete,
  onSetPrimary,
  onPreview
}) => {
  const handleUpload = async (newFiles: File[]) => {
    try {
      await onUpload(newFiles)
    } catch (error) {
      console.error('Upload failed:', error)
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload files. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async (fileId: string) => {
    try {
      await onDelete(fileId)
    } catch (error) {
      console.error('Delete failed:', error)
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete file. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleSetPrimary = async (fileId: string) => {
    try {
      await onSetPrimary(fileId)
    } catch (error) {
      console.error('Set primary failed:', error)
      toast({
        title: 'Update Failed',
        description: 'Failed to set primary file. Please try again.',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Media</Label>
        <span className="text-xs text-muted-foreground">
          {files.length} / {maxFiles} files
        </span>
      </div>

      {/* Media Grid */}
      <div className="flex flex-wrap gap-4 items-start">
        {/* Existing Files */}
        {files.map((file) => (
          <MediaCard
            key={file.id}
            file={file}
            onDelete={handleDelete}
            onSetPrimary={handleSetPrimary}
            onPreview={onPreview}
          />
        ))}

        {/* Upload Card */}
        {files.length < maxFiles && (
          <UploadCard
            onUpload={handleUpload}
            uploading={uploading}
            disabled={uploading}
          />
        )}
      </div>

      {/* Empty State */}
      {files.length === 0 && !uploading && (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-sm">No media files yet</p>
          <p className="text-xs">Upload images, videos, or documents</p>
        </div>
      )}
    </div>
  )
}

export default MediaSection