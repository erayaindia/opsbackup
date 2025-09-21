import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { X, ImagePlus, VideoIcon, Eye } from 'lucide-react'
import { ImagePreviewModal } from '@/components/fulfillment/packing/ImagePreviewModal'
import ProductImageCarousel from './ProductImageCarousel'
import type { ProductImage } from '@/services/productImagesService'

interface FormContentProps {
  newIdeaForm: any
  setNewIdeaForm: (form: any) => void
  selectedCategories: string[]
  setSelectedCategories: (categories: string[]) => void
  availableCategories: string[]
  categoriesLoading?: boolean
  tagInput: string
  setTagInput: (input: string) => void
  tags: string[]
  setTags: (tags: string[]) => void
  referenceLinks: Array<{url: string, type: 'competitor' | 'ad'}>
  setReferenceLinks: (links: Array<{url: string, type: 'competitor' | 'ad'}>) => void
  uploadedImages: File[]
  uploadedVideos: File[]
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleVideoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  removeImage: (index: number) => void
  removeVideo: (index: number) => void
  handleDrop: (e: React.DragEvent) => void
  handleDragOver: (e: React.DragEvent) => void
  handleDragEnter: (e: React.DragEvent) => void
  handleDragLeave: (e: React.DragEvent) => void
  dragActive: boolean
  extractDomainFromUrl: (url: string) => string
  autoResizeTextarea: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  vendors: any[]
  vendorsLoading: boolean
  availableOwners: any[]
  // Product image props
  currentProductImage?: string | null
  uploadedProductImage?: File | null
  onChangeProductImage?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveCurrentImage?: () => void
  onRemoveUploadedImage?: () => void
  // Product ID for new image carousel
  productId?: string
  onProductImagesChange?: (images: ProductImage[]) => void
  // Toggle states for collapsible sections
  showBasics?: boolean
  setShowBasics?: (show: boolean) => void
  showMarketResearch?: boolean
  setShowMarketResearch?: (show: boolean) => void
  showReferencesMedia?: boolean
  setShowReferencesMedia?: (show: boolean) => void
}

