import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import {
  X,
  Edit3,
  Save,
  Trash2,
  ImagePlus,
  Package,
  Lightbulb,
  Factory,
  Camera,
  TrendingUp
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'

import type { LifecycleProduct, CreateProductPayload } from '@/services/productLifecycleService'
import { FormContent } from './FormContent'
import { useUsers } from '@/hooks/useUsers'
import { useSuppliers } from '@/hooks/useSuppliers'

interface ProductDetailsModalProps {
  product: LifecycleProduct | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (updatedProduct: LifecycleProduct) => void
  onUpdateProduct: (productId: string, updates: Partial<CreateProductPayload>) => Promise<LifecycleProduct>
  onDeleteProduct: (productId: string) => Promise<void>
}

const STAGE_CONFIG = {
  idea: { name: 'Idea', icon: Lightbulb, color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950' },
  production: { name: 'Production', icon: Factory, color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-950' },
  content: { name: 'Content', icon: Camera, color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950' },
  scaling: { name: 'Scaling', icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-950' },
  inventory: { name: 'Inventory', icon: Package, color: 'text-gray-600', bgColor: 'bg-gray-50 dark:bg-gray-950' }
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  open,
  onOpenChange,
  onUpdate,
  onUpdateProduct,
  onDeleteProduct
}) => {
  const [isEditMode, setIsEditMode] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Form state for editing
  const [editForm, setEditForm] = useState({
    title: '',
    tags: '',
    category: '',
    competitorLinks: '',
    adLinks: '',
    notes: '',
    problemStatement: '',
    opportunityStatement: '',
    estimatedSourcePriceMin: '',
    estimatedSourcePriceMax: '',
    estimatedSellingPrice: '',
    selectedSupplierId: '',
    priority: 'medium',
    stage: 'idea',
    assignedTo: ''
  })

  // Edit-specific state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [referenceLinks, setReferenceLinks] = useState<Array<{url: string, type: 'competitor' | 'ad'}>>([])
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [uploadedVideos, setUploadedVideos] = useState<File[]>([])
  const [uploadedProductImage, setUploadedProductImage] = useState<File | null>(null)
  const [currentProductImage, setCurrentProductImage] = useState<string | null>(null)
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  // Hooks
  const { users: availableUsers, loading: usersLoading } = useUsers()
  const { suppliers, loading: suppliersLoading } = useSuppliers()

  // Initialize form data when product changes and always start in edit mode
  useEffect(() => {
    if (product && open) {
      setEditForm({
        title: product.workingTitle || product.name || '',
        tags: product.tags.join(', '),
        category: product.category.join(', '),
        competitorLinks: product.ideaData?.competitorLinks?.join('\n') || '',
        adLinks: product.ideaData?.adLinks?.join('\n') || '',
        notes: product.ideaData?.notes || '',
        problemStatement: product.ideaData?.problemStatement || '',
        opportunityStatement: product.ideaData?.opportunityStatement || '',
        estimatedSourcePriceMin: product.ideaData?.estimatedSourcePriceMin?.toString() || '',
        estimatedSourcePriceMax: product.ideaData?.estimatedSourcePriceMax?.toString() || '',
        estimatedSellingPrice: product.ideaData?.estimatedSellingPrice?.toString() || '',
        selectedSupplierId: product.ideaData?.selectedSupplierId || '',
        priority: product.priority,
        stage: product.stage,
        assignedTo: product.teamLead.id
      })

      setSelectedCategories(product.category)
      setTags(product.tags)

      // Load existing reference links from database
      const existingReferenceLinks: Array<{url: string, type: 'competitor' | 'ad'}> = [
        ...(product.ideaData?.competitorLinks || []).map(url => ({ url, type: 'competitor' as const })),
        ...(product.ideaData?.adLinks || []).map(url => ({ url, type: 'ad' as const }))
      ]
      setReferenceLinks(existingReferenceLinks)

      // Initialize current product image and reset upload states
      setCurrentProductImage(product.thumbnail || product.thumbnailUrl || null)
      setRemoveCurrentImage(false)
      setUploadedImages([])
      setUploadedVideos([])
      setUploadedProductImage(null)
      setIsEditMode(true) // Always start in edit mode
    }
  }, [product, open])

  if (!product) return null

  const stageConfig = STAGE_CONFIG[product.stage]
  const StageIcon = stageConfig?.icon || Package

  const handleCancelEdit = () => {
    // Close the modal instead of switching to view mode
    onOpenChange(false)
  }

  const handleUpdateProduct = async () => {
    try {
      setIsUpdating(true)

      // Validate required fields
      if (!editForm.title.trim()) {
        toast({
          title: 'Product Name required',
          description: 'Please enter a product name.',
          variant: 'destructive'
        })
        return
      }

      if (!editForm.assignedTo) {
        toast({
          title: 'Assigned To required',
          description: 'Please select a team member to assign this product to.',
          variant: 'destructive'
        })
        return
      }

      // Prepare update payload with all fields
      const updatePayload: Partial<CreateProductPayload> = {
        title: editForm.title.trim(),
        tags: tags.length > 0 ? tags : [],
        category: selectedCategories.length > 0 ? selectedCategories : [],
        competitorLinks: referenceLinks.filter(link => link.type === 'competitor').map(link => link.url),
        adLinks: referenceLinks.filter(link => link.type === 'ad').map(link => link.url),
        notes: editForm.notes.trim() || undefined,
        problemStatement: editForm.problemStatement.trim() || undefined,
        opportunityStatement: editForm.opportunityStatement.trim() || undefined,
        estimatedSourcePriceMin: editForm.estimatedSourcePriceMin.trim() || undefined,
        estimatedSourcePriceMax: editForm.estimatedSourcePriceMax.trim() || undefined,
        estimatedSellingPrice: editForm.estimatedSellingPrice.trim() || undefined,
        selectedSupplierId: editForm.selectedSupplierId.trim() || undefined,
        priority: editForm.priority as 'low' | 'medium' | 'high',
        stage: editForm.stage as 'idea' | 'production' | 'content' | 'scaling' | 'inventory',
        assignedTo: editForm.assignedTo,
        // Add uploaded files to the payload
        uploadedImages: uploadedImages,
        uploadedVideos: uploadedVideos,
        // Handle product image: new upload, removal, or keep current
        thumbnail: uploadedProductImage
          ? uploadedProductImage // New image uploaded
          : removeCurrentImage
            ? null // Remove current image
            : undefined // Keep current image unchanged
      }

      console.log('Updating product with payload:', updatePayload)

      const updatedProduct = await onUpdateProduct(product.id, updatePayload)

      onUpdate(updatedProduct)
      onOpenChange(false) // Close the modal after successful update

      toast({
        title: 'Product updated successfully!',
        description: `"${updatedProduct.workingTitle}" has been updated.`
      })

    } catch (error) {
      console.error('Failed to update product:', error)
      toast({
        title: 'Failed to update product',
        description: 'Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteProduct = async () => {
    if (!product) return

    try {
      setIsDeleting(true)

      await onDeleteProduct(product.id)

      setShowDeleteDialog(false)
      onOpenChange(false) // Close the modal

      toast({
        title: 'Product deleted successfully!',
        description: `"${product.workingTitle}" has been permanently deleted.`
      })

    } catch (error) {
      console.error('Failed to delete product:', error)
      toast({
        title: 'Failed to delete product',
        description: 'Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Form helper functions
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const totalImages = uploadedImages.length + files.length

    if (totalImages > 10) {
      toast({
        title: 'Too many images',
        description: 'You can upload up to 10 images maximum.',
        variant: 'destructive'
      })
      return
    }

    setUploadedImages(prev => [...prev, ...files])
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const totalVideos = uploadedVideos.length + files.length

    if (totalVideos > 5) {
      toast({
        title: 'Too many videos',
        description: 'You can upload up to 5 videos maximum.',
        variant: 'destructive'
      })
      return
    }

    setUploadedVideos(prev => [...prev, ...files])
  }

  const handleProductImageUpload = (file: File) => {
    setUploadedProductImage(file)
    setRemoveCurrentImage(false) // If uploading new image, don't remove current
  }

  const removeProductImage = () => {
    setUploadedProductImage(null)
  }

  const handleRemoveCurrentImage = () => {
    setRemoveCurrentImage(true)
    setUploadedProductImage(null) // Also clear any new upload
  }

  const handleChangeCurrentImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleProductImageUpload(file)
    }
  }

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  const removeVideo = (index: number) => {
    setUploadedVideos(prev => prev.filter((_, i) => i !== index))
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    const videoFiles = files.filter(file => file.type.startsWith('video/'))

    if (uploadedImages.length + imageFiles.length > 10) {
      toast({
        title: 'Too many images',
        description: 'You can upload up to 10 images maximum.',
        variant: 'destructive'
      })
      return
    }

    if (uploadedVideos.length + videoFiles.length > 5) {
      toast({
        title: 'Too many videos',
        description: 'You can upload up to 5 videos maximum.',
        variant: 'destructive'
      })
      return
    }

    if (imageFiles.length > 0) {
      setUploadedImages(prev => [...prev, ...imageFiles])
    }
    if (videoFiles.length > 0) {
      setUploadedVideos(prev => [...prev, ...videoFiles])
    }
  }

  const extractDomainFromUrl = (url: string): string => {
    try {
      const domain = new URL(url).hostname
      return domain.replace('www.', '')
    } catch {
      return url
    }
  }

  const autoResizeTextarea = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = Math.max(textarea.scrollHeight, 72) + 'px'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[60vw] h-[80vh] max-w-4xl max-h-[800px] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4 border-b border-border/20">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
              <div className={`p-2 rounded-none ${stageConfig?.bgColor}`}>
                <Edit3 className="h-5 w-5 text-primary" />
              </div>
              Edit Product: {product.workingTitle || product.name || 'Untitled Product'}
            </DialogTitle>

            {/* Action buttons */}
            <div className="flex items-center gap-2 mr-8">
              <Button
                onClick={() => setShowDeleteDialog(true)}
                variant="outline"
                size="sm"
                className="gap-2 rounded-none text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
              <Button
                onClick={handleCancelEdit}
                variant="outline"
                size="sm"
                className="rounded-none"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateProduct}
                disabled={isUpdating}
                size="sm"
                className="gap-2 rounded-none"
              >
                <Save className="h-4 w-4" />
                {isUpdating ? 'Updating...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content - Always show edit form */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto space-y-6 p-6 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
            <FormContent
              newIdeaForm={editForm}
              setNewIdeaForm={setEditForm}
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
              availableCategories={[]}
              tagInput={tagInput}
              setTagInput={setTagInput}
              tags={tags}
              setTags={setTags}
              referenceLinks={referenceLinks}
              setReferenceLinks={setReferenceLinks}
              uploadedImages={uploadedImages}
              uploadedVideos={uploadedVideos}
              handleImageUpload={handleImageUpload}
              handleVideoUpload={handleVideoUpload}
              removeImage={removeImage}
              removeVideo={removeVideo}
              handleDrop={handleDrop}
              handleDragOver={handleDragOver}
              handleDragEnter={handleDragEnter}
              handleDragLeave={handleDragLeave}
              dragActive={dragActive}
              extractDomainFromUrl={extractDomainFromUrl}
              autoResizeTextarea={autoResizeTextarea}
              suppliers={suppliers}
              suppliersLoading={suppliersLoading}
              availableOwners={availableUsers}
              // Product image props
              currentProductImage={currentProductImage}
              uploadedProductImage={uploadedProductImage}
              onChangeProductImage={handleChangeCurrentImage}
              onRemoveCurrentImage={handleRemoveCurrentImage}
              onRemoveUploadedImage={removeProductImage}
            />
          </div>
        </div>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{product?.workingTitle || product?.name}"?
              This action cannot be undone and will permanently remove:
              <br />
              <br />
              • Product details and metadata
              <br />
              • All associated categories and tags
              <br />
              • Idea data and notes
              <br />
              • Activity history
              <br />
              • Reference links
              <br />
              • Product media (if any)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Product'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}