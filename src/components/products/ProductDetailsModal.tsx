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
  Lightbulb,
  Factory,
  Camera,
  TrendingUp,
  Package,
  Calendar,
  User,
  ExternalLink
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  const [dragActive, setDragActive] = useState(false)

  // Hooks
  const { users: availableUsers, loading: usersLoading } = useUsers()
  const { suppliers, loading: suppliersLoading } = useSuppliers()

  // Initialize form data when product changes
  useEffect(() => {
    if (product && open) {
      setEditForm({
        title: product.workingTitle || product.name || '',
        tags: product.tags.join(', '),
        category: product.category.join(', '),
        competitorLinks: '',
        adLinks: '',
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
      setReferenceLinks([])
      setUploadedImages([])
      setUploadedVideos([])
      setUploadedProductImage(null)
      setIsEditMode(false)
    }
  }, [product, open])

  if (!product) return null

  const stageConfig = STAGE_CONFIG[product.stage]
  const StageIcon = stageConfig?.icon || Package

  const handleEdit = () => {
    setIsEditMode(true)
  }

  const handleCancelEdit = () => {
    setIsEditMode(false)
    // Reset form to original values
    if (product) {
      setEditForm({
        title: product.workingTitle || product.name || '',
        tags: product.tags.join(', '),
        category: product.category.join(', '),
        competitorLinks: '',
        adLinks: '',
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
    }
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

      // Prepare update payload
      const updatePayload: Partial<CreateProductPayload> = {
        title: editForm.title,
        tags: tags.length > 0 ? tags : undefined,
        category: selectedCategories.length > 0 ? selectedCategories : undefined,
        competitorLinks: referenceLinks.filter(link => link.type === 'competitor').map(link => link.url),
        adLinks: referenceLinks.filter(link => link.type === 'ad').map(link => link.url),
        notes: editForm.notes,
        problemStatement: editForm.problemStatement,
        opportunityStatement: editForm.opportunityStatement,
        estimatedSourcePriceMin: editForm.estimatedSourcePriceMin,
        estimatedSourcePriceMax: editForm.estimatedSourcePriceMax,
        estimatedSellingPrice: editForm.estimatedSellingPrice,
        selectedSupplierId: editForm.selectedSupplierId,
        priority: editForm.priority as 'low' | 'medium' | 'high',
        stage: editForm.stage as 'idea' | 'production' | 'content' | 'scaling' | 'inventory',
        assignedTo: editForm.assignedTo
      }

      console.log('Updating product with payload:', updatePayload)

      const updatedProduct = await onUpdateProduct(product.id, updatePayload)

      onUpdate(updatedProduct)
      setIsEditMode(false)

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
  }

  const removeProductImage = () => {
    setUploadedProductImage(null)
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
      <DialogContent className="w-[80vw] h-[calc(100vh-4rem)] max-w-none max-h-none flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4 border-b border-border/20">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
              <div className={`p-2 rounded-none ${stageConfig?.bgColor}`}>
                <StageIcon className={`h-5 w-5 ${stageConfig?.color}`} />
              </div>
              {product.workingTitle || product.name || 'Untitled Product'}
            </DialogTitle>

            {/* Action buttons */}
            <div className="flex items-center gap-2 mr-8">
              {!isEditMode ? (
                <>
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
                    onClick={handleEdit}
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-none"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </Button>
                </>
              ) : (
                <>
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
                    {isUpdating ? 'Updating...' : 'Update Product'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isEditMode ? (
            // Edit Mode - Show FormContent
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
              />
            </div>
          ) : (
            // View Mode - Show product details
            <div className="h-full overflow-y-auto p-6 space-y-6">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="media">Media</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* Product Image */}
                  {(product.thumbnail || product.thumbnailUrl) && (
                    <div>
                      <Label className="text-sm font-medium">Product Image</Label>
                      <div className="mt-2">
                        <img
                          src={product.thumbnail || product.thumbnailUrl}
                          alt={product.workingTitle || product.name}
                          className="w-full max-w-md h-64 object-cover rounded-none border"
                        />
                      </div>
                    </div>
                  )}

                  {/* Basic Info Grid */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium">Internal Code</Label>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {product.internalCode}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Stage</Label>
                      <div className="mt-1">
                        <Badge variant="secondary" className="capitalize">
                          <StageIcon className="h-3 w-3 mr-1" />
                          {stageConfig?.name || product.stage}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Priority</Label>
                      <Badge
                        variant={product.priority === 'high' ? 'destructive' :
                                product.priority === 'medium' ? 'default' : 'secondary'}
                        className="mt-1 capitalize"
                      >
                        {product.priority}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Potential Score</Label>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {product.potentialScore}/100
                      </div>
                    </div>
                  </div>

                  {/* Assigned To */}
                  <div>
                    <Label className="text-sm font-medium">Assigned To</Label>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {product.teamLead.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{product.teamLead.name}</div>
                        <div className="text-xs text-muted-foreground">{product.teamLead.email}</div>
                      </div>
                    </div>
                  </div>

                  {/* Categories & Tags */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium">Categories</Label>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {product.category.map((cat, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Tags</Label>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {product.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-primary/10 text-primary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium">Created</Label>
                      <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {product.createdAt.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Last Updated</Label>
                      <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {product.updatedAt.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-6">
                  {/* Idea Details */}
                  {product.ideaData && (
                    <>
                      {product.ideaData.notes && (
                        <div>
                          <Label className="text-sm font-medium">Notes</Label>
                          <div className="mt-2 p-3 bg-muted rounded-none text-sm whitespace-pre-wrap">
                            {product.ideaData.notes}
                          </div>
                        </div>
                      )}

                      {product.ideaData.problemStatement && (
                        <div>
                          <Label className="text-sm font-medium">Problem Statement</Label>
                          <div className="mt-2 p-3 bg-muted rounded-none text-sm">
                            {product.ideaData.problemStatement}
                          </div>
                        </div>
                      )}

                      {product.ideaData.opportunityStatement && (
                        <div>
                          <Label className="text-sm font-medium">Opportunity Statement</Label>
                          <div className="mt-2 p-3 bg-muted rounded-none text-sm">
                            {product.ideaData.opportunityStatement}
                          </div>
                        </div>
                      )}

                      {/* Pricing */}
                      <div className="grid grid-cols-3 gap-4">
                        {product.ideaData.estimatedSourcePriceMin && (
                          <div>
                            <Label className="text-sm font-medium">Min Source Price</Label>
                            <div className="text-sm text-muted-foreground mt-1">
                              ₹{product.ideaData.estimatedSourcePriceMin}
                            </div>
                          </div>
                        )}
                        {product.ideaData.estimatedSourcePriceMax && (
                          <div>
                            <Label className="text-sm font-medium">Max Source Price</Label>
                            <div className="text-sm text-muted-foreground mt-1">
                              ₹{product.ideaData.estimatedSourcePriceMax}
                            </div>
                          </div>
                        )}
                        {product.ideaData.estimatedSellingPrice && (
                          <div>
                            <Label className="text-sm font-medium">Selling Price</Label>
                            <div className="text-sm text-muted-foreground mt-1">
                              ₹{product.ideaData.estimatedSellingPrice}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="media" className="space-y-6">
                  <div className="text-center text-muted-foreground">
                    Media content will be displayed here
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="space-y-6">
                  {product.activities.length > 0 ? (
                    <div className="space-y-4">
                      {product.activities.map((activity, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 border rounded-none">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{activity.action}</div>
                            <div className="text-xs text-muted-foreground">
                              {activity.timestamp.toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      No activity recorded yet
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
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