import { useState, useMemo, useCallback } from 'react'
import type { FilterOptions } from '@/services/productLifecycleService'

export type Stage = 'idea' | 'production' | 'content' | 'scaling' | 'inventory'

export interface UseProductFiltersReturn {
  // Filter state
  filters: FilterOptions
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>
  activeStageFilter: Stage | 'all'
  setActiveStageFilter: React.Dispatch<React.SetStateAction<Stage | 'all'>>
  selectedCategories: string[]
  setSelectedCategories: React.Dispatch<React.SetStateAction<string[]>>

  // Computed values
  hasActiveFilters: boolean
  activeFiltersCount: number

  // Filter options for API
  filterOptionsForAPI: FilterOptions & { stage?: Stage }

  // Action functions
  clearAllFilters: () => void
  clearCategoryFilters: () => void
  toggleCategoryFilter: (category: string) => void
}

/**
 * Custom hook to manage all product filtering logic
 *
 * Centralizes filter state management, computed values, and filter manipulation functions
 * for the Products page.
 */
export function useProductFilters(
  onFiltersChange?: () => void
): UseProductFiltersReturn {
  // Primary filter state
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

  // Stage filter state
  const [activeStageFilter, setActiveStageFilter] = useState<Stage | 'all'>('all')

  // Category selection state (used in forms)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      Object.values(filters).some(filter =>
        Array.isArray(filter) ? filter.length > 0 : filter !== undefined
      ) || activeStageFilter !== 'all'
    )
  }, [filters, activeStageFilter])

  // Count active filters for display
  const activeFiltersCount = useMemo(() => {
    const filterCount = [
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
    ].length

    return filterCount + (activeStageFilter !== 'all' ? 1 : 0)
  }, [filters, activeStageFilter])

  // Generate filter options for API calls
  const filterOptionsForAPI = useMemo(() => {
    return {
      ...filters,
      stage: activeStageFilter !== 'all' ? activeStageFilter : undefined
    }
  }, [filters, activeStageFilter])

  // Clear all filters
  const clearAllFilters = useCallback(() => {
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
    setActiveStageFilter('all')
    setSelectedCategories([])

    onFiltersChange?.()
  }, [onFiltersChange])

  // Clear category filters
  const clearCategoryFilters = useCallback(() => {
    setFilters(prev => ({ ...prev, categories: [] }))
    onFiltersChange?.()
  }, [onFiltersChange])

  // Toggle individual category filter
  const toggleCategoryFilter = useCallback((category: string) => {
    setFilters(prev => {
      const currentCategories = prev.categories || []
      const isSelected = currentCategories.includes(category)

      return {
        ...prev,
        categories: isSelected
          ? currentCategories.filter(c => c !== category)
          : [...currentCategories, category]
      }
    })
    onFiltersChange?.()
  }, [onFiltersChange])

  return {
    // State
    filters,
    setFilters,
    activeStageFilter,
    setActiveStageFilter,
    selectedCategories,
    setSelectedCategories,

    // Computed
    hasActiveFilters,
    activeFiltersCount,
    filterOptionsForAPI,

    // Actions
    clearAllFilters,
    clearCategoryFilters,
    toggleCategoryFilter
  }
}
