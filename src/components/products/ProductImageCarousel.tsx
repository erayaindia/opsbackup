import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  Star,
  StarOff,
  X,
  GripVertical,
  Upload,
  Loader2,
  AlertCircle,
  ImageIcon,
  FileIcon,
  FileVideo,
  FileText,
  Archive,
  Plus,
  Download
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { productFilesService, type ProductFile } from '@/services/productFilesService'
import ImageUploadZone from './ImageUploadZone'
import { ImagePreviewModal } from '@/components/fulfillment/packing/ImagePreviewModal'
import VideoPlayerModal from './VideoPlayerModal'

// Helper function to get file type icon
const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('video/')) return FileVideo
  if (fileType.startsWith('image/')) return ImageIcon
  if (fileType === 'application/pdf' || fileType.startsWith('text/')) return FileText
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) return FileText
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return FileText
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return Archive
  return FileIcon
}

// Helper function to render file preview
const renderFilePreview = (file: ProductFile) => {
  if (file.file_type?.startsWith('image/')) {
    return (
      <img
        src={file.file_url}
        alt={file.caption || 'Product file'}
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
          onLoadedMetadata={(e) => {
            // Seek to 1 second to show a frame
            const video = e.target as HTMLVideoElement
            video.currentTime = 1
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <FileVideo className="h-6 w-6 text-white drop-shadow-lg" />
        </div>
      </div>
    )
  }

  // For other file types, show icon only (no filename in compact view)
  const IconComponent = getFileIcon(file.file_type || '')
  return (
    <div className="w-full h-full flex items-center justify-center bg-muted-foreground/5">
      <IconComponent className="h-6 w-6 text-muted-foreground" />
    </div>
  )
}

interface SortableFileProps {
  file: ProductFile
  productName?: string
  fileIndex?: number
  totalFiles?: number
  onDelete: (id: string) => void
  onSetPrimary: (id: string) => void
  onPreview: (file: ProductFile) => void
  isDragging?: boolean
}

const SortableFile: React.FC<SortableFileProps> = ({
  file,
  productName,
  fileIndex = 1,
  totalFiles = 1,
  onDelete,
  onSetPrimary,
  onPreview,
  isDragging = false
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: file.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleClick = (e: React.MouseEvent) => {
    if (!isSortableDragging && !isDragging) {
      e.preventDefault()
      e.stopPropagation()
      console.log('File clicked:', file.file_name, file.file_type)
      onPreview(file)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group w-full h-full bg-muted rounded-lg overflow-hidden border-2 transition-all cursor-pointer',
        {
          'border-primary ring-1 ring-primary/20': file.is_primary,
          'border-border': !file.is_primary,
          'opacity-50 scale-95': isSortableDragging || isDragging,
          'hover:border-primary/50': !isSortableDragging && !isDragging
        }
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick(e as any)
        }
      }}
      aria-label={`Preview ${file.file_name || 'file'}`}
    >
      {/* File Display */}
      <div className="w-full h-full pointer-events-none">
        {renderFilePreview(file)}
      </div>

      {/* Primary badge - smaller for compact view */}
      {file.is_primary && (
        <div className="absolute top-1 left-1 w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center">
          <Star className="h-2 w-2 text-black fill-current" />
        </div>
      )}

      {/* Action buttons - visible on hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors pointer-events-none">
        {/* Drag handle - top right */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-0 right-0 w-4 h-4 bg-black/60 hover:bg-black/80 rounded-bl cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-2.5 w-2.5 text-white m-0.5" />
        </div>

        {/* Download button - top left */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-0 left-0 h-4 w-4 p-0 bg-blue-500/80 hover:bg-blue-600 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto rounded-br"
          onClick={async (e) => {
            e.stopPropagation()
            // Get file extension from the original filename or file type
            const extension = file.file_name?.split('.').pop() ||
                            (file.file_type?.startsWith('image/') ? 'jpg' :
                             file.file_type?.startsWith('video/') ? 'mp4' :
                             file.file_type?.includes('pdf') ? 'pdf' : 'file')

            // Build filename with product name and number if multiple files
            let filename: string
            if (productName) {
              if (totalFiles > 1) {
                filename = `${productName} (${fileIndex}).${extension}`
              } else {
                filename = `${productName}.${extension}`
              }
            } else {
              filename = file.file_name || `download.${extension}`
            }

            console.log('Download debug:', { productName, fileIndex, totalFiles, filename })

            try {
              // Fetch the file as a blob with CORS mode
              const response = await fetch(file.file_url, {
                mode: 'cors',
                credentials: 'omit'
              })

              if (!response.ok) {
                throw new Error('Failed to fetch file')
              }

              const blob = await response.blob()

              // Create a blob URL and trigger download
              const blobUrl = window.URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.style.display = 'none'
              link.href = blobUrl
              link.download = filename
              link.setAttribute('download', filename) // Force download attribute

              document.body.appendChild(link)
              link.click()

              // Clean up
              setTimeout(() => {
                document.body.removeChild(link)
                window.URL.revokeObjectURL(blobUrl)
              }, 100)

              toast({
                title: 'Download Started',
                description: `Downloading ${filename}`,
              })
            } catch (error) {
              console.error('Download failed:', error)
              toast({
                title: 'Download Failed',
                description: 'Failed to download file',
                variant: 'destructive'
              })
            }
          }}
          aria-label="Download file"
        >
          <Download className="h-2.5 w-2.5" />
        </Button>

        {/* Delete button - bottom right */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute bottom-0 right-0 h-4 w-4 p-0 bg-red-500/80 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto rounded-tl"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(file.id)
          }}
          aria-label="Delete file"
        >
          <X className="h-2.5 w-2.5" />
        </Button>

        {/* Set primary button - bottom left */}
        {!file.is_primary && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute bottom-0 left-0 h-4 w-4 p-0 bg-yellow-500/80 hover:bg-yellow-600 text-black opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto rounded-tr"
            onClick={(e) => {
              e.stopPropagation()
              onSetPrimary(file.id)
            }}
            aria-label="Set as primary"
          >
            <StarOff className="h-2.5 w-2.5" />
          </Button>
        )}
      </div>

    </div>
  )
}

interface ProductImageCarouselProps {
  productId?: string
  productName?: string
  className?: string
  maxImages?: number
  onImagesChange?: (files: ProductFile[]) => void
}

export const ProductImageCarousel: React.FC<ProductImageCarouselProps> = ({
  productId,
  productName,
  className,
  maxImages = 10,
  onImagesChange
}) => {
  const [files, setFiles] = useState<ProductFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [reordering, setReordering] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tableNotExists, setTableNotExists] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [previewIndex, setPreviewIndex] = useState(0)
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [currentVideo, setCurrentVideo] = useState<{ url: string; title: string } | null>(null)
  const loadedProductId = useRef<string | null>(null)
  const isLoadingRef = useRef(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Load files for the product
  const loadFiles = useCallback(async () => {
    if (!productId) {
      console.log('No productId provided, skipping file load')
      setLoading(false)
      setFiles([])
      loadedProductId.current = null
      return
    }

    // Prevent loading if already loading or already loaded for this product
    if (isLoadingRef.current || loadedProductId.current === productId) {
      // console.log('Already loading or loaded for product:', productId)
      return
    }

    // console.log('Loading files for product:', productId)
    isLoadingRef.current = true

    try {
      setLoading(true)
      setError(null)
      const productFiles = await productFilesService.getProductFiles(productId)

      // Sort files so primary file comes first, then others by display_order
      const sortedFiles = productFiles.sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1
        if (!a.is_primary && b.is_primary) return 1
        return a.display_order - b.display_order
      })

      setFiles(sortedFiles)
      loadedProductId.current = productId
    } catch (error) {
      console.error('Failed to load files:', error)

      // Handle table not existing gracefully - don't show error to user
      if (error instanceof Error &&
          (error.message?.includes('relation') ||
           error.message?.includes('does not exist') ||
           error.message?.includes('42P01'))) {
        console.warn('Product files table does not exist yet. Using empty state.')
        setFiles([])
        setTableNotExists(true)
        loadedProductId.current = productId
        // Don't set error state for missing table
      } else {
        setError('Failed to load files')
        toast({
          title: 'Error',
          description: 'Failed to load product files',
          variant: 'destructive'
        })
      }
    } finally {
      setLoading(false)
      isLoadingRef.current = false
    }
  }, [productId])

  useEffect(() => {
    // Reset loading state when productId changes
    if (productId && loadedProductId.current !== productId) {
      loadedProductId.current = null
      loadFiles()
    }
  }, [productId, loadFiles])

  // Separate effect to call onImagesChange when files change
  useEffect(() => {
    onImagesChange?.(files)
  }, [files, onImagesChange])

  // Handle file uploads
  const handleFilesAdded = useCallback(async (newFiles: File[]) => {
    if (!productId || newFiles.length === 0) return

    // Check if table exists first
    if (tableNotExists) {
      toast({
        title: 'Database Setup Required',
        description: 'Please run the database migration first: npx supabase db push',
        variant: 'destructive'
      })
      return
    }

    setUploading(true)
    try {
      const uploadedFiles = await productFilesService.uploadFiles(productId, newFiles, {
        isPrimary: files.length === 0 // First file becomes primary if no existing files
      })

      if (uploadedFiles.length > 0) {
        const updatedFiles = [...files, ...uploadedFiles].sort((a, b) => a.display_order - b.display_order)
        setFiles(updatedFiles)
        onImagesChange?.(updatedFiles)
        setTableNotExists(false) // Reset flag since upload worked

        toast({
          title: 'Success',
          description: `Uploaded ${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''}`,
        })
      }
    } catch (error) {
      console.error('Upload failed:', error)

      // Check if this is a table not exists error
      if (error instanceof Error &&
          (error.message?.includes('relation') ||
           error.message?.includes('does not exist') ||
           error.message?.includes('42P01'))) {
        setTableNotExists(true)
        toast({
          title: 'Database Setup Required',
          description: 'Please run the database migration first: npx supabase db push',
          variant: 'destructive'
        })
      } else {
        toast({
          title: 'Upload Failed',
          description: error instanceof Error ? error.message : 'Failed to upload files',
          variant: 'destructive'
        })
      }
    } finally {
      setUploading(false)
    }
  }, [productId, files, onImagesChange, tableNotExists])

  // Handle file deletion
  const handleDeleteFile = useCallback(async (fileId: string) => {
    try {
      await productFilesService.deleteFile(fileId)
      const updatedFiles = files.filter(file => file.id !== fileId)
      setFiles(updatedFiles)
      onImagesChange?.(updatedFiles)

      toast({
        title: 'Success',
        description: 'File deleted successfully',
      })
    } catch (error) {
      console.error('Delete failed:', error)
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete file',
        variant: 'destructive'
      })
    }
  }, [files, onImagesChange])

  // Handle setting primary file
  const handleSetPrimary = useCallback(async (fileId: string) => {
    try {
      await productFilesService.setPrimaryFile(productId, fileId)

      // Update files: set primary and reorder so primary comes first
      const updatedFiles = files.map(file => ({
        ...file,
        is_primary: file.id === fileId
      }))

      // Sort files so primary file comes first, then others by display_order
      const sortedFiles = updatedFiles.sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1
        if (!a.is_primary && b.is_primary) return 1
        return a.display_order - b.display_order
      })

      setFiles(sortedFiles)
      onImagesChange?.(sortedFiles)

      toast({
        title: 'Success',
        description: 'Primary file updated',
      })
    } catch (error) {
      console.error('Set primary failed:', error)
      toast({
        title: 'Update Failed',
        description: 'Failed to set primary file',
        variant: 'destructive'
      })
    }
  }, [productId, files, onImagesChange])

  // Handle file preview
  const handlePreview = useCallback((file: ProductFile) => {
    if (file.file_type?.startsWith('video/')) {
      // Open video player modal for videos
      setCurrentVideo({
        url: file.file_url,
        title: file.file_name || file.caption || 'Video'
      })
      setVideoModalOpen(true)
    } else if (file.file_type?.startsWith('image/')) {
      // Open image preview modal for images
      const imageUrls = files.filter(f => f.file_type?.startsWith('image/')).map(f => f.file_url)
      const index = files.filter(f => f.file_type?.startsWith('image/')).findIndex(f => f.id === file.id)
      setPreviewImages(imageUrls)
      setPreviewIndex(index >= 0 ? index : 0)
      setPreviewModalOpen(true)
    } else {
      // For other file types, open in new tab or download
      window.open(file.file_url, '_blank')
    }
  }, [files])

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  // Handle drag end (reordering)
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    setReordering(true)
    try {
      const oldIndex = files.findIndex(img => img.id === active.id)
      const newIndex = files.findIndex(img => img.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newFiles = arrayMove(files, oldIndex, newIndex)

        // Update display orders
        const imageOrders = newImages.map((img, index) => ({
          id: img.id,
          order: index
        }))

        setImages(newImages)
        onImagesChange?.(newImages)

        // Update in database
        await productImagesService.reorderImages(productId, imageOrders)

        toast({
          title: 'Success',
          description: 'Images reordered successfully',
        })
      }
    } catch (error) {
      console.error('Reorder failed:', error)
      // Reload files to restore correct order
      loadFiles()
      toast({
        title: 'Reorder Failed',
        description: 'Failed to reorder files',
        variant: 'destructive'
      })
    } finally {
      setReordering(false)
    }
  }, [files, productId, onImagesChange, loadFiles])

  const currentDraggedFile = activeId ? files.find(img => img.id === activeId) : null

  // Show a different message if no productId yet
  if (!productId) {
    return (
      <div className={cn('space-y-4', className)}>
        <Label className="text-sm font-medium">Product Files</Label>
        <div className="flex items-center justify-center h-32 bg-muted rounded-lg">
          <div className="text-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Save the product first to add files</p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <Label className="text-sm font-medium">Product Files</Label>
        <div className="flex items-center justify-center h-32 bg-muted rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('space-y-4', className)}>
        <Label className="text-sm font-medium">Product Files</Label>
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={loadImages}
            className="ml-auto"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Media</Label>
        {reordering && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Reordering...
          </div>
        )}
      </div>

      {/* Responsive Media Grid Layout */}
      <div className="flex flex-wrap gap-3 items-start justify-start">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={files.map(file => file.id)} strategy={rectSortingStrategy}>
            {files.map((file, index) => (
              <div key={file.id} className="w-48 h-48 flex-shrink-0">
                <SortableFile
                  file={file}
                  productName={productName}
                  fileIndex={index + 1}
                  totalFiles={files.length}
                  onDelete={handleDeleteFile}
                  onSetPrimary={handleSetPrimary}
                  onPreview={handlePreview}
                  isDragging={activeId === file.id}
                />
              </div>
            ))}
          </SortableContext>

          <DragOverlay>
            {currentDraggedFile ? (
              <div className="w-44 h-44 bg-muted rounded-lg overflow-hidden border-2 border-primary shadow-lg">
                {renderFilePreview(currentDraggedFile)}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Test Dashed Box - Same size as media cards */}
        {files.length < maxImages && (
          <button
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.multiple = true
              input.accept = 'image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/*,application/zip'
              input.onchange = (e) => {
                const files = (e.target as HTMLInputElement).files
                if (files && files.length > 0) {
                  handleFilesAdded(Array.from(files))
                }
              }
              input.click()
            }}
            disabled={uploading || reordering || tableNotExists}
            className="!w-48 !h-48 flex-shrink-0 bg-transparent rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-all p-0 m-0"
            aria-label="Upload media files"
          >
            <Plus className="h-8 w-8 text-muted-foreground" />
          </button>
        )}

      </div>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        images={previewImages}
        currentIndex={previewIndex}
        onIndexChange={setPreviewIndex}
        title="Product Images"
      />

      <VideoPlayerModal
        open={videoModalOpen}
        onClose={() => {
          setVideoModalOpen(false)
          setCurrentVideo(null)
        }}
        videoUrl={currentVideo?.url || ''}
        videoTitle={currentVideo?.title}
      />
    </div>
  )
}

export default ProductImageCarousel