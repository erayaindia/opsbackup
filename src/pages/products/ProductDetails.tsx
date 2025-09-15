import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import {
  ArrowLeft,
  Edit3,
  Save,
  Trash2,
  Package,
  Lightbulb,
  Factory,
  Camera,
  TrendingUp
} from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import {
  productLifecycleService,
  type LifecycleProduct,
  type CreateProductPayload
} from '@/services/productLifecycleService'
import { FormContent } from '@/components/products/FormContent'
import { useUsers } from '@/hooks/useUsers'
import { useSuppliers } from '@/hooks/useSuppliers'
import { useCategories } from '@/hooks/useCategories'
import { useVendors } from '@/hooks/useSuppliers'

const STAGE_CONFIG = {
  idea: { name: 'Idea', icon: Lightbulb, color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950' },
  production: { name: 'Production', icon: Factory, color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-950' },
  content: { name: 'Content', icon: Camera, color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950' },
  scaling: { name: 'Scaling', icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-950' },
  inventory: { name: 'Inventory', icon: Package, color: 'text-gray-600', bgColor: 'bg-gray-50 dark:bg-gray-950' }
}

// Generate URL-friendly slug from product title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Find product by slug (generated from title)
const findProductBySlug = (products: LifecycleProduct[], slug: string): LifecycleProduct | null => {
  return products.find(product => {
    const productSlug = generateSlug(product.workingTitle || product.name || `product-${product.internalCode}`)
    return productSlug === slug
  }) || null
}

export default function ProductDetails() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const [product, setProduct] = useState<LifecycleProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState('idea')

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
  const { allCategories: databaseCategories, loading: categoriesLoading } = useCategories()
  const { data: vendors = [], isLoading: vendorsLoading } = useVendors()

  // Use database categories
  const availableCategories = databaseCategories.map(cat => cat.name).sort()

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      if (!slug) {
        navigate('/products')
        return
      }

      try {
        setLoading(true)

        // Get all products and find by slug
        const products = await productLifecycleService.listProducts()
        const foundProduct = findProductBySlug(products, slug)

        if (!foundProduct) {
          toast({
            title: 'Product not found',
            description: 'The requested product could not be found.',
            variant: 'destructive'
          })
          navigate('/products')
          return
        }

        setProduct(foundProduct)

        // Initialize form data
        setEditForm({
          title: foundProduct.workingTitle || foundProduct.name || '',
          tags: foundProduct.tags.join(', '),
          category: foundProduct.category.join(', '),
          competitorLinks: foundProduct.ideaData?.competitorLinks?.join('\n') || '',
          adLinks: foundProduct.ideaData?.adLinks?.join('\n') || '',
          notes: foundProduct.ideaData?.notes || '',
          problemStatement: foundProduct.ideaData?.problemStatement || '',
          opportunityStatement: foundProduct.ideaData?.opportunityStatement || '',
          estimatedSourcePriceMin: foundProduct.ideaData?.estimatedSourcePriceMin?.toString() || '',
          estimatedSourcePriceMax: foundProduct.ideaData?.estimatedSourcePriceMax?.toString() || '',
          estimatedSellingPrice: foundProduct.ideaData?.estimatedSellingPrice?.toString() || '',
          selectedSupplierId: foundProduct.ideaData?.selectedSupplierId || '',
          priority: foundProduct.priority,
          stage: foundProduct.stage,
          assignedTo: foundProduct.teamLead.id
        })

        setSelectedCategories(foundProduct.category)
        setTags(foundProduct.tags)

        // Load existing reference links from database
        const existingReferenceLinks: Array<{url: string, type: 'competitor' | 'ad'}> = [
          ...(foundProduct.ideaData?.competitorLinks || []).map(url => ({ url, type: 'competitor' as const })),
          ...(foundProduct.ideaData?.adLinks || []).map(url => ({ url, type: 'ad' as const }))
        ]
        setReferenceLinks(existingReferenceLinks)

        // Initialize current product image and reset upload states
        setCurrentProductImage(foundProduct.thumbnail || foundProduct.thumbnailUrl || null)
        setRemoveCurrentImage(false)
        setUploadedImages([])
        setUploadedVideos([])
        setUploadedProductImage(null)
        setActiveTab(foundProduct.stage || 'idea') // Set active tab based on product stage

      } catch (error) {
        console.error('Failed to load product:', error)
        toast({
          title: 'Error loading product',
          description: 'Please try again.',
          variant: 'destructive'
        })
        navigate('/products')
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [slug, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-6 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-6" />
            <div className="h-12 bg-muted rounded mb-6" />
            <div className="h-96 bg-muted rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-6 py-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Product not found</p>
            <Button onClick={() => navigate('/products')} className="mt-4">
              Back to Products
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const stageConfig = STAGE_CONFIG[product.stage]
  const StageIcon = stageConfig?.icon || Package

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

      const updatedProduct = await productLifecycleService.updateProduct(product.id, updatePayload)

      setProduct(updatedProduct)

      toast({
        title: 'Product updated successfully!',
        description: `"${updatedProduct.workingTitle}" has been updated.`
      })

      // If title changed, redirect to new URL
      const newSlug = generateSlug(updatedProduct.workingTitle || updatedProduct.name || `product-${updatedProduct.internalCode}`)
      if (newSlug !== slug) {
        navigate(`/products/${newSlug}`, { replace: true })
      }

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

      await productLifecycleService.deleteProduct(product.id)

      setShowDeleteDialog(false)

      toast({
        title: 'Product deleted successfully!',
        description: `"${product.workingTitle}" has been permanently deleted.`
      })

      // Navigate back to products list
      navigate('/products')

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
    <div className="min-h-screen bg-background">
      <div className="px-6 py-6">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b mb-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/products')}
                className="gap-2 rounded-none"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Products
              </Button>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-none ${stageConfig?.bgColor}`}>
                  <Edit3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    {product.workingTitle || product.name || 'Untitled Product'}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {product.internalCode} • {stageConfig?.name} Stage
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
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
                onClick={handleUpdateProduct}
                disabled={isUpdating}
                size="sm"
                className="gap-2 rounded-none"
              >
                <Save className="h-4 w-4" />
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>

        {/* Tabbed Content */}
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Tab Navigation */}
            <div className="mb-6">
              <TabsList className="grid w-full max-w-md grid-cols-4 bg-muted rounded-lg">
                <TabsTrigger value="idea" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Lightbulb className="h-4 w-4" />
                  Idea
                </TabsTrigger>
                <TabsTrigger value="production" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Factory className="h-4 w-4" />
                  Production
                </TabsTrigger>
                <TabsTrigger value="content" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Camera className="h-4 w-4" />
                  Content
                </TabsTrigger>
                <TabsTrigger value="scaling" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <TrendingUp className="h-4 w-4" />
                  Scaling
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content */}
            {/* Idea Tab */}
            <TabsContent value="idea" className="mt-0">
              <div className="bg-card rounded-lg border shadow-sm p-6">
                  <FormContent
                  newIdeaForm={editForm}
                  setNewIdeaForm={setEditForm}
                  selectedCategories={selectedCategories}
                  setSelectedCategories={setSelectedCategories}
                  availableCategories={availableCategories}
                  categoriesLoading={categoriesLoading}
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
                  vendors={vendors}
                  vendorsLoading={vendorsLoading}
                  availableOwners={availableUsers}
                  // Product image props
                  currentProductImage={currentProductImage}
                  uploadedProductImage={uploadedProductImage}
                  onChangeProductImage={handleChangeCurrentImage}
                  onRemoveCurrentImage={handleRemoveCurrentImage}
                    onRemoveUploadedImage={removeProductImage}
                  />
              </div>
            </TabsContent>

            {/* Production Tab */}
            <TabsContent value="production" className="mt-0">
              <div className="bg-card rounded-lg border shadow-sm p-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4">
                    <div className="p-2 rounded-none bg-orange-50 dark:bg-orange-950">
                      <Factory className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Production Management</h3>
                      <p className="text-sm text-muted-foreground">Manage manufacturing, samples, and production timeline</p>
                    </div>
                  </div>

                  {/* Supplier & Pricing */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-foreground">Supplier & Pricing</Label>

                    {/* Supplier Selection */}
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-2 block">Select Supplier</Label>
                      <Select
                        value={editForm.selectedSupplierId}
                        onValueChange={(value) => setEditForm(prev => ({ ...prev, selectedSupplierId: value }))}
                      >
                        <SelectTrigger className="rounded-none">
                          <SelectValue placeholder="Choose a vendor..." />
                        </SelectTrigger>
                        <SelectContent>
                          {vendorsLoading ? (
                            <SelectItem value="loading" disabled>Loading vendors...</SelectItem>
                          ) : !vendors || vendors.length === 0 ? (
                            <SelectItem value="no-vendors" disabled>No vendors available</SelectItem>
                          ) : (
                            vendors
                              .filter(vendor => vendor.status === 'active')
                              .map((vendor) => (
                                <SelectItem key={vendor.id} value={vendor.id}>
                                  <span className="font-medium">{vendor.name}</span>
                                </SelectItem>
                              ))
                          )}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-muted-foreground">Choose from active vendors</p>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                          onClick={() => window.open('/vendors', '_blank')}
                        >
                          View All Vendors
                        </Button>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Estimated Source Price (₹)</Label>
                        <Input
                          type="number"
                          step="1"
                          value={editForm.estimatedSourcePriceMin}
                          onChange={(e) => setEditForm(prev => ({ ...prev, estimatedSourcePriceMin: e.target.value }))}
                          placeholder="500"
                          className="rounded-none"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Price in INR</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Estimated Selling Price (₹)</Label>
                        <Input
                          type="number"
                          step="1"
                          value={editForm.estimatedSellingPrice}
                          onChange={(e) => setEditForm(prev => ({ ...prev, estimatedSellingPrice: e.target.value }))}
                          placeholder="800"
                          className="rounded-none"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Selling price in INR</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Materials & Specifications */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-foreground">Materials & Specifications</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Dimensions</Label>
                        <Input
                          placeholder="L x W x H"
                          className="rounded-none"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Weight</Label>
                        <Input
                          placeholder="kg"
                          className="rounded-none"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-2 block">Materials</Label>
                      <Textarea
                        placeholder="Describe materials used..."
                        className="rounded-none min-h-[80px]"
                      />
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Sample Management */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-foreground">Sample Management</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Sample Request Date</Label>
                        <Input
                          type="date"
                          className="rounded-none"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Sample Received Date</Label>
                        <Input
                          type="date"
                          className="rounded-none"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-2 block">Sample Status</Label>
                      <Select>
                        <SelectTrigger className="rounded-none">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="needs-revision">Needs Revision</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-2 block">Sample Notes</Label>
                      <Textarea
                        placeholder="Notes about sample quality, feedback..."
                        className="rounded-none min-h-[80px]"
                      />
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Production Timeline */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-foreground">Production Timeline</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Production Start</Label>
                        <Input
                          type="date"
                          className="rounded-none"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Expected Completion</Label>
                        <Input
                          type="date"
                          className="rounded-none"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-2 block">Production Milestones</Label>
                      <Textarea
                        placeholder="Key milestones and deadlines..."
                        className="rounded-none min-h-[100px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="mt-0">
              <div className="bg-card rounded-lg border shadow-sm p-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4">
                    <div className="p-2 rounded-none bg-blue-50 dark:bg-blue-950">
                      <Camera className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Content Creation</h3>
                      <p className="text-sm text-muted-foreground">Manage creative assets, scripts, and content production</p>
                    </div>
                  </div>

                  {/* Creative Brief */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-foreground">Creative Brief</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Moodboard Link</Label>
                        <Input
                          placeholder="https://..."
                          className="rounded-none"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Brief Document</Label>
                        <Input
                          placeholder="https://..."
                          className="rounded-none"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Video Scripts */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-foreground">Video Scripts</Label>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-2 block">Hero Video Script</Label>
                      <Textarea
                        placeholder="Main hero video script..."
                        className="rounded-none min-h-[100px]"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-2 block">Lifestyle Script</Label>
                      <Textarea
                        placeholder="Lifestyle video script..."
                        className="rounded-none min-h-[100px]"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-2 block">Unboxing Script</Label>
                      <Textarea
                        placeholder="Unboxing video script..."
                        className="rounded-none min-h-[100px]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">15s Script</Label>
                        <Textarea
                          placeholder="Short 15 second script..."
                          className="rounded-none min-h-[80px]"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">30s Script</Label>
                        <Textarea
                          placeholder="30 second script..."
                          className="rounded-none min-h-[80px]"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Team Assignment */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-foreground">Team Assignment</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Agency</Label>
                        <Select>
                          <SelectTrigger className="rounded-none">
                            <SelectValue placeholder="Select agency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="agency1">Creative Agency A</SelectItem>
                            <SelectItem value="agency2">Creative Agency B</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Influencer</Label>
                        <Select>
                          <SelectTrigger className="rounded-none">
                            <SelectValue placeholder="Select influencer" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="influencer1">Influencer 1</SelectItem>
                            <SelectItem value="influencer2">Influencer 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Scaling Tab */}
            <TabsContent value="scaling" className="mt-0">
              <div className="bg-card rounded-lg border shadow-sm p-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4">
                    <div className="p-2 rounded-none bg-green-50 dark:bg-green-950">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Scaling & Marketing</h3>
                      <p className="text-sm text-muted-foreground">Manage launch, budget allocation, and performance metrics</p>
                    </div>
                  </div>

                  {/* Launch Details */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-foreground">Launch Details</Label>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-2 block">Launch Date</Label>
                      <Input
                        type="date"
                        className="rounded-none"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-2 block">Marketing Channels</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm">Facebook</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm">Instagram</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm">Google Ads</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm">YouTube</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Budget Allocation */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-foreground">Budget Allocation</Label>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-2 block">Total Budget</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="rounded-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Facebook Budget</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          className="rounded-none"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Instagram Budget</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          className="rounded-none"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Google Budget</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          className="rounded-none"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">YouTube Budget</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          className="rounded-none"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Performance Targets & Metrics */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-foreground">Performance Targets</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Target Revenue</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          className="rounded-none"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Actual Revenue</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          className="rounded-none"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Target ROAS</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          className="rounded-none"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Actual ROAS</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          className="rounded-none"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Target Conversions</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          className="rounded-none"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Actual Conversions</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          className="rounded-none"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Learnings & Notes */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-foreground">Learnings & Insights</Label>
                    <div>
                      <Textarea
                        placeholder="Key learnings, insights, and notes from this campaign..."
                        className="rounded-none min-h-[120px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

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
    </div>
  )
}