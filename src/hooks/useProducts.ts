import { useReducer, useCallback, useMemo, useEffect, useRef } from 'react'
import { toast } from '@/hooks/use-toast'
import { productLifecycleService, type LifecycleProduct } from '@/services/productLifecycleService'
import { useUrlSync } from './useUrlSync'
import { useProductOptimisticUpdates, createTempId } from './useOptimisticUpdates'
import { useProductUndoRedo } from './useUndoRedo'
import type {
  ProductsState,
  ProductsAction,
  ProductFilters,
  ViewType,
  GroupByOption,
  SortOption,
  TableColumn,
  ProductsApiOptions,
  UseProductsReturn
} from '@/types/products'

// Initial state
const initialState: ProductsState = {
  // Data
  products: [],
  loading: false,
  error: null,

  // Search and filters
  searchQuery: '',
  debouncedSearchQuery: '',
  filters: {},

  // View configuration
  selectedView: 'gallery',
  groupBy: 'none',
  sortOption: {
    field: 'updated_at',
    direction: 'desc',
    label: 'Recently Updated'
  },

  // Table configuration
  tableColumns: [
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
  ],

  // Pagination
  pagination: {
    currentPage: 1,
    itemsPerPage: 20,
    totalItems: 0,
    isLoadingMore: false
  },

  // Cache
  cache: {
    products: new Map(),
    lastFetchTime: 0
  },

  // UI state
  favoriteProducts: new Set(),
  archivedProducts: new Set(),
  selectedProducts: new Set()
}

// Reducer
const productsReducer = (state: ProductsState, action: ProductsAction): ProductsState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.loading }

    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false }

    case 'SET_PRODUCTS':
      return {
        ...state,
        products: action.products,
        loading: false,
        error: null
      }

    case 'ADD_PRODUCTS':
      return {
        ...state,
        products: [...state.products, ...action.products],
        loading: false,
        error: null
      }

    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(p =>
          p.id === action.product.id ? action.product : p
        )
      }

    case 'REMOVE_PRODUCT':
      return {
        ...state,
        products: state.products.filter(p => p.id !== action.productId)
      }

    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.query }

    case 'SET_DEBOUNCED_SEARCH_QUERY':
      return { ...state, debouncedSearchQuery: action.query }

    case 'SET_FILTERS':
      return { ...state, filters: action.filters }

    case 'UPDATE_FILTER':
      return {
        ...state,
        filters: { ...state.filters, [action.key]: action.value }
      }

    case 'CLEAR_FILTERS':
      return {
        ...state,
        filters: {},
        searchQuery: '',
        debouncedSearchQuery: '',
        groupBy: 'none'
      }

    case 'SET_VIEW':
      return { ...state, selectedView: action.view }

    case 'SET_GROUP_BY':
      return { ...state, groupBy: action.groupBy }

    case 'SET_SORT_OPTION':
      return { ...state, sortOption: action.sortOption }

    case 'TOGGLE_COLUMN_VISIBILITY':
      return {
        ...state,
        tableColumns: state.tableColumns.map(col =>
          col.key === action.columnKey
            ? { ...col, visible: !col.visible }
            : col
        )
      }

    case 'SET_PAGINATION':
      return {
        ...state,
        pagination: { ...state.pagination, ...action.pagination }
      }

    case 'TOGGLE_FAVORITE':
      const newFavorites = new Set(state.favoriteProducts)
      if (newFavorites.has(action.productId)) {
        newFavorites.delete(action.productId)
      } else {
        newFavorites.add(action.productId)
      }
      return { ...state, favoriteProducts: newFavorites }

    case 'TOGGLE_ARCHIVE':
      const newArchived = new Set(state.archivedProducts)
      if (newArchived.has(action.productId)) {
        newArchived.delete(action.productId)
      } else {
        newArchived.add(action.productId)
      }
      return { ...state, archivedProducts: newArchived }

    case 'TOGGLE_SELECTION':
      const newSelection = new Set(state.selectedProducts)
      if (newSelection.has(action.productId)) {
        newSelection.delete(action.productId)
      } else {
        newSelection.add(action.productId)
      }
      return { ...state, selectedProducts: newSelection }

    case 'SELECT_ALL':
      return {
        ...state,
        selectedProducts: new Set(state.products.map(p => p.id))
      }

    case 'CLEAR_SELECTION':
      return { ...state, selectedProducts: new Set() }

    case 'UPDATE_CACHE':
      const newCache = new Map(state.cache.products)
      newCache.set(action.key, {
        data: action.data,
        timestamp: action.timestamp,
        expiresAt: action.timestamp + (5 * 60 * 1000) // 5 minutes
      })
      return {
        ...state,
        cache: { ...state.cache, products: newCache, lastFetchTime: action.timestamp }
      }

    case 'CLEAR_CACHE':
      return {
        ...state,
        cache: { products: new Map(), lastFetchTime: 0 }
      }

    default:
      return state
  }
}

// Main hook
export const useProducts = (): UseProductsReturn => {
  const [state, dispatch] = useReducer(productsReducer, initialState)
  const { syncToUrl, parseFiltersFromUrl, serializeFiltersForUrl } = useUrlSync()
  const optimisticUpdates = useProductOptimisticUpdates()
  const undoRedo = useProductUndoRedo()

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  // Debounced search effect
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      dispatch({ type: 'SET_DEBOUNCED_SEARCH_QUERY', query: state.searchQuery })
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [state.searchQuery])

  // URL synchronization effect
  useEffect(() => {
    syncToUrl({
      view: state.selectedView,
      search: state.searchQuery,
      groupBy: state.groupBy,
      sort: `${state.sortOption.field}-${state.sortOption.direction}`,
      filters: Object.keys(state.filters).length > 0 ? serializeFiltersForUrl(state.filters) : undefined,
      page: state.pagination.currentPage
    })
  }, [
    state.selectedView,
    state.searchQuery,
    state.groupBy,
    state.sortOption,
    state.filters,
    state.pagination.currentPage,
    syncToUrl,
    serializeFiltersForUrl
  ])

  // Actions
  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', loading })
  }, [])

  const setError = useCallback((error: Error | null) => {
    dispatch({ type: 'SET_ERROR', error })
  }, [])

  const loadProducts = useCallback(async (options?: ProductsApiOptions) => {
    try {
      dispatch({ type: 'SET_LOADING', loading: true })
      dispatch({ type: 'SET_ERROR', error: null })

      // Create cache key
      const cacheKey = JSON.stringify({
        page: state.pagination.currentPage,
        search: state.debouncedSearchQuery,
        groupBy: state.groupBy,
        sort: state.sortOption,
        filters: state.filters,
        ...options
      })

      // Check cache first
      const now = Date.now()
      const cached = state.cache.products.get(cacheKey)
      if (cached && now < cached.expiresAt) {
        console.log('Using cached products')
        dispatch({ type: 'SET_PRODUCTS', products: cached.data })
        return
      }

      // Fetch from API
      const apiOptions: ProductsApiOptions = {
        limit: state.pagination.itemsPerPage,
        offset: (state.pagination.currentPage - 1) * state.pagination.itemsPerPage,
        search: state.debouncedSearchQuery,
        sort: { field: state.sortOption.field, direction: state.sortOption.direction },
        filters: state.filters,
        ...options
      }

      const response = await productLifecycleService.listProducts(apiOptions)

      let products: LifecycleProduct[]
      let total: number

      if (Array.isArray(response)) {
        products = response
        total = response.length
      } else {
        products = response.items
        total = response.total
        dispatch({ type: 'SET_PAGINATION', pagination: { totalItems: total } })
      }

      // Apply optimistic updates
      const optimisticProducts = optimisticUpdates.applyToProductList(products)

      dispatch({ type: 'SET_PRODUCTS', products: optimisticProducts })
      dispatch({ type: 'UPDATE_CACHE', key: cacheKey, data: products, timestamp: now })

    } catch (error) {
      console.error('Failed to load products:', error)
      dispatch({ type: 'SET_ERROR', error: error as Error })
      toast({
        title: 'Failed to load products',
        description: 'Please try again or refresh the page.',
        variant: 'destructive'
      })
    }
  }, [
    state.pagination.currentPage,
    state.pagination.itemsPerPage,
    state.debouncedSearchQuery,
    state.groupBy,
    state.sortOption,
    state.filters,
    state.cache.products,
    optimisticUpdates
  ])

  const createProduct = useCallback(async (productData: Partial<LifecycleProduct>) => {
    const tempId = createTempId('product')
    const tempProduct = {
      ...productData,
      id: tempId,
      createdAt: new Date(),
      updatedAt: new Date()
    } as LifecycleProduct

    try {
      // Add optimistic update
      const updateId = optimisticUpdates.addOptimisticCreate(tempProduct)

      // Apply optimistic update immediately
      dispatch({ type: 'ADD_PRODUCTS', products: [tempProduct] })

      // Perform actual creation
      const newProduct = await productLifecycleService.createProduct(productData as any)

      // Replace temp product with real one
      dispatch({ type: 'REMOVE_PRODUCT', productId: tempId })
      dispatch({ type: 'ADD_PRODUCTS', products: [newProduct] })

      // Resolve optimistic update
      optimisticUpdates.resolveOptimisticUpdate(updateId, true)

      // Add to undo history
      undoRedo.addCreateAction(
        newProduct.workingTitle || newProduct.name || 'Product',
        async () => {
          dispatch({ type: 'ADD_PRODUCTS', products: [newProduct] })
        },
        async () => {
          await productLifecycleService.deleteProduct(newProduct.id)
          dispatch({ type: 'REMOVE_PRODUCT', productId: newProduct.id })
        }
      )

      toast({
        title: 'Product created',
        description: `"${newProduct.workingTitle || newProduct.name}" has been created successfully.`
      })

    } catch (error) {
      console.error('Failed to create product:', error)

      // Remove optimistic update
      dispatch({ type: 'REMOVE_PRODUCT', productId: tempId })

      toast({
        title: 'Failed to create product',
        description: 'Please try again.',
        variant: 'destructive'
      })
      throw error
    }
  }, [optimisticUpdates, undoRedo])

  const updateProduct = useCallback(async (id: string, updates: Partial<LifecycleProduct>) => {
    const originalProduct = state.products.find(p => p.id === id)
    if (!originalProduct) return

    try {
      // Add optimistic update
      const updateId = optimisticUpdates.addOptimisticUpdate(id, originalProduct, updates)

      // Apply optimistic update immediately
      dispatch({ type: 'UPDATE_PRODUCT', product: { ...originalProduct, ...updates } })

      // Perform actual update
      const updatedProduct = await productLifecycleService.updateProduct(id, updates as any)

      // Replace with real data
      dispatch({ type: 'UPDATE_PRODUCT', product: updatedProduct })

      // Resolve optimistic update
      optimisticUpdates.resolveOptimisticUpdate(updateId, true)

      // Add to undo history
      undoRedo.addUpdateAction(
        updatedProduct.workingTitle || updatedProduct.name || 'Product',
        async () => {
          dispatch({ type: 'UPDATE_PRODUCT', product: updatedProduct })
        },
        async () => {
          dispatch({ type: 'UPDATE_PRODUCT', product: originalProduct })
          await productLifecycleService.updateProduct(id, originalProduct as any)
        }
      )

      toast({
        title: 'Product updated',
        description: `"${updatedProduct.workingTitle || updatedProduct.name}" has been updated.`
      })

    } catch (error) {
      console.error('Failed to update product:', error)

      // Revert optimistic update
      dispatch({ type: 'UPDATE_PRODUCT', product: originalProduct })

      toast({
        title: 'Failed to update product',
        description: 'Please try again.',
        variant: 'destructive'
      })
      throw error
    }
  }, [state.products, optimisticUpdates, undoRedo])

  const deleteProduct = useCallback(async (id: string) => {
    const product = state.products.find(p => p.id === id)
    if (!product) return

    try {
      // Add optimistic update
      const updateId = optimisticUpdates.addOptimisticDelete(id, product)

      // Apply optimistic update immediately
      dispatch({ type: 'REMOVE_PRODUCT', productId: id })

      // Perform actual deletion
      await productLifecycleService.deleteProduct(id)

      // Resolve optimistic update
      optimisticUpdates.resolveOptimisticUpdate(updateId, true)

      // Add to undo history
      undoRedo.addDeleteAction(
        product.workingTitle || product.name || 'Product',
        async () => {
          dispatch({ type: 'REMOVE_PRODUCT', productId: id })
        },
        async () => {
          // Note: In reality, you'd need a restore API endpoint
          dispatch({ type: 'ADD_PRODUCTS', products: [product] })
        }
      )

      toast({
        title: 'Product deleted',
        description: `"${product.workingTitle || product.name}" has been deleted.`
      })

    } catch (error) {
      console.error('Failed to delete product:', error)

      // Revert optimistic update
      dispatch({ type: 'ADD_PRODUCTS', products: [product] })

      toast({
        title: 'Failed to delete product',
        description: 'Please try again.',
        variant: 'destructive'
      })
      throw error
    }
  }, [state.products, optimisticUpdates, undoRedo])

  const duplicateProduct = useCallback(async (product: LifecycleProduct) => {
    const duplicateData = {
      ...product,
      workingTitle: `${product.workingTitle || product.name} (Copy)`,
      name: `${product.workingTitle || product.name} (Copy)`
    }
    delete (duplicateData as any).id

    await createProduct(duplicateData)
  }, [createProduct])

  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', query })
    dispatch({ type: 'SET_PAGINATION', pagination: { currentPage: 1 } })
  }, [])

  const setFilters = useCallback((filters: ProductFilters) => {
    dispatch({ type: 'SET_FILTERS', filters })
    dispatch({ type: 'SET_PAGINATION', pagination: { currentPage: 1 } })
  }, [])

  const clearFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_FILTERS' })
    dispatch({ type: 'CLEAR_CACHE' })
  }, [])

  const setView = useCallback((view: ViewType) => {
    dispatch({ type: 'SET_VIEW', view })
  }, [])

  const setGroupBy = useCallback((groupBy: GroupByOption) => {
    dispatch({ type: 'SET_GROUP_BY', groupBy })
  }, [])

  const setSortOption = useCallback((sortOption: SortOption) => {
    dispatch({ type: 'SET_SORT_OPTION', sortOption })
    dispatch({ type: 'SET_PAGINATION', pagination: { currentPage: 1 } })
    dispatch({ type: 'CLEAR_CACHE' })
  }, [])

  const toggleColumnVisibility = useCallback((columnKey: string) => {
    dispatch({ type: 'TOGGLE_COLUMN_VISIBILITY', columnKey })
  }, [])

  const toggleFavorite = useCallback((productId: string) => {
    dispatch({ type: 'TOGGLE_FAVORITE', productId })
  }, [])

  const toggleArchive = useCallback((productId: string) => {
    dispatch({ type: 'TOGGLE_ARCHIVE', productId })
  }, [])

  const loadMore = useCallback(async () => {
    if (state.pagination.isLoadingMore ||
        state.products.length >= state.pagination.totalItems) return

    dispatch({ type: 'SET_PAGINATION', pagination: { isLoadingMore: true } })
    dispatch({ type: 'SET_PAGINATION', pagination: { currentPage: state.pagination.currentPage + 1 } })

    try {
      await loadProducts()
    } finally {
      dispatch({ type: 'SET_PAGINATION', pagination: { isLoadingMore: false } })
    }
  }, [state.pagination, state.products.length, loadProducts])

  // Derived state
  const filteredProducts = useMemo(() => {
    let filtered = state.products

    // Apply client-side filters that weren't handled server-side
    filtered = filtered.filter(product => !state.archivedProducts.has(product.id))

    // Sort by favorites
    filtered.sort((a, b) => {
      const aIsFavorite = state.favoriteProducts.has(a.id)
      const bIsFavorite = state.favoriteProducts.has(b.id)

      if (aIsFavorite && !bIsFavorite) return -1
      if (!aIsFavorite && bIsFavorite) return 1

      return 0 // Maintain server sort order
    })

    return filtered
  }, [state.products, state.archivedProducts, state.favoriteProducts])

  const groupedProducts = useMemo(() => {
    if (state.groupBy === 'none') {
      return { 'All Products': filteredProducts }
    }

    const groups: Record<string, LifecycleProduct[]> = {}

    filteredProducts.forEach(product => {
      let groupKey: string

      switch (state.groupBy) {
        case 'category':
          groupKey = product.category.length > 0 ? product.category[0] : 'Uncategorized'
          break
        case 'vendor':
          groupKey = product.ideaData?.selectedSupplierId || 'No Vendor'
          break
        case 'assignee':
          groupKey = product.teamLead.name || 'Unassigned'
          break
        case 'stage':
          groupKey = product.stage.charAt(0).toUpperCase() + product.stage.slice(1)
          break
        case 'priority':
          groupKey = product.priority.charAt(0).toUpperCase() + product.priority.slice(1)
          break
        default:
          groupKey = 'All Products'
      }

      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(product)
    })

    // Sort groups by name
    const sortedGroups: Record<string, LifecycleProduct[]> = {}
    Object.keys(groups)
      .sort()
      .forEach(key => {
        sortedGroups[key] = groups[key]
      })

    return sortedGroups
  }, [filteredProducts, state.groupBy])

  const visibleColumns = useMemo(() => {
    return state.tableColumns.filter(col => col.visible)
  }, [state.tableColumns])

  const hasActiveFilters = useMemo(() => {
    return Object.keys(state.filters).length > 0 ||
           state.searchQuery.length > 0 ||
           state.groupBy !== 'none'
  }, [state.filters, state.searchQuery, state.groupBy])

  const canLoadMore = useMemo(() => {
    return state.products.length < state.pagination.totalItems
  }, [state.products.length, state.pagination.totalItems])

  return {
    state,
    actions: {
      setLoading,
      setError,
      loadProducts,
      createProduct,
      updateProduct,
      deleteProduct,
      duplicateProduct,
      setSearchQuery,
      setFilters,
      clearFilters,
      setView,
      setGroupBy,
      setSortOption,
      toggleColumnVisibility,
      toggleFavorite,
      toggleArchive,
      loadMore
    },
    derived: {
      filteredProducts,
      groupedProducts,
      visibleColumns,
      hasActiveFilters,
      isLoadingMore: state.pagination.isLoadingMore,
      canLoadMore
    }
  }
}