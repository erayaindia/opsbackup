import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import {
  Search,
  Filter,
  Plus,
  Loader2,
  CheckCircle,
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
  Globe,
  MoreHorizontal,
  Archive,
  Copy,
  Eye,
  Progress,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SortAsc,
  SortDesc,
  Group,
  Columns,
  Settings
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  productLifecycleService,
  type LifecycleProduct as LifecycleCard,
  type FilterOptions,
  type CreateProductPayload
} from '@/services/productLifecycleService'
import { useUserPermissions } from '@/components/PermissionGuard'

// Re-export types for compatibility
export type ViewType = 'table' | 'gallery'
export type Stage = 'idea' | 'production' | 'content' | 'scaling' | 'inventory'
export type Priority = 'low' | 'medium' | 'high'
export type User = { id: string; name: string; email: string }
export type GroupByOption = 'none' | 'category' | 'vendor' | 'assignee' | 'stage' | 'priority'
export type SortOption = {
  field: string
  direction: 'asc' | 'desc'
  label: string
}

export type TableColumn = {
  key: string
  label: string
  visible: boolean
  width?: string
  sortable?: boolean
}
export interface SavedView {
  id: string
  name: string
  filters: FilterOptions
  search: string
  view: ViewType
  createdAt: Date
}
import { useVendors } from '@/hooks/useSuppliers'
import { useUsers } from '@/hooks/useUsers'
import { useCategories } from '@/hooks/useCategories'
import { ActivityPanel, type StageKey, type TimelineEntry, type NowNextBlocked, saveTimelineEntry, updateStage, setNowNextBlocked } from '@/components/products/ActivityPanel'
import { FormContent } from '@/components/products/FormContent'

const STORAGE_KEYS = {
  LAST_VIEW: 'lifecycle_last_view'
}

