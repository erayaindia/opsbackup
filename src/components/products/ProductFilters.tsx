import React, { memo } from 'react'
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
} from 'lucide-react'
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

export const GroupByFilter = memo<GroupByFilterProps>(({ groupBy, onGroupByChange }) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline" className="gap-2 h-10 justify-start sm:justify-center">
        <Group className="h-4 w-4" />
        <span className="text-sm">Group by</span>
        {groupBy !== 'none' && (
          <Badge variant="secondary" className="ml-auto sm:ml-1 h-5 px-1.5 text-xs capitalize">
            {groupBy}
          </Badge>
        )}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-48 p-2" align="start">
      <div className="space-y-1">
        <div className="text-sm font-medium p-2">Group by</div>
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
            onClick={() => onGroupByChange(option.value as GroupByOption)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </PopoverContent>
  </Popover>
))

GroupByFilter.displayName = 'GroupByFilter'

interface SortFilterProps {
  sortOption: SortOption
  sortOptions: SortOption[]
  onSortChange: (option: SortOption) => void
}

export const SortFilter = memo<SortFilterProps>(({ sortOption, sortOptions, onSortChange }) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline" className="gap-2 h-10 justify-start sm:justify-center">
        <ArrowUpDown className="h-4 w-4" />
        <span className="text-sm">Sort</span>
        <Badge variant="secondary" className="ml-auto sm:ml-1 h-5 px-1.5 text-xs">
          {sortOption.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
        </Badge>
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-56 p-2" align="start">
      <div className="space-y-1">
        <div className="text-sm font-medium p-2">Sort by</div>
        {sortOptions.map(option => (
          <Button
            key={`${option.field}-${option.direction}`}
            variant={sortOption.field === option.field && sortOption.direction === option.direction ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start h-8"
            onClick={() => onSortChange(option)}
          >
            <span className="flex-1 text-left">{option.label}</span>
            {option.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          </Button>
        ))}
      </div>
    </PopoverContent>
  </Popover>
))

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
}) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline" className="gap-2 h-10 justify-start sm:justify-center">
        <Columns className="h-4 w-4" />
        <span className="text-sm">Columns</span>
        <Badge variant="secondary" className="ml-auto sm:ml-1 h-5 px-1.5 text-xs">
          {visibleColumns.length}
        </Badge>
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-56 p-3" align="start">
      <div className="space-y-3">
        <div className="text-sm font-medium">Show Columns</div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {tableColumns.map(column => (
            <div key={column.key} className="flex items-center space-x-2">
              <Checkbox
                id={`column-${column.key}`}
                checked={column.visible}
                onCheckedChange={() => onToggleColumn(column.key)}
                disabled={column.key === 'product' || column.key === 'actions'} // Always show these
              />
              <Label
                htmlFor={`column-${column.key}`}
                className="text-sm cursor-pointer flex-1"
              >
                {column.label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </PopoverContent>
  </Popover>
))

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
}) => (
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
              onClick={() => onFiltersChange({ ...filters, categories: [] })}
              className="h-6 px-2 text-xs"
            >
              Clear
            </Button>
          )}
        </div>
        {categoriesLoading ? (
          <div className="text-xs text-muted-foreground">Loading categories...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
            {categories.map((category) => (
              <div key={category.name} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.name}`}
                  checked={filters.categories?.includes(category.name) || false}
                  onCheckedChange={(checked) => {
                    onFiltersChange({
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
))

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
}) => (
  <div className="relative w-full sm:w-64 lg:w-80">
    <Input
      id="lifecycle-search"
      placeholder={placeholder}
      value={searchQuery}
      onChange={(e) => onSearchChange(e.target.value)}
      className="px-4 h-10 text-sm w-full"
    />
  </div>
))

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
}) => (
  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
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
))

ProductFilters.displayName = 'ProductFilters'