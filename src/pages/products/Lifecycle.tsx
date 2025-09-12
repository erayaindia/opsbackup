import React, { useState, useEffect, useMemo } from 'react'
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
  X
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
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
  // State management
  const [cards, setCards] = useState<LifecycleCard[]>([])
  const [filteredCards, setFilteredCards] = useState<LifecycleCard[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedView, setSelectedView] = useState<ViewType>(() => {
    return (localStorage.getItem(STORAGE_KEYS.LAST_VIEW) as ViewType) || 'kanban'
  })
  
  // Filters state
  const [filters, setFilters] = useState<FilterOptions>({
    stages: [],
    tags: [],
    owners: [],
    priority: [],
    potentialScoreMin: undefined,
    potentialScoreMax: undefined,
    idleDaysMin: undefined
  })
  
  // Modal state
  const [showNewIdeaModal, setShowNewIdeaModal] = useState(false)
  const [newIdeaForm, setNewIdeaForm] = useState({
    title: '',
    tags: '',
    competitorLinks: '',
    adLinks: '',
    notes: '',
    thumbnail: ''
  })
  
  // Saved views state
  const [savedViews, setSavedViews] = useState<SavedView[]>([])
  const [availableOwners, setAvailableOwners] = useState<User[]>([])
  
  // Drawer state
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  
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
  
  // Available tags derived from cards
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>()
    cards.forEach(card => card.tags.forEach(tag => tagSet.add(tag)))
    return Array.from(tagSet).sort()
  }, [cards])
  
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
        const filtered = await mockLifecycleAdapter.listCards({
          filters,
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
  }, [cards, filters, searchQuery])
  
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
      
      const tags = newIdeaForm.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      const competitorLinks = newIdeaForm.competitorLinks.split('\n').map(link => link.trim()).filter(Boolean)
      const adLinks = newIdeaForm.adLinks.split('\n').map(link => link.trim()).filter(Boolean)
      
      const newCard = await mockLifecycleAdapter.createIdea({
        title: newIdeaForm.title,
        tags,
        competitorLinks,
        adLinks,
        notes: newIdeaForm.notes,
        thumbnail: newIdeaForm.thumbnail || undefined
      })
      
      setCards(prev => [newCard, ...prev])
      
      // Reset form
      setNewIdeaForm({
        title: '',
        tags: '',
        competitorLinks: '',
        adLinks: '',
        notes: '',
        thumbnail: ''
      })
      
      setShowNewIdeaModal(false)
      
      window.dispatchEvent(new CustomEvent('telemetry', {
        detail: { event: 'lifecycle:new_idea', cardId: newCard.id }
      }))
      
      toast({
        title: 'Idea created',
        description: `"${newCard.title}" has been added to the Idea stage.`
      })
      
    } catch (error) {
      console.error('Failed to create idea:', error)
      toast({
        title: 'Failed to create idea',
        description: 'Please try again.',
        variant: 'destructive'
      })
    }
  }
  
  const getFilteredCount = () => {
    const activeFilters = [
      ...filters.stages,
      ...filters.tags,
      ...filters.owners,
      ...filters.priority || [],
      ...(filters.potentialScoreMin !== undefined ? ['score-min'] : []),
      ...(filters.potentialScoreMax !== undefined ? ['score-max'] : []),
      ...(filters.idleDaysMin !== undefined ? ['idle-days'] : [])
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
        <div className="container mx-auto px-4 py-6 max-w-7xl">
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
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b mb-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold tracking-tight">Product Lifecycle</h1>
              <Badge variant="secondary" className="px-3 py-1">
                {filteredCount} {filteredCount === 1 ? 'item' : 'items'}
                {activeFilters > 0 && (
                  <span className="ml-1 text-xs">({activeFilters} filters)</span>
                )}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <HelpCircle className="h-4 w-4" />
                Help
              </Button>
              
              <Button
                onClick={() => setShowNewIdeaModal(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                New Idea
              </Button>
            </div>
          </div>
          
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
              <Button
                variant={selectedView === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedView('kanban')}
                className="gap-2"
              >
                <LayoutGrid className="h-4 w-4" />
                Kanban
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
              <Button
                variant={selectedView === 'gallery' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedView('gallery')}
                className="gap-2"
              >
                <Images className="h-4 w-4" />
                Gallery
              </Button>
            </div>
            
            <div className="flex items-center gap-2 flex-1 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="lifecycle-search"
                  placeholder="Search ideas, tags, owners, links..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Stage Statistics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {Object.entries(STAGE_CONFIG).map(([stage, config]) => {
            const StageIcon = config.icon
            const count = stageStats[stage as Stage]
            
            return (
              <Card key={stage} className={`${config.bgColor} border-0`}>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <StageIcon className={`h-5 w-5 ${config.color}`} />
                    <span className="font-semibold">{config.name}</span>
                  </div>
                  <div className={`text-2xl font-bold ${config.color}`}>{count}</div>
                  <div className="text-sm text-muted-foreground">
                    {count === 1 ? 'product' : 'products'}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
        
        {/* Main Content Based on View */}
        {selectedView === 'kanban' && (
          <KanbanView 
            cards={filteredCards} 
            onCardClick={(cardId) => {
              setSelectedCardId(cardId)
              setIsDrawerOpen(true)
            }}
          />
        )}
        {selectedView === 'table' && (
          <TableView 
            cards={filteredCards} 
            onCardClick={(cardId) => {
              setSelectedCardId(cardId)
              setIsDrawerOpen(true)
            }}
          />
        )}
        {selectedView === 'gallery' && (
          <GalleryView 
            cards={filteredCards} 
            onCardClick={(cardId) => {
              setSelectedCardId(cardId)
              setIsDrawerOpen(true)
            }}
          />
        )}
        
        {/* New Idea Modal */}
        <Dialog open={showNewIdeaModal} onOpenChange={setShowNewIdeaModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                New Product Idea
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newIdeaForm.title}
                  onChange={(e) => setNewIdeaForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter product idea title..."
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={newIdeaForm.tags}
                    onChange={(e) => setNewIdeaForm(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="smart-tech, lifestyle, health"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="thumbnail">Thumbnail URL</Label>
                  <Input
                    id="thumbnail"
                    value={newIdeaForm.thumbnail}
                    onChange={(e) => setNewIdeaForm(prev => ({ ...prev, thumbnail: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newIdeaForm.notes}
                  onChange={(e) => setNewIdeaForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Describe your product idea..."
                  className="mt-1 min-h-[100px]"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="competitor-links">Competitor Links</Label>
                  <Textarea
                    id="competitor-links"
                    value={newIdeaForm.competitorLinks}
                    onChange={(e) => setNewIdeaForm(prev => ({ ...prev, competitorLinks: e.target.value }))}
                    placeholder="https://competitor1.com&#10;https://competitor2.com"
                    className="mt-1 min-h-[80px]"
                  />
                </div>
                
                <div>
                  <Label htmlFor="ad-links">Ad Links</Label>
                  <Textarea
                    id="ad-links"
                    value={newIdeaForm.adLinks}
                    onChange={(e) => setNewIdeaForm(prev => ({ ...prev, adLinks: e.target.value }))}
                    placeholder="https://facebook.com/ads/library/123&#10;https://tiktok.com/ads/456"
                    className="mt-1 min-h-[80px]"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowNewIdeaModal(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateIdea}>
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
            setCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c))
            toast({
              title: 'Card updated',
              description: `"${updatedCard.title}" has been updated.`
            })
          }}
        />
      </div>
    </div>
  )
}

// View components with card click handlers
function KanbanView({ cards, onCardClick }: { cards: LifecycleCard[]; onCardClick: (cardId: string) => void }) {
  return (
    <div className="grid grid-cols-4 gap-6">
      {Object.entries(STAGE_CONFIG).map(([stage, config]) => {
        const stageCards = cards.filter(card => card.stage === stage)
        const StageIcon = config.icon
        
        return (
          <div key={stage} className="space-y-4">
            <div className="flex items-center gap-2 font-semibold">
              <StageIcon className={`h-4 w-4 ${config.color}`} />
              {config.name} ({stageCards.length})
            </div>
            <div className="space-y-3">
              {stageCards.map(card => (
                <Card 
                  key={card.id} 
                  className="p-3 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onCardClick(card.id)}
                >
                  <div className="space-y-2">
                    {card.thumbnail && (
                      <img
                        src={card.thumbnail}
                        alt={card.title}
                        className="w-full h-24 object-cover rounded"
                      />
                    )}
                    <div className="font-medium text-sm">{card.title}</div>
                    <div className="flex flex-wrap gap-1">
                      {card.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {card.owner.name.split(' ')[0]}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {card.potentialScore}%
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TableView({ cards, onCardClick }: { cards: LifecycleCard[]; onCardClick: (cardId: string) => void }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left p-4 font-medium">Title</th>
                <th className="text-left p-4 font-medium">Stage</th>
                <th className="text-left p-4 font-medium">Owner</th>
                <th className="text-left p-4 font-medium">Priority</th>
                <th className="text-left p-4 font-medium">Score</th>
                <th className="text-left p-4 font-medium">Idle Days</th>
              </tr>
            </thead>
            <tbody>
              {cards.map(card => (
                <tr 
                  key={card.id} 
                  className="border-b hover:bg-muted/50 cursor-pointer"
                  onClick={() => onCardClick(card.id)}
                >
                  <td className="p-4">
                    <div className="font-medium">{card.title}</div>
                    <div className="flex gap-1 mt-1">
                      {card.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant="outline" className="capitalize">
                      {card.stage}
                    </Badge>
                  </td>
                  <td className="p-4">{card.owner.name}</td>
                  <td className="p-4">
                    <Badge
                      variant={
                        card.priority === 'high' ? 'destructive' :
                        card.priority === 'medium' ? 'default' : 'secondary'
                      }
                      className="capitalize"
                    >
                      {card.priority}
                    </Badge>
                  </td>
                  <td className="p-4">{card.potentialScore}%</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {card.idleDays}d
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function GalleryView({ cards, onCardClick }: { cards: LifecycleCard[]; onCardClick: (cardId: string) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {cards.map(card => (
        <Card 
          key={card.id} 
          className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onCardClick(card.id)}
        >
          {card.thumbnail && (
            <div className="aspect-video">
              <img
                src={card.thumbnail}
                alt={card.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="font-medium">{card.title}</div>
              <div className="flex flex-wrap gap-1">
                {card.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {card.owner.name.split(' ')[0]}
                </div>
                <Badge variant="outline" className="text-xs">
                  {card.potentialScore}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Card Details Drawer Component
interface CardDetailsDrawerProps {
  card: LifecycleCard | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (card: LifecycleCard) => void
}

function CardDetailsDrawer({ card, open, onOpenChange, onUpdate }: CardDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [editingField, setEditingField] = useState<string | null>(null)
  const [formData, setFormData] = useState<any>({})
  
  // Reset form when card changes
  useEffect(() => {
    if (card) {
      setFormData(card)
      setActiveTab(getDefaultTabForStage(card.stage))
    }
  }, [card])
  
  if (!card) return null
  
  const stageConfig = STAGE_CONFIG[card.stage]
  const StageIcon = stageConfig.icon
  
  const handleFieldUpdate = async (field: string, value: any) => {
    try {
      const updatedCard = await mockLifecycleAdapter.updateCard(card.id, { [field]: value })
      onUpdate(updatedCard)
      setEditingField(null)
    } catch (error) {
      console.error('Failed to update card:', error)
      toast({
        title: 'Update failed',
        description: 'Please try again.',
        variant: 'destructive'
      })
    }
  }
  
  const handleStageChange = async (newStage: Stage) => {
    try {
      const updatedCard = await mockLifecycleAdapter.moveStage(card.id, newStage)
      onUpdate(updatedCard)
      toast({
        title: 'Stage updated',
        description: `"${card.title}" moved to ${STAGE_CONFIG[newStage].name}.`
      })
    } catch (error) {
      console.error('Failed to move card:', error)
      toast({
        title: 'Move failed',
        description: 'Please try again.',
        variant: 'destructive'
      })
    }
  }
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[800px] sm:max-w-[800px] overflow-y-auto">
        <SheetHeader className="space-y-4 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${stageConfig.bgColor}`}>
                  <StageIcon className={`h-4 w-4 ${stageConfig.color}`} />
                </div>
                <Badge variant="outline" className="capitalize">
                  {card.stage}
                </Badge>
              </div>
              <SheetTitle className="text-xl">{card.title}</SheetTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Select value={card.stage} onValueChange={(value: Stage) => handleStageChange(value)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STAGE_CONFIG).map(([stage, config]) => (
                  <SelectItem key={stage} value={stage}>
                    <div className="flex items-center gap-2">
                      <config.icon className={`h-3 w-3 ${config.color}`} />
                      {config.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select 
              value={card.priority} 
              onValueChange={(value: Priority) => handleFieldUpdate('priority', value)}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            
            <Badge variant="outline" className="ml-auto">
              Score: {card.potentialScore}%
            </Badge>
          </div>
        </SheetHeader>
        
        <div className="py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="stage">
                {card.stage === 'idea' && 'Idea'}
                {card.stage === 'production' && 'Production'}
                {card.stage === 'content' && 'Content'}
                {card.stage === 'scaling' && 'Scaling'}
              </TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6 mt-6">
              <OverviewTab card={card} onUpdate={handleFieldUpdate} />
            </TabsContent>
            
            <TabsContent value="stage" className="space-y-6 mt-6">
              {card.stage === 'idea' && <IdeaTab card={card} onUpdate={handleFieldUpdate} />}
              {card.stage === 'production' && <ProductionTab card={card} onUpdate={handleFieldUpdate} />}
              {card.stage === 'content' && <ContentTab card={card} onUpdate={handleFieldUpdate} />}
              {card.stage === 'scaling' && <ScalingTab card={card} onUpdate={handleFieldUpdate} />}
            </TabsContent>
            
            <TabsContent value="history" className="space-y-6 mt-6">
              <HistoryTab card={card} />
            </TabsContent>
            
            <TabsContent value="files" className="space-y-6 mt-6">
              <FilesTab card={card} onUpdate={handleFieldUpdate} />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Helper function to get default tab based on stage
function getDefaultTabForStage(stage: Stage): string {
  return 'overview'
}

// Overview Tab Component
function OverviewTab({ card, onUpdate }: { card: LifecycleCard; onUpdate: (field: string, value: any) => void }) {
  const [editingNotes, setEditingNotes] = useState(false)
  
  // Get current notes based on stage
  const getCurrentNotes = () => {
    switch (card.stage) {
      case 'idea':
        return card.ideaData?.notes || ''
      default:
        return ''
    }
  }
  
  const [notesValue, setNotesValue] = useState(getCurrentNotes())
  
  // Update notes value when card changes
  useEffect(() => {
    setNotesValue(getCurrentNotes())
  }, [card])
  
  const handleNotesUpdate = () => {
    // Update the appropriate stage data
    switch (card.stage) {
      case 'idea':
        onUpdate('ideaData', { ...card.ideaData, notes: notesValue })
        break
      default:
        break
    }
    setEditingNotes(false)
  }
  
  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Owner</Label>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium">
                {card.owner.name.split(' ').map(n => n[0]).join('')}
              </div>
              <span className="text-sm">{card.owner.name}</span>
            </div>
          </div>
          
          <div>
            <Label className="text-sm font-medium">Created</Label>
            <div className="text-sm text-muted-foreground mt-1">
              {new Date(card.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Last Updated</Label>
            <div className="text-sm text-muted-foreground mt-1">
              {new Date(card.updatedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
          
          <div>
            <Label className="text-sm font-medium">Idle Days</Label>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{card.idleDays} days</span>
            </div>
          </div>
        </div>
      </div>
      
      <Separator />
      
      {/* Tags */}
      <div>
        <Label className="text-sm font-medium">Tags</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {card.tags.map(tag => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
      
      <Separator />
      
      {/* Notes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium">Notes</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingNotes(!editingNotes)}
            className="h-6 px-2"
          >
            <Edit3 className="h-3 w-3" />
          </Button>
        </div>
        
        {editingNotes ? (
          <div className="space-y-2">
            <Textarea
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              className="min-h-[120px]"
              placeholder="Add notes about this product..."
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNotesValue(getCurrentNotes())
                  setEditingNotes(false)
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleNotesUpdate}>
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3 min-h-[120px]">
            {getCurrentNotes() || 'No notes added yet. Click edit to add notes.'}
          </div>
        )}
      </div>
    </div>
  )
}

// Stage-specific tab components
function IdeaTab({ card, onUpdate }: { card: LifecycleCard; onUpdate: (field: string, value: any) => void }) {
  if (card.stage !== 'idea') return null
  
  const ideaData = card.stageData as any // Type assertion for demo
  
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium">Feasibility Score</Label>
        <div className="flex items-center gap-4 mt-2">
          <Badge variant="outline" className="text-lg px-3 py-1">
            {card.potentialScore}%
          </Badge>
          <div className="text-sm text-muted-foreground">
            Based on market research and technical analysis
          </div>
        </div>
      </div>
      
      <Separator />
      
      {/* Competitor Links */}
      <div>
        <Label className="text-sm font-medium">Competitor Analysis</Label>
        <div className="space-y-2 mt-2">
          {(ideaData?.competitorLinks || []).map((link: string, index: number) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                {link}
              </a>
            </div>
          ))}
          {(!ideaData?.competitorLinks || ideaData.competitorLinks.length === 0) && (
            <div className="text-sm text-muted-foreground">No competitor links added yet.</div>
          )}
        </div>
      </div>
      
      {/* Ad Links */}
      <div>
        <Label className="text-sm font-medium">Ad Research</Label>
        <div className="space-y-2 mt-2">
          {(ideaData?.adLinks || []).map((link: string, index: number) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                {link}
              </a>
            </div>
          ))}
          {(!ideaData?.adLinks || ideaData.adLinks.length === 0) && (
            <div className="text-sm text-muted-foreground">No ad research links added yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProductionTab({ card, onUpdate }: { card: LifecycleCard; onUpdate: (field: string, value: any) => void }) {
  if (card.stage !== 'production') return null
  
  const productionData = card.stageData as any
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <Label className="text-sm font-medium">Sample Status</Label>
          <Badge variant="secondary" className="mt-1">
            {productionData?.sampleStatus || 'Not Started'}
          </Badge>
        </div>
        
        <div>
          <Label className="text-sm font-medium">Expected Launch</Label>
          <div className="text-sm mt-1">
            {productionData?.expectedLaunch || 'TBD'}
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div>
        <Label className="text-sm font-medium">Suppliers</Label>
        <div className="space-y-2 mt-2">
          {(productionData?.suppliers || []).map((supplier: any, index: number) => (
            <Card key={index} className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{supplier.name}</div>
                  <div className="text-xs text-muted-foreground">{supplier.contact}</div>
                </div>
                <Badge variant="outline">{supplier.status}</Badge>
              </div>
            </Card>
          ))}
          {(!productionData?.suppliers || productionData.suppliers.length === 0) && (
            <div className="text-sm text-muted-foreground">No suppliers added yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}

function ContentTab({ card, onUpdate }: { card: LifecycleCard; onUpdate: (field: string, value: any) => void }) {
  if (card.stage !== 'content') return null
  
  const contentData = card.stageData as any
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <Label className="text-sm font-medium">Shoot Status</Label>
          <Badge variant="secondary" className="mt-1">
            {contentData?.shootStatus || 'Not Started'}
          </Badge>
        </div>
        
        <div>
          <Label className="text-sm font-medium">Content Pieces</Label>
          <div className="text-sm mt-1">
            {contentData?.contentPieces || 0} created
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div>
        <Label className="text-sm font-medium">Scripts & Plans</Label>
        <div className="space-y-2 mt-2">
          {(contentData?.scripts || []).map((script: any, index: number) => (
            <Card key={index} className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{script.title}</div>
                  <div className="text-xs text-muted-foreground">{script.type}</div>
                </div>
                <Badge variant="outline">{script.status}</Badge>
              </div>
            </Card>
          ))}
          {(!contentData?.scripts || contentData.scripts.length === 0) && (
            <div className="text-sm text-muted-foreground">No scripts created yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}

function ScalingTab({ card, onUpdate }: { card: LifecycleCard; onUpdate: (field: string, value: any) => void }) {
  if (card.stage !== 'scaling') return null
  
  const scalingData = card.stageData as any
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <Label className="text-sm font-medium">Launch Date</Label>
          <div className="text-sm mt-1">
            {scalingData?.launchDate || 'Not scheduled'}
          </div>
        </div>
        
        <div>
          <Label className="text-sm font-medium">Target Revenue</Label>
          <div className="text-sm mt-1">
            ${scalingData?.targetRevenue || 0}/month
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div>
        <Label className="text-sm font-medium">Marketing Channels</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {(scalingData?.channels || []).map((channel: string) => (
            <Badge key={channel} variant="secondary">
              {channel}
            </Badge>
          ))}
        </div>
      </div>
      
      <div>
        <Label className="text-sm font-medium">KPIs</Label>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <Card className="p-3">
            <div className="text-sm font-medium">ROAS</div>
            <div className="text-lg font-bold">{scalingData?.kpis?.roas || 0}x</div>
          </Card>
          <Card className="p-3">
            <div className="text-sm font-medium">Conversion Rate</div>
            <div className="text-lg font-bold">{scalingData?.kpis?.conversionRate || 0}%</div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function HistoryTab({ card }: { card: LifecycleCard }) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Activity history for this product will be shown here.
      </div>
      
      {/* Mock history items */}
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded">
          <div className="h-2 w-2 bg-blue-500 rounded-full mt-2" />
          <div>
            <div className="text-sm font-medium">Card created</div>
            <div className="text-xs text-muted-foreground">
              {new Date(card.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded">
          <div className="h-2 w-2 bg-green-500 rounded-full mt-2" />
          <div>
            <div className="text-sm font-medium">Last updated</div>
            <div className="text-xs text-muted-foreground">
              {new Date(card.updatedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FilesTab({ card, onUpdate }: { card: LifecycleCard; onUpdate: (field: string, value: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Files and attachments related to this product will be shown here.
      </div>
      
      {/* Mock files */}
      <div className="space-y-2">
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Product Specification.pdf</span>
            </div>
            <Button variant="ghost" size="sm">
              Download
            </Button>
          </div>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Demo Video.mp4</span>
            </div>
            <Button variant="ghost" size="sm">
              View
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}