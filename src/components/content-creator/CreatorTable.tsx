import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BaseTable,
  TableHeader as SharedTableHeader,
  TablePagination,
  TableExport,
  useTableState,
  type ExportColumn
} from '@/components/shared/tables';
import { Search, Star, Filter, Plus, Users, Zap, DollarSign, Edit, MoreHorizontal, ExternalLink } from 'lucide-react';
import { ContentCreator, CreatorFilters, CreatorView, CreatorRole, CreatorStatus, CreatorAvailability } from '@/types/contentCreator';

interface CreatorTableProps {
  creators: ContentCreator[];
  onCreatorSelect: (creator: ContentCreator) => void;
  onAddCreator: () => void;
  onEditCreator: (creator: ContentCreator) => void;
}

const CREATOR_VIEWS: { value: CreatorView; label: string; icon: any; description: string }[] = [
  { value: 'All Creators', label: 'All Creators', icon: Users, description: 'View all content creators' },
  { value: 'Active Only', label: 'Active Only', icon: Zap, description: 'Only active creators' },
  { value: 'Available Now', label: 'Available Now', icon: Star, description: 'Creators with free availability' },
  { value: 'By Role', label: 'By Role', icon: Filter, description: 'Group by creator role' },
  { value: 'Top Rated', label: 'Top Rated', icon: Star, description: 'Highest rated creators' },
];

const CREATOR_ROLES: CreatorRole[] = [
  'Videographer', 'Editor', 'UGC Creator', 'Influencer', 'Agency', 'Model',
  'Designer', 'Photographer', 'Copywriter', 'Voice Actor', 'Animator'
];

