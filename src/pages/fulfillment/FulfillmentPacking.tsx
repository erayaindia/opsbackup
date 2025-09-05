import { useState, useEffect, useMemo, useCallback } from "react";
import { FulfillmentHeader } from "@/components/fulfillment/FulfillmentHeader";
import { PackingFileUpload } from "@/components/fulfillment/packing/PackingFileUpload";
import { PackingTable } from "@/components/fulfillment/packing/PackingTable";
import { PackingControls } from "@/components/fulfillment/packing/PackingControls";
import { PackingStats } from "@/components/fulfillment/packing/PackingStats";
import { packingManager, PackingOrder, PackingFilters, PackingSortConfig } from "@/lib/fulfillment/packingManager";
import { Card, CardContent } from "@/components/ui/card";

export default function FulfillmentPacking() {
  const [orders, setOrders] = useState<PackingOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasData, setHasData] = useState(false);
  
  // Filters and pagination
  const [filters, setFilters] = useState<PackingFilters>({
    search: '',
    status: 'all',
    packer: 'all',
    sku: 'all'
  });
  const [sort, setSort] = useState<PackingSortConfig>({ field: 'orderNumber', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  // Load saved state on mount
  useEffect(() => {
    const savedFilters = localStorage.getItem('packing-filters');
    const savedSort = localStorage.getItem('packing-sort');
    const savedPageSize = localStorage.getItem('packing-page-size');
    
    if (savedFilters) {
      try {
        setFilters(JSON.parse(savedFilters));
      } catch (e) {
        console.error('Failed to parse saved filters');
      }
    }
    
    if (savedSort) {
      try {
        setSort(JSON.parse(savedSort));
      } catch (e) {
        console.error('Failed to parse saved sort');
      }
    }
    
    if (savedPageSize) {
      setPageSize(parseInt(savedPageSize));
    }
    
    // Check if we have existing data
    const allOrders = packingManager.getAllOrders();
    setHasData(allOrders.length > 0);
    
    // Subscribe to changes
    const unsubscribe = packingManager.subscribe(() => {
      const updatedOrders = packingManager.getAllOrders();
      setHasData(updatedOrders.length > 0);
      // Clear selection when data changes
      setSelectedOrders(new Set());
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  // Save filter/sort state when they change
  useEffect(() => {
    localStorage.setItem('packing-filters', JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    localStorage.setItem('packing-sort', JSON.stringify(sort));
  }, [sort]);

  useEffect(() => {
    localStorage.setItem('packing-page-size', pageSize.toString());
  }, [pageSize]);

  // Get paginated and filtered data
  const { orders: paginatedOrders, total, totalPages } = useMemo(() => {
    return packingManager.getOrders(filters, sort, currentPage, pageSize);
  }, [filters, sort, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sort, pageSize]);

  const stats = useMemo(() => packingManager.getStats(), [paginatedOrders]);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    try {
      const newOrders = await packingManager.parseFile(file);
      packingManager.addOrders(newOrders);
      setHasData(true);
    } catch (error) {
      console.error('Failed to process file:', error);
      // TODO: Show error toast
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = () => {
    packingManager.clearAllOrders();
    setHasData(false);
    setSelectedOrders(new Set());
  };

  const handleBulkAction = (action: string, packer?: string) => {
    const orderIds = Array.from(selectedOrders);
    
    switch (action) {
      case 'mark-packed':
        packingManager.bulkUpdateStatus(orderIds, 'packed', packer);
        break;
      case 'mark-dispute':
        packingManager.bulkUpdateStatus(orderIds, 'dispute');
        break;
      case 'mark-pending':
        packingManager.bulkUpdateStatus(orderIds, 'pending');
        break;
    }
    
    setSelectedOrders(new Set());
  };

  const handleExport = () => {
    const filteredOrders = packingManager.getOrders(filters, sort, 1, 999999).orders;
    const csv = packingManager.exportToCSV(filteredOrders);
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = packingManager.getExportFilename('packing-orders');
    a.click();
    URL.revokeObjectURL(url);
  };

  const uniqueValues = useMemo(() => ({
    packers: packingManager.getUniqueValues('packer'),
    skus: packingManager.getUniqueValues('sku'),
    variants: packingManager.getUniqueValues('variant')
  }), [paginatedOrders]);

  if (!hasData) {
    return (
      <div className="h-full">
        <FulfillmentHeader
          title="Packing"
          breadcrumbs={[{ label: "Packing" }]}
        />
        
        <div className="p-4">
          <Card className="enhanced-card">
            <CardContent className="p-6">
              <PackingFileUpload
                onFileUpload={handleFileUpload}
                loading={loading}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <FulfillmentHeader
        title="Packing"
        breadcrumbs={[{ label: "Packing" }]}
      />
      
      <div className="flex-1 p-4 space-y-4 overflow-auto">
        <PackingStats stats={stats} />
        
        <PackingControls
          filters={filters}
          onFiltersChange={setFilters}
          uniqueValues={uniqueValues}
          selectedCount={selectedOrders.size}
          onBulkAction={handleBulkAction}
          onExport={handleExport}
          onClearData={handleClearData}
          onAddFile={() => {
            // Trigger file upload dialog
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.csv,.xlsx,.xls';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) handleFileUpload(file);
            };
            input.click();
          }}
          filteredCount={total}
          totalCount={packingManager.getAllOrders().length}
        />
        
        <PackingTable
          orders={paginatedOrders}
          sort={sort}
          onSortChange={setSort}
          selectedOrders={selectedOrders}
          onSelectionChange={setSelectedOrders}
          currentPage={currentPage}
          pageSize={pageSize}
          totalPages={totalPages}
          total={total}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          onStatusChange={(id, status) => 
            packingManager.updateOrderStatus(id, status)
          }
        />
      </div>
    </div>
  );
}