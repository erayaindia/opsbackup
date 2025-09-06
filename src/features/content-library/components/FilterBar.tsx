import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Search } from 'lucide-react';
import { 
  FilterBarProps, 
  Stage, 
  PerformanceLabel, 
  Aspect 
} from '../types';

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onClearAll,
  activeFilterCount
}) => {
  const stages: Stage[] = ["Ready", "Live", "Re-edit", "Archived", "Pending", "Approved"];
  const performanceLabels: PerformanceLabel[] = ["Top Creative", "Scaling", "Testing", "Low Performer"];
  const aspects: Aspect[] = ["16:9", "9:16", "1:1", "4:5"];

  const formatFilterLabel = (key: string, value: string): string => {
    switch (key) {
      case 'assetType':
        return value === 'videos' ? 'Videos Only' : value === 'images' ? 'Images Only' : 'All Assets';
      case 'stage':
        return value === 'all' ? 'All Stages' : value;
      case 'performance':
        return value === 'all' ? 'All Performance' : value;
      case 'aspect':
        return value === 'all' ? 'All Aspects' : `${value} Aspect`;
      case 'dateRange':
        switch (value) {
          case 'today': return 'Today';
          case 'week': return 'Last 7 Days';
          case 'month': return 'Last 30 Days';
          case 'custom': return 'Custom Range';
          default: return 'All Time';
        }
      case 'searchQuery':
        return `Search: "${value}"`; 
      default:
        return value;
    }
  };

  const getActiveFilters = () => {
    const active = [];
    if (filters.assetType !== 'all') active.push({ key: 'assetType', value: filters.assetType });
    if (filters.stage !== 'all') active.push({ key: 'stage', value: filters.stage });
    if (filters.performance !== 'all') active.push({ key: 'performance', value: filters.performance });
    if (filters.aspect !== 'all') active.push({ key: 'aspect', value: filters.aspect });
    if (filters.dateRange !== 'all') active.push({ key: 'dateRange', value: filters.dateRange });
    if (filters.searchQuery && filters.searchQuery.trim()) active.push({ key: 'searchQuery', value: filters.searchQuery });
    return active;
  };

  const activeFilters = getActiveFilters();

  return (
    <div className="bg-card border-b border-border">
      <div className="container mx-auto px-6 py-4">
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, stage, performance, date..."
              value={filters.searchQuery}
              onChange={(e) => onFilterChange('searchQuery', e.target.value)}
              className="pl-10 pr-4 py-2"
            />
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-3">
          {/* Asset Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground whitespace-nowrap">Type:</span>
            <Select
              value={filters.assetType}
              onValueChange={(value) => onFilterChange('assetType', value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assets</SelectItem>
                <SelectItem value="videos">Videos Only</SelectItem>
                <SelectItem value="images">Images Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stage Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground whitespace-nowrap">Stage:</span>
            <Select
              value={filters.stage}
              onValueChange={(value) => onFilterChange('stage', value)}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {stages.map((stage) => (
                  <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Performance Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground whitespace-nowrap">Performance:</span>
            <Select
              value={filters.performance}
              onValueChange={(value) => onFilterChange('performance', value)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Performance</SelectItem>
                {performanceLabels.map((label) => (
                  <SelectItem key={label} value={label}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Aspect Ratio Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground whitespace-nowrap">Aspect:</span>
            <Select
              value={filters.aspect}
              onValueChange={(value) => onFilterChange('aspect', value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Aspects</SelectItem>
                {aspects.map((aspect) => (
                  <SelectItem key={aspect} value={aspect}>
                    {aspect === "16:9" ? "16:9 (Landscape)" :
                     aspect === "9:16" ? "9:16 (Portrait)" :
                     aspect === "1:1" ? "1:1 (Square)" :
                     aspect === "4:5" ? "4:5 (Instagram)" : aspect}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground whitespace-nowrap">Date:</span>
            <Select
              value={filters.dateRange}
              onValueChange={(value) => onFilterChange('dateRange', value)}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="custom" disabled>Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear All Button */}
          {activeFilterCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear All
            </Button>
          )}
        </div>

        {/* Active Filters Summary */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {activeFilters.map((filter, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="flex items-center gap-1 text-xs"
              >
                {formatFilterLabel(filter.key, filter.value)}
                <button
                  onClick={() => onFilterChange(filter.key as keyof typeof filters, filter.key === 'searchQuery' ? '' : 'all')}
                  className="hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5 ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};