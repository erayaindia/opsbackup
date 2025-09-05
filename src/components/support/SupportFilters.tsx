import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, LayoutGrid, List } from "lucide-react";
import type { TicketStatus, TicketPriority } from "@/hooks/useEnhancedSupportTickets";

interface SupportFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: TicketStatus | 'all';
  setStatusFilter: (status: TicketStatus | 'all') => void;
  priorityFilter: TicketPriority | 'all';
  setPriorityFilter: (priority: TicketPriority | 'all') => void;
  tabFilter: 'all' | 'new' | 'open' | 'waiting' | 'solved';
  setTabFilter: (tab: 'all' | 'new' | 'open' | 'waiting' | 'solved') => void;
  viewMode: 'table' | 'cards';
  setViewMode: (mode: 'table' | 'cards') => void;
  resultCount: number;
  totalCount: number;
}

export function SupportFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  tabFilter,
  setTabFilter,
  viewMode,
  setViewMode,
  resultCount,
  totalCount
}: SupportFiltersProps) {
  const tabs = [
    { key: 'all', label: 'All', count: totalCount },
    { key: 'new', label: 'New', count: 0 },
    { key: 'open', label: 'Open', count: 0 },
    { key: 'waiting', label: 'Waiting', count: 0 },
    { key: 'solved', label: 'Solved', count: 0 },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Tab Filters */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            variant={tabFilter === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => setTabFilter(tab.key)}
            className="h-9"
          >
            {tab.label}
            {tab.key === 'all' && (
              <Badge variant="secondary" className="ml-2 h-5 text-xs">
                {totalCount}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Search and Filters Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="waiting">Waiting</SelectItem>
              <SelectItem value="solved">Solved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View Toggle and Results */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {resultCount} of {totalCount} tickets
          </span>
          
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-8 px-2"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="h-8 px-2"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}