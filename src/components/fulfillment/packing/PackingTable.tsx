import { PackingOrder, PackingSortConfig } from "@/lib/fulfillment/packingManager";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowUpDown, ArrowUp, ArrowDown, Eye, Edit3, Info, LayoutGrid, List, MoreHorizontal, X, Filter } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { ProductCell } from "./ProductCell";
import { StatusPill } from "./StatusPill";
import { ImagePreviewModal } from "./ImagePreviewModal";
import { ColumnVisibilityControl, useColumnVisibility } from "./ColumnVisibility";
import { useToast } from "@/hooks/use-toast";

interface PackingTableProps {
  orders: PackingOrder[];
  sort: PackingSortConfig;
  onSortChange: (sort: PackingSortConfig) => void;
  selectedOrders: Set<string>;
  onSelectionChange: (selection: Set<string>) => void;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onStatusChange: (id: string, status: PackingOrder['status']) => void;
}

export function PackingTable({ 
  orders, 
  sort, 
  onSortChange, 
  selectedOrders, 
  onSelectionChange,
  currentPage,
  pageSize,
  totalPages,
  total,
  onPageChange,
  onPageSizeChange,
  onStatusChange
}: PackingTableProps) {
  const { toast } = useToast();
  const [columnVisibility, setColumnVisibility] = useColumnVisibility();
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [modalIndex, setModalIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<string | null>(null);
  
  // Persistence for UI state
  const [density, setDensity] = useState(() => {
    try {
      return localStorage.getItem('ordersTable.density') || 'normal';
    } catch {
      return 'normal';
    }
  });
  
  const [currentPageSize, setCurrentPageSize] = useState(() => {
    try {
      const saved = localStorage.getItem('ordersTable.pageSize');
      return saved ? parseInt(saved) : 1000;
    } catch {
      return 1000;
    }
  });

  // Update localStorage when state changes
  useEffect(() => {
    try {
      localStorage.setItem('ordersTable.density', density);
    } catch {}
  }, [density]);

  useEffect(() => {
    try {
      localStorage.setItem('ordersTable.pageSize', currentPageSize.toString());
    } catch {}
  }, [currentPageSize]);

  // Responsive column visibility based on screen size  
  const responsiveColumns = useMemo(() => {
    const baseColumns = { ...columnVisibility };
    
    // Auto-hide columns on smaller screens to prevent horizontal scroll
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 1536) {
        baseColumns.engrValue = false;
        baseColumns.sku = false;
      }
      if (window.innerWidth < 1280) {
        baseColumns.polaroids = false;
        baseColumns.packer = false;
      }
    }
    
    return baseColumns;
  }, [columnVisibility]);

  // Sync currentPageSize with props
  useEffect(() => {
    if (currentPageSize !== pageSize) {
      onPageSizeChange(currentPageSize);
    }
  }, [currentPageSize, pageSize, onPageSizeChange]);

  const compactView = density === 'compact';
  
  const handleSort = (field: keyof PackingOrder) => {
    const direction = sort.field === field && sort.direction === 'asc' ? 'desc' : 'asc';
    onSortChange({ field, direction });
  };
  
  const getSortIcon = (field: keyof PackingOrder) => {
    if (sort.field !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sort.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(new Set(orders.map(o => o.id)));
    } else {
      onSelectionChange(new Set());
    }
  };
  
  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelection = new Set(selectedOrders);
    if (checked) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    onSelectionChange(newSelection);
  };
  
  const openModal = (src: string, alt: string) => {
    setModalImages([src]);
    setModalIndex(0);
    setModalOpen(true);
  };

  const openModalWithImages = (images: string[], index = 0) => {
    const validImages = images.filter(img => img && img.trim() && img.toLowerCase() !== 'missing photo');
    if (validImages.length > 0) {
      setModalImages(validImages);
      setModalIndex(index);
      setModalOpen(true);
    }
  };

  const handleStatusChange = async (id: string, newStatus: PackingOrder['status']) => {
    const prevOrder = orders.find(o => o.id === id);
    if (!prevOrder || prevOrder.status === newStatus) return;

    // Optimistic update
    setPendingStatusUpdate(id);
    
    try {
      await onStatusChange(id, newStatus);
      toast({
        title: "Status Updated",
        description: `Order status changed to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update order status",
        variant: "destructive",
      });
    } finally {
      setPendingStatusUpdate(null);
    }
  };
  
  const allSelected = orders.length > 0 && orders.every(o => selectedOrders.has(o.id));
  const someSelected = orders.some(o => selectedOrders.has(o.id));
  
  if (orders.length === 0) {
    return (
      <Card className="rounded-none">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No orders to display</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <TooltipProvider>
      {/* Sticky Top Controls Bar */}
      <div className="sticky top-16 z-30 bg-[hsl(var(--background))]/95 backdrop-blur-sm border-b border-[hsl(var(--line))] px-4 py-3 mb-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Density Control */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--muted)] mr-2">Density:</span>
            <Button
              variant={density === 'normal' ? "default" : "outline"}
              size="sm"
              onClick={() => setDensity('normal')}
              className="h-8 px-3"
            >
              Normal
            </Button>
            <Button
              variant={density === 'compact' ? "default" : "outline"}
              size="sm"
              onClick={() => setDensity('compact')}
              className="h-8 px-3"
            >
              Compact
            </Button>
          </div>
          
          {/* Center: Rows per page */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--muted)]">Rows per page:</span>
            <Select 
              value={currentPageSize.toString()} 
              onValueChange={(value) => {
                const newSize = value === 'all' ? total : parseInt(value);
                setCurrentPageSize(newSize);
                onPageSizeChange(newSize);
              }}
            >
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="250">250</SelectItem>
                <SelectItem value="500">500</SelectItem>
                <SelectItem value="1000">1000</SelectItem>
                <SelectItem value="2000">2000</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Right: Controls */}
          <div className="flex items-center gap-2">
            <ColumnVisibilityControl 
              visibility={columnVisibility}
              onVisibilityChange={setColumnVisibility}
            />
            <span className="text-sm text-[var(--muted)] ml-2">
              Showing {orders.length} of {total}
            </span>
          </div>
        </div>
      </div>

      <Card style={{ backgroundColor: 'hsl(var(--card))' }}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full table-fixed border-collapse text-sm">
              <colgroup>
                <col style={{ width: '3.14rem' }} /> {/* 44px */}
                <col style={{ width: '9.14rem' }} /> {/* 128px */}
                <col style={{ width: 'clamp(18.57rem, 30vw, 28.57rem)' }} /> {/* clamp(260px, 30vw, 400px) */}
                <col style={{ width: '6.86rem' }} /> {/* 96px */}
                {responsiveColumns.polaroids && <col style={{ width: '6.86rem' }} />} {/* 96px */}
                <col style={{ width: '7.43rem' }} /> {/* 104px */}
                {responsiveColumns.engrValue && <col style={{ width: '10rem' }} />} {/* 140px */}
                <col style={{ width: '8rem' }} /> {/* 112px */}
                {responsiveColumns.packer && <col style={{ width: '6.86rem' }} />} {/* 96px */}
                {responsiveColumns.sku && <col style={{ width: '8rem' }} />} {/* 112px */}
                <col style={{ width: '4.57rem' }} /> {/* 64px */}
                <col style={{ width: '6.29rem' }} /> {/* 88px */}
              </colgroup>
              
              <TableHeader className="sticky top-0 z-20 bg-[hsl(var(--background))]/95 backdrop-blur-sm border-b border-[hsl(var(--line))]">
                <TableRow className="h-11">
                  <TableHead className="px-2 py-2 align-middle text-sm font-medium">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      className={someSelected && !allSelected ? "data-[state=checked]:bg-primary/50" : ""}
                    />
                  </TableHead>
                  <TableHead className="px-2 py-2 align-middle text-sm font-medium min-w-0">
                    <Button variant="ghost" onClick={() => handleSort('orderNumber')} className="p-0 h-auto font-medium text-xs whitespace-nowrap">
                      Order# <span className="ml-1">{getSortIcon('orderNumber')}</span>
                    </Button>
                  </TableHead>
                  <TableHead className="px-2 py-2 align-middle text-sm font-medium min-w-0">
                    <Button variant="ghost" onClick={() => handleSort('productName')} className="p-0 h-auto font-medium text-xs whitespace-nowrap truncate">
                      Product <span className="ml-1">{getSortIcon('productName')}</span>
                    </Button>
                  </TableHead>
                  <TableHead className="px-2 py-2 align-middle text-sm font-medium text-center min-w-0">Photo</TableHead>
                  {responsiveColumns.polaroids && (
                    <TableHead className="px-2 py-2 align-middle text-sm font-medium text-center min-w-0">Polaroids</TableHead>
                  )}
                  <TableHead className="px-2 py-2 align-middle text-sm font-medium min-w-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" onClick={() => handleSort('backEngravingType')} className="p-0 h-auto font-medium text-xs whitespace-nowrap">
                          Engr.Type <Info className="h-3 w-3 ml-1 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Back Engraving Type</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                  {responsiveColumns.engrValue && (
                    <TableHead className="px-2 py-2 align-middle text-sm font-medium min-w-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" onClick={() => handleSort('backEngravingValue')} className="p-0 h-auto font-medium text-xs whitespace-nowrap truncate" title="Engr.Value">
                            Engr.Value <Info className="h-3 w-3 ml-1 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Back Engraving Value</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableHead>
                  )}
                  <TableHead className="px-2 py-2 align-middle text-sm font-medium text-center min-w-0">
                    <Button variant="ghost" onClick={() => handleSort('status')} className="p-0 h-auto font-medium text-xs whitespace-nowrap">
                      Status <span className="ml-1">{getSortIcon('status')}</span>
                    </Button>
                  </TableHead>
                  {responsiveColumns.packer && (
                    <TableHead className="px-2 py-2 align-middle text-sm font-medium min-w-0">
                      <Button variant="ghost" onClick={() => handleSort('packer')} className="p-0 h-auto font-medium text-xs whitespace-nowrap">
                        Packer <span className="ml-1">{getSortIcon('packer')}</span>
                      </Button>
                    </TableHead>
                  )}
                  {responsiveColumns.sku && (
                    <TableHead className="px-2 py-2 align-middle text-sm font-medium min-w-0">
                      <Button variant="ghost" onClick={() => handleSort('sku')} className="p-0 h-auto font-medium text-xs whitespace-nowrap">
                        SKU <span className="ml-1">{getSortIcon('sku')}</span>
                      </Button>
                    </TableHead>
                  )}
                  <TableHead className="px-2 py-2 align-middle text-sm font-medium text-center min-w-0">
                    <Button variant="ghost" onClick={() => handleSort('quantity')} className="p-0 h-auto font-medium text-xs whitespace-nowrap">
                      Qty <span className="ml-1">{getSortIcon('quantity')}</span>
                    </Button>
                  </TableHead>
                  <TableHead className="px-2 py-2 align-middle text-sm font-medium text-right min-w-0">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order, index) => {
                  const polaroidUrls = order.polaroids?.filter(url => url && url.trim()) || [];
                  const hasMainPhoto = order.mainPhoto && order.mainPhoto !== 'Missing photo';
                  const isLoading = pendingStatusUpdate === order.id;
                  
                  return (
                     <TableRow 
                      key={order.id} 
                      className={`
                        ${compactView ? 'h-14' : 'h-16'} 
                        ${index % 2 === 0 ? 'bg-[hsl(var(--background))]' : 'bg-[hsl(var(--card))]/50'} 
                        hover:bg-[hsl(var(--card))]/80 transition-all duration-200
                      `}
                    >
                      <TableCell className="px-2 py-2 align-middle min-w-0">
                        <Checkbox
                          checked={selectedOrders.has(order.id)}
                          onCheckedChange={(checked) => handleSelectRow(order.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="px-2 py-2 align-middle font-mono font-semibold text-xs min-w-0 whitespace-nowrap truncate" title={order.orderNumber}>
                        {order.orderNumber}
                      </TableCell>
                      <TableCell className="px-2 py-2 align-middle min-w-0">
                        <ProductCell order={order} onClick={openModal} />
                      </TableCell>
                      <TableCell className="px-2 py-2 align-middle text-center min-w-0">
                        {hasMainPhoto ? (
                          <button
                            onClick={() => openModal(order.mainPhoto!, `${order.productName} main photo`)}
                            className="relative w-10 h-10 rounded overflow-hidden ring-1 ring-[var(--line)] focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 hover:scale-105"
                            aria-label="Open image preview"
                          >
                            <img 
                              src={order.mainPhoto} 
                              alt={`${order.productName} main photo`} 
                              className="w-full h-full object-cover" 
                            />
                          </button>
                        ) : (
                          <div className="w-10 h-10 rounded bg-[var(--line)] flex items-center justify-center">
                            <span className="text-[var(--muted)] text-xs">No</span>
                          </div>
                        )}
                      </TableCell>
                      {responsiveColumns.polaroids && (
                        <TableCell className="px-2 py-2 align-middle text-center min-w-0">
                          {polaroidUrls.length > 0 ? (
                            <div className="flex gap-1 justify-center">
                              {polaroidUrls.slice(0, 2).map((url, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => openModalWithImages(polaroidUrls, idx)}
                                  className="relative w-7 h-7 rounded overflow-hidden ring-1 ring-[var(--line)] focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 hover:scale-105"
                                  aria-label={`Open polaroid ${idx + 1} preview`}
                                >
                                  <img 
                                    src={url} 
                                    alt={`Polaroid ${idx + 1}`} 
                                    className="w-full h-full object-cover" 
                                  />
                                </button>
                              ))}
                              {polaroidUrls.length > 2 && (
                                <div className="w-7 h-7 rounded bg-[var(--line)] flex items-center justify-center">
                                  <span className="text-[var(--muted)] text-xs">+{polaroidUrls.length - 2}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[var(--muted)] text-xs">-</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="px-2 py-2 align-middle text-sm min-w-0 whitespace-nowrap truncate" title={order.backEngravingType}>
                        {order.backEngravingType}
                      </TableCell>
                      {responsiveColumns.engrValue && (
                        <TableCell className="px-2 py-2 align-middle text-sm min-w-0 whitespace-nowrap truncate" title={order.backEngravingValue}>
                          {order.backEngravingValue?.startsWith('http') && order.backEngravingValue.length > 20
                            ? `${new URL(order.backEngravingValue).hostname}…`
                            : order.backEngravingValue
                          }
                        </TableCell>
                      )}
                      <TableCell className="px-2 py-2 align-middle text-center min-w-0">
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleStatusChange(order.id, value as PackingOrder['status'])}
                          disabled={isLoading}
                        >
                          <SelectTrigger className="h-6 w-20 border-0 bg-transparent p-0 focus:ring-0">
                            <StatusPill status={order.status} isLoading={isLoading} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="packed">Packed</SelectItem>
                            <SelectItem value="dispute">Dispute</SelectItem>
                            <SelectItem value="invalid">Invalid</SelectItem>
                            <SelectItem value="missing-photo">Missing Photo</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      {responsiveColumns.packer && (
                        <TableCell className="px-2 py-2 align-middle text-sm min-w-0 whitespace-nowrap truncate" title={order.packer}>
                          {order.packer || '-'}
                        </TableCell>
                      )}
                      {responsiveColumns.sku && (
                        <TableCell className="px-2 py-2 align-middle text-sm min-w-0 whitespace-nowrap truncate" title={order.sku}>
                          {order.sku}
                        </TableCell>
                      )}
                      <TableCell className="px-2 py-2 align-middle text-center font-semibold min-w-0">
                        {order.quantity}
                      </TableCell>
                      <TableCell className="px-2 py-2 align-middle text-right min-w-0">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Bottom pagination (simplified for navigation only) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center px-2 py-4">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="h-8 w-8 p-0"
            >
              <ArrowDown className="h-4 w-4 rotate-90" />
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (page > totalPages) return null;
                return (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onPageChange(page)}
                    className="h-8 w-8 p-0 text-xs"
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="h-8 w-8 p-0"
            >
              <ArrowUp className="h-4 w-4 rotate-90" />
            </Button>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        images={modalImages}
        currentIndex={modalIndex}
        onIndexChange={setModalIndex}
      />
    </TooltipProvider>
  );
}