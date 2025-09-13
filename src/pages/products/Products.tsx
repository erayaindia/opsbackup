import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import {
  Search,
  Filter,
  Plus,
  HelpCircle,
  LayoutGrid,
  Table as TableIcon,
  Images,
  Star,
  Trash2,
  Lightbulb,
  Factory,
  Camera,
  TrendingUp,
  Clock,
  Users,
  ExternalLink,
  Calendar,
  Target,
  FileText,
  Video,
  Package,
  ShoppingCart,
  BarChart3,
  Zap,
  Edit3,
  X,
  ImagePlus,
  VideoIcon,
  Download,
  ChevronDown,
  Globe
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

import {
  productLifecycleService,
  type LifecycleProduct as LifecycleCard,
  type FilterOptions,
  type CreateProductPayload
} from '@/services/productLifecycleService'

// Re-export types for compatibility
export type ViewType = 'table' | 'gallery'
export type Stage = 'idea' | 'production' | 'content' | 'scaling' | 'inventory'
export type Priority = 'low' | 'medium' | 'high'
export type User = { id: string; name: string; email: string }
export interface SavedView {
  id: string
  name: string
  filters: FilterOptions
  search: string
  view: ViewType
  createdAt: Date
}
import { useSuppliers } from '@/hooks/useSuppliers'
import { useUsers } from '@/hooks/useUsers'
import { ActivityPanel, type StageKey, type TimelineEntry, type NowNextBlocked, saveTimelineEntry, updateStage, setNowNextBlocked } from '@/components/products/ActivityPanel'
import { FormContent } from '@/components/products/FormContent'
import { ProductDetailsModal } from '@/components/products/ProductDetailsModal'
import { debugProductsRLS } from '@/utils/debugProductsRLS'

const STORAGE_KEYS = {
  LAST_VIEW: 'lifecycle_last_view'
}

const STAGE_CONFIG = {
  idea: { name: 'Idea', icon: Lightbulb, color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950' },
  production: { name: 'Production', icon: Factory, color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-950' },
  content: { name: 'Content', icon: Camera, color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950' },
  scaling: { name: 'Scaling', icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-950' }
}

export default function Lifecycle() {
  // Hooks
  const { suppliers, loading: suppliersLoading } = useSuppliers()
  const { users: availableUsers, loading: usersLoading } = useUsers()
  
  // State management
  const [cards, setCards] = useState<LifecycleCard[]>([])
  const [filteredCards, setFilteredCards] = useState<LifecycleCard[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedView, setSelectedView] = useState<ViewType>(() => {
    return (localStorage.getItem(STORAGE_KEYS.LAST_VIEW) as ViewType) || 'gallery'
  })
  
  // Filters state
  const [filters, setFilters] = useState<FilterOptions>({
    stages: [],
    tags: [],
    categories: [],
    owners: [],
    teamLeads: [],
    priority: [],
    potentialScoreMin: undefined,
    potentialScoreMax: undefined,
    idleDaysMin: undefined,
    internalCodePattern: undefined,
    createdDateRange: undefined,
    updatedDateRange: undefined,
    marginRange: undefined,
    supplierLocations: []
  })
  
  // Modal state
  const [showNewIdeaModal, setShowNewIdeaModal] = useState(false)
  const [newIdeaForm, setNewIdeaForm] = useState({
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
    selectedSupplierId: '',
    priority: 'medium',
    stage: 'idea',
    assignedTo: ''
  })
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [uploadedVideos, setUploadedVideos] = useState<File[]>([])
  const [uploadedProductImage, setUploadedProductImage] = useState<File | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [referenceLinks, setReferenceLinks] = useState<Array<{url: string, type: 'competitor' | 'ad'}>>([])
  const [dragActive, setDragActive] = useState(false)
  
  // Activity panel state
  const [showActivityPanel, setShowActivityPanel] = useState(true)
  const [currentStage, setCurrentStage] = useState<StageKey>('idea')
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([])
  const [nowNextBlocked, setNowNextBlockedState] = useState<NowNextBlocked>({})
  
  // Saved views state
  const [savedViews, setSavedViews] = useState<SavedView[]>([])
  
  // Drawer state
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  
  // Stage filter state
  const [activeStageFilter, setActiveStageFilter] = useState<Stage | 'all'>('all')
  
  // Get selected card
  const selectedCard = cards.find(card => card.id === selectedCardId)
  
  // Available tags and categories derived from cards
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>()
    cards.forEach(card => card.tags.forEach(tag => tagSet.add(tag)))
    return Array.from(tagSet).sort()
  }, [cards])

  const availableCategories = useMemo(() => {
    const categorySet = new Set<string>()
    cards.forEach(card => card.category.forEach(cat => categorySet.add(cat)))
    return Array.from(categorySet).sort()
  }, [cards])

  const availableTeamLeads = useMemo(() => {
    const leadSet = new Set<string>()
    cards.forEach(card => leadSet.add(card.teamLead.id))
    return availableUsers.filter(user => leadSet.has(user.id))
  }, [cards, availableUsers])
  
  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const cardsData = await productLifecycleService.listProducts()

        setCards(cardsData)
        setSavedViews([]) // TODO: Implement saved views in database

        console.log('Loaded data:')
        console.log('Cards:', cardsData.length)
        console.log('Available users:', availableUsers)
      } catch (error) {
        console.error('Failed to load lifecycle data:', error)
        toast({
          title: 'Error loading data',
          description: 'Please refresh the page to try again.',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [availableUsers])
  
  // Filter and search cards
  useEffect(() => {
    const applyFilters = async () => {
      try {
        // Apply stage filter to the filters object
        const stageFilters = activeStageFilter === 'all' ? filters : {
          ...filters,
          stages: [activeStageFilter]
        }

        const filtered = await productLifecycleService.listProducts({
          filters: stageFilters,
          search: searchQuery,
          sort: { field: 'updated_at', direction: 'desc' }
        })
        setFilteredCards(filtered)
      } catch (error) {
        console.error('Filter error:', error)
        setFilteredCards(cards)
      }
    }

    applyFilters()
  }, [cards, filters, searchQuery, activeStageFilter])
  
  // Persist view selection
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LAST_VIEW, selectedView)
  }, [selectedView])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        const searchInput = document.getElementById('lifecycle-search')
        searchInput?.focus()
        return
      }
      
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
        const activeElement = document.activeElement
        if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault()
          setShowNewIdeaModal(true)
          return
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])
  
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

  // Generate slug from product name
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  // Auto-resize textarea function
  const autoResize = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto'
    textarea.style.height = Math.max(textarea.scrollHeight, 72) + 'px'
  }

  // Sample tag suggestions

  const tagSuggestions = [
    'wireless', 'premium', 'ergonomic', 'sustainable', 'portable',
    'smart', 'compact', 'durable', 'innovative', 'eco-friendly'
  ]

  // Handle tag operations
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(tagInput)
    }
  }

  // Handle reference link operations
  const addReferenceLink = (type: 'competitor' | 'ad') => {
    setReferenceLinks([...referenceLinks, { url: '', type }])
  }

  const removeReferenceLink = (index: number) => {
    setReferenceLinks(referenceLinks.filter((_, i) => i !== index))
  }

  const updateReferenceLink = (index: number, url: string) => {
    const updated = [...referenceLinks]
    updated[index] = { ...updated[index], url }
    setReferenceLinks(updated)
  }

  // Drag and drop handlers for media
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

  // Validate URL
  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  // Get domain from URL
  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname
    } catch {
      return ''
    }
  }


  // Activity panel handlers
  const handleStageChange = async (stage: StageKey) => {
    await updateStage(stage)
    setCurrentStage(stage)
    // Refresh timeline entries if needed
  }

  const handleAddTimelineEntry = async (entry: Omit<TimelineEntry, 'id' | 'timestamp'>) => {
    await saveTimelineEntry(entry)
    setTimelineEntries(prev => [...prev, {
      ...entry,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    }])
  }

  const handleUpdateNowNextBlocked = async (values: NowNextBlocked) => {
    await setNowNextBlocked(values)
    setNowNextBlockedState(prev => ({ ...prev, ...values }))
  }

  // Utility functions
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

  const handleUpdateProduct = async (productId: string, updates: Partial<CreateProductPayload>): Promise<LifecycleProduct> => {
    try {
      const updatedProduct = await productLifecycleService.updateProduct(productId, updates)

      // Update the product in the local state
      setCards(prev => prev.map(card =>
        card.id === productId ? updatedProduct : card
      ))

      return updatedProduct
    } catch (error) {
      console.error('Failed to update product:', error)
      throw error
    }
  }

  const handleDeleteProduct = async (productId: string): Promise<void> => {
    try {
      await productLifecycleService.deleteProduct(productId)

      // Remove the product from the local state
      setCards(prev => prev.filter(card => card.id !== productId))

      console.log('Product deleted successfully:', productId)
    } catch (error) {
      console.error('Failed to delete product:', error)
      throw error
    }
  }

  const handleCreateIdea = async () => {
    try {
      // Validate all mandatory fields
      if (!newIdeaForm.title.trim()) {
        toast({
          title: 'Product Name required',
          description: 'Please enter a product name.',
          variant: 'destructive'
        })
        return
      }

      if (!newIdeaForm.assignedTo) {
        toast({
          title: 'Assigned To required',
          description: 'Please select a team member to assign this product to.',
          variant: 'destructive'
        })
        return
      }

      if (!newIdeaForm.stage) {
        toast({
          title: 'Stage required',
          description: 'Please select a stage for this product.',
          variant: 'destructive'
        })
        return
      }

      if (!newIdeaForm.priority) {
        toast({
          title: 'Priority required',
          description: 'Please select a priority level for this product.',
          variant: 'destructive'
        })
        return
      }

      // Upload product image if provided
      let thumbnailUrl: string | undefined
      if (uploadedProductImage) {
        try {
          thumbnailUrl = await productLifecycleService.uploadProductImage(uploadedProductImage, 'temp')
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError)
          toast({
            title: 'Image upload failed',
            description: 'Product will be created without image.',
            variant: 'destructive'
          })
        }
      }

      // Prepare payload
      const payload: CreateProductPayload = {
        title: newIdeaForm.title,
        tags: tags.length > 0 ? tags : undefined,
        category: selectedCategories.length > 0 ? selectedCategories : undefined,
        competitorLinks: referenceLinks.filter(link => link.type === 'competitor').map(link => link.url),
        adLinks: referenceLinks.filter(link => link.type === 'ad').map(link => link.url),
        notes: newIdeaForm.notes,
        thumbnail: thumbnailUrl,
        problemStatement: newIdeaForm.problemStatement,
        opportunityStatement: newIdeaForm.opportunityStatement,
        estimatedSourcePriceMin: newIdeaForm.estimatedSourcePriceMin,
        estimatedSourcePriceMax: newIdeaForm.estimatedSourcePriceMax,
        selectedSupplierId: newIdeaForm.selectedSupplierId,
        priority: newIdeaForm.priority as Priority,
        stage: newIdeaForm.stage as Stage,
        assignedTo: newIdeaForm.assignedTo
      }

      console.log('Creating new product with payload:', payload)

      const newProduct = await productLifecycleService.createProduct(payload)

      console.log('Created product:', newProduct)

      // Refresh the products list
      const updatedProducts = await productLifecycleService.listProducts()
      setCards(updatedProducts)

      // If we're not on 'all' or matching stage filter, switch to show the new product
      if (activeStageFilter !== 'all' && activeStageFilter !== payload.stage) {
        setActiveStageFilter(payload.stage)
      }

      // Reset form
      setNewIdeaForm({
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
        selectedSupplierId: '',
        priority: 'medium',
        stage: 'idea',
        assignedTo: ''
      })
      setUploadedImages([])
      setUploadedVideos([])
      setUploadedProductImage(null)
      setSelectedCategories([])
      setTagInput('')
      setTags([])
      setReferenceLinks([])
      setDragActive(false)

      setShowNewIdeaModal(false)

      toast({
        title: 'Product created successfully!',
        description: `"${newProduct.workingTitle}" has been added to the ${newProduct.stage} stage.`
      })

    } catch (error) {
      console.error('Failed to create product:', error)
      toast({
        title: 'Failed to create product',
        description: 'Please try again.',
        variant: 'destructive'
      })
    }
  }
  
  const getFilteredCount = () => {
    const activeFilters = [
      ...filters.stages,
      ...filters.tags,
      ...filters.categories,
      ...filters.owners,
      ...filters.teamLeads,
      ...filters.priority || [],
      ...filters.supplierLocations || [],
      ...(filters.potentialScoreMin !== undefined ? ['score-min'] : []),
      ...(filters.potentialScoreMax !== undefined ? ['score-max'] : []),
      ...(filters.idleDaysMin !== undefined ? ['idle-days'] : []),
      ...(filters.internalCodePattern ? ['internal-code'] : []),
      ...(filters.createdDateRange ? ['created-date'] : []),
      ...(filters.updatedDateRange ? ['updated-date'] : []),
      ...(filters.marginRange ? ['margin-range'] : [])
    ].length + (searchQuery ? 1 : 0)
    
    return { count: filteredCards.length, activeFilters }
  }
  
  const { count: filteredCount, activeFilters } = getFilteredCount()
  
  // Get stage statistics
  const stageStats = useMemo(() => {
    const stats = {
      idea: 0,
      production: 0,
      content: 0,
      scaling: 0
    }
    
    filteredCards.forEach(card => {
      stats[card.stage]++
    })
    
    return stats
  }, [filteredCards])
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="px-6 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded-none w-64 mb-6" />
            <div className="h-12 bg-muted rounded-none mb-6" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-48 bg-muted rounded-none" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="px-6 py-6">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b mb-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <h1 className="text-3xl font-bold tracking-tight">Product Management</h1>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 p-1 bg-muted rounded-none">
                    <Button
                      variant={selectedView === 'gallery' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectedView('gallery')}
                      className="gap-2 rounded-none"
                    >
                      <Images className="h-4 w-4" />
                      Gallery
                    </Button>
                    <Button
                      variant={selectedView === 'table' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectedView('table')}
                      className="gap-2 rounded-none"
                    >
                      <TableIcon className="h-4 w-4" />
                      Table
                    </Button>
                  </div>
                  
                  <Badge variant="secondary" className="px-3 py-1">
                    {filteredCount} {filteredCount === 1 ? 'item' : 'items'}
                    {activeFilters > 0 && (
                      <span className="ml-1 text-xs">({activeFilters} filters)</span>
                    )}
                  </Badge>
                  
                  <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="lifecycle-search"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 h-10 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowNewIdeaModal(true)}
                className="gap-2 rounded-none"
              >
                <Plus className="h-4 w-4" />
                New Idea
              </Button>
              <Button
                variant="outline"
                className="gap-2 rounded-none"
                onClick={() => {
                  // Export functionality would go here
                  toast({
                    title: 'Export started',
                    description: 'Your products data is being exported...'
                  })
                }}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button
                variant="outline"
                className="gap-2 rounded-none"
                onClick={() => {
                  debugProductsRLS()
                  toast({
                    title: 'Debug running',
                    description: 'Check browser console for RLS debug info.'
                  })
                }}
              >
                Debug RLS
              </Button>
            </div>
          </div>
        </div>
        
        {/* Stage Filter Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-muted rounded-none w-fit">
            <Button
              variant={activeStageFilter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveStageFilter('all')}
              className="gap-2 rounded-none"
            >
              <LayoutGrid className="h-4 w-4" />
              All Stages
            </Button>
            {Object.entries(STAGE_CONFIG).map(([stage, config]) => {
              const StageIcon = config.icon
              const stageCards = cards.filter(card => card.stage === stage)
              
              return (
                <Button
                  key={stage}
                  variant={activeStageFilter === stage ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveStageFilter(stage as Stage)}
                  className="gap-2 rounded-none"
                >
                  <StageIcon className="h-4 w-4" />
                  {config.name}
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {stageCards.length}
                  </Badge>
                </Button>
              )
            })}
          </div>
        </div>
        
        
        {/* Main Content Based on View */}
        {selectedView === 'table' && (
          <div className="bg-white rounded-none border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium">Title</th>
                    <th className="text-left p-4 font-medium">Stage</th>
                    <th className="text-left p-4 font-medium">Category</th>
                    <th className="text-left p-4 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCards.map((card, index) => {
                    return (
                      <tr
                        key={card.id}
                        className="border-b hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setSelectedCardId(card.id)
                          setIsDrawerOpen(true)
                        }}
                      >
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{card.workingTitle || card.name || `Product ${card.internalCode}`}</div>
                            <div className="text-xs text-gray-500">{card.internalCode}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary">{card.stage}</Badge>
                        </td>
                        <td className="p-4">{card.category.join(', ')}</td>
                        <td className="p-4 text-sm text-gray-500">
                          {card.createdAt.toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {selectedView === 'gallery' && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
            {filteredCards.map((card, index) => {
              const priorityColor = card.priority === 'high' ? 'bg-red-100 text-red-700 border border-red-200' :
                                  card.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                  'bg-green-100 text-green-700 border border-green-200';
              const stageConfig = STAGE_CONFIG[card.stage];
              const StageIcon = stageConfig?.icon || Package;

              return (
                <Card
                  key={card.id}
                  onClick={() => {
                    setSelectedCardId(card.id)
                    setIsDrawerOpen(true)
                  }}
                  className="enhanced-card hover:shadow-elegant transition-all duration-300 cursor-pointer border-border/50 backdrop-blur-sm animate-fade-in overflow-hidden"
                >
                  {/* Product Image - 65% of card height */}
                  <div className="relative h-[200px] bg-muted flex items-center justify-center">
                    {card.thumbnail || card.thumbnailUrl || card.ideaData?.thumbnail ? (
                      <img
                        src={card.thumbnail || card.thumbnailUrl || card.ideaData?.thumbnail}
                        alt={card.workingTitle || card.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="flex items-center justify-center w-full h-full">
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-muted-foreground/40">
                                  <path d="M20 7h-3V6a3 3 0 0 0-3-3H10a3 3 0 0 0-3 3v1H4a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM9 6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1H9V6zm9 13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h6v1a1 1 0 0 0 2 0V9h2v10z" fill="currentColor"/>
                                  <circle cx="9" cy="13" r="1" fill="currentColor"/>
                                  <circle cx="15" cy="13" r="1" fill="currentColor"/>
                                  <path d="M12 15.5c-1.1 0-2-.9-2-2h4c0 1.1-.9 2-2 2z" fill="currentColor"/>
                                </svg>
                              </div>
                            `;
                          }
                        }}
                      />
                    ) : (
                      // Default themed SVG icon for products without images
                      <div className="flex items-center justify-center w-full h-full">
                        <svg
                          width="64"
                          height="64"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="text-muted-foreground/40"
                        >
                          <path
                            d="M20 7h-3V6a3 3 0 0 0-3-3H10a3 3 0 0 0-3 3v1H4a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM9 6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1H9V6zm9 13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h6v1a1 1 0 0 0 2 0V9h2v10z"
                            fill="currentColor"
                          />
                          <circle cx="9" cy="13" r="1" fill="currentColor" />
                          <circle cx="15" cy="13" r="1" fill="currentColor" />
                          <path d="M12 15.5c-1.1 0-2-.9-2-2h4c0 1.1-.9 2-2 2z" fill="currentColor" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Card Content - 35% of card height */}
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-mono text-xs">{card.internalCode}</span>
                        <span>{new Date(card.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}</span>
                      </div>

                      {/* Product Name */}
                      <div className="text-sm font-bold text-foreground truncate">
                        {card.workingTitle || card.name || `Product ${card.internalCode}`}
                      </div>

                      {/* Priority and Stage */}
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-none text-xs font-medium ${priorityColor}`}>
                          {(card.priority || 'medium').charAt(0).toUpperCase() + (card.priority || 'medium').slice(1)}
                        </span>
                        <div className="flex items-center gap-1 px-2 py-1 bg-muted text-muted-foreground rounded-none text-xs">
                          <StageIcon className="h-3 w-3" />
                          <span className="font-medium">{stageConfig?.name || card.stage}</span>
                        </div>
                      </div>

                      {/* Category and Assigned User */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-none text-xs">
                          {card.category[0] || 'Uncategorized'}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                            {card.teamLead.name.charAt(0)}
                          </div>
                          <span className="text-xs">{card.teamLead.name.split(' ')[0]}</span>
                        </div>
                      </div>

                      {/* Tags at bottom */}
                      {(card.tags && card.tags.length > 0) && (
                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex items-center gap-1 overflow-hidden">
                            {card.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-none text-[10px] font-normal whitespace-nowrap flex-shrink-0">
                                {tag}
                              </span>
                            ))}
                            {card.tags.length > 3 && (
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-none text-[10px] font-normal flex-shrink-0">
                                +{card.tags.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        
        {/* New Idea Modal */}
        <Dialog open={showNewIdeaModal} onOpenChange={setShowNewIdeaModal}>
          <DialogContent className="w-[50vw] h-[calc(100vh-4rem)] max-w-none max-h-none flex flex-col">
            <DialogHeader className="flex-shrink-0 pb-4 border-b border-border/20">
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
                  <div className="p-2 rounded-none bg-primary/10">
                    <Lightbulb className="h-5 w-5 text-primary" />
                  </div>
                  New Product Idea
                </DialogTitle>
                
                {/* Top right controls */}
                <div className="hidden lg:flex items-center gap-4 mr-8">
                  {/* Product Photo Upload */}
                  <div className="flex items-center gap-2">
                    {uploadedProductImage ? (
                      <div className="relative">
                        <img
                          src={URL.createObjectURL(uploadedProductImage)}
                          alt="Product"
                          className="w-8 h-8 object-cover rounded-none border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-1 -right-1 h-4 w-4 rounded-none p-0"
                          onClick={removeProductImage}
                        >
                          <X className="h-2 w-2" />
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleProductImageUpload(file)
                            }
                          }}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 rounded-none"
                          asChild
                        >
                          <span>
                            <ImagePlus className="h-3 w-3" />
                            Add Photo
                          </span>
                        </Button>
                      </label>
                    )}
                  </div>

                  {/* Assigned To */}
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium text-foreground">Assigned To: *</Label>
                    {usersLoading && <span className="text-xs text-muted-foreground ml-1">(Loading...)</span>}
                    <Select
                      value={newIdeaForm.assignedTo || ''}
                      onValueChange={(value) => setNewIdeaForm(prev => ({ ...prev, assignedTo: value }))}
                    >
                      <SelectTrigger className="h-8 w-40 rounded-none">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.length === 0 ? (
                          <SelectItem value="no-users" disabled>No users available</SelectItem>
                        ) : (
                          availableUsers.map((owner) => (
                            <SelectItem key={owner.id} value={owner.id}>
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                                  {owner.name.charAt(0)}
                                </div>
                                <span className="text-xs">{owner.name.split(' ')[0]}</span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </DialogHeader>
            
            {/* Mobile tabs or desktop two-pane layout */}
            <div className="flex-1 overflow-hidden lg:hidden">
              {/* Mobile: Tab-based layout */}
              <Tabs defaultValue="details" className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-2 mx-6 mt-4">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="activity" className="flex items-center gap-2">
                    Activity
                    <Badge variant="secondary" className="text-xs">
                      {timelineEntries.length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="flex-1 overflow-y-auto space-y-6 p-6 mt-0 max-h-[70vh] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                  <FormContent
                    newIdeaForm={newIdeaForm}
                    setNewIdeaForm={setNewIdeaForm}
                    selectedCategories={selectedCategories}
                    setSelectedCategories={setSelectedCategories}
                    availableCategories={availableCategories}
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
                </TabsContent>
                
                <TabsContent value="activity" className="flex-1 overflow-y-auto p-6 mt-0">
                  <ActivityPanel
                    currentStage={currentStage}
                    entries={timelineEntries}
                    nowNextBlocked={nowNextBlocked}
                    onStageChange={handleStageChange}
                    onAddEntry={handleAddTimelineEntry}
                    onUpdateNowNextBlocked={handleUpdateNowNextBlocked}
                    isVisible={true}
                    onToggleVisibility={() => {}}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Desktop: Two-pane layout */}
            <div className={`hidden lg:block flex-1 overflow-hidden ${
              showActivityPanel ? 'grid grid-cols-[1fr,400px] gap-6' : ''
            }`}>
              {/* Left pane: Form content */}
              <div className="overflow-y-auto space-y-6 p-6 max-h-[70vh] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                <FormContent
                  newIdeaForm={newIdeaForm}
                  setNewIdeaForm={setNewIdeaForm}
                  selectedCategories={selectedCategories}
                  setSelectedCategories={setSelectedCategories}
                  availableCategories={availableCategories}
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
              
              {/* Right pane: Activity Panel */}
              {showActivityPanel && (
                <div className="sticky top-0 max-h-[calc(100vh-160px)] overflow-y-auto bg-muted/30 rounded-none p-4">
                  <ActivityPanel
                    currentStage={currentStage}
                    entries={timelineEntries}
                    nowNextBlocked={nowNextBlocked}
                    onStageChange={handleStageChange}
                    onAddEntry={handleAddTimelineEntry}
                    onUpdateNowNextBlocked={handleUpdateNowNextBlocked}
                    isVisible={true}
                    onToggleVisibility={() => setShowActivityPanel(false)}
                  />
                </div>
              )}
            </div>
            
            {/* Modal Footer - Fixed at bottom */}
            <div className="flex-shrink-0 bg-background border-t border-border/30 px-6 py-4 mt-6">
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowNewIdeaModal(false)}
                  className="min-w-[80px] rounded-none"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateIdea}
                  className="min-w-[120px] bg-primary hover:bg-primary/90 rounded-none"
                >
                  Create Idea
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Product Details Modal */}
        <ProductDetailsModal
          product={selectedCard}
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          onUpdate={(updatedProduct) => {
            setCards(prev => prev.map(card =>
              card.id === updatedProduct.id ? updatedProduct : card
            ))
          }}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
        />
      </div>
    </div>
    )
  }
