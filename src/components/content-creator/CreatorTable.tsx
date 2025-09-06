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
import { Search, Star, Filter, Plus, Users, Zap } from 'lucide-react';
import { ContentCreator, CreatorFilters, CreatorView, CreatorRole, CreatorStatus, CreatorCapacity } from '@/types/contentCreator';

interface CreatorTableProps {
  creators: ContentCreator[];
  onCreatorSelect: (creator: ContentCreator) => void;
  onAddCreator: () => void;
}

const CREATOR_VIEWS: { value: CreatorView; label: string; icon: any; description: string }[] = [
  { value: 'All Creators', label: 'All Creators', icon: Users, description: 'View all content creators' },
  { value: 'Active Only', label: 'Active Only', icon: Zap, description: 'Only active creators' },
  { value: 'Available Now', label: 'Available Now', icon: Star, description: 'Creators with free capacity' },
  { value: 'By Role', label: 'By Role', icon: Filter, description: 'Group by creator role' },
  { value: 'Top Rated', label: 'Top Rated', icon: Star, description: 'Highest rated creators' },
];

const CREATOR_ROLES: CreatorRole[] = [
  'Videographer', 'Editor', 'Influencer', 'Agency', 'Model', 
  'Designer', 'Photographer', 'Copywriter', 'Voice Actor', 'Animator'
];

const getStatusColor = (status: CreatorStatus) => {
  switch (status) {
    case 'Active': return 'bg-green-100 text-green-800';
    case 'Onboarding': return 'bg-blue-100 text-blue-800';
    case 'Paused': return 'bg-yellow-100 text-yellow-800';
    case 'Archived': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getCapacityColor = (capacity: CreatorCapacity) => {
  switch (capacity) {
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
}) => {
  const [filters, setFilters] = useState<CreatorFilters>({
    role: 'All',
    status: 'All',
    capacity: 'All',
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
        creator.location.toLowerCase().includes(searchTerm);
      if (!matchesSearch) return false;
    }

    // Role filter
    if (filters.role !== 'All' && creator.role !== filters.role) return false;

    // Status filter  
    if (filters.status !== 'All' && creator.status !== filters.status) return false;

    // Capacity filter
    if (filters.capacity !== 'All' && creator.capacity !== filters.capacity) return false;

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
        return creator.capacity === 'Free' && creator.status === 'Active';
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

  const handleFilterChange = (key: keyof CreatorFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      role: 'All',
      status: 'All', 
      capacity: 'All',
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
        <Button onClick={onAddCreator} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Creator
        </Button>
      </div>

      {/* Views Tabs */}
      <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as CreatorView)}>
        <TabsList className="grid w-full grid-cols-5">
          {CREATOR_VIEWS.map((view) => (
            <TabsTrigger
              key={view.value}
              value={view.value}
              className="text-xs sm:text-sm"
              title={view.description}
            >
              <view.icon className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{view.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filters</CardTitle>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All ({activeFiltersCount})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name, role, email..."
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Role Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select
                value={filters.role}
                onValueChange={(value) => handleFilterChange('role', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Onboarding">Onboarding</SelectItem>
                  <SelectItem value="Paused">Paused</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Capacity Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Capacity</label>
              <Select
                value={filters.capacity}
                onValueChange={(value) => handleFilterChange('capacity', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Capacity</SelectItem>
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
          Showing {sortedCreators.length} of {creators.length} creators
          {currentView !== 'All Creators' && (
            <Badge variant="outline" className="ml-2">
              {currentView}
            </Badge>
          )}
        </span>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Creator</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="hidden md:table-cell">Location</TableHead>
              <TableHead className="hidden lg:table-cell">Projects</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCreators.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
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
                    <Button onClick={onAddCreator} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Creator
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedCreators.map((creator) => (
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
                    <Badge variant="outline">{creator.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(creator.status)}>
                      {creator.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getCapacityColor(creator.capacity)}>
                      {creator.capacity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="font-medium">{creator.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {creator.location}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="text-sm">
                      <div className="font-medium">{creator.currentProjects.length} active</div>
                      <div className="text-muted-foreground">{creator.pastProjects.length} completed</div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};