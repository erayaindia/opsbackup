import type { LifecycleProduct } from '@/services/productLifecycleService'

// Base types
export type ViewType = 'table' | 'gallery'
export type Stage = 'idea' | 'production' | 'content' | 'scaling' | 'inventory'
export type Priority = 'low' | 'medium' | 'high'
export type GroupByOption = 'none' | 'category' | 'vendor' | 'assignee' | 'stage' | 'priority'

// User and category types
export interface User {
  id: string
  name: string
  email: string
}

export interface Category {
  id: string
  name: string
}

export interface Vendor {
  id: string
  name: string
  location?: string
}

// Sorting configuration
export interface SortOption {
  field: string
  direction: 'asc' | 'desc'
  label: string
}

// Table column configuration
export interface TableColumn {
  key: string
  label: string
  visible: boolean
  width?: string
  sortable?: boolean
}

// Filter options with proper typing
export interface ProductFilters {
  stages?: Stage[]
  tags?: string[]
  categories?: string[]
  owners?: string[]
  teamLeads?: string[]
  priority?: Priority[]
  search?: string
  potentialScoreMin?: number
  potentialScoreMax?: number
  idleDaysMin?: number
  internalCodePattern?: string
  createdDateRange?: {
    start: Date
    end: Date
  }
  updatedDateRange?: {
    start: Date
    end: Date
  }
  marginRange?: {
    min: number
    max: number
  }
  vendorLocations?: string[]
}

// Pagination types
export interface PaginationState {
  currentPage: number
  itemsPerPage: number
  totalItems: number
  isLoadingMore: boolean
}

// Cache types
export interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

export interface ProductCache {
  products: Map<string, CacheEntry<LifecycleProduct[]>>
  lastFetchTime: number
}

// State management types
export interface ProductsState {
  // Data
  products: LifecycleProduct[]
  loading: boolean
  error: Error | null

  // Search and filters
  searchQuery: string
  debouncedSearchQuery: string
  filters: ProductFilters

  // View configuration
  selectedView: ViewType
  groupBy: GroupByOption
  sortOption: SortOption

  // Table configuration
  tableColumns: TableColumn[]

  // Pagination
  pagination: PaginationState

  // Cache
  cache: ProductCache

  // UI state
  favoriteProducts: Set<string>
  archivedProducts: Set<string>
  selectedProducts: Set<string>
}

// Action types for state management
export type ProductsAction =
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: Error | null }
  | { type: 'SET_PRODUCTS'; products: LifecycleProduct[] }
  | { type: 'ADD_PRODUCTS'; products: LifecycleProduct[] }
  | { type: 'UPDATE_PRODUCT'; product: LifecycleProduct }
  | { type: 'REMOVE_PRODUCT'; productId: string }
  | { type: 'SET_SEARCH_QUERY'; query: string }
  | { type: 'SET_DEBOUNCED_SEARCH_QUERY'; query: string }
  | { type: 'SET_FILTERS'; filters: ProductFilters }
  | { type: 'UPDATE_FILTER'; key: keyof ProductFilters; value: unknown }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'SET_VIEW'; view: ViewType }
  | { type: 'SET_GROUP_BY'; groupBy: GroupByOption }
  | { type: 'SET_SORT_OPTION'; sortOption: SortOption }
  | { type: 'TOGGLE_COLUMN_VISIBILITY'; columnKey: string }
  | { type: 'SET_PAGINATION'; pagination: Partial<PaginationState> }
  | { type: 'TOGGLE_FAVORITE'; productId: string }
  | { type: 'TOGGLE_ARCHIVE'; productId: string }
  | { type: 'TOGGLE_SELECTION'; productId: string }
  | { type: 'SELECT_ALL' }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'UPDATE_CACHE'; key: string; data: LifecycleProduct[]; timestamp: number }
  | { type: 'CLEAR_CACHE' }

// API response types
export interface ProductListResponse {
  items: LifecycleProduct[]
  total: number
  hasMore: boolean
  page?: number
  totalPages?: number
}

export interface ProductsApiOptions {
  filters?: ProductFilters
  search?: string
  stage?: string
  sort?: {
    field: string
    direction: 'asc' | 'desc'
  }
  limit?: number
  offset?: number
  pagination?: {
    page: number
    limit: number
  }
}

// Event handler types
export interface ProductEventHandlers {
  onProductClick: (product: LifecycleProduct) => void
  onProductFavorite: (e: React.MouseEvent, productId: string) => void
  onProductArchive: (e: React.MouseEvent, productId: string) => void
  onProductDuplicate: (e: React.MouseEvent, product: LifecycleProduct) => void
  onProductDelete: (productId: string) => void
  onProductUpdate: (product: LifecycleProduct) => void
  onProductCreate: () => void
}

// Component prop types
export interface ProductCardProps {
  product: LifecycleProduct
  stageConfig?: {
    name: string
    icon: React.ComponentType<{ className?: string }>
    color: string
    bgColor: string
  }
  isFavorite: boolean
  isSelected: boolean
  getProductAge: (product: LifecycleProduct) => number
  eventHandlers: ProductEventHandlers
}

export interface ProductTableProps {
  products: LifecycleProduct[]
  groupedProducts: Record<string, LifecycleProduct[]>
  visibleColumns: TableColumn[]
  sortOption: SortOption
  groupBy: GroupByOption
  eventHandlers: ProductEventHandlers
  onSortChange: (option: SortOption) => void
}

export interface ProductFiltersProps {
  groupBy: GroupByOption
  sortOption: SortOption
  sortOptions: SortOption[]
  tableColumns: TableColumn[]
  visibleColumns: TableColumn[]
  filters: ProductFilters
  categories: Category[]
  categoriesLoading: boolean
  searchQuery: string
  selectedView: ViewType
  onGroupByChange: (option: GroupByOption) => void
  onSortChange: (option: SortOption) => void
  onToggleColumn: (columnKey: string) => void
  onFiltersChange: (filters: ProductFilters) => void
  onSearchChange: (query: string) => void
}

// URL state types for synchronization
export interface UrlState {
  view?: ViewType
  search?: string
  groupBy?: GroupByOption
  sort?: string
  filters?: string // JSON encoded filters
  page?: number
}

// Optimistic update types
export interface OptimisticUpdate<T = unknown> {
  id: string
  type: 'create' | 'update' | 'delete'
  timestamp: number
  originalData?: T
  newData?: T
  status: 'pending' | 'success' | 'error'
}

// Undo/Redo types
export interface UndoRedoAction {
  id: string
  type: string
  description: string
  timestamp: number
  execute: () => Promise<void> | void
  undo: () => Promise<void> | void
}

export interface UndoRedoState {
  history: UndoRedoAction[]
  currentIndex: number
  maxHistorySize: number
}

// Hook return types
export interface UseProductsReturn {
  state: ProductsState
  actions: {
    setLoading: (loading: boolean) => void
    setError: (error: Error | null) => void
    loadProducts: (options?: ProductsApiOptions) => Promise<void>
    createProduct: (product: Partial<LifecycleProduct>) => Promise<void>
    updateProduct: (id: string, updates: Partial<LifecycleProduct>) => Promise<void>
    deleteProduct: (id: string) => Promise<void>
    duplicateProduct: (product: LifecycleProduct) => Promise<void>
    setSearchQuery: (query: string) => void
    setFilters: (filters: ProductFilters) => void
    clearFilters: () => void
    setView: (view: ViewType) => void
    setGroupBy: (groupBy: GroupByOption) => void
    setSortOption: (sortOption: SortOption) => void
    toggleColumnVisibility: (columnKey: string) => void
    toggleFavorite: (productId: string) => void
    toggleArchive: (productId: string) => void
    loadMore: () => Promise<void>
  }
  derived: {
    filteredProducts: LifecycleProduct[]
    groupedProducts: Record<string, LifecycleProduct[]>
    visibleColumns: TableColumn[]
    hasActiveFilters: boolean
    isLoadingMore: boolean
    canLoadMore: boolean
  }
}

export interface UseUrlSyncReturn {
  syncToUrl: (state: Partial<UrlState>) => void
  syncFromUrl: () => UrlState
  updateUrl: (updates: Partial<UrlState>, replace?: boolean) => void
}

export interface UseOptimisticUpdatesReturn<T> {
  optimisticUpdates: Map<string, OptimisticUpdate<T>>
  addOptimisticUpdate: (update: Omit<OptimisticUpdate<T>, 'id' | 'timestamp'>) => string
  resolveOptimisticUpdate: (id: string, success: boolean) => void
  clearOptimisticUpdates: () => void
}

export interface UseUndoRedoReturn {
  state: UndoRedoState
  canUndo: boolean
  canRedo: boolean
  addAction: (action: Omit<UndoRedoAction, 'id' | 'timestamp'>) => void
  undo: () => Promise<void>
  redo: () => Promise<void>
  clearHistory: () => void
}