export const FormContent: React.FC<FormContentProps> = ({
  newIdeaForm,
  setNewIdeaForm,
  selectedCategories,
  setSelectedCategories,
  availableCategories,
  categoriesLoading = false,
  tagInput,
  setTagInput,
  tags,
  setTags,
  referenceLinks,
  setReferenceLinks,
  uploadedImages,
  uploadedVideos,
  handleImageUpload,
  handleVideoUpload,
  removeImage,
  removeVideo,
  handleDrop,
  handleDragOver,
  handleDragEnter,
  handleDragLeave,
  dragActive,
  extractDomainFromUrl,
  autoResizeTextarea,
  vendors,
  vendorsLoading,
  availableOwners = [],
  // Product image props
  currentProductImage,
  uploadedProductImage,
  onChangeProductImage,
  onRemoveCurrentImage,
  onRemoveUploadedImage,
  // Product ID for new image carousel
  productId,
  onProductImagesChange,
  // Toggle states for collapsible sections
  showBasics = true,
  setShowBasics = () => {},
  showMarketResearch = true,
  setShowMarketResearch = () => {},
  showReferencesMedia = true,
  setShowReferencesMedia = () => {}
}) => {
  const addTag = (tag: string) => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      setTags([...tags, tag.trim()])
      setTagInput('')
    }
  }

  const removeTag = (indexToRemove: number) => {
    setTags(tags.filter((_, index) => index !== indexToRemove))
  }

  const [showLinkInput, setShowLinkInput] = useState(false)
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [newLinkType, setNewLinkType] = useState<'competitor' | 'ad'>('competitor')

  // Image preview state
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [previewIndex, setPreviewIndex] = useState(0)

  const addReferenceLink = () => {
    setShowLinkInput(true)
  }

  const saveLinkInput = () => {
    if (newLinkUrl.trim()) {
      setReferenceLinks([...referenceLinks, { url: newLinkUrl.trim(), type: newLinkType }])
      setNewLinkUrl('')
      setNewLinkType('competitor')
      setShowLinkInput(false)
    }
  }

  const cancelLinkInput = () => {
    setNewLinkUrl('')
    setNewLinkType('competitor')
    setShowLinkInput(false)
  }

  const removeReferenceLink = (indexToRemove: number) => {
    setReferenceLinks(referenceLinks.filter((_, index) => index !== indexToRemove))
  }

  // Image preview functions
  const openImagePreview = (imageUrl: string, additionalImages: string[] = []) => {
    const images = [imageUrl, ...additionalImages]
    setPreviewImages(images)
    setPreviewIndex(0)
    setIsPreviewModalOpen(true)
  }

  const openProductImagePreview = () => {
    const imageUrl = uploadedProductImage
      ? URL.createObjectURL(uploadedProductImage)
      : currentProductImage
    if (imageUrl) {
      openImagePreview(imageUrl)
    }
  }

  const openUploadedImagePreview = (index: number) => {
    const imageUrls = uploadedImages.map(file => URL.createObjectURL(file))
    setPreviewImages(imageUrls)
    setPreviewIndex(index)
    setIsPreviewModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Product Image Carousel - Positioned before text fields */}
      <div className="p-4 bg-muted/10 rounded-lg border">
        <ProductImageCarousel
          productId={productId}
          maxImages={10}
          onImagesChange={onProductImagesChange}
        />
      </div>
      {/* Section 1: Two-Column Grid - Basics & Market Research */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Basics */}
        <div className="space-y-4">
          <div className="p-3 bg-muted/10 rounded-none border">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-primary rounded-full"></div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Basics</h3>
                <p className="text-sm text-muted-foreground">Core product information</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Product Name */}
              <div>
                <Label htmlFor="title" className="text-sm font-semibold text-foreground">Product Name *</Label>
                <Input
                  id="title"
                  value={newIdeaForm.title}
                  onChange={(e) => setNewIdeaForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Eraya Smart Home Diffuser"
                  className="mt-2 text-base font-medium h-11 rounded-none"
                />
              </div>

              {/* Category */}
              <div>
                <Label className="text-sm font-medium text-foreground">Category</Label>
                <Select
                  value={selectedCategories[0] || ''}
                  onValueChange={(value) => setSelectedCategories([value])}
                  disabled={categoriesLoading}
                >
                  <SelectTrigger className="mt-2 h-10 rounded-none">
                    <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Select category..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesLoading ? (
                      <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                    ) : availableCategories.length === 0 ? (
                      <SelectItem value="no-categories" disabled>No categories available</SelectItem>
                    ) : (
                      availableCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {!categoriesLoading && availableCategories.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No categories found. <a href="/categories" target="_blank" className="text-primary hover:underline">Manage categories</a>
                  </p>
                )}
              </div>

              {/* Priority */}
              <div>
                <Label className="text-sm font-medium text-foreground">Priority *</Label>
                <Select
                  value={newIdeaForm.priority || 'medium'}
                  onValueChange={(value) => setNewIdeaForm(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger className="mt-2 h-10 rounded-none">
                    <SelectValue placeholder="Select priority..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Stage */}
              <div>
                <Label className="text-sm font-medium text-foreground">Stage *</Label>
                <Select
                  value={newIdeaForm.stage || 'idea'}
                  onValueChange={(value) => setNewIdeaForm(prev => ({ ...prev, stage: value }))}
                >
                  <SelectTrigger className="mt-2 h-10 rounded-none">
                    <SelectValue placeholder="Select stage..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="idea">Idea</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="content">Content</SelectItem>
                    <SelectItem value="scaling">Scaling</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div>
                <Label className="text-sm font-medium text-foreground">Tags</Label>
                <div className="mt-2">
                  <Input
                    placeholder="Type and press Enter to add tags..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTag(tagInput)
                      }
                    }}
                    className="h-10 rounded-none"
                  />
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-1 h-auto p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => removeTag(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Market Research */}
        <div className="space-y-4">
          <div className="p-3 bg-muted/10 rounded-none border">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Market Research</h3>
                <p className="text-sm text-muted-foreground">Analysis and insights</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Problem Statement */}
              <div>
                <Label className="text-sm font-medium text-foreground">Problem Statement</Label>
                <Textarea
                  value={newIdeaForm.problemStatement}
                  onChange={(e) => {
                    setNewIdeaForm(prev => ({ ...prev, problemStatement: e.target.value }))
                    autoResizeTextarea(e)
                  }}
                  placeholder="What customer problem does this product solve?"
                  className="mt-2 min-h-[72px] resize-none rounded-none"
                />
              </div>

              {/* Opportunity Statement */}
              <div>
                <Label className="text-sm font-medium text-foreground">Market Opportunity</Label>
                <Textarea
                  value={newIdeaForm.opportunityStatement}
                  onChange={(e) => {
                    setNewIdeaForm(prev => ({ ...prev, opportunityStatement: e.target.value }))
                    autoResizeTextarea(e)
                  }}
                  placeholder="Describe the market opportunity and potential..."
                  className="mt-2 min-h-[72px] resize-none rounded-none"
                />
              </div>

              {/* Additional Notes */}
              <div>
                <Label className="text-sm font-medium text-foreground">Additional Notes</Label>
                <Textarea
                  value={newIdeaForm.notes}
                  onChange={(e) => {
                    setNewIdeaForm(prev => ({ ...prev, notes: e.target.value }))
                    autoResizeTextarea(e)
                  }}
                  placeholder="Key features, target audience, concept notes..."
                  className="mt-2 min-h-[100px] resize-none rounded-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

        <div className="p-3 bg-muted/10 rounded-none border">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
            <div>
              <h4 className="text-base font-semibold text-foreground">References & Media</h4>
              <p className="text-sm text-muted-foreground">Supporting materials and inspiration</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Reference Links */}
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-foreground">Reference Links</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addReferenceLink}
                  className="h-7 text-xs"
                >
                  Add Link
                </Button>
              </div>

              {/* Add Link Input */}
              {showLinkInput && (
                <div className="space-y-3 mt-3 p-3 border border-border/50 rounded-none bg-muted/20">
                  <div>
                    <Label className="text-xs font-medium text-foreground">Link Type</Label>
                    <Select value={newLinkType} onValueChange={(value: 'competitor' | 'ad') => setNewLinkType(value)}>
                      <SelectTrigger className="mt-1 h-8 rounded-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="competitor">Competitor</SelectItem>
                        <SelectItem value="ad">Advertisement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-foreground">URL</Label>
                    <Input
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="mt-1 h-8 rounded-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          saveLinkInput()
                        }
                        if (e.key === 'Escape') {
                          e.preventDefault()
                          cancelLinkInput()
                        }
                      }}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={saveLinkInput}
                      className="h-7 text-xs"
                    >
                      Add Link
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={cancelLinkInput}
                      className="h-7 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {referenceLinks.length > 0 && (
                <div className="space-y-2 mt-3">
                  {referenceLinks.map((link, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded-none">
                      <Badge variant={link.type === 'competitor' ? 'destructive' : 'default'} className="text-xs">
                        {link.type}
                      </Badge>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 underline flex-1 truncate cursor-pointer"
                        title={link.url}
                      >
                        {extractDomainFromUrl(link.url)}
                      </a>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeReferenceLink(index)}
                        className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>


            {/* Media Upload */}
            <div>
              <Label className="text-sm font-medium text-foreground">Media Upload</Label>

              {/* Drag and drop area */}
              <div className="mt-2">
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex gap-2">
                      <ImagePlus className="h-5 w-5 text-muted-foreground" />
                      <VideoIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Drop files here
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Images (max 10) or Videos (max 5)
                    </p>
                  </div>
                </div>
              </div>

              {/* Media Preview */}
              {(uploadedImages.length > 0 || uploadedVideos.length > 0) && (
                <div className="mt-3 p-3 bg-muted/30 rounded-none">
                  {uploadedImages.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Images ({uploadedImages.length}/10)
                      </p>
                      <div className="grid grid-cols-6 gap-2">
                        {uploadedImages.map((file, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Upload ${index + 1}`}
                              className="w-full h-12 object-cover rounded-none border cursor-pointer"
                              onClick={() => openUploadedImagePreview(index)}
                            />
                            {/* Preview button overlay */}
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="absolute inset-0 m-auto h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 border-0"
                              onClick={() => openUploadedImagePreview(index)}
                            >
                              <Eye className="h-2 w-2 text-white" />
                            </Button>
                            {/* Remove button */}
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {uploadedVideos.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Videos ({uploadedVideos.length}/5)
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {uploadedVideos.map((file, index) => (
                          <div key={index} className="relative group">
                            <div className="w-full h-12 bg-muted/60 rounded-none border flex items-center justify-center">
                              <VideoIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeVideo(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Bottom spacing */}
      <div className="h-16"></div>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        images={previewImages}
        currentIndex={previewIndex}
        onIndexChange={setPreviewIndex}
        title="Image Preview"
      />
    </div>
  )
}

export default FormContent