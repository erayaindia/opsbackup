import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';

export interface FilterOption {
  key: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  width?: string;
}

interface TableFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  searchPlaceholder?: string;
  filterOptions?: FilterOption[];
  filters?: Record<string, any>;
  onFilterChange?: (key: string, value: any) => void;
  onClearFilters?: () => void;
  showSearch?: boolean;
  className?: string;
}

export const TableFilters: React.FC<TableFiltersProps> = ({
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Search...",
  filterOptions = [],
  filters = {},
  onFilterChange,
  onClearFilters,
  showSearch = true,
  className
}) => {
  const hasActiveFilters = searchTerm || Object.values(filters).some(value =>
    value && value !== 'all' && value !== ''
  );

  return (
    <Card className={`rounded-none ${className}`}>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-4">
          {/* Search Input */}
          {showSearch && (
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 rounded-none h-10"
                />
              </div>
            </div>
          )}

          {/* Filter Dropdowns */}
          {filterOptions.map((filterOption) => (
            <Select
              key={filterOption.key}
              value={filters[filterOption.key] || 'all'}
              onValueChange={(value) => onFilterChange?.(filterOption.key, value)}
            >
              <SelectTrigger
                className={`rounded-none h-10 ${filterOption.width || 'w-[180px]'}`}
              >
                <SelectValue placeholder={filterOption.placeholder || filterOption.label} />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="all">All {filterOption.label}</SelectItem>
                {filterOption.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}

          {/* Clear Filters Button */}
          {hasActiveFilters && onClearFilters && (
            <Button
              variant="outline"
              onClick={onClearFilters}
              className="rounded-none h-10"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TableFilters;