const STAGE_CONFIG = {
  idea: { name: 'Idea', icon: Lightbulb, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-950/50' },
  production: { name: 'Production', icon: Factory, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-950/50' },
  content: { name: 'Content', icon: Camera, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-950/50' },
  scaling: { name: 'Scaling', icon: TrendingUp, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-950/50' }
}

// Generate URL-friendly slug from product title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Enhanced empty state component
const EmptyState = memo(({
  hasFilters,
  searchQuery,
  onCreateProduct,
  onClearFilters
}: {
  hasFilters: boolean
  searchQuery: string
  onCreateProduct: () => void
  onClearFilters: () => void
}) => {
  const isFiltered = hasFilters || searchQuery

  if (isFiltered) {
    return (
      <div className="text-center py-16 px-4">
        <div className="max-w-md mx-auto">
          <Search className="h-16 w-16 text-muted-foreground mx-auto mb-6 opacity-50" />
          <h3 className="text-xl font-semibold mb-3 text-foreground">No products match your criteria</h3>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            We couldn't find any products matching "{searchQuery}" with your current filters.
            Try adjusting your search terms or removing some filters.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={onClearFilters}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Clear All Filters
            </Button>
            <Button
              onClick={onCreateProduct}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Create New Product
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center py-20 px-4">
      <div className="max-w-md mx-auto">
        <div className="relative mb-8">
          <Package className="h-20 w-20 text-muted-foreground mx-auto mb-4 opacity-50" />
          <div className="absolute -top-2 -right-8">
            <Lightbulb className="h-8 w-8 text-yellow-500 animate-pulse" />
          </div>
        </div>
        <h3 className="text-2xl font-bold mb-3 text-foreground">Start building your product catalog</h3>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          You haven't created any products yet. Products help you manage your entire workflow
          from initial ideas to scaling successful items.
        </p>

        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 text-sm text-muted-foreground justify-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full" />
              <span>Ideas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full" />
              <span>Production</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span>Content</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Scaling</span>
            </div>
          </div>
        </div>

        <Button
          onClick={onCreateProduct}
          size="lg"
          className="gap-3 px-8 py-3 text-base"
        >
          <Plus className="h-5 w-5" />
          Create Your First Product
        </Button>

        <div className="mt-8 text-xs text-muted-foreground">
          💡 Tip: Start with a simple product idea and let our workflow guide you through each stage
        </div>
      </div>
    </div>
  )
})

// Skeleton loader for product cards
const ProductCardSkeleton = memo(() => (
  <Card className="enhanced-card border-border/50 backdrop-blur-sm animate-fade-in overflow-hidden">
    {/* Skeleton Image */}
    <div className="relative h-[200px] bg-muted animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer" />
    </div>

    {/* Skeleton Content */}
    <CardContent className="p-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-3 bg-muted rounded animate-pulse w-16" />
          <div className="h-3 bg-muted rounded animate-pulse w-12" />
        </div>

        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />

        <div className="flex items-center gap-2">
          <div className="h-5 bg-muted rounded animate-pulse w-16" />
          <div className="h-5 bg-muted rounded animate-pulse w-20" />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="h-4 bg-muted rounded animate-pulse w-20" />
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-muted rounded-full animate-pulse" />
            <div className="h-3 bg-muted rounded animate-pulse w-12" />
          </div>
        </div>

        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center gap-1">
            <div className="h-4 bg-muted rounded animate-pulse w-12" />
            <div className="h-4 bg-muted rounded animate-pulse w-8" />
            <div className="h-4 bg-muted rounded animate-pulse w-10" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
))

// Lazy Image component with Intersection Observer
const LazyImage = memo(({ src, alt, className, onError }: {
  src: string
  alt: string
  className: string
  onError?: () => void
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (isInView && src) {
      setImageSrc(src)
    }
  }, [isInView, src])

  return (
    <div ref={imgRef} className="w-full h-full flex items-center justify-center bg-muted">
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={alt}
          className={className}
          onError={onError}
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full animate-pulse">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-muted-foreground/30"
          >
            <path
              d="M20 7h-3V6a3 3 0 0 0-3-3H10a3 3 0 0 0-3 3v1H4a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM9 6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1H9V6zm9 13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h6v1a1 1 0 0 0 2 0V9h2v10z"
              fill="currentColor"
            />
          </svg>
        </div>
      )}
    </div>
  )
})

// Memoized ProductCard component for better performance
const ProductCard = memo(({
  card,
  onClick,
  onFavorite,
  onArchive,
  onDuplicate,
  isFavorite,
  getProductAge,
  canDelete = true
}: {
  card: LifecycleCard
  onClick: (card: LifecycleCard) => void
  onFavorite: (e: React.MouseEvent, productId: string) => void
  onArchive: (e: React.MouseEvent, productId: string) => void
  onDuplicate: (e: React.MouseEvent, card: LifecycleCard) => void
  isFavorite: boolean
  getProductAge: (card: LifecycleCard) => number
  canDelete?: boolean
}) => {
  const priorityColor = card.priority === 'high' ? 'bg-red-100 text-red-700 border border-red-200' :
                      card.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                      'bg-green-100 text-green-700 border border-green-200';
  const stageConfig = STAGE_CONFIG[card.stage];
  const StageIcon = stageConfig?.icon || Package;

  const days = getProductAge(card);

  return (
    <TooltipProvider>
      <div className="group relative">
        <Card
          onClick={() => onClick(card)}
          className={`enhanced-card hover:shadow-elegant transition-all duration-300 cursor-pointer border-border/50 backdrop-blur-sm animate-fade-in overflow-hidden ${isFavorite ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''}`}
        >
          {/* Favorite Star - Top Left Corner */}
          <div className="absolute top-2 left-2 z-10">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 rounded-full transition-all duration-200 ${
                    isFavorite
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                      : 'bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100'
                  }`}
                  onClick={(e) => onFavorite(e, card.id)}
                >
                  <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isFavorite ? 'Remove from favorites' : 'Add to favorites'}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Quick Actions Menu - Top Right Corner */}
          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full bg-black/50 hover:bg-black/70 text-white"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Quick actions</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick(card); }}>
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit Product
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => onDuplicate(e, card)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                {canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => onArchive(e, card.id)}
                      className="text-orange-600"
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      Archive
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Age Indicator - Top Right Badge */}
          <div className="absolute top-2 right-12 z-10">
            <Tooltip>
              <TooltipTrigger>
                <span className="px-2 py-1 bg-black/50 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {days}d
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{days} days in {stageConfig?.name || card.stage} stage</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Product Image with Lazy Loading */}
          <div className="relative h-[200px] bg-muted flex items-center justify-center">
            {card.primaryFile?.file_url ? (
              <LazyImage
                src={card.primaryFile.file_url}
                alt={card.workingTitle || card.name}
                className="w-full h-full object-cover"
                onError={() => {
                  // Image loading failed - handled silently
                }}
              />
            ) : (
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

          {/* Card Content */}
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
                    {card.teamLead?.name?.charAt(0) || '?'}
                  </div>
                  <span className="text-xs">{card.teamLead?.name?.split(' ')[0] || 'Unknown'}</span>
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

        {/* Hover Preview Tooltip */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="absolute inset-0 pointer-events-none" />
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-sm p-4">
            <div className="space-y-2 text-sm">
              <div className="font-semibold">{card.workingTitle || card.name}</div>
              {card.ideaData?.problemStatement && (
                <div>
                  <span className="font-medium">Problem:</span>
                  <p className="text-xs text-muted-foreground truncate">
                    {card.ideaData.problemStatement.slice(0, 100)}...
                  </p>
                </div>
              )}
              {card.ideaData?.opportunityStatement && (
                <div>
                  <span className="font-medium">Opportunity:</span>
                  <p className="text-xs text-muted-foreground truncate">
                    {card.ideaData.opportunityStatement.slice(0, 100)}...
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between text-xs">
                <span>Stage: {stageConfig?.name || card.stage}</span>
                <span>Age: {days} days</span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
})

export default function Lifecycle() {
  // Hooks
  const navigate = useNavigate()
  const { data: vendors = [], isLoading: vendorsLoading } = useVendors()
  const { users: availableUsers, loading: usersLoading } = useUsers()
  const { allCategories: databaseCategories, loading: categoriesLoading } = useCategories()
  const { currentUser, hasRole } = useUserPermissions()
  
  // State management
  const [cards, setCards] = useState<LifecycleCard[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [totalItems, setTotalItems] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Grouping and sorting state
  const [groupBy, setGroupBy] = useState<GroupByOption>('none')
  const [sortOption, setSortOption] = useState<SortOption>({
    field: 'updated_at',
    direction: 'desc',
    label: 'Recently Updated'
  })

  // Column customization state
  const [tableColumns, setTableColumns] = useState<TableColumn[]>([
    { key: 'product', label: 'Product', visible: true, width: '300px', sortable: true },
    { key: 'stage', label: 'Stage', visible: true, width: '120px', sortable: true },
    { key: 'priority', label: 'Priority', visible: true, width: '100px', sortable: true },
    { key: 'category', label: 'Category', visible: true, width: '150px', sortable: true },
    { key: 'assignee', label: 'Assigned To', visible: true, width: '120px', sortable: true },
    { key: 'created', label: 'Created', visible: true, width: '100px', sortable: true },
    { key: 'price', label: 'Est. Price', visible: false, width: '100px', sortable: true },
    { key: 'score', label: 'Score', visible: false, width: '80px', sortable: true },
    { key: 'vendor', label: 'Vendor', visible: false, width: '120px', sortable: false },
    { key: 'actions', label: 'Actions', visible: true, width: '80px', sortable: false }
  ])

  // Cache for products data
  const [cachedProducts, setCachedProducts] = useState<Map<string, LifecycleCard[]>>(new Map())
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
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
    vendorLocations: []
  })
  
  // Modal state
  const [showNewIdeaModal, setShowNewIdeaModal] = useState(false)
  const [isCreatingIdea, setIsCreatingIdea] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)

  // Enhanced card features state
  const [favoriteProducts, setFavoriteProducts] = useState<Set<string>>(new Set())
  const [archivedProducts, setArchivedProducts] = useState<Set<string>>(new Set())
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
  
  
  // Stage filter state
  const [activeStageFilter, setActiveStageFilter] = useState<Stage | 'all'>('all')

  // Available sort options
  const sortOptions: SortOption[] = [
    { field: 'updated_at', direction: 'desc', label: 'Recently Updated' },
    { field: 'created_at', direction: 'desc', label: 'Recently Created' },
    { field: 'working_title', direction: 'asc', label: 'Name (A-Z)' },
    { field: 'working_title', direction: 'desc', label: 'Name (Z-A)' },
    { field: 'priority', direction: 'desc', label: 'Priority (High to Low)' },
    { field: 'potential_score', direction: 'desc', label: 'Score (High to Low)' },
    { field: 'estimated_selling_price', direction: 'desc', label: 'Price (High to Low)' },
    { field: 'estimated_selling_price', direction: 'asc', label: 'Price (Low to High)' }
  ]
  
  
  // Available tags and categories derived from cards
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>()
    cards.forEach(card => card.tags.forEach(tag => tagSet.add(tag)))
    return Array.from(tagSet).sort()
  }, [cards])

  // Use database categories instead of deriving from products
  const availableCategories = useMemo(() => {
    return databaseCategories.map(cat => cat.name).sort()
  }, [databaseCategories])

  const availableTeamLeads = useMemo(() => {
    const leadSet = new Set<string>()
    cards.forEach(card => leadSet.add(card.teamLead.id))
    return availableUsers.filter(user => leadSet.has(user.id))
  }, [cards, availableUsers])
  
  // Debounced search effect
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      setCurrentPage(1) // Reset to first page when search changes
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchQuery])

  // Load initial data with pagination and caching
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // Create cache key for current filters
        const cacheKey = JSON.stringify({
          page: currentPage,
          search: debouncedSearchQuery,
          stage: activeStageFilter,
          filters
        })

        // Check cache first
        const now = Date.now()
        if (cachedProducts.has(cacheKey) && (now - lastFetchTime) < CACHE_DURATION) {
          // Using cached data
          const cachedData = cachedProducts.get(cacheKey)!
          if (currentPage === 1) {
            setCards(cachedData)
          } else {
            setCards(prev => [...prev, ...cachedData])
          }
          setLoading(false)
          return
        }

        // Fetch data with pagination
        const offset = (currentPage - 1) * itemsPerPage
        const cardsData = await productLifecycleService.listProducts({
          limit: itemsPerPage,
          offset,
          search: debouncedSearchQuery,
          stage: activeStageFilter !== 'all' ? activeStageFilter : undefined,
          sort: { field: sortOption.field, direction: sortOption.direction },
          ...filters
        })

        // Update cache
        setCachedProducts(prev => {
          const newCache = new Map(prev)
          newCache.set(cacheKey, cardsData.items || cardsData)
          // Limit cache size to prevent memory issues
          if (newCache.size > 50) {
            const oldestKey = newCache.keys().next().value
            newCache.delete(oldestKey)
          }
          return newCache
        })
        setLastFetchTime(now)

        if (currentPage === 1) {
          setCards(cardsData.items || cardsData)
          setTotalItems(cardsData.total || cardsData.length)
        } else {
          setCards(prev => [...prev, ...(cardsData.items || cardsData)])
        }

        setSavedViews([]) // TODO: Implement saved views in database

        // Successfully loaded products data
      } catch (error) {
        console.error('Failed to load lifecycle data:', error)
        toast({
          title: 'Error loading data',
          description: 'Please refresh the page to try again.',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
        setIsLoadingMore(false)
      }
    }

    loadData()
  }, [currentPage, debouncedSearchQuery, activeStageFilter, filters]) // React to pagination and search changes
  
  // Optimized filtering with grouping support
  const filteredCards = useMemo(() => {
    if (!cards.length) return []

    let filtered = cards

    // Exclude archived products
    filtered = filtered.filter(card => !archivedProducts.has(card.id))

    // Sort: favorites first, then by server sort order
    filtered.sort((a, b) => {
      const aIsFavorite = favoriteProducts.has(a.id)
      const bIsFavorite = favoriteProducts.has(b.id)

      if (aIsFavorite && !bIsFavorite) return -1
      if (!aIsFavorite && bIsFavorite) return 1

      // Server already sorted by sortOption, so maintain that order
      return 0
    })

    return filtered
  }, [cards, archivedProducts, favoriteProducts])

  // Group filtered cards
  const groupedCards = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Products': filteredCards }
    }

    const groups: Record<string, LifecycleCard[]> = {}

    filteredCards.forEach(card => {
      let groupKey: string

      switch (groupBy) {
        case 'category':
          groupKey = card.category.length > 0 ? card.category[0] : 'Uncategorized'
          break
        case 'vendor':
          groupKey = card.ideaData?.selectedSupplierId || 'No Vendor'
          break
        case 'assignee':
          groupKey = card.teamLead.name || 'Unassigned'
          break
        case 'stage':
          groupKey = STAGE_CONFIG[card.stage]?.name || card.stage
          break
        case 'priority':
          groupKey = card.priority ? card.priority.charAt(0).toUpperCase() + card.priority.slice(1) : 'No Priority'
          break
        default:
          groupKey = 'All Products'
      }

      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(card)
    })

    // Sort groups by name
    const sortedGroups: Record<string, LifecycleCard[]> = {}
    Object.keys(groups)
      .sort()
      .forEach(key => {
        sortedGroups[key] = groups[key]
      })

    return sortedGroups
  }, [filteredCards, groupBy])
  
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


  
  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }
  
  const removeVideo = (index: number) => {
    setUploadedVideos(prev => prev.filter((_, i) => i !== index))
  }

  // Generate slug from product name
  const generateSlug = useCallback((text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }, [])

  // Navigate to product page with all tabs
  const handleProductClick = useCallback((card: LifecycleCard) => {
    const slug = generateSlug(card.workingTitle || card.name || `product-${card.internalCode}`)
    navigate(`/products/${slug}`)
  }, [navigate, generateSlug])

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


  // Animated "Create Idea" button handler
  const handleCreateIdeaClick = useCallback(() => {
    setIsCreatingIdea(true)

    // Add a slight delay for the animation effect
    setTimeout(() => {
      setShowNewIdeaModal(true)
      setIsCreatingIdea(false)
    }, 300)
  }, [])

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


  const handleCreateIdea = async () => {
    try {
      setIsUpdating(true) // Add loading state for the actual creation
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


      // Prepare payload
      const payload: CreateProductPayload = {
        title: newIdeaForm.title,
        tags: tags.length > 0 ? tags : undefined,
        category: selectedCategories.length > 0 ? selectedCategories : undefined,
        competitorLinks: referenceLinks.filter(link => link.type === 'competitor').map(link => link.url),
        adLinks: referenceLinks.filter(link => link.type === 'ad').map(link => link.url),
        notes: newIdeaForm.notes,
        problemStatement: newIdeaForm.problemStatement,
        opportunityStatement: newIdeaForm.opportunityStatement,
        estimatedSourcePriceMin: newIdeaForm.estimatedSourcePriceMin,
        estimatedSourcePriceMax: newIdeaForm.estimatedSourcePriceMax,
        selectedSupplierId: newIdeaForm.selectedSupplierId,
        priority: newIdeaForm.priority as Priority,
        stage: newIdeaForm.stage as Stage,
        assignedTo: newIdeaForm.assignedTo
      }

      // Creating new product

      const newProduct = await productLifecycleService.createProduct(payload)

      // Product created successfully

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
      setSelectedCategories([])
      setTagInput('')
      setTags([])
      setReferenceLinks([])
      setDragActive(false)

      // Show success animation
      setShowSuccessAnimation(true)

      // Close modal after success animation
      setTimeout(() => {
        setShowNewIdeaModal(false)
        setShowSuccessAnimation(false)
      }, 1500)

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
    } finally {
      setIsUpdating(false)
    }
  }

  // Enhanced card feature handlers
  const toggleFavorite = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation()
    setFavoriteProducts(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId)
      } else {
        newFavorites.add(productId)
      }
      return newFavorites
    })
  }

  const handleArchive = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation()

    // Check if user has super_admin role
    if (!hasRole(['super_admin'])) {
      toast({
        title: 'Access Denied',
        description: 'Only super administrators can delete products.',
        variant: 'destructive'
      })
      return
    }

    setArchivedProducts(prev => new Set([...prev, productId]))
    toast({
      title: 'Product archived',
      description: 'Product has been moved to archive.'
    })
  }

  const handleDuplicate = async (e: React.MouseEvent, card: LifecycleCard) => {
    e.stopPropagation()
    try {
      const duplicatedProduct = await productLifecycleService.createProduct({
        title: `${card.workingTitle || card.name} (Copy)`,
        tags: card.tags || [],
        category: card.category || [],
        competitorLinks: card.ideaData?.competitorLinks || [],
        adLinks: card.ideaData?.adLinks || [],
        notes: card.ideaData?.notes || '',
        problemStatement: card.ideaData?.problemStatement || '',
        opportunityStatement: card.ideaData?.opportunityStatement || '',
        estimatedSourcePriceMin: card.ideaData?.estimatedSourcePriceMin?.toString() || '',
        estimatedSourcePriceMax: card.ideaData?.estimatedSourcePriceMax?.toString() || '',
        estimatedSellingPrice: card.ideaData?.estimatedSellingPrice?.toString() || '',
        selectedSupplierId: card.ideaData?.selectedSupplierId || '',
        priority: card.priority,
        stage: card.stage,
        assignedTo: card.teamLead.id,
        uploadedImages: [],
        uploadedVideos: [],
        thumbnail: null
      })

      setCards(prev => [duplicatedProduct, ...prev])
      toast({
        title: 'Product duplicated',
        description: `"${duplicatedProduct.workingTitle}" has been created.`
      })
    } catch (error) {
      console.error('Failed to duplicate product:', error)
      toast({
        title: 'Failed to duplicate product',
        description: 'Please try again.',
        variant: 'destructive'
      })
    }
  }


  const getProductAge = (card: LifecycleCard): number => {
    const stageDate = new Date(card.updatedAt || card.createdAt)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - stageDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Load more function for infinite scroll
  const loadMore = useCallback(async () => {
    if (isLoadingMore || (totalItems > 0 && cards.length >= totalItems)) return

    setIsLoadingMore(true)
    setCurrentPage(prev => prev + 1)
  }, [isLoadingMore, totalItems, cards.length])

  // Intersection Observer for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || isLoadingMore) return
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && totalItems > 0 && cards.length < totalItems) {
        loadMore()
      }
    })

    if (node) observerRef.current.observe(node)
  }, [loading, isLoadingMore, loadMore, totalItems, cards.length])

  // Clear all filters function
  const clearAllFilters = () => {
    setFilters({
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
      vendorLocations: []
    })
    setSearchQuery('')
    setDebouncedSearchQuery('')
    setActiveStageFilter('all')
    setCurrentPage(1)
    setGroupBy('none')
    setSortOption({
      field: 'updated_at',
      direction: 'desc',
      label: 'Recently Updated'
    })
    setCachedProducts(new Map()) // Clear cache when filters change
  }

  // Handle sort change
  const handleSortChange = (option: SortOption) => {
    setSortOption(option)
    setCurrentPage(1)
    setCachedProducts(new Map()) // Clear cache when sort changes
  }

  // Handle group by change
  const handleGroupByChange = (option: GroupByOption) => {
    setGroupBy(option)
  }

  // Handle column visibility toggle
  const toggleColumnVisibility = (columnKey: string) => {
    setTableColumns(prev =>
      prev.map(col =>
        col.key === columnKey
          ? { ...col, visible: !col.visible }
          : col
      )
    )
  }

  // Get visible columns
  const visibleColumns = useMemo(() => {
    return tableColumns.filter(col => col.visible)
  }, [tableColumns])

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(filter =>
      Array.isArray(filter) ? filter.length > 0 : filter !== undefined
    ) || activeStageFilter !== 'all'
  }, [filters, activeStageFilter])

  // Memoize filtered count calculation
  const { count: filteredCount, activeFilters } = useMemo(() => {
    const activeFilters = [
      ...filters.stages,
      ...filters.tags,
      ...filters.categories,
      ...filters.owners,
      ...filters.teamLeads,
      ...filters.priority || [],
      ...filters.vendorLocations || [],
      ...(filters.potentialScoreMin !== undefined ? ['score-min'] : []),
      ...(filters.potentialScoreMax !== undefined ? ['score-max'] : []),
      ...(filters.idleDaysMin !== undefined ? ['idle-days'] : []),
      ...(filters.internalCodePattern ? ['internal-code'] : []),
      ...(filters.createdDateRange ? ['created-date'] : []),
      ...(filters.updatedDateRange ? ['updated-date'] : []),
      ...(filters.marginRange ? ['margin-range'] : [])
    ].length + (debouncedSearchQuery ? 1 : 0) + (groupBy !== 'none' ? 1 : 0)

    return { count: totalItems || filteredCards.length, activeFilters }
  }, [filteredCards.length, totalItems, filters, debouncedSearchQuery, groupBy])
  
  // Get stage statistics - optimized to use all cards, not filtered
  const stageStats = useMemo(() => {
    const stats = {
      idea: 0,
      production: 0,
      content: 0,
      scaling: 0
    }

    cards.forEach(card => {
      if (stats.hasOwnProperty(card.stage)) {
        stats[card.stage as keyof typeof stats]++
      }
    })

    return stats
  }, [cards])
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="px-4 sm:px-6 py-6">
          {/* Header Skeleton */}
          <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b mb-6 pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
              <div className="flex flex-col">
                <div className="h-8 bg-muted rounded animate-pulse w-64 mb-2" />
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 p-1 bg-muted rounded">
                    <div className="h-8 w-20 bg-muted rounded animate-pulse" />
                    <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-20 bg-muted rounded animate-pulse" />
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-32 bg-muted rounded animate-pulse" />
                    <div className="h-10 w-80 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-10 w-24 bg-muted rounded animate-pulse" />
                <div className="h-10 w-20 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Stage Filter Skeleton */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-1 p-1 bg-muted rounded w-fit">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 w-24 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>

          {/* Product Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
            {[...Array(10)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b mb-6 pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
            <div className="flex flex-col w-full lg:w-auto">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3 sm:mb-4">Product Management</h1>

              {/* Mobile-first layout for controls */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                {/* View Toggle & Count */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 p-1 bg-muted rounded">
                    <Button
                      variant={selectedView === 'gallery' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectedView('gallery')}
                      className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
                    >
                      <Images className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Gallery</span>
                    </Button>
                    <Button
                      variant={selectedView === 'table' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectedView('table')}
                      className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
                    >
                      <TableIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Table</span>
                    </Button>
                  </div>

                  <Badge variant="secondary" className="px-2 sm:px-3 py-1 text-xs">
                    {filteredCount} {filteredCount === 1 ? 'item' : 'items'}
                    {groupBy !== 'none' && (
                      <span className="ml-1 text-xs">• Grouped by {groupBy}</span>
                    )}
                    {activeFilters > 0 && (
                      <span className="ml-1 text-xs">• {activeFilters} filters</span>
                    )}
                    {cards.length < (totalItems || 0) && (
                      <span className="ml-1 text-xs">• {cards.length} loaded</span>
                    )}
                  </Badge>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="gap-2 h-10 justify-start sm:justify-center">
                        <Filter className="h-4 w-4" />
                        <span className="text-sm">Categories</span>
                        {filters.categories && filters.categories.length > 0 && (
                          <Badge variant="secondary" className="ml-auto sm:ml-1 h-5 px-1.5 text-xs">
                            {filters.categories.length}
                          </Badge>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4" align="start">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">Filter by Categories</h4>
                          {filters.categories && filters.categories.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setFilters(prev => ({ ...prev, categories: [] }))}
                              className="h-6 px-2 text-xs"
                            >
                              Clear
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                          {(databaseCategories || []).map((category) => (
                            <div key={category.name} className="flex items-center space-x-2">
                              <Checkbox
                                id={`category-${category.name}`}
                                checked={filters.categories?.includes(category.name) || false}
                                onCheckedChange={(checked) => {
                                  setFilters(prev => ({
                                    ...prev,
                                    categories: checked
                                      ? [...(prev.categories || []), category.name]
                                      : (prev.categories || []).filter(c => c !== category.name)
                                  }))
                                }}
                              />
                              <Label
                                htmlFor={`category-${category.name}`}
                                className="text-xs cursor-pointer"
                              >
                                {category.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Group By Dropdown */}
                  <Select value={groupBy} onValueChange={handleGroupByChange}>
                    <SelectTrigger className="h-10 w-full sm:w-40 gap-2">
                      <Group className="h-4 w-4" />
                      <SelectValue placeholder="Group by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No grouping</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                      <SelectItem value="stage">Stage</SelectItem>
                      <SelectItem value="priority">Priority</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                      <SelectItem value="assignee">Assignee</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="relative w-full sm:w-64 lg:w-80">
                    <Input
                      id="lifecycle-search"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-4 h-10 text-sm w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                onClick={handleCreateIdeaClick}
                disabled={isCreatingIdea}
                className={`gap-2 transition-all duration-300 relative overflow-hidden flex-1 sm:flex-none ${
                  isCreatingIdea
                    ? 'bg-primary/80 scale-105 shadow-lg animate-pulse'
                    : 'hover:scale-105 hover:shadow-md active:scale-95'
                }`}
              >
                {isCreatingIdea ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{isCreatingIdea ? 'Creating...' : 'New Idea'}</span>
                <span className="sm:hidden">{isCreatingIdea ? 'Creating...' : 'New'}</span>
              </Button>
              <Button
                variant="outline"
                className="gap-2 flex-1 sm:flex-none"
                onClick={() => {
                  toast({
                    title: 'Export started',
                    description: 'Your products data is being exported...'
                  })
                }}
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Stage Filter Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-muted rounded w-full sm:w-fit overflow-x-auto">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeStageFilter === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveStageFilter('all')}
                    className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap"
                  >
                    <LayoutGrid className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">All Stages</span>
                    <span className="xs:hidden">All</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View all products across all stages</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {Object.entries(STAGE_CONFIG).map(([stage, config]) => {
              const StageIcon = config.icon
              const stageCards = cards.filter(card => card.stage === stage)

              return (
                <TooltipProvider key={stage}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={activeStageFilter === stage ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveStageFilter(stage as Stage)}
                        className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap"
                      >
                        <StageIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">{config.name}</span>
                        <span className="sm:hidden">{config.name.slice(0, 4)}</span>
                        <Badge variant="secondary" className="ml-1 text-xs h-4 px-1.5">
                          {stageCards.length}
                        </Badge>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Filter by {config.name} stage ({stageCards.length} products)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })}
          </div>
        </div>
        
        
        {/* Main Content Based on View */}
        {selectedView === 'table' && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="border-r border-border/50 whitespace-nowrap min-w-[300px]">Product</TableHead>
                  <TableHead className="border-r border-border/50 whitespace-nowrap min-w-[120px]">Stage</TableHead>
                  <TableHead className="border-r border-border/50 whitespace-nowrap min-w-[100px]">Priority</TableHead>
                  <TableHead className="border-r border-border/50 whitespace-nowrap min-w-[150px]">Category</TableHead>
                  <TableHead className="border-r border-border/50 whitespace-nowrap min-w-[120px]">Assigned To</TableHead>
                  <TableHead className="border-r border-border/50 whitespace-nowrap min-w-[100px]">Created</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCards.map((card) => {
                  const priorityVariant = card.priority === 'high' ? 'destructive' :
                                      card.priority === 'medium' ? 'default' :
                                      'secondary' as const;
                  const stageConfig = STAGE_CONFIG[card.stage];
                  const StageIcon = stageConfig?.icon || Package;

                  return (
                    <TableRow
                      key={card.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors group"
                      onClick={() => handleProductClick(card)}
                    >
                      {/* Product Info with Thumbnail */}
                      <TableCell className="border-r border-border/50">
                        <div className="flex items-center gap-3">
                          {/* Product Thumbnail */}
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {card.primaryFile?.file_url ? (
                              <LazyImage
                                src={card.primaryFile?.file_url}
                                alt={card.workingTitle || card.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          {/* Product Details */}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate group-hover:text-primary transition-colors">
                              {card.workingTitle || card.name || `Product ${card.internalCode}`}
                            </div>
                            <div className="text-sm text-muted-foreground font-mono">{card.internalCode}</div>
                            {/* Tags */}
                            {card.tags && card.tags.length > 0 && (
                              <div className="flex items-center gap-1 mt-1 overflow-hidden">
                                {card.tags.slice(0, 2).map((tag, tagIndex) => (
                                  <Badge key={tagIndex} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {card.tags.length > 2 && (
                                  <span className="text-xs text-muted-foreground">+{card.tags.length - 2}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Stage */}
                      <TableCell className="border-r border-border/50">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${stageConfig?.bgColor || 'bg-muted'}`}>
                            <StageIcon className={`h-4 w-4 ${stageConfig?.color || 'text-muted-foreground'}`} />
                          </div>
                          <span className="font-medium">{stageConfig?.name || card.stage}</span>
                        </div>
                      </TableCell>

                      {/* Priority */}
                      <TableCell className="border-r border-border/50">
                        <Badge variant={priorityVariant}>
                          {(card.priority || 'medium').charAt(0).toUpperCase() + (card.priority || 'medium').slice(1)}
                        </Badge>
                      </TableCell>

                      {/* Category */}
                      <TableCell className="border-r border-border/50">
                        <div className="flex flex-wrap gap-1">
                          {card.category.slice(0, 2).map((cat, catIndex) => (
                            <Badge key={catIndex} variant="secondary" className="text-xs">
                              {cat}
                            </Badge>
                          ))}
                          {card.category.length > 2 && (
                            <span className="text-xs text-muted-foreground">+{card.category.length - 2}</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Assigned To */}
                      <TableCell className="border-r border-border/50">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                            {card.teamLead?.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className="font-medium">{card.teamLead?.name?.split(' ')[0] || 'Unknown'}</div>
                            <div className="text-xs text-muted-foreground">{card.teamLead?.name?.split(' ').slice(1).join(' ') || ''}</div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Created Date */}
                      <TableCell className="border-r border-border/50">
                        <div className="text-sm">
                          {card.createdAt.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {card.idleDays} days ago
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleProductClick(card)
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              // Edit functionality can be added here
                            }}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Empty State */}
            {filteredCards.length === 0 && (
              <EmptyState
                hasFilters={hasActiveFilters}
                searchQuery={searchQuery}
                onCreateProduct={() => setShowNewIdeaModal(true)}
                onClearFilters={clearAllFilters}
              />
            )}
          </div>
        )}
        {selectedView === 'gallery' && (
          <>
            {filteredCards.length > 0 ? (
              <>
                {groupBy === 'none' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
                    {filteredCards.map(card => (
                        <ProductCard
                          key={card.id}
                          card={card}
                          onClick={handleProductClick}
                          onFavorite={toggleFavorite}
                          onArchive={handleArchive}
                          onDuplicate={handleDuplicate}
                          isFavorite={favoriteProducts.has(card.id)}
                          getProductAge={getProductAge}
                          primaryFile={card.primaryFile}
                          canDelete={hasRole(['super_admin'])}
                        />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-8">
                    {Object.entries(groupedCards).map(([groupName, cards]) => (
                      <div key={groupName} className="space-y-4">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-foreground">{groupName}</h3>
                          <Badge variant="secondary" className="px-2 py-1 text-xs">
                            {cards.length} {cards.length === 1 ? 'item' : 'items'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
                          {cards.map(card => (
                            <ProductCard
                              key={card.id}
                              card={card}
                              onClick={handleProductClick}
                              onFavorite={toggleFavorite}
                              onArchive={handleArchive}
                              onDuplicate={handleDuplicate}
                              isFavorite={favoriteProducts.has(card.id)}
                              getProductAge={getProductAge}
                              primaryFile={card.primaryFile}
                              canDelete={hasRole(['super_admin'])}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Infinite scroll trigger */}
                {totalItems > 0 && cards.length < totalItems && (
                  <div ref={loadMoreRef} className="flex justify-center py-8">
                    {isLoadingMore && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading more products...</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Show total loaded vs total available */}
                {totalItems > 0 && (
                  <div className="flex justify-center py-4">
                    <span className="text-sm text-muted-foreground">
                      Showing {cards.length} of {totalItems} products
                    </span>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                hasFilters={hasActiveFilters}
                searchQuery={searchQuery}
                onCreateProduct={() => setShowNewIdeaModal(true)}
                onClearFilters={clearAllFilters}
              />
            )}
          </>
        )}
        
        {/* New Idea Modal */}
        <Dialog open={showNewIdeaModal} onOpenChange={setShowNewIdeaModal}>
          <DialogContent className="w-[50vw] h-[calc(100vh-4rem)] max-w-none max-h-none flex flex-col animate-in fade-in-0 zoom-in-95 duration-300">
            <DialogHeader className="flex-shrink-0 pb-4 border-b border-border/20">
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
                  <div className="p-2 rounded-none bg-primary/10 animate-pulse">
                    <Lightbulb className={`h-5 w-5 text-primary transition-all duration-500 ${
                      showSuccessAnimation ? 'text-green-500 animate-bounce' : ''
                    }`} />
                  </div>
                  <span className="animate-in slide-in-from-left-5 duration-300">
                    {showSuccessAnimation ? 'Product Created!' : 'New Product Idea'}
                  </span>
                </DialogTitle>
                
                {/* Top right controls */}
                <div className="hidden lg:flex items-center gap-4 mr-8">
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
                                  {owner.name?.charAt(0) || '?'}
                                </div>
                                <span className="text-xs">{owner.name?.split(' ')[0] || 'Unknown'}</span>
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
                  disabled={isUpdating || showSuccessAnimation}
                  className={`min-w-[120px] bg-primary hover:bg-primary/90 rounded-none transition-all duration-200 ${
                    isUpdating ? 'animate-pulse scale-105' : ''
                  } ${
                    showSuccessAnimation ? 'bg-green-500 scale-110 animate-bounce' : ''
                  }`}
                >
                  {showSuccessAnimation ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2 animate-pulse" />
                      Created!
                    </>
                  ) : isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Idea'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    )
  }
