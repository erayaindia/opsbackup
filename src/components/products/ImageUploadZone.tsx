import React, { useCallback, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { Upload, ImagePlus, X, AlertCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ImageUploadZoneProps {
  onFilesAdded: (files: File[]) => void
  onUploadProgress?: (progress: number) => void
  isUploading?: boolean
  maxFiles?: number
  currentFileCount?: number
  className?: string
  disabled?: boolean
}

export const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({
  onFilesAdded,
  onUploadProgress,
  isUploading = false,
  maxFiles = 10,
  currentFileCount = 0,
  className,
  disabled = false
}) => {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)

  const remainingSlots = maxFiles - currentFileCount

  const validateFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const validFiles: File[] = []
    const errors: string[] = []

    // Check if adding these files would exceed the limit
    if (fileArray.length > remainingSlots) {
      errors.push(`Can only add ${remainingSlots} more images (${currentFileCount}/${maxFiles} used)`)
      return { validFiles: [], errors }
    }

    fileArray.forEach((file, index) => {
      // Check file type
      const allowedTypes = [
        // Images
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
        // Videos
        'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm',
        // Documents
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain', 'text/csv',
        // Archives
        'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
      ]

      if (!allowedTypes.includes(file.type)) {
        errors.push(`File ${index + 1}: File type not supported. Allowed: images, videos, PDFs, documents, and archives`)
        return
      }

      // Check file size (50MB limit)
      const maxSize = 50 * 1024 * 1024
      if (file.size > maxSize) {
        errors.push(`File ${index + 1}: File size must be less than 50MB`)
        return
      }

      validFiles.push(file)
    })

    return { validFiles, errors }
  }, [remainingSlots, currentFileCount, maxFiles])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true)
    }
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled || isUploading) return

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const { validFiles, errors } = validateFiles(e.dataTransfer.files)

      if (errors.length > 0) {
        errors.forEach(error => {
          toast({
            title: 'Upload Error',
            description: error,
            variant: 'destructive'
          })
        })
      }

      if (validFiles.length > 0) {
        setSelectedFiles(validFiles)
        onFilesAdded(validFiles)
      }
    }
  }, [disabled, isUploading, validateFiles, onFilesAdded])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input changed, files:', e.target.files?.length)
    if (disabled || isUploading) return

    if (e.target.files && e.target.files.length > 0) {
      const { validFiles, errors } = validateFiles(e.target.files)
      console.log('Valid files:', validFiles.length, 'Errors:', errors.length)

      if (errors.length > 0) {
        errors.forEach(error => {
          toast({
            title: 'Upload Error',
            description: error,
            variant: 'destructive'
          })
        })
      }

      if (validFiles.length > 0) {
        setSelectedFiles(validFiles)
        onFilesAdded(validFiles)
      }

      // Reset input
      e.target.value = ''
    }
  }, [disabled, isUploading, validateFiles, onFilesAdded])

  const removeSelectedFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  const clearSelectedFiles = useCallback(() => {
    setSelectedFiles([])
  }, [])

  React.useEffect(() => {
    if (onUploadProgress) {
      onUploadProgress(uploadProgress)
    }
  }, [uploadProgress, onUploadProgress])

  const canAddMore = remainingSlots > 0 && !disabled

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleZoneClick = useCallback(() => {
    console.log('Upload zone clicked, canAddMore:', canAddMore, 'isUploading:', isUploading)
    if (canAddMore && !isUploading && fileInputRef.current) {
      console.log('Opening file dialog...')
      fileInputRef.current.click()
    }
  }, [canAddMore, isUploading])

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Zone */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 transition-all duration-200',
          {
            'border-primary bg-primary/5': dragActive && canAddMore,
            'border-muted-foreground/25 hover:border-muted-foreground/50': !dragActive && canAddMore,
            'border-muted-foreground/10 bg-muted/30 cursor-not-allowed': !canAddMore,
            'pointer-events-none opacity-50': isUploading,
            'cursor-pointer': canAddMore && !isUploading
          }
        )}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleZoneClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/*,application/zip"
          onChange={handleFileInput}
          disabled={!canAddMore || isUploading}
          className="hidden"
          aria-label="Upload product files"
        />

        <div className="flex flex-col items-center justify-center text-center space-y-3">
          {isUploading ? (
            <>
              <Upload className="h-8 w-8 text-primary animate-pulse" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Uploading images...</p>
                <Progress value={uploadProgress} className="w-48" />
              </div>
            </>
          ) : (
            <>
              <ImagePlus className={cn(
                'h-8 w-8',
                canAddMore ? 'text-muted-foreground' : 'text-muted-foreground/50'
              )} />
              <div className="space-y-1">
                <p className={cn(
                  'text-sm font-medium',
                  canAddMore ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {canAddMore ? 'Drop files here or click to browse' : 'Maximum files reached'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {canAddMore ? (
                    <>Images, videos, PDFs, documents up to 50MB each ({remainingSlots} slots remaining)</>
                  ) : (
                    <>Using {currentFileCount}/{maxFiles} file slots</>
                  )}
                </p>
              </div>
            </>
          )}
        </div>

        {dragActive && canAddMore && (
          <div className="absolute inset-0 bg-primary/10 border-2 border-primary rounded-lg pointer-events-none" />
        )}
      </div>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Selected Files ({selectedFiles.length})</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelectedFiles}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {selectedFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} className="relative group">
                <div className="aspect-square bg-muted rounded-lg overflow-hidden border">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full h-full object-cover"
                    onLoad={(e) => {
                      // Clean up object URL after image loads
                      URL.revokeObjectURL((e.target as HTMLImageElement).src)
                    }}
                  />
                </div>

                {/* Remove button */}
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeSelectedFile(index)}
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-3 w-3" />
                </Button>

                {/* File info */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p>{(file.size / 1024 / 1024).toFixed(1)}MB</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Status */}
      {!canAddMore && !isUploading && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Maximum of {maxFiles} files allowed per product. Remove existing files to add new ones.
          </p>
        </div>
      )}
    </div>
  )
}

export default ImageUploadZone