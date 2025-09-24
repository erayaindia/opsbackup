import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, AlertTriangle, Package, CheckCircle, XCircle, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Calendar, ChevronLeft, ChevronRight, ChevronDown, Download, FileText, Clock, Copy, Check, X } from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { format } from "date-fns";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  createCourierHandoverItem,
  getCourierHandoverItems,
  updateCourierHandoverItem,
  deleteCourierHandoverItem,
  bulkDeleteCourierHandoverItems,
  exportCourierHandoverItems,
  CourierHandoverItem,
  CourierHandoverFilters
} from "@/lib/courierHandover";

// Using CourierHandoverItem from lib, but creating a display interface
interface DisplayItem {
  id: string;
  orderNumber: string;
  awbNumber: string;
  courier: string;
  bagLetter?: string;
  scannedBy: string;
  timestamp: Date;
  status: string;
  isManualEntry: boolean;
}

// Convert database item to display item
const toDisplayItem = (dbItem: CourierHandoverItem): DisplayItem => ({
  id: dbItem.id,
  orderNumber: dbItem.order_number || 'N/A',
  awbNumber: dbItem.awb_number || 'N/A',
  courier: dbItem.courier,
  bagLetter: dbItem.bag_letter || undefined,
  scannedBy: 'Current User', // TODO: Get actual user name
  timestamp: new Date(dbItem.scanned_at),
  status: dbItem.status,
  isManualEntry: dbItem.is_manual_entry
});

const COURIERS = [
  "Bluedart",
  "Delhivery",
  "Xpressbees",
  "Amazon",
  "FedEx",
  "DHL",
  "DTDC",
  "Ecom Express",
  "Shiprocket"
];

const BAG_LETTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)); // A-Z

type SortField = 'orderNumber' | 'awbNumber' | 'courier' | 'bagLetter' | 'scannedBy' | 'timestamp';
type SortDirection = 'asc' | 'desc';

