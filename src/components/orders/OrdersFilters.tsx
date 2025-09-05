import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Calendar as CalendarIcon, 
  Filter,
  X
} from 'lucide-react';
import { DateFilter } from '@/hooks/useShopifyOrders';
import { format } from 'date-fns';
import { DayPicker, DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

interface OrdersFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  dateFilter: DateFilter;
  onDateFilterChange: (filter: DateFilter) => void;
  customDateRange?: { start: Date; end: Date };
  onCustomDateRangeChange: (range: { start: Date; end: Date } | undefined) => void;
}

export function OrdersFilters({
  searchTerm,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  customDateRange,
  onCustomDateRangeChange
}: OrdersFiltersProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(
    customDateRange ? { from: customDateRange.start, to: customDateRange.end } : undefined
  );

  const dateFilterOptions = [
    { value: 'today' as const, label: 'Today' },
    { value: 'yesterday' as const, label: 'Yesterday' },
    { value: 'last7days' as const, label: 'Last 7 Days' },
    { value: 'last30days' as const, label: 'Last 30 Days' },
    { value: 'custom' as const, label: 'Custom Range' }
  ];

  const handleDateFilterClick = (filter: DateFilter) => {
    if (filter === 'custom') {
      setIsCalendarOpen(true);
    } else {
      onDateFilterChange(filter);
      onCustomDateRangeChange(undefined);
    }
  };

  const handleCustomDateRangeApply = () => {
    if (tempDateRange?.from && tempDateRange?.to) {
      onCustomDateRangeChange({ start: tempDateRange.from, end: tempDateRange.to });
      onDateFilterChange('custom');
      setIsCalendarOpen(false);
    }
  };

  const handleCustomDateRangeReset = () => {
    setTempDateRange(undefined);
    onCustomDateRangeChange(undefined);
    onDateFilterChange('last30days');
    setIsCalendarOpen(false);
  };

  const getActiveFilterLabel = () => {
    if (dateFilter === 'custom' && customDateRange) {
      return `${format(customDateRange.start, 'MMM d')} - ${format(customDateRange.end, 'MMM d')}`;
    }
    return dateFilterOptions.find(option => option.value === dateFilter)?.label || 'Last 30 Days';
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {/* Top Row: Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Bar - Reduced width */}
            <div className="w-full sm:w-80">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order ID, email, or name"
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
            </div>

            {/* Date Filters - Responsive layout */}
            <div className="flex flex-wrap gap-2 sm:ml-auto">
              {dateFilterOptions.slice(0, -1).map((option) => (
                <Button
                  key={option.value}
                  variant={dateFilter === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleDateFilterClick(option.value)}
                  className="flex-shrink-0"
                >
                  {option.label}
                </Button>
              ))}

              {/* Custom Date Range with Single Calendar */}
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={dateFilter === 'custom' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleDateFilterClick('custom')}
                    className="flex-shrink-0"
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Custom Range
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <div className="p-4 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select Date Range</label>
                      <DayPicker
                        mode="range"
                        defaultMonth={tempDateRange?.from}
                        selected={tempDateRange}
                        onSelect={setTempDateRange}
                        numberOfMonths={2}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCustomDateRangeApply}
                        disabled={!tempDateRange?.from || !tempDateRange?.to}
                        size="sm"
                        className="flex-1"
                      >
                        Apply Range
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCustomDateRangeReset}
                        size="sm"
                        className="flex-1"
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Active Filters Display */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Active filters:</span>
            <Badge variant="secondary" className="flex items-center gap-1">
              {getActiveFilterLabel()}
              {dateFilter === 'custom' && (
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={handleCustomDateRangeReset}
                />
              )}
            </Badge>
            {searchTerm && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: "{searchTerm}"
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => onSearchChange('')}
                />
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}