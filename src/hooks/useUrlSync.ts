import { useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { UrlState, ViewType, GroupByOption, ProductFilters } from '@/types/products'

const PARAM_KEYS = {
  view: 'view',
  search: 'q',
  groupBy: 'group',
  sort: 'sort',
  filters: 'filters',
  page: 'page'
} as const

/**
 * Hook for synchronizing product state with URL parameters
 * This enables shareable links and browser back/forward navigation
 */
export const useUrlSync = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // Parse current URL parameters
  const urlState = useMemo((): UrlState => {
    const params = new URLSearchParams(location.search)
    const state: UrlState = {}

    // Parse view
    const view = params.get(PARAM_KEYS.view)
    if (view === 'table' || view === 'gallery') {
      state.view = view
    }

    // Parse search query
    const search = params.get(PARAM_KEYS.search)
    if (search) {
      state.search = decodeURIComponent(search)
    }

    // Parse group by
    const groupBy = params.get(PARAM_KEYS.groupBy)
    if (['none', 'category', 'vendor', 'assignee', 'stage', 'priority'].includes(groupBy || '')) {
      state.groupBy = groupBy as GroupByOption
    }

    // Parse sort
    const sort = params.get(PARAM_KEYS.sort)
    if (sort) {
      state.sort = decodeURIComponent(sort)
    }

    // Parse filters
    const filtersParam = params.get(PARAM_KEYS.filters)
    if (filtersParam) {
      try {
        const decoded = decodeURIComponent(filtersParam)
        const parsed = JSON.parse(decoded)
        if (typeof parsed === 'object' && parsed !== null) {
          state.filters = decoded
        }
      } catch (error) {
        console.warn('Failed to parse filters from URL:', error)
      }
    }

    // Parse page
    const page = params.get(PARAM_KEYS.page)
    if (page) {
      const pageNum = parseInt(page, 10)
      if (!isNaN(pageNum) && pageNum > 0) {
        state.page = pageNum
      }
    }

    return state
  }, [location.search])

  // Update URL with new state
  const updateUrl = useCallback((
    updates: Partial<UrlState>,
    replace: boolean = false
  ) => {
    const params = new URLSearchParams(location.search)

    // Apply updates
    Object.entries(updates).forEach(([key, value]) => {
      const paramKey = PARAM_KEYS[key as keyof typeof PARAM_KEYS]
      if (!paramKey) return

      if (value === undefined || value === null || value === '') {
        params.delete(paramKey)
      } else {
        if (key === 'filters' && typeof value === 'object') {
          // Serialize filters object
          const serialized = JSON.stringify(value)
          params.set(paramKey, encodeURIComponent(serialized))
        } else {
          params.set(paramKey, encodeURIComponent(String(value)))
        }
      }
    })

    // Clean up empty parameters
    const cleanParams = new URLSearchParams()
    for (const [key, value] of params.entries()) {
      if (value && value.trim()) {
        cleanParams.set(key, value)
      }
    }

    // Build new URL
    const newSearch = cleanParams.toString()
    const newUrl = `${location.pathname}${newSearch ? `?${newSearch}` : ''}`

    // Navigate
    if (replace) {
      navigate(newUrl, { replace: true })
    } else {
      navigate(newUrl)
    }
  }, [location.pathname, location.search, navigate])

  // Sync specific state to URL
  const syncToUrl = useCallback((state: Partial<UrlState>) => {
    updateUrl(state, true) // Use replace to avoid creating too many history entries
  }, [updateUrl])

  // Get current state from URL
  const syncFromUrl = useCallback((): UrlState => {
    return urlState
  }, [urlState])

  // Parse filters from URL state
  const parseFiltersFromUrl = useCallback((filtersString?: string): ProductFilters | undefined => {
    if (!filtersString) return undefined

    try {
      const parsed = JSON.parse(filtersString)

      // Validate the structure
      if (typeof parsed !== 'object' || parsed === null) {
        return undefined
      }

      // Clean and validate filter properties
      const filters: ProductFilters = {}

      if (Array.isArray(parsed.stages)) {
        filters.stages = parsed.stages.filter((s: unknown) =>
          typeof s === 'string' && ['idea', 'production', 'content', 'scaling', 'inventory'].includes(s)
        )
      }

      if (Array.isArray(parsed.tags)) {
        filters.tags = parsed.tags.filter((t: unknown) => typeof t === 'string')
      }

      if (Array.isArray(parsed.categories)) {
        filters.categories = parsed.categories.filter((c: unknown) => typeof c === 'string')
      }

      if (Array.isArray(parsed.owners)) {
        filters.owners = parsed.owners.filter((o: unknown) => typeof o === 'string')
      }

      if (Array.isArray(parsed.teamLeads)) {
        filters.teamLeads = parsed.teamLeads.filter((t: unknown) => typeof t === 'string')
      }

      if (Array.isArray(parsed.priority)) {
        filters.priority = parsed.priority.filter((p: unknown) =>
          typeof p === 'string' && ['low', 'medium', 'high'].includes(p)
        )
      }

      if (typeof parsed.search === 'string') {
        filters.search = parsed.search
      }

      if (typeof parsed.potentialScoreMin === 'number') {
        filters.potentialScoreMin = parsed.potentialScoreMin
      }

      if (typeof parsed.potentialScoreMax === 'number') {
        filters.potentialScoreMax = parsed.potentialScoreMax
      }

      if (typeof parsed.idleDaysMin === 'number') {
        filters.idleDaysMin = parsed.idleDaysMin
      }

      if (typeof parsed.internalCodePattern === 'string') {
        filters.internalCodePattern = parsed.internalCodePattern
      }

      // Handle date ranges
      if (parsed.createdDateRange &&
          typeof parsed.createdDateRange.start === 'string' &&
          typeof parsed.createdDateRange.end === 'string') {
        const start = new Date(parsed.createdDateRange.start)
        const end = new Date(parsed.createdDateRange.end)
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          filters.createdDateRange = { start, end }
        }
      }

      if (parsed.updatedDateRange &&
          typeof parsed.updatedDateRange.start === 'string' &&
          typeof parsed.updatedDateRange.end === 'string') {
        const start = new Date(parsed.updatedDateRange.start)
        const end = new Date(parsed.updatedDateRange.end)
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          filters.updatedDateRange = { start, end }
        }
      }

      if (parsed.marginRange &&
          typeof parsed.marginRange.min === 'number' &&
          typeof parsed.marginRange.max === 'number') {
        filters.marginRange = parsed.marginRange
      }

      if (Array.isArray(parsed.vendorLocations)) {
        filters.vendorLocations = parsed.vendorLocations.filter((v: unknown) => typeof v === 'string')
      }

      return filters
    } catch (error) {
      console.warn('Failed to parse filters from URL:', error)
      return undefined
    }
  }, [])

  // Serialize filters for URL
  const serializeFiltersForUrl = useCallback((filters: ProductFilters): string => {
    // Create a clean copy with only non-empty values
    const cleanFilters: Partial<ProductFilters> = {}

    if (filters.stages?.length) cleanFilters.stages = filters.stages
    if (filters.tags?.length) cleanFilters.tags = filters.tags
    if (filters.categories?.length) cleanFilters.categories = filters.categories
    if (filters.owners?.length) cleanFilters.owners = filters.owners
    if (filters.teamLeads?.length) cleanFilters.teamLeads = filters.teamLeads
    if (filters.priority?.length) cleanFilters.priority = filters.priority
    if (filters.search?.trim()) cleanFilters.search = filters.search.trim()
    if (typeof filters.potentialScoreMin === 'number') cleanFilters.potentialScoreMin = filters.potentialScoreMin
    if (typeof filters.potentialScoreMax === 'number') cleanFilters.potentialScoreMax = filters.potentialScoreMax
    if (typeof filters.idleDaysMin === 'number') cleanFilters.idleDaysMin = filters.idleDaysMin
    if (filters.internalCodePattern?.trim()) cleanFilters.internalCodePattern = filters.internalCodePattern.trim()
    if (filters.createdDateRange) cleanFilters.createdDateRange = filters.createdDateRange
    if (filters.updatedDateRange) cleanFilters.updatedDateRange = filters.updatedDateRange
    if (filters.marginRange) cleanFilters.marginRange = filters.marginRange
    if (filters.vendorLocations?.length) cleanFilters.vendorLocations = filters.vendorLocations

    return JSON.stringify(cleanFilters)
  }, [])

  // Clear URL parameters
  const clearUrl = useCallback(() => {
    navigate(location.pathname, { replace: true })
  }, [location.pathname, navigate])

  return {
    urlState,
    syncToUrl,
    syncFromUrl,
    updateUrl,
    parseFiltersFromUrl,
    serializeFiltersForUrl,
    clearUrl
  }
}

// Helper hook for URL state with defaults
export const useUrlStateWithDefaults = (defaults: Partial<UrlState> = {}) => {
  const { urlState, ...urlSync } = useUrlSync()

  const stateWithDefaults = useMemo(() => ({
    view: urlState.view || defaults.view || ('gallery' as ViewType),
    search: urlState.search || defaults.search || '',
    groupBy: urlState.groupBy || defaults.groupBy || ('none' as GroupByOption),
    sort: urlState.sort || defaults.sort || 'updated_at-desc',
    filters: urlState.filters || defaults.filters,
    page: urlState.page || defaults.page || 1
  }), [urlState, defaults])

  return {
    urlState: stateWithDefaults,
    ...urlSync
  }
}

export type { UrlState }