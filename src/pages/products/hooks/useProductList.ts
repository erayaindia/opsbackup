import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { toast } from '@/hooks/use-toast'
import {
  productLifecycleService,
  type LifecycleProduct as LifecycleCard,
  type FilterOptions
} from '@/services/productLifecycleService'

export type Stage = 'idea' | 'production' | 'content' | 'scaling' | 'inventory'

export type SortOption = {
  field: string
  direction: 'asc' | 'desc'
  label: string
}

export interface UseProductListParams {
  filters: FilterOptions
  activeStageFilter: Stage | 'all'
}

export interface UseProductListReturn {
  // Data state
  cards: LifecycleCard[]
  loading: boolean
  isLoadingMore: boolean

  // Pagination state
  currentPage: number
  itemsPerPage: number
  totalItems: number
  hasMore: boolean

  // Search state
  searchQuery: string
  debouncedSearchQuery: string

  // Sort state
  sortOption: SortOption
  sortOptions: SortOption[]

  // Actions
  setSearchQuery: (query: string) => void
  setSortOption: (option: SortOption) => void
  setCurrentPage: (page: number | ((prev: number) => number)) => void
  loadMore: () => Promise<void>
  refresh: () => void
  clearCache: () => void

  // Refs for external use
  loadMoreRef: (node: HTMLDivElement | null) => void
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Custom hook to manage product list data fetching, caching, and pagination
 *
 * Centralizes all data loading logic including:
 * - Product fetching with pagination
 * - Search with debouncing
 * - Sorting
 * - Caching for performance
 * - Infinite scroll support
 */
export function useProductList({
  filters,
  activeStageFilter
}: UseProductListParams): UseProductListReturn {
  // Cards data state
  const [cards, setCards] = useState<LifecycleCard[]>([])
  const [loading, setLoading] = useState(true)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [totalItems, setTotalItems] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Sort state
  const [sortOption, setSortOption] = useState<SortOption>({
    field: 'updated_at',
    direction: 'desc',
    label: 'Recently Updated'
  })

  // Cache for products data
  const [cachedProducts, setCachedProducts] = useState<Map<string, LifecycleCard[]>>(new Map())
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Intersection Observer ref for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Available sort options
  const sortOptions: SortOption[] = useMemo(() => [
    { field: 'updated_at', direction: 'desc', label: 'Recently Updated' },
    { field: 'created_at', direction: 'desc', label: 'Recently Created' },
    { field: 'working_title', direction: 'asc', label: 'Name (A-Z)' },
    { field: 'working_title', direction: 'desc', label: 'Name (Z-A)' },
    { field: 'priority', direction: 'desc', label: 'Priority (High to Low)' },
    { field: 'potential_score', direction: 'desc', label: 'Score (High to Low)' },
    { field: 'estimated_selling_price', direction: 'desc', label: 'Price (High to Low)' },
    { field: 'estimated_selling_price', direction: 'asc', label: 'Price (Low to High)' }
  ], [])

  // Calculate if there are more items to load
  const hasMore = useMemo(() => {
    return totalItems > 0 && cards.length < totalItems
  }, [totalItems, cards.length])

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

  // Load data with pagination and caching
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // Create cache key for current filters
        const cacheKey = JSON.stringify({
          page: currentPage,
          search: debouncedSearchQuery,
          stage: activeStageFilter,
          filters,
          sort: sortOption
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
  }, [currentPage, debouncedSearchQuery, activeStageFilter, filters, sortOption, itemsPerPage, cachedProducts, lastFetchTime])

  // Load more function for pagination
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    setCurrentPage(prev => prev + 1)
  }, [isLoadingMore, hasMore])

  // Intersection Observer callback for infinite scroll
  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || isLoadingMore) return
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore()
      }
    })

    if (node) observerRef.current.observe(node)
  }, [loading, isLoadingMore, loadMore, hasMore])

  // Refresh function to clear cache and reload
  const refresh = useCallback(() => {
    setCachedProducts(new Map())
    setLastFetchTime(0)
    setCurrentPage(1)
  }, [])

  // Clear cache only (without reloading)
  const clearCache = useCallback(() => {
    setCachedProducts(new Map())
    setLastFetchTime(0)
  }, [])

  return {
    // Data
    cards,
    loading,
    isLoadingMore,

    // Pagination
    currentPage,
    itemsPerPage,
    totalItems,
    hasMore,

    // Search
    searchQuery,
    debouncedSearchQuery,

    // Sort
    sortOption,
    sortOptions,

    // Actions
    setSearchQuery,
    setSortOption,
    setCurrentPage,
    loadMore,
    refresh,
    clearCache,

    // Refs
    loadMoreRef
  }
}
