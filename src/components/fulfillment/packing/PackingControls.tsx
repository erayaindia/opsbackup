import { Search, Filter, Download, Plus, Trash2, Package, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PackingFilters } from "@/lib/fulfillment/packingManager";

interface PackingControlsProps {
  filters: PackingFilters;
  onFiltersChange: (filters: PackingFilters) => void;
  uniqueValues: {
    packers: string[];
    skus: string[];
    variants: string[];
  };
  selectedCount: number;
  onBulkAction: (action: string, packer?: string) => void;
  onExport: () => void;
  onClearData: () => void;
  onAddFile: () => void;
  filteredCount?: number;
  totalCount?: number;
}

export function PackingControls({
  filters,
  onFiltersChange,
  uniqueValues,
  selectedCount,
  onBulkAction,
  onExport,
  onClearData,
  onAddFile,
  filteredCount,
  totalCount
}: PackingControlsProps) {
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'packed', label: 'Packed' },
    { value: 'dispute', label: 'Dispute' },
    { value: 'invalid', label: 'Invalid' },
    { value: 'missing-photo', label: 'Missing Photo' }
  ];

  const activeFiltersCount = Object.values(filters).filter(value => 
    value && value !== 'all' && value !== ''
  ).length;

  return (
    <div className="space-y-4">
      {/* Main Controls Row */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search orders, products, variants..."
              value={filters.search}
              onChange={(e) => 
                onFiltersChange({ ...filters, search: e.target.value })
              }
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <Select
              value={filters.status}
              onValueChange={(value) => 
                onFiltersChange({ ...filters, status: value })
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.packer}
              onValueChange={(value) => 
                onFiltersChange({ ...filters, packer: value })
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Packer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Packers</SelectItem>
                {uniqueValues.packers.map((packer) => (
                  <SelectItem key={packer} value={packer}>
                    {packer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.sku}
              onValueChange={(value) => 
                onFiltersChange({ ...filters, sku: value })
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="SKU" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All SKUs</SelectItem>
                {uniqueValues.skus.map((sku) => (
                  <SelectItem key={sku} value={sku}>
                    {sku}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={filters.variant || 'all'}
              onValueChange={(value) => 
                onFiltersChange({ ...filters, variant: value === 'all' ? undefined : value })
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Variant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Variants</SelectItem>
                {uniqueValues.variants.map((variant) => (
                  <SelectItem key={variant} value={variant}>
                    {variant}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => 
                  onFiltersChange({
                    search: '',
                    status: 'all',
                    packer: 'all',
                    sku: 'all'
                  })
                }
              >
                <Filter className="h-4 w-4 mr-1" />
                Clear ({activeFiltersCount})
              </Button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={onAddFile} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add File
          </Button>
          
          <Button onClick={onExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          
          <Button onClick={onClearData} variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Filter Status Indicator */}
      {activeFiltersCount > 0 && filteredCount !== undefined && totalCount !== undefined && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            Filtered: {filteredCount} of {totalCount} orders
          </Badge>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <Badge variant="secondary" className="font-medium">
            {selectedCount} selected
          </Badge>
          
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm">
                  <Package className="h-4 w-4 mr-2" />
                  Mark as Packed
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Assign to Packer</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onBulkAction('mark-packed')}>
                  No specific packer
                </DropdownMenuItem>
                {uniqueValues.packers.map((packer) => (
                  <DropdownMenuItem 
                    key={packer}
                    onClick={() => onBulkAction('mark-packed', packer)}
                  >
                    {packer}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => onBulkAction('mark-dispute')}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Mark as Dispute
            </Button>

            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onBulkAction('mark-pending')}
            >
              Mark as Pending
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}