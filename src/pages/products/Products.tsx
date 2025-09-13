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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

import {
  mockLifecycleAdapter,
  type LifecycleCard,
  type FilterOptions,
  type ViewType,
  type SavedView,
  type User,
  type Stage,
  type Priority
} from '@/services/mockLifecycleAdapter'
import { useSuppliers } from '@/hooks/useSuppliers'
import { ActivityPanel, type StageKey, type TimelineEntry, type NowNextBlocked, saveTimelineEntry, updateStage, setNowNextBlocked } from '@/components/products/ActivityPanel'
import { FormContent } from '@/components/products/FormContent'

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
  const [availableOwners, setAvailableOwners] = useState<User[]>([])
  
  // Drawer state
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  
  // Stage filter state
  const [activeStageFilter, setActiveStageFilter] = useState<Stage | 'all'>('all')
  
  // Get selected card
  const selectedCard = cards.find(card => card.id === selectedCardId)
  
  // Get stage-specific notes for the selected card
  const getCardNotes = (card: LifecycleCard) => {
    switch (card.stage) {
      case 'idea':
        return card.ideaData?.notes || ''
      default:
        return ''
    }
  }
  
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
    return availableOwners.filter(user => leadSet.has(user.id))
  }, [cards, availableOwners])
  
  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [cardsData, viewsData, ownersData] = await Promise.all([
          mockLifecycleAdapter.listCards(),
          mockLifecycleAdapter.listSavedViews(),
          mockLifecycleAdapter.listOwners()
        ])
        
        setCards(cardsData)
        setSavedViews(viewsData)
        setAvailableOwners(ownersData)

        console.log('Loaded data:')
        console.log('Cards:', cardsData.length)
        console.log('Available owners:', ownersData)
        console.log('Saved views:', viewsData.length)
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
  }, [])
  
  // Filter and search cards
  useEffect(() => {
    const applyFilters = async () => {
      try {
        // Apply stage filter to the filters object
        const stageFilters = activeStageFilter === 'all' ? filters : {
          ...filters,
          stages: [activeStageFilter]
        }
        
        const filtered = await mockLifecycleAdapter.listCards({
          filters: stageFilters,
          search: searchQuery,
          sort: { field: 'updatedAt', direction: 'desc' }
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

  // Card Details Drawer Component
  const CardDetailsDrawer = ({
    card,
    open,
    onOpenChange,
    onUpdate
  }: {
    card?: LifecycleCard | null,
    open: boolean,
    onOpenChange: (open: boolean) => void,
    onUpdate: (card: LifecycleCard) => void
  }) => {
    if (!card) return null

    const cardIndex = filteredCards.findIndex(c => c.id === card.id);
    const sequentialId = cardIndex >= 0 ? cardIndex + 1 : 'N/A';
    const stageConfig = STAGE_CONFIG[card.stage];
    const StageIcon = stageConfig?.icon || Package;

    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              {card.title || card.workingTitle || `Demo Product ${sequentialId}`}
            </SheetTitle>
            <div className="text-sm text-muted-foreground">
              Product ID: #{sequentialId}
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Product Image */}
            {card.ideaData?.thumbnail && (
              <div>
                <Label className="text-sm font-medium">Product Image</Label>
                <div className="mt-2">
                  <img
                    src={card.ideaData.thumbnail}
                    alt={card.title}
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                </div>
              </div>
            )}

            {/* Stage and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Stage</Label>
                <div className="mt-1 flex items-center gap-2">
                  <StageIcon className="h-4 w-4 text-primary" />
                  <Badge variant="secondary" className="capitalize">
                    {stageConfig?.name || card.stage}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Priority</Label>
                <Badge
                  variant={card.priority === 'high' ? 'destructive' :
                          card.priority === 'medium' ? 'default' : 'secondary'}
                  className="mt-1 capitalize"
                >
                  {card.priority || 'Medium'}
                </Badge>
              </div>
            </div>

            {/* Team Lead */}
            <div>
              <Label className="text-sm font-medium">Assigned To</Label>
              <div className="mt-1 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                  {card.teamLead.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium">{card.teamLead.name}</div>
                  <div className="text-xs text-muted-foreground">Team Lead</div>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div>
              <Label className="text-sm font-medium">Categories</Label>
              <div className="flex flex-wrap gap-1 mt-2">
                {card.category.map((cat, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Tags */}
            {card.tags.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Tags</Label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {card.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs bg-primary/10 text-primary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {getCardNotes(card) && (
              <div>
                <Label className="text-sm font-medium">Notes</Label>
                <div className="mt-2 p-3 bg-muted rounded-lg text-sm">
                  {getCardNotes(card)}
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Created</Label>
                <div className="text-sm text-muted-foreground mt-1">
                  {card.createdAt.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Last Updated</Label>
                <div className="text-sm text-muted-foreground mt-1">
                  {card.updatedAt.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }


  const handleCreateIdea = async () => {
    try {
      if (!newIdeaForm.title.trim()) {
        toast({
          title: 'Title required',
          description: 'Please enter a title for your idea.',
          variant: 'destructive'
        })
        return
      }

      // Create new card with form data
      const newCardData = {
        title: newIdeaForm.title,
        workingTitle: newIdeaForm.title,
        tags: tags.length > 0 ? tags : ['new-product'], // Use tags from state
        category: selectedCategories.length > 0 ? selectedCategories : ['General'],
        priority: newIdeaForm.priority as Priority,
        stage: newIdeaForm.stage as Stage,
        assignedTo: newIdeaForm.assignedTo,
        notes: newIdeaForm.notes,
        problemStatement: newIdeaForm.problemStatement,
        opportunityStatement: newIdeaForm.opportunityStatement,
        estimatedSourcePriceMin: newIdeaForm.estimatedSourcePriceMin,
        estimatedSourcePriceMax: newIdeaForm.estimatedSourcePriceMax,
        selectedSupplierId: newIdeaForm.selectedSupplierId,
        productImage: uploadedProductImage
      }

      console.log('Creating new card with data:', newCardData)
      console.log('Tags being created:', newCardData.tags)
      console.log('Selected categories:', selectedCategories)
      console.log('Available owners:', availableOwners.map(o => ({ id: o.id, name: o.name })))

      const newCard = await mockLifecycleAdapter.createIdea({
        title: newCardData.title,
        tags: newCardData.tags,
        category: newCardData.category,
        competitorLinks: referenceLinks.filter(link => link.type === 'competitor').map(link => link.url),
        adLinks: referenceLinks.filter(link => link.type === 'ad').map(link => link.url),
        notes: newCardData.notes,
        thumbnail: uploadedProductImage ? URL.createObjectURL(uploadedProductImage) : undefined,
        estimatedSourcePriceMin: newCardData.estimatedSourcePriceMin,
        estimatedSourcePriceMax: newCardData.estimatedSourcePriceMax,
        selectedSupplierId: newCardData.selectedSupplierId
      })

      // Update the new card with form data that mockLifecycleAdapter might not handle
      const enhancedCard = {
        ...newCard,
        priority: newCardData.priority,
        stage: newCardData.stage,
        teamLead: availableOwners.find(owner => owner.id === newCardData.assignedTo) || availableOwners[0] || newCard.teamLead
      }

      console.log('Enhanced card:', enhancedCard)

      setCards(prev => [enhancedCard, ...prev])

      // If we're not on 'all' or matching stage filter, switch to show the new card
      if (activeStageFilter !== 'all' && activeStageFilter !== newCardData.stage) {
        setActiveStageFilter(newCardData.stage)
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
        description: `"${enhancedCard.title || enhancedCard.workingTitle}" has been added to the ${enhancedCard.stage} stage.`
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
            <div className="h-8 bg-muted rounded w-64 mb-6" />
            <div className="h-12 bg-muted rounded mb-6" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-48 bg-muted rounded" />
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
                  <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                    <Button
                      variant={selectedView === 'gallery' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectedView('gallery')}
                      className="gap-2"
                    >
                      <Images className="h-4 w-4" />
                      Gallery
                    </Button>
                    <Button
                      variant={selectedView === 'table' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectedView('table')}
                      className="gap-2"
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
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                New Idea
              </Button>
              <Button
                variant="outline"
                className="gap-2"
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
            </div>
          </div>
        </div>
        
        {/* Stage Filter Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-muted rounded-lg w-fit">
            <Button
              variant={activeStageFilter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveStageFilter('all')}
              className="gap-2"
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
                  className="gap-2"
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
          <div className="bg-white rounded-lg border">
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
                    const sequentialId = index + 1;
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
                            <div className="font-medium">{card.title || card.workingTitle || `Demo Product ${sequentialId}`}</div>
                            <div className="text-xs text-gray-500">ID: #{sequentialId}</div>
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
              const sequentialId = index + 1;
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
                  <div className="relative h-[200px] bg-muted">
                    <img
                      src={card.ideaData?.thumbnail || `https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&crop=center`}
                      alt={card.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&crop=center`;
                      }}
                    />
                  </div>

                  {/* Card Content - 35% of card height */}
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>ID: #{sequentialId}</span>
                        <span>{new Date(card.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}</span>
                      </div>

                      {/* Product Name */}
                      <div className="text-sm font-bold text-foreground truncate">
                        {card.title || card.workingTitle || `Demo Product ${sequentialId}`}
                      </div>

                      {/* Priority and Stage */}
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColor}`}>
                          {(card.priority || 'medium').charAt(0).toUpperCase() + (card.priority || 'medium').slice(1)}
                        </span>
                        <div className="flex items-center gap-1 px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs">
                          <StageIcon className="h-3 w-3" />
                          <span className="font-medium">{stageConfig?.name || card.stage}</span>
                        </div>
                      </div>

                      {/* Category and Assigned User */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-md text-xs">
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
                              <span key={index} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-sm text-[10px] font-normal whitespace-nowrap flex-shrink-0">
                                {tag}
                              </span>
                            ))}
                            {card.tags.length > 3 && (
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-sm text-[10px] font-normal flex-shrink-0">
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
          <DialogContent className="w-[calc(100vw-4rem)] h-[calc(100vh-4rem)] max-w-none max-h-none flex flex-col">
            <DialogHeader className="flex-shrink-0 pb-4 border-b border-border/20">
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Lightbulb className="h-5 w-5 text-primary" />
                  </div>
                  New Product Idea
                </DialogTitle>
                
                {/* Activity panel toggle for desktop */}
                <div className="hidden lg:flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowActivityPanel(!showActivityPanel)}
                    className="flex items-center gap-2"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    Activity
                  </Button>
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
                    availableOwners={availableOwners}
                    uploadedProductImage={uploadedProductImage}
                    handleProductImageUpload={handleProductImageUpload}
                    removeProductImage={removeProductImage}
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
                  availableOwners={availableOwners}
                  uploadedProductImage={uploadedProductImage}
                  handleProductImageUpload={handleProductImageUpload}
                  removeProductImage={removeProductImage}
                />
              </div>
              
              {/* Right pane: Activity Panel */}
              {showActivityPanel && (
                <div className="sticky top-0 max-h-[calc(100vh-160px)] overflow-y-auto bg-muted/30 rounded-lg p-4">
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
                  className="min-w-[80px]"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateIdea}
                  className="min-w-[120px] bg-primary hover:bg-primary/90"
                >
                  Create Idea
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Card Details Drawer */}
        <CardDetailsDrawer 
          card={selectedCard}
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          onUpdate={(updatedCard) => {
            setCards(prev => prev.map(card => 
              card.id === updatedCard.id ? updatedCard : card
            ))
          }}
        />
      </div>
    </div>
    )
  }
