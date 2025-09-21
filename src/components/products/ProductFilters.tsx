import React, { memo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Filter,
  Group,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Columns,
  Search,
  X
} from 'lucide-react'
import { useUniqueId, useScreenReader, a11yUtils } from '@/hooks/useAccessibility'
import type {
  FilterOptions,
  GroupByOption,
  SortOption,
  TableColumn
} from '@/pages/products/Products'

interface Category {
  id: string
  name: string
}

interface GroupByFilterProps {
  groupBy: GroupByOption
  onGroupByChange: (option: GroupByOption) => void
}

export const GroupByFilter = memo<GroupByFilterProps>(({ groupBy, onGroupByChange }) => {
  const { announce } = useScreenReader()
  const triggerId = useUniqueId('group-by-trigger')
  const contentId = useUniqueId('group-by-content')

  const handleGroupByChange = (option: GroupByOption) => {
    onGroupByChange(option)
    const label = option === 'none' ? 'No grouping' : `Grouped by ${option}`
    announce(label)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 h-10 justify-start sm:justify-center"
          id={triggerId}
          aria-expanded={false}
          aria-haspopup="menu"
          aria-controls={contentId}
          aria-label={a11yUtils.getFilterAriaLabel('Group by', groupBy !== 'none')}
        >
          <Group className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm">Group by</span>
          {groupBy !== 'none' && (
            <Badge variant="secondary" className="ml-auto sm:ml-1 h-5 px-1.5 text-xs capitalize">
              {groupBy}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-48 p-2"
        align="start"
        id={contentId}
        role="menu"
        aria-labelledby={triggerId}
      >
        <div className="space-y-1">
          <div className="text-sm font-medium p-2" id={`${contentId}-label`}>Group by</div>
          <div role="group" aria-labelledby={`${contentId}-label`}>
            {[
              { value: 'none', label: 'No grouping' },
              { value: 'category', label: 'Category' },
              { value: 'vendor', label: 'Vendor' },
              { value: 'assignee', label: 'Assignee' },
              { value: 'stage', label: 'Stage' },
              { value: 'priority', label: 'Priority' }
            ].map(option => (
              <Button
                key={option.value}
                variant={groupBy === option.value ? 'default' : 'ghost'}
                size="sm"
                className="w-full justify-start h-8"
                role="menuitem"
                aria-pressed={groupBy === option.value}
                onClick={() => handleGroupByChange(option.value as GroupByOption)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
})

GroupByFilter.displayName = 'GroupByFilter'

interface SortFilterProps {
  sortOption: SortOption
  sortOptions: SortOption[]
  onSortChange: (option: SortOption) => void
}

export const SortFilter = memo<SortFilterProps>(({ sortOption, sortOptions, onSortChange }) => {
  const { announce } = useScreenReader()
  const triggerId = useUniqueId('sort-trigger')
  const contentId = useUniqueId('sort-content')

  const handleSortChange = (option: SortOption) => {
    onSortChange(option)
    announce(`Sorted by ${option.label}`)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 h-10 justify-start sm:justify-center"
          id={triggerId}
          aria-expanded={false}
          aria-haspopup="menu"
          aria-controls={contentId}
          aria-label={`Sort options. Currently sorted by ${sortOption.label}`}
        >
          <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm">Sort</span>
          <Badge variant="secondary" className="ml-auto sm:ml-1 h-5 px-1.5 text-xs">
            {sortOption.direction === 'asc' ? (
              <ArrowUp className="h-3 w-3" aria-hidden="true" />
            ) : (
              <ArrowDown className="h-3 w-3" aria-hidden="true" />
            )}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-2"
        align="start"
        id={contentId}
        role="menu"
        aria-labelledby={triggerId}
      >
        <div className="space-y-1">
          <div className="text-sm font-medium p-2" id={`${contentId}-label`}>Sort by</div>
          <div role="group" aria-labelledby={`${contentId}-label`}>
            {sortOptions.map(option => (
              <Button
                key={`${option.field}-${option.direction}`}
                variant={sortOption.field === option.field && sortOption.direction === option.direction ? 'default' : 'ghost'}
                size="sm"
                className="w-full justify-start h-8"
                role="menuitem"
                aria-pressed={sortOption.field === option.field && sortOption.direction === option.direction}
                onClick={() => handleSortChange(option)}
              >
                <span className="flex-1 text-left">{option.label}</span>
                {option.direction === 'asc' ? (
                  <ArrowUp className="h-3 w-3" aria-hidden="true" />
                ) : (
                  <ArrowDown className="h-3 w-3" aria-hidden="true" />
                )}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
})

SortFilter.displayName = 'SortFilter'

interface ColumnCustomizationProps {
  tableColumns: TableColumn[]
  visibleColumns: TableColumn[]
  onToggleColumn: (columnKey: string) => void
}

export const ColumnCustomization = memo<ColumnCustomizationProps>(({
  tableColumns,
  visibleColumns,
  onToggleColumn
}) => {
  const { announce } = useScreenReader()
  const triggerId = useUniqueId('columns-trigger')
  const contentId = useUniqueId('columns-content')

  const handleToggleColumn = (columnKey: string) => {
    onToggleColumn(columnKey)
    const column = tableColumns.find(col => col.key === columnKey)
    if (column) {
      const action = column.visible ? 'hidden' : 'shown'
      announce(`Column ${column.label} ${action}`)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 h-10 justify-start sm:justify-center"
          id={triggerId}
          aria-expanded={false}
          aria-haspopup="menu"
          aria-controls={contentId}
          aria-label={`Column visibility settings. ${visibleColumns.length} columns visible`}
        >
          <Columns className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm">Columns</span>
          <Badge variant="secondary" className="ml-auto sm:ml-1 h-5 px-1.5 text-xs">
            {visibleColumns.length}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-3"
        align="start"
        id={contentId}
        role="menu"
        aria-labelledby={triggerId}
      >
        <div className="space-y-3">
          <div className="text-sm font-medium" id={`${contentId}-label`}>Show Columns</div>
          <div className="space-y-2 max-h-64 overflow-y-auto" role="group" aria-labelledby={`${contentId}-label`}>
            {tableColumns.map(column => {
              const isDisabled = column.key === 'product' || column.key === 'actions'
              return (
                <div key={column.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`column-${column.key}`}
                    checked={column.visible}
                    onCheckedChange={() => handleToggleColumn(column.key)}
                    disabled={isDisabled}
                    aria-describedby={isDisabled ? `column-${column.key}-desc` : undefined}
                  />
                  <Label
                    htmlFor={`column-${column.key}`}
                    className={`text-sm flex-1 ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  >
                    {column.label}
                  </Label>
                  {isDisabled && (
                    <span id={`column-${column.key}-desc`} className="sr-only">
                      Always visible
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
})

ColumnCustomization.displayName = 'ColumnCustomization'

interface CategoryFilterProps {
  filters: FilterOptions
  categories: Category[]
  categoriesLoading: boolean
  onFiltersChange: (filters: FilterOptions) => void
}

export const CategoryFilter = memo<CategoryFilterProps>(({
  filters,
  categories,
  categoriesLoading,
  onFiltersChange
}) => {
  const { announce } = useScreenReader()
  const triggerId = useUniqueId('category-trigger')
  const contentId = useUniqueId('category-content')

  const handleFilterChange = (newFilters: FilterOptions) => {
    onFiltersChange(newFilters)
    const activeCount = newFilters.categories?.length || 0
    announce(`Category filter updated. ${activeCount} categories selected`)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 h-10 justify-start sm:justify-center"
          id={triggerId}
          aria-expanded={false}
          aria-haspopup="menu"
          aria-controls={contentId}
          aria-label={a11yUtils.getFilterAriaLabel('Categories', (filters.categories?.length || 0) > 0, filters.categories?.length)}
        >
          <Filter className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm">Categories</span>
          {filters.categories && filters.categories.length > 0 && (
            <Badge variant="secondary" className="ml-auto sm:ml-1 h-5 px-1.5 text-xs">
              {filters.categories.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-4"
        align="start"
        id={contentId}
        role="menu"
        aria-labelledby={triggerId}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium" id={`${contentId}-label`}>Filter by Categories</h4>
            {filters.categories && filters.categories.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFilterChange({ ...filters, categories: [] })}
                className="h-6 px-2 text-xs"
                aria-label="Clear all category filters"
              >
                <X className="h-3 w-3 mr-1" aria-hidden="true" />
                Clear
              </Button>
            )}
          </div>
          {categoriesLoading ? (
            <div className="text-xs text-muted-foreground" role="status" aria-live="polite">
              Loading categories...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto" role="group" aria-labelledby={`${contentId}-label`}>
              {categories.map((category) => (
                <div key={category.name} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.name}`}
                    checked={filters.categories?.includes(category.name) || false}
                    onCheckedChange={(checked) => {
                      handleFilterChange({
                        ...filters,
                        categories: checked
                          ? [...(filters.categories || []), category.name]
                          : (filters.categories || []).filter(c => c !== category.name)
                      })
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
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
})

CategoryFilter.displayName = 'CategoryFilter'

interface SearchFilterProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  placeholder?: string
}

export const SearchFilter = memo<SearchFilterProps>(({
  searchQuery,
  onSearchChange,
  placeholder = "Search products..."
}) => {
  const { announce } = useScreenReader()
  const searchId = useUniqueId('search-input')
  const searchRef = useRef<HTMLInputElement>(null)

  const handleSearchChange = (value: string) => {
    onSearchChange(value)
    if (value.trim()) {
      announce(`Searching for ${value}`)
    } else {
      announce('Search cleared')
    }
  }

  const clearSearch = () => {
    onSearchChange('')
    searchRef.current?.focus()
    announce('Search cleared')
  }

  return (
    <div className="relative w-full sm:w-64 lg:w-80">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Input
          ref={searchRef}
          id={searchId}
          type="search"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-10 h-10 text-sm w-full"
          aria-label="Search products"
          aria-describedby={searchQuery ? `${searchId}-results` : undefined}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            onClick={clearSearch}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>
      {searchQuery && (
        <div id={`${searchId}-results`} className="sr-only" aria-live="polite">
          Search term: {searchQuery}
        </div>
      )}
    </div>
  )
})

SearchFilter.displayName = 'SearchFilter'

export interface ProductFiltersProps {
  groupBy: GroupByOption
  sortOption: SortOption
  sortOptions: SortOption[]
  tableColumns: TableColumn[]
  visibleColumns: TableColumn[]
  filters: FilterOptions
  categories: Category[]
  categoriesLoading: boolean
  searchQuery: string
  selectedView: 'table' | 'gallery'
  onGroupByChange: (option: GroupByOption) => void
  onSortChange: (option: SortOption) => void
  onToggleColumn: (columnKey: string) => void
  onFiltersChange: (filters: FilterOptions) => void
  onSearchChange: (query: string) => void
}

export const ProductFilters = memo<ProductFiltersProps>(({
  groupBy,
  sortOption,
  sortOptions,
  tableColumns,
  visibleColumns,
  filters,
  categories,
  categoriesLoading,
  searchQuery,
  selectedView,
  onGroupByChange,
  onSortChange,
  onToggleColumn,
  onFiltersChange,
  onSearchChange
}) => {
  const containerId = useUniqueId('product-filters')

  return (
    <div
      id={containerId}
      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto"
      role="toolbar"
      aria-label="Product filters and search"
    >
      <GroupByFilter groupBy={groupBy} onGroupByChange={onGroupByChange} />
      <SortFilter sortOption={sortOption} sortOptions={sortOptions} onSortChange={onSortChange} />

      {selectedView === 'table' && (
        <ColumnCustomization
          tableColumns={tableColumns}
          visibleColumns={visibleColumns}
          onToggleColumn={onToggleColumn}
        />
      )}

      <CategoryFilter
        filters={filters}
        categories={categories}
        categoriesLoading={categoriesLoading}
        onFiltersChange={onFiltersChange}
      />

      <SearchFilter searchQuery={searchQuery} onSearchChange={onSearchChange} />
    </div>
  )
})

ProductFilters.displayName = 'ProductFilters'