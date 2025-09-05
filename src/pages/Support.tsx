import { useState } from "react";
import { useEnhancedSupportTickets } from "@/hooks/useEnhancedSupportTickets";
import { SupportKPICards } from "@/components/support/SupportKPICards";
import { SupportFilters } from "@/components/support/SupportFilters";
import { SupportTableView } from "@/components/support/SupportTableView";
import { SupportCardView } from "@/components/support/SupportCardView";
import { SupportTicketDrawer } from "@/components/support/SupportTicketDrawer";
import { BulkActions } from "@/components/support/BulkActions";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import type { SupportTicket, TicketStatus, TicketPriority } from "@/hooks/useEnhancedSupportTickets";

export default function Support() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');
  const [tabFilter, setTabFilter] = useState<'all' | 'new' | 'open' | 'waiting' | 'solved'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);

  const {
    tickets,
    loading,
    totalCount,
    actualTotalCount,
    updateTicket,
    kpis,
    pagination
  } = useEnhancedSupportTickets({
    searchQuery,
    statusFilter,
    priorityFilter,
    tabFilter,
    page: currentPage,
    pageSize: 50
  });

  const handleViewTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setDrawerOpen(true);
  };

  const handleUpdateTicket = (ticketId: string, updates: Partial<SupportTicket>) => {
    updateTicket(ticketId, updates);
  };

  const handleBulkUpdate = (updates: Partial<SupportTicket>) => {
    selectedTickets.forEach(ticketId => {
      updateTicket(ticketId, updates);
    });
    setSelectedTickets([]);
  };

  const handleClearSelection = () => {
    setSelectedTickets([]);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Generate pagination items
  const getPaginationItems = () => {
    const items = [];
    const { totalPages } = pagination;
    const current = currentPage;
    
    // Always show first page
    if (totalPages > 1) {
      items.push(1);
    }
    
    // Add ellipsis and current page area if needed
    if (current > 3 && totalPages > 5) {
      items.push('...');
    }
    
    // Add pages around current
    for (let i = Math.max(2, current - 1); i <= Math.min(totalPages - 1, current + 1); i++) {
      if (!items.includes(i)) {
        items.push(i);
      }
    }
    
    // Add ellipsis before last page if needed
    if (current < totalPages - 2 && totalPages > 5) {
      items.push('...');
    }
    
    // Always show last page
    if (totalPages > 1 && !items.includes(totalPages)) {
      items.push(totalPages);
    }
    
    return items;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Support Tickets</h1>
      </div>

      {/* Sticky KPI Cards */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-4">
        <SupportKPICards kpis={kpis} />
      </div>

      {/* Filters */}
      <SupportFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        tabFilter={tabFilter}
        setTabFilter={setTabFilter}
        viewMode={viewMode}
        setViewMode={setViewMode}
        resultCount={totalCount}
        totalCount={actualTotalCount}
      />

      {/* Bulk Actions */}
      <BulkActions
        selectedCount={selectedTickets.length}
        onBulkUpdate={handleBulkUpdate}
        onClearSelection={handleClearSelection}
      />

      {/* Content */}
      {viewMode === 'table' ? (
        <SupportTableView
          tickets={tickets}
          loading={loading}
          onUpdateTicket={handleUpdateTicket}
          onViewTicket={handleViewTicket}
          onBulkUpdate={handleBulkUpdate}
          selectedTickets={selectedTickets}
          onSelectTickets={setSelectedTickets}
        />
      ) : (
        <SupportCardView
          tickets={tickets}
          loading={loading}
          onViewTicket={handleViewTicket}
        />
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => pagination.hasPreviousPage && handlePageChange(currentPage - 1)}
                  className={pagination.hasPreviousPage ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
                />
              </PaginationItem>
              
              {getPaginationItems().map((item, index) => (
                <PaginationItem key={index}>
                  {item === '...' ? (
                    <span className="px-3 py-2">...</span>
                  ) : (
                    <PaginationLink
                      onClick={() => handlePageChange(item as number)}
                      isActive={currentPage === item}
                      className="cursor-pointer"
                    >
                      {item}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => pagination.hasNextPage && handlePageChange(currentPage + 1)}
                  className={pagination.hasNextPage ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Ticket Details Drawer */}
      <SupportTicketDrawer
        ticket={selectedTicket}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onUpdateTicket={handleUpdateTicket}
      />
    </div>
  );
}