export default function FulfillmentCourierHandover() {
  const [selectedCourier, setSelectedCourier] = useState<string>("");
  const [selectedBagLetter, setSelectedBagLetter] = useState<string>("");
  const [batchId, setBatchId] = useState<string>("");
  const [scanValue, setScanValue] = useState<string>("");
  const [scanType, setScanType] = useState<'order_id' | 'awb'>('awb');
  const [scannedItems, setScannedItems] = useState<DisplayItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [manualOrderId, setManualOrderId] = useState<string>("");
  const [manualAwbNumber, setManualAwbNumber] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [flashFeedback, setFlashFeedback] = useState<'success' | 'error' | null>(null);
  const [showScanningSection, setShowScanningSection] = useState(false);

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateRange, setDateRange] = useState<string>("");
  const [courierFilter, setCourierFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);

  // Quick filters
  const [quickFilter, setQuickFilter] = useState<'all' | 'recent' | 'duplicates'>('all');

  // Data refresh trigger (less frequent for performance)
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Bulk select states
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const scanInputRef = useRef<HTMLInputElement>(null);

  // Fetch data from database
  const fetchCourierHandoverItems = useCallback(async () => {
    setLoading(true);
    try {
      const filters: CourierHandoverFilters = {};

      if (searchQuery) filters.search = searchQuery;
      if (dateRange) {
        if (dateRange.includes(' to ')) {
          // Range selection
          const [fromDate, toDate] = dateRange.split(' to ');
          if (fromDate) filters.date_from = fromDate;
          if (toDate) filters.date_to = toDate;
        } else {
          // Single date selection
          filters.date_from = dateRange;
          filters.date_to = dateRange;
        }
      }
      if (courierFilter !== 'all') filters.courier = courierFilter;
      if (quickFilter !== 'all') filters.quick_filter = quickFilter;

      const result = await getCourierHandoverItems({
        filters,
        page: currentPage,
        limit: itemsPerPage,
        sortBy: sortField === 'orderNumber' ? 'order_number' :
               sortField === 'awbNumber' ? 'awb_number' :
               sortField === 'bagLetter' ? 'bag_letter' :
               sortField === 'timestamp' ? 'scanned_at' : 'scanned_at',
        sortOrder: sortDirection
      });

      if (result.error) {
        console.error('Error fetching items:', result.error);
        setError(`Failed to load items: ${result.error.message}`);
      } else if (result.data) {
        const displayItems = result.data.map(toDisplayItem);
        setScannedItems(displayItems);
        setTotalItems(result.count);
      }
    } catch (error) {
      console.error('Error fetching courier handover items:', error);
      setError('Failed to load courier handover items');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, dateRange, courierFilter, quickFilter, currentPage, itemsPerPage, sortField, sortDirection, refreshTrigger]);

  // Debounced refresh to avoid too many database calls
  const debouncedRefresh = useCallback(() => {
    const timeoutId = setTimeout(() => {
      fetchCourierHandoverItems();
    }, 5000); // Refresh from database every 5 seconds at most
    return () => clearTimeout(timeoutId);
  }, [fetchCourierHandoverItems]);

  // Load data on component mount and when filters change (not on refresh trigger for scanning)
  useEffect(() => {
    fetchCourierHandoverItems();
  }, [searchQuery, dateRange, courierFilter, quickFilter, currentPage, itemsPerPage, sortField, sortDirection]);

  // Separate effect for initial load only
  useEffect(() => {
    fetchCourierHandoverItems();
  }, []);

  // Sound notification functions
  const playSuccessSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  const playErrorSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 300;
    oscillator.type = 'sawtooth';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  // Visual flash feedback
  const triggerFlashFeedback = (type: 'success' | 'error') => {
    setFlashFeedback(type);
    setTimeout(() => setFlashFeedback(null), 500);
  };

  // Keep scan input focused
  useEffect(() => {
    const interval = setInterval(() => {
      if (scanInputRef.current && selectedCourier) {
        scanInputRef.current.focus();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [selectedCourier]);

  // Focus scan input when courier is selected
  useEffect(() => {
    if (selectedCourier && scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, [selectedCourier]);

  const addScannedItem = useCallback(async (orderNumber: string, awbNumber: string, isManual: boolean = false) => {
    if (!selectedCourier) {
      setError("Please select a courier first");
      playErrorSound();
      triggerFlashFeedback('error');
      return;
    }

    if (!selectedBagLetter || selectedBagLetter === "none") {
      setError("Please select a bag letter first");
      playErrorSound();
      triggerFlashFeedback('error');
      return;
    }

    if (!orderNumber && !awbNumber) {
      setError("Please provide either Order ID or AWB number");
      playErrorSound();
      triggerFlashFeedback('error');
      return;
    }

    // Show immediate feedback BEFORE database operation
    setError("");
    playSuccessSound();
    triggerFlashFeedback('success');

    // Clear form immediately for fast UX
    if (isManual) {
      setManualOrderId("");
      setManualAwbNumber("");
      setShowManualEntry(false);
    }

    // Create optimistic UI update - add item to table immediately
    const tempItem: DisplayItem = {
      id: `temp-${Date.now()}`, // Temporary ID
      orderNumber: orderNumber || "N/A",
      awbNumber: awbNumber || "N/A",
      courier: selectedCourier,
      bagLetter: selectedBagLetter === "none" ? undefined : selectedBagLetter,
      scannedBy: "Current User",
      timestamp: new Date(),
      status: "scanned",
      isManualEntry: isManual
    };

    // Add to table immediately for instant feedback
    setScannedItems(prev => [tempItem, ...prev]);
    setTotalItems(prev => prev + 1);

    // Database operation in background (non-blocking)
    try {
      const result = await createCourierHandoverItem({
        order_number: orderNumber || undefined,
        awb_number: awbNumber || undefined,
        courier: selectedCourier,
        bag_letter: selectedBagLetter === "none" ? undefined : selectedBagLetter,
        scan_type: scanType,
        is_manual_entry: isManual
      });

      if (result.error) {
        // If database fails, remove optimistic item and show error
        setScannedItems(prev => prev.filter(item => item.id !== tempItem.id));
        setTotalItems(prev => prev - 1);
        setError(result.error.message);
        playErrorSound();
        triggerFlashFeedback('error');
        return;
      }

      // Success - replace temp item with real item (with proper ID)
      if (result.data) {
        const realItem = toDisplayItem(result.data);
        setScannedItems(prev =>
          prev.map(item => item.id === tempItem.id ? realItem : item)
        );
      }

    } catch (error) {
      // If database fails, remove optimistic item and show error
      setScannedItems(prev => prev.filter(item => item.id !== tempItem.id));
      setTotalItems(prev => prev - 1);
      console.error('Error adding scanned item:', error);
      setError('Failed to save scanned item');
      playErrorSound();
      triggerFlashFeedback('error');
    }
  }, [selectedCourier, selectedBagLetter, scanType]);

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!scanValue.trim()) return;

    const scannedValue = scanValue.trim();

    // Store in correct column based on user selection
    if (scanType === 'awb') {
      addScannedItem("", scannedValue);  // Empty order ID, store in AWB column
    } else {
      addScannedItem(scannedValue, "");  // Store in Order ID column, empty AWB
    }

    setScanValue("");
    scanInputRef.current?.focus();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addScannedItem(manualOrderId, manualAwbNumber, true);
  };

  const removeScannedItem = async (id: string) => {
    // Optimistic update - remove immediately from UI
    const itemToRemove = scannedItems.find(item => item.id === id);
    if (!itemToRemove) return;

    setScannedItems(prev => prev.filter(item => item.id !== id));
    setTotalItems(prev => prev - 1);

    // Database operation in background
    try {
      const result = await deleteCourierHandoverItem(id, true); // Hard delete
      if (result.error) {
        // If deletion fails, restore the item
        setScannedItems(prev => [itemToRemove, ...prev]);
        setTotalItems(prev => prev + 1);
        setError(`Failed to delete item: ${result.error.message}`);
      }
    } catch (error) {
      // If deletion fails, restore the item
      setScannedItems(prev => [itemToRemove, ...prev]);
      setTotalItems(prev => prev + 1);
      console.error('Error deleting item:', error);
      setError('Failed to delete item');
    }
  };

  // Remove clearAllScans as we removed the Clear All button

  // Since filtering is now done in the database, we just use the items as-is
  const filteredAndSortedItems = useMemo(() => {
    return scannedItems;
  }, [scannedItems]);

  // Paginated items (already paginated from database)
  const paginatedItems = filteredAndSortedItems;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Handle column sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get unique couriers from the predefined list (static for now)
  const uniqueCouriers = COURIERS;

  // Clear filters
  const clearFilters = () => {
    setSearchQuery("");
    setDateRange("");
    setCourierFilter("all");
    setQuickFilter("all");
    setCurrentPage(1);
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateRange, courierFilter, quickFilter]);

  // Handle bulk select
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems(new Set());
      setSelectAll(false);
    } else {
      const allItemIds = new Set(paginatedItems.map(item => item.id));
      setSelectedItems(allItemIds);
      setSelectAll(true);
    }
  };

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
    setSelectAll(newSelected.size === paginatedItems.length && paginatedItems.length > 0);
  };

  // Clear selections when page changes
  useEffect(() => {
    setSelectedItems(new Set());
    setSelectAll(false);
  }, [currentPage, filteredAndSortedItems]);


  // Bulk delete selected items
  const bulkDeleteSelected = async () => {
    if (selectedItems.size === 0) return;

    const itemIds = Array.from(selectedItems);
    const itemsToRemove = scannedItems.filter(item => selectedItems.has(item.id));

    // Optimistic update - remove immediately from UI
    setScannedItems(prev => prev.filter(item => !selectedItems.has(item.id)));
    setTotalItems(prev => prev - itemIds.length);
    setSelectedItems(new Set());
    setSelectAll(false);

    // Database operation in background
    try {
      const result = await bulkDeleteCourierHandoverItems(itemIds, true); // Hard delete

      if (result.error) {
        // If deletion fails, restore the items
        setScannedItems(prev => [...itemsToRemove, ...prev]);
        setTotalItems(prev => prev + itemIds.length);
        setError(`Failed to delete items: ${result.error.message}`);
      }
    } catch (error) {
      // If deletion fails, restore the items
      setScannedItems(prev => [...itemsToRemove, ...prev]);
      setTotalItems(prev => prev + itemIds.length);
      console.error('Error bulk deleting items:', error);
      setError('Failed to delete selected items');
    }
  };

  // Generate CSV handover summary
  const generatePDFSummary = async () => {
    setLoading(true);
    try {
      const filters: CourierHandoverFilters = {};
      if (searchQuery) filters.search = searchQuery;
      if (courierFilter !== 'all') filters.courier = courierFilter;

      const result = await exportCourierHandoverItems(filters);
      if (result.error) {
        setError(`Failed to export: ${result.error.message}`);
      } else if (result.data) {
        const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Handover_${selectedCourier}_${selectedBagLetter}_${format(new Date(), 'ddMMyyyy_HHmm')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      setError('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  // Export Manifest as PDF with two-column layout like the screenshot
  const exportManifest = () => {
    if (scannedItems.length === 0) {
      setError('No items to export');
      return;
    }

    try {
      // Group items by courier
      const groupedByCourier = scannedItems.reduce((acc, item) => {
        const courier = item.courier;
        if (!acc[courier]) {
          acc[courier] = [];
        }
        acc[courier].push(item);
        return acc;
      }, {} as Record<string, DisplayItem[]>);

      const pdf = new jsPDF();
      const courierEntries = Object.entries(groupedByCourier);
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;

      // Add main header
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('Courier Manifest', pageWidth / 2, 15, { align: 'center' });

      courierEntries.forEach(([courier, items], courierIndex) => {
        if (courierIndex > 0) {
          pdf.addPage();
        }

        const rowHeight = 8;
        const headerHeight = 50; // Space for courier header and info
        const signatureHeight = 25; // Space for signature at bottom
        const availableHeight = pageHeight - headerHeight - signatureHeight;
        const maxRowsPerPage = Math.floor(availableHeight / rowHeight) - 1; // -1 for table header
        const maxItemsPerPage = maxRowsPerPage * 2; // Two columns

        // Calculate how many pages needed for this courier
        const totalPages = Math.ceil(items.length / maxItemsPerPage);

        for (let page = 0; page < totalPages; page++) {
          if (page > 0) {
            pdf.addPage();
          }

          let startY = 30;

          // Courier header on each page
          pdf.setFontSize(12);
          pdf.setFont(undefined, 'bold');
          pdf.text(`Courier: ${courier}`, 15, startY);

          // Date and info line
          pdf.setFontSize(9);
          pdf.setFont(undefined, 'normal');
          const now = new Date();
          const bagLetters = [...new Set(items.map(item => item.bagLetter).filter(Boolean))];
          const infoLine = `Date: ${format(now, 'dd/MM/yyyy')} | Bags: ${bagLetters.join(',') || 'N/A'} | Total: ${items.length}`;
          pdf.text(infoLine, 15, startY + 8);

          // Add page info if multiple pages
          if (totalPages > 1) {
            pdf.text(`Page ${page + 1} of ${totalPages}`, pageWidth - 40, startY + 8);
          }

          startY += 20;

          // Calculate items for this page
          const startIndex = page * maxItemsPerPage;
          const endIndex = Math.min(startIndex + maxItemsPerPage, items.length);
          const pageItems = items.slice(startIndex, endIndex);

          // Table dimensions
          const leftTableX = 15;
          const rightTableX = pageWidth / 2 + 5;
          const tableWidth = 85;
          const itemsPerColumn = Math.ceil(pageItems.length / 2);

          // Draw left table
          const leftItems = pageItems.slice(0, itemsPerColumn);
          const leftStartNumber = startIndex + 1;
          drawSimpleTable(pdf, leftTableX, startY, tableWidth, rowHeight, leftItems, leftStartNumber, maxRowsPerPage);

          // Draw right table if there are remaining items
          if (pageItems.length > itemsPerColumn) {
            const rightItems = pageItems.slice(itemsPerColumn);
            const rightStartNumber = startIndex + itemsPerColumn + 1;
            drawSimpleTable(pdf, rightTableX, startY, tableWidth, rowHeight, rightItems, rightStartNumber, maxRowsPerPage);
          }

          // Signature section at bottom of every page
          const signatureY = pageHeight - 20;
          pdf.setFontSize(8);
          pdf.text('Name: ________________  Signature: ________________  Date: __________', pageWidth - 180, signatureY);
        }
      });

      // Save PDF
      const fileName = `CourierManifest_${format(new Date(), 'ddMMyyyy_HHmm')}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating manifest:', error);
      setError('Failed to generate manifest. Please try again.');
    }
  };

  // Helper function to draw simple table with fixed height for pagination
  const drawSimpleTable = (pdf: any, startX: number, startY: number, width: number, rowHeight: number, items: DisplayItem[], startNumber: number, maxRows: number) => {
    const numberColWidth = 15;
    const awbColWidth = width - numberColWidth;
    const actualRows = Math.min(items.length, maxRows);

    // Draw table border - always draw full table height for consistent layout
    pdf.rect(startX, startY, width, (maxRows + 1) * rowHeight);

    // Draw header
    pdf.setFontSize(8);
    pdf.setFont(undefined, 'bold');
    pdf.rect(startX, startY, numberColWidth, rowHeight);
    pdf.rect(startX + numberColWidth, startY, awbColWidth, rowHeight);
    pdf.text('No.', startX + numberColWidth/2, startY + 5, { align: 'center' });
    pdf.text('AWB Number', startX + numberColWidth + awbColWidth/2, startY + 5, { align: 'center' });

    // Draw all rows (filled and empty)
    pdf.setFont(undefined, 'normal');
    for (let i = 0; i < maxRows; i++) {
      const y = startY + (i + 1) * rowHeight;

      // Draw row borders
      pdf.rect(startX, y, numberColWidth, rowHeight);
      pdf.rect(startX + numberColWidth, y, awbColWidth, rowHeight);

      // Add content only if item exists
      if (i < items.length) {
        const item = items[i];
        pdf.text((startNumber + i).toString(), startX + numberColWidth/2, y + 5, { align: 'center' });
        pdf.text(item.awbNumber || '', startX + numberColWidth + 3, y + 5);
      }
    }
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* Flash feedback overlay */}
      {flashFeedback && (
        <div
          className={`
            absolute inset-0 z-50 pointer-events-none animate-pulse
            ${flashFeedback === 'success'
              ? 'bg-green-500/20 border-4 border-green-500'
              : 'bg-red-500/20 border-4 border-red-500'
            }
            transition-all duration-500 ease-out
          `}
        />
      )}

      {/* Simple Header */}
      <div className="p-4 border-b">
        <h1 className="text-2xl font-semibold">Courier Handover</h1>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-auto relative">
        {/* Compact Search & Filters - Top of page */}
        <div className="bg-muted/30 border rounded-none p-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search Order ID, AWB, Courier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-none h-8 text-xs"
              />
            </div>

            {/* Date Filter */}
            <div className="w-48">
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                placeholder="Filter by date"
                className="w-full"
              />
            </div>

            {/* Courier Filter */}
            <Select value={courierFilter} onValueChange={setCourierFilter}>
              <SelectTrigger className="rounded-none h-8 text-xs w-28">
                <SelectValue placeholder="Courier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {uniqueCouriers.map(courier => (
                  <SelectItem key={courier} value={courier}>
                    {courier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Quick Filters */}
            <div className="flex items-center gap-1">
              <Button
                variant={quickFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setQuickFilter('all')}
                className="text-xs h-8 rounded-none px-2"
              >
                All
              </Button>
              <Button
                variant={quickFilter === 'recent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setQuickFilter('recent')}
                className="text-xs h-8 rounded-none px-2"
              >
                24h
              </Button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {(searchQuery || dateRange || courierFilter !== "all" || quickFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs h-8 rounded-none px-2"
                >
                  Clear
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loading || scannedItems.length === 0}
                    className="text-xs h-8 rounded-none px-2"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Export
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-none">
                  <DropdownMenuItem
                    onClick={generatePDFSummary}
                    disabled={loading}
                    className="text-xs cursor-pointer"
                  >
                    <Download className="h-3 w-3 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={exportManifest}
                    disabled={loading || scannedItems.length === 0}
                    className="text-xs cursor-pointer"
                  >
                    <FileText className="h-3 w-3 mr-2" />
                    Export Manifest
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Scan Toggle Button and Bulk Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold">Scanned Items ({totalItems})</h2>
            </div>

          </div>

          <Button
            onClick={() => setShowScanningSection(!showScanningSection)}
            className="rounded-none"
            variant={showScanningSection ? "outline" : "default"}
          >
            {showScanningSection ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Close Scan
              </>
            ) : (
              <>
                <Package className="h-4 w-4 mr-2" />
                Scan Items
              </>
            )}
          </Button>
        </div>
        {/* Configuration Section - Only show when scanning */}
        {showScanningSection && (
          <Card className="enhanced-card rounded-none">
          <CardContent className="p-4">
            {/* All Dropdowns in One Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Courier Selector */}
              <div className="space-y-2">
                <Label htmlFor="courier">Courier Service *</Label>
                <Select value={selectedCourier} onValueChange={setSelectedCourier}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder="Select courier" />
                  </SelectTrigger>
                  <SelectContent>
                    {COURIERS.map(courier => (
                      <SelectItem key={courier} value={courier}>
                        {courier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Scan Type Selector */}
              <div className="space-y-2">
                <Label htmlFor="scanType">Scanning Type *</Label>
                <Select value={scanType} onValueChange={(value: 'order_id' | 'awb') => setScanType(value)}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="awb">AWB Number</SelectItem>
                    <SelectItem value="order_id">Order ID</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bag Letter Selector */}
              <div className="space-y-2">
                <Label htmlFor="bagLetter">Bag Letter *</Label>
                <Select value={selectedBagLetter} onValueChange={setSelectedBagLetter}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder="Select bag letter" />
                  </SelectTrigger>
                  <SelectContent>
                    {BAG_LETTERS.map(letter => (
                      <SelectItem key={letter} value={letter}>
                        Bag {letter}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

          </CardContent>
        </Card>
        )}

        {/* Scanning Section - Only show when scanning is enabled */}
        {showScanningSection && selectedCourier && selectedBagLetter && selectedBagLetter !== "none" && (
          <Card className="enhanced-card rounded-none">
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-base">Scan Packages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 py-3">
              {/* Scan Input */}
              <div className="relative max-w-md">
                <Input
                  ref={scanInputRef}
                  id="scanInput"
                  value={scanValue}
                  onChange={(e) => setScanValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScanSubmit(e as any)}
                  placeholder={`Scan ${scanType === 'order_id' ? 'Order ID' : 'AWB'}...`}
                  className={`
                    text-xs font-mono transition-all duration-300 h-7 px-2 py-1 w-full rounded-none
                    ${flashFeedback === 'success'
                      ? 'ring-1 ring-green-500 border-green-500'
                      : flashFeedback === 'error'
                      ? 'ring-1 ring-red-500 border-red-500'
                      : 'focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
                    }
                  `}
                  autoComplete="off"
                  autoFocus
                />
                {flashFeedback && (
                  <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
                    {flashFeedback === 'success' ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-600" />
                    )}
                  </div>
                )}
                {flashFeedback && (
                  <div className={`
                    absolute inset-0 pointer-events-none
                    ${flashFeedback === 'success' ? 'bg-green-100/50' : 'bg-red-100/50'}
                    animate-ping
                  `} />
                )}
              </div>

              {/* Scan Input and Manual Entry in same line */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowManualEntry(!showManualEntry)}
                  className="text-xs rounded-none whitespace-nowrap"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Manual Entry
                </Button>
                {showManualEntry && (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={manualOrderId}
                      onChange={(e) => setManualOrderId(e.target.value)}
                      placeholder="Order ID"
                      className="rounded-none h-7 text-xs flex-1"
                    />
                    <Input
                      value={manualAwbNumber}
                      onChange={(e) => setManualAwbNumber(e.target.value)}
                      placeholder="AWB Number"
                      className="rounded-none h-7 text-xs flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        addScannedItem(manualOrderId, manualAwbNumber, true);
                      }}
                      className="rounded-none h-7 text-xs"
                    >
                      Add
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowManualEntry(false)}
                      className="rounded-none h-7 text-xs"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}


        {/* Loading State */}
        {loading && scannedItems.length === 0 && (
          <Card className="enhanced-card rounded-none">
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">Loading courier handover items...</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scanned Items Table - Always show */}
        <Card className="enhanced-card rounded-none">
          {showScanningSection && selectedCourier && (
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <Badge variant="secondary">
                  {selectedCourier} - {
                    selectedBagLetter && selectedBagLetter !== "none"
                      ? selectedBagLetter
                      : "No Bag"
                  }
                </Badge>
              </CardTitle>
            </CardHeader>
          )}
          <CardContent>
            {scannedItems.length > 0 ? (
              <div className="border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px] text-center border-r border-border">
                        <Checkbox
                          checked={selectAll}
                          onCheckedChange={handleSelectAll}
                          className="rounded-none"
                        />
                      </TableHead>
                      <TableHead className="w-[50px] text-center border-r border-border">#</TableHead>
                      <TableHead className="text-center border-r border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('orderNumber')}
                          className="h-auto p-0 font-semibold hover:bg-transparent rounded-none"
                        >
                          Order ID
                          {sortField === 'orderNumber' && (
                            sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                          )}
                          {sortField !== 'orderNumber' && <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
                        </Button>
                      </TableHead>
                      <TableHead className="text-center border-r border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('awbNumber')}
                          className="h-auto p-0 font-semibold hover:bg-transparent rounded-none"
                        >
                          AWB No.
                          {sortField === 'awbNumber' && (
                            sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                          )}
                          {sortField !== 'awbNumber' && <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
                        </Button>
                      </TableHead>
                      <TableHead className="text-center border-r border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('courier')}
                          className="h-auto p-0 font-semibold hover:bg-transparent rounded-none"
                        >
                          Courier
                          {sortField === 'courier' && (
                            sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                          )}
                          {sortField !== 'courier' && <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
                        </Button>
                      </TableHead>
                      <TableHead className="text-center border-r border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('batchId')}
                          className="h-auto p-0 font-semibold hover:bg-transparent rounded-none"
                        >
                          Bag/Batch
                          {sortField === 'batchId' && (
                            sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                          )}
                          {sortField !== 'batchId' && <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
                        </Button>
                      </TableHead>
                      <TableHead className="text-center border-r border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('scannedBy')}
                          className="h-auto p-0 font-semibold hover:bg-transparent rounded-none"
                        >
                          Scanned By
                          {sortField === 'scannedBy' && (
                            sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                          )}
                          {sortField !== 'scannedBy' && <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
                        </Button>
                      </TableHead>
                      <TableHead className="text-center border-r border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('timestamp')}
                          className="h-auto p-0 font-semibold hover:bg-transparent rounded-none"
                        >
                          Time
                          {sortField === 'timestamp' && (
                            sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                          )}
                          {sortField !== 'timestamp' && <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
                        </Button>
                      </TableHead>
                      <TableHead className="text-center border-r border-border">Status</TableHead>
                      <TableHead className="w-[50px] text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-center border-r border-border">
                          <Checkbox
                            checked={selectedItems.has(item.id)}
                            onCheckedChange={() => handleSelectItem(item.id)}
                            className="rounded-none"
                          />
                        </TableCell>
                        <TableCell className="text-center font-semibold border-r border-border">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </TableCell>
                        <TableCell className="font-mono text-center border-r border-border">
                          {item.orderNumber}
                        </TableCell>
                        <TableCell className="font-mono text-center border-r border-border">{item.awbNumber}</TableCell>
                        <TableCell className="text-center border-r border-border">
                          <Badge variant="outline">{item.courier}</Badge>
                        </TableCell>
                        <TableCell className="text-center border-r border-border">{item.bagLetter || "-"}</TableCell>
                        <TableCell className="text-center border-r border-border">{item.scannedBy}</TableCell>
                        <TableCell className="font-mono text-xs text-center border-r border-border">
                          <div className="flex flex-col items-center">
                            <span>{format(item.timestamp, "dd/MM/yyyy")}</span>
                            <span className="text-muted-foreground">
                              {item.timestamp.toLocaleTimeString('en-IN', {
                                timeZone: 'Asia/Kolkata',
                                hour12: false,
                                hour: '2-digit',
                                minute: '2-digit'
                              })} IST
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center border-r border-border">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${
                              item.status === 'scanned' ? 'bg-green-100 text-green-800' :
                              item.status === 'handed_over' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {item.status === 'scanned' ? '✅ Scanned' :
                             item.status === 'handed_over' ? '📦 Handed Over' :
                             '❌ Cancelled'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeScannedItem(item.id)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-700 rounded-none"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination Controls */}
              {scannedItems.length > 0 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Rows per page:</span>
                      <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) => {
                          setItemsPerPage(Number(value));
                          setCurrentPage(1); // Reset to first page when changing items per page
                        }}
                      >
                        <SelectTrigger className="w-20 h-8 rounded-none text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                          <SelectItem value="500">500</SelectItem>
                          <SelectItem value="1000">1000</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {/* Page navigation - only show when multiple pages */}
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="text-xs rounded-none"
                      >
                        <ChevronLeft className="h-3 w-3" />
                        Previous
                      </Button>

                      {/* Page numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className="w-8 h-8 text-xs p-0 rounded-none"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="text-xs rounded-none"
                      >
                        Next
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No items scanned yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {showScanningSection
                    ? "Configure your settings and start scanning items to see them here"
                    : "Click the 'Scan Items' button to start scanning courier handover items"}
                </p>
                {!showScanningSection && (
                  <Button
                    onClick={() => setShowScanningSection(true)}
                    className="rounded-none"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Start Scanning
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}