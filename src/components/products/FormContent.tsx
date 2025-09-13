import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { X, ImagePlus, VideoIcon } from 'lucide-react'

interface FormContentProps {
  newIdeaForm: any
  setNewIdeaForm: (form: any) => void
  selectedCategories: string[]
  setSelectedCategories: (categories: string[]) => void
  availableCategories: string[]
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
  suppliers: any[]
  suppliersLoading: boolean
  availableOwners: any[]
}

export const FormContent: React.FC<FormContentProps> = ({
  newIdeaForm,
  setNewIdeaForm,
  selectedCategories,
  setSelectedCategories,
  availableCategories,
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
  suppliers,
  suppliersLoading,
  availableOwners = []
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

  return (
    <div className="space-y-6">
      {/* Section 1: Two-Column Grid - Basics & Market Research */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Basics */}
        <div className="space-y-4">
          <div className="pb-3 border-b border-border/30">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <div className="w-1 h-4 bg-primary rounded-full"></div>
              Basics
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Core product information</p>
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
              >
                <SelectTrigger className="mt-2 h-10 rounded-none">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div>
              <Label className="text-sm font-medium text-foreground">Priority</Label>
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
              <Label className="text-sm font-medium text-foreground">Stage</Label>
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

            {/* Source Price */}
            <div className="w-full">
              <Label className="text-sm font-medium text-foreground">Estimated Source Price (₹)</Label>
              <Input
                type="number"
                step="1"
                value={newIdeaForm.estimatedSourcePriceMin}
                onChange={(e) => setNewIdeaForm(prev => ({ ...prev, estimatedSourcePriceMin: e.target.value }))}
                placeholder="500"
                className="mt-2 h-10 rounded-none"
              />
              <p className="text-xs text-muted-foreground mt-1">Price in INR</p>
            </div>

            {/* Supplier Selection */}
            <div>
              <Label className="text-sm font-medium text-foreground">Select Supplier</Label>
              <Select
                value={newIdeaForm.selectedSupplierId}
                onValueChange={(value) => setNewIdeaForm(prev => ({ ...prev, selectedSupplierId: value }))}
              >
                <SelectTrigger className="mt-2 h-10 rounded-none">
                  <SelectValue placeholder="Choose a supplier..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliersLoading ? (
                    <SelectItem value="loading" disabled>Loading suppliers...</SelectItem>
                  ) : suppliers.length === 0 ? (
                    <SelectItem value="no-suppliers" disabled>No suppliers available</SelectItem>
                  ) : (
                    suppliers
                      .filter(supplier => supplier.status === 'active')
                      .map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{supplier.name}</span>
                            {supplier.lead_time_days && (
                              <span className="text-xs text-muted-foreground">
                                Lead time: {supplier.lead_time_days} days
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">Choose from active suppliers</p>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                  onClick={() => window.open('/products/suppliers', '_blank')}
                >
                  View All Suppliers
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Market Research */}
        <div className="space-y-4">
          <div className="pb-3 border-b border-border/30">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
              Market Research
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Analysis and insights</p>
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

            {/* Selling Price */}
            <div>
              <Label className="text-sm font-medium text-foreground">Estimated Selling Price (₹)</Label>
              <Input
                type="number"
                step="1"
                value={newIdeaForm.estimatedSellingPrice}
                onChange={(e) => setNewIdeaForm(prev => ({ ...prev, estimatedSellingPrice: e.target.value }))}
                placeholder="800"
                className="mt-2 h-10 rounded-none"
              />
              <p className="text-xs text-muted-foreground mt-1">Selling price in INR</p>
            </div>
          </div>
        </div>
      </div>

      {/* References & Media Section - Full Width */}
      <div className="mt-8 pt-8 border-t border-border/30">
        <div className="pb-3 border-b border-border/30">
          <h4 className="text-base font-semibold text-foreground flex items-center gap-2">
            <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
            References & Media
          </h4>
          <p className="text-sm text-muted-foreground mt-1">Supporting materials and inspiration</p>
        </div>

        <div className="space-y-4 mt-6">
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

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-none p-4 text-center transition-colors mt-2 ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-2">
                  <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  <VideoIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Drop files here or click to upload
                </p>
                <p className="text-xs text-muted-foreground">
                  Images (max 10) or Videos (max 5)
                </p>
                <div className="flex gap-2 mt-2">
                  <label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button type="button" variant="outline" size="sm" className="text-xs" asChild>
                      <span>Images</span>
                    </Button>
                  </label>
                  <label>
                    <input
                      type="file"
                      multiple
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                    <Button type="button" variant="outline" size="sm" className="text-xs" asChild>
                      <span>Videos</span>
                    </Button>
                  </label>
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
                            className="w-full h-12 object-cover rounded-none border"
                          />
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
    </div>
  )
}

export default FormContent