const getStatusColor = (status: CreatorStatus) => {
  switch (status) {
    case 'Active': return 'bg-green-100 text-green-800';
    case 'Onboarding': return 'bg-blue-100 text-blue-800';
    case 'Paused': return 'bg-yellow-100 text-yellow-800';
    case 'Rejected': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getAvailabilityColor = (availability: CreatorAvailability) => {
  switch (availability) {
    case 'Free': return 'bg-green-100 text-green-800';
    case 'Limited': return 'bg-yellow-100 text-yellow-800';
    case 'Busy': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const CreatorTable: React.FC<CreatorTableProps> = ({
  creators,
  onCreatorSelect,
  onAddCreator,
  onEditCreator,
}) => {
  const [filters, setFilters] = useState<CreatorFilters>({
    role: 'All',
    status: 'All',
    availability: 'All',
    minRating: 0,
    searchQuery: '',
  });

  const [currentView, setCurrentView] = useState<CreatorView>('All Creators');

  // Filter creators based on current filters
  const filteredCreators = creators.filter((creator) => {
    // Search query filter
    if (filters.searchQuery) {
      const searchTerm = filters.searchQuery.toLowerCase();
      const matchesSearch =
        creator.name.toLowerCase().includes(searchTerm) ||
        creator.role.toLowerCase().includes(searchTerm) ||
        creator.email.toLowerCase().includes(searchTerm) ||
        creator.location.toLowerCase().includes(searchTerm) ||
        (creator.shippingAddress?.state && creator.shippingAddress.state.toLowerCase().includes(searchTerm));
      if (!matchesSearch) return false;
    }

    // Role filter
    if (filters.role !== 'All' && creator.role !== filters.role) return false;

    // Status filter  
    if (filters.status !== 'All' && creator.status !== filters.status) return false;

    // Availability filter
    if (filters.availability !== 'All' && creator.availability !== filters.availability) return false;

    // Rating filter
    if (creator.rating < filters.minRating) return false;

    return true;
  });

  // Apply view-based filtering
  const viewFilteredCreators = filteredCreators.filter((creator) => {
    switch (currentView) {
      case 'Active Only':
        return creator.status === 'Active';
      case 'Available Now':
        return creator.availability === 'Free' && creator.status === 'Active';
      case 'Top Rated':
        return creator.rating >= 8;
      case 'By Role':
      case 'All Creators':
      default:
        return true;
    }
  });

  // Sort creators
  const sortedCreators = [...viewFilteredCreators].sort((a, b) => {
    if (currentView === 'Top Rated') {
      return b.rating - a.rating;
    }
    return a.name.localeCompare(b.name);
  });

  // Define export columns for CSV export
  const exportColumns: ExportColumn[] = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role' },
    { key: 'status', header: 'Status' },
    { key: 'availability', header: 'Availability' },
    { key: 'rating', header: 'Rating' },
    {
      key: 'location',
      header: 'State',
      transform: (creator) => creator.shippingAddress?.state || creator.location
    },
    {
      key: 'rateCard',
      header: 'Base Rate',
      transform: (rateCard) => `${rateCard.currency} ${rateCard.baseRate} per ${rateCard.unit}`
    }
  ];

  // Initialize table state for pagination
  const tableState = useTableState({
    data: sortedCreators,
    defaultSortField: 'name',
    defaultSortDirection: 'asc',
    searchFields: ['name', 'email', 'role', 'location', 'state'],
    filterConfig: {}
  });

  const handleFilterChange = (key: keyof CreatorFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      role: 'All',
      status: 'All', 
      availability: 'All',
      minRating: 0,
      searchQuery: '',
    });
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'searchQuery') return value.trim() !== '';
    if (key === 'minRating') return value > 0;
    return value !== 'All';
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Content Creators</h1>
          <p className="text-muted-foreground">
            Manage your content creator network and assignments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => window.open('/creator-onboard', '_blank')}
            variant="outline"
            className="flex items-center gap-2 rounded-none"
          >
            <ExternalLink className="h-4 w-4" />
            Creator Onboard
          </Button>
          <Button onClick={onAddCreator} className="flex items-center gap-2 rounded-none">
            <Plus className="h-4 w-4" />
            Add Creator
          </Button>
          <TableExport
            data={sortedCreators}
            columns={exportColumns}
            filename={`creators_export_${new Date().toISOString().split('T')[0]}.csv`}
            className="rounded-none"
          />
        </div>
      </div>


      {/* Filters */}
      <Card className="rounded-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filters</CardTitle>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="rounded-none">
                Clear All ({activeFiltersCount})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar and Filter Dropdowns in one row */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search Bar */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                type="search"
                placeholder="Search by name, role, email, state..."
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                className="rounded-none"
              />
            </div>

            {/* Role Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select
                value={filters.role}
                onValueChange={(value) => handleFilterChange('role', value)}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="All">All Roles</SelectItem>
                  {CREATOR_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Onboarding">Onboarding</SelectItem>
                  <SelectItem value="Paused">Paused</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Availability Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Availability</label>
              <Select
                value={filters.availability}
                onValueChange={(value) => handleFilterChange('availability', value)}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="All">All Availability</SelectItem>
                  <SelectItem value="Free">Free</SelectItem>
                  <SelectItem value="Limited">Limited</SelectItem>
                  <SelectItem value="Busy">Busy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rating Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Min Rating</label>
              <Select
                value={filters.minRating.toString()}
                onValueChange={(value) => handleFilterChange('minRating', parseInt(value))}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="0">Any Rating</SelectItem>
                  <SelectItem value="7">7+ Stars</SelectItem>
                  <SelectItem value="8">8+ Stars</SelectItem>
                  <SelectItem value="9">9+ Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {tableState.startIndex}-{tableState.endIndex} of {tableState.filteredData.length} creators
          {currentView !== 'All Creators' && (
            <Badge variant="outline" className="ml-2 rounded-none">
              {currentView}
            </Badge>
          )}
        </span>
      </div>

      {/* Table */}
      <BaseTable className="rounded-none">
          <TableHeader>
            <TableRow>
              <TableHead>Creator</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Charge</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="hidden md:table-cell">State</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableState.paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <Users className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">No creators found</p>
                      <p className="text-sm text-muted-foreground">
                        {activeFiltersCount > 0 
                          ? 'Try adjusting your filters or search query'
                          : 'Add your first content creator to get started'
                        }
                      </p>
                    </div>
                    <Button onClick={onAddCreator} size="sm" className="rounded-none">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Creator
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              tableState.paginatedData.map((creator) => (
                <TableRow
                  key={creator.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onCreatorSelect(creator)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={creator.profilePicture} alt={creator.name} />
                        <AvatarFallback>
                          {creator.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{creator.name}</div>
                        <div className="text-sm text-muted-foreground">{creator.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-none">{creator.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${getStatusColor(creator.status)} rounded-none`}>
                      {creator.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        {creator.rateCard.currency} {creator.rateCard.baseRate.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {creator.rateCard.unit}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${getAvailabilityColor(creator.availability)} rounded-none`}>
                      {creator.availability}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="font-medium">{creator.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {creator.shippingAddress?.state || creator.location}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-none h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditCreator(creator);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
      </BaseTable>

      {/* Pagination */}
      <TablePagination
        currentPage={tableState.currentPage}
        totalPages={tableState.totalPages}
        itemsPerPage={tableState.itemsPerPage}
        totalItems={tableState.filteredData.length}
        onPageChange={tableState.setCurrentPage}
        onItemsPerPageChange={tableState.setItemsPerPage}
        startIndex={tableState.startIndex}
        endIndex={tableState.endIndex}
        className="rounded-none"
      />
    </div>
  );
};