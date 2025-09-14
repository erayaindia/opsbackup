import React, { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import Fuse from 'fuse.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ArrowRight,
  Package,
  Clock,
  Activity,
  ArrowLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  CalendarIcon,
  X
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

interface MovementData {
  id: string;
  inventory_detail_id: string;
  movement_type: string;
  quantity: number;
  unit_cost?: number;
  occurred_at: string;
  notes?: string;
  reason?: string;
  reference_type?: string;
  performed_by?: string;
  user_name?: string;
  product_name?: string;
  sku?: string;
  warehouse_location?: string;
}

const movementTypeIcons = {
  IN: <TrendingUp className="h-4 w-4 text-green-600" />,
  OUT: <TrendingDown className="h-4 w-4 text-red-600" />,
  ADJUST: <RefreshCw className="h-4 w-4 text-blue-600" />,
  TRANSFER: <ArrowRight className="h-4 w-4 text-orange-600" />,
};

const movementTypeColors = {
  IN: "bg-green-100 text-green-800 border-green-300",
  OUT: "bg-red-100 text-red-800 border-red-300",
  ADJUST: "bg-blue-100 text-blue-800 border-blue-300",
  TRANSFER: "bg-orange-100 text-orange-800 border-orange-300",
};

export default function InventoryHistory() {
  const navigate = useNavigate();
  const [movements, setMovements] = useState<MovementData[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and filter states like inventory page
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['all']);
  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>(['all']);
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const fetchMovements = async () => {
    setLoading(true);
    try {
      // Simple direct query with manual join
      const { data: logs, error: logsError } = await supabase
        .from('inventory_logs')
        .select(`
          id,
          inventory_detail_id,
          movement_type,
          quantity,
          unit_cost,
          occurred_at,
          notes,
          reason,
          reference_type,
          performed_by
        `)
        .order('occurred_at', { ascending: false })
        .limit(100);

      if (logsError) throw logsError;

      if (!logs || logs.length === 0) {
        setMovements([]);
        return;
      }

      // Get unique inventory detail IDs and user IDs
      const inventoryIds = [...new Set(logs.map(log => log.inventory_detail_id))];
      const userIds = [...new Set(logs.map(log => log.performed_by).filter(Boolean))];

      // Fetch inventory details
      const { data: inventoryDetails, error: detailsError } = await supabase
        .from('inventory_details')
        .select('id, product_name, sku, warehouse_location')
        .in('id', inventoryIds);

      if (detailsError) throw detailsError;

      // Test direct query for the specific user ID we see in the UI
      const testUserId = '384c0dad-f79b-44cb-a752-3b289902fa9e';
      const { data: testUser, error: testError } = await supabase
        .from('app_users')
        .select('auth_user_id, full_name, company_email')
        .eq('auth_user_id', testUserId)
        .single();

      console.log('Test query for specific user:', testUserId);
      console.log('Test result:', testUser, testError);

      // Fetch user details from app_users table first
      const { data: appUsers, error: appUsersError } = await supabase
        .from('app_users')
        .select('auth_user_id, full_name, company_email')
        .in('auth_user_id', userIds);

      if (appUsersError) {
        console.warn('Error fetching app_users:', appUsersError);
      }

      // Also fetch from auth users table as fallback
      const { data: authUsers, error: authUsersError } = await supabase
        .from('users')
        .select('id, email, raw_user_meta_data')
        .in('id', userIds);

      if (authUsersError) {
        console.warn('Error fetching auth users:', authUsersError);
      }

      console.log('User IDs from logs (performed_by):', userIds);
      console.log('App users found:', appUsers?.length || 0, appUsers);
      console.log('Auth users found:', authUsers?.length || 0, authUsers);

      // Create lookup maps
      const detailsMap = new Map();
      inventoryDetails?.forEach(detail => {
        detailsMap.set(detail.id, detail);
      });

      // Create combined user lookup map
      const usersMap = new Map();

      // First, add app_users (preferred source for names)
      appUsers?.forEach(user => {
        usersMap.set(user.auth_user_id, {
          full_name: user.full_name,
          email: user.company_email,
          source: 'app_users'
        });
      });

      // Then add auth users as fallback for any missing entries
      authUsers?.forEach(user => {
        if (!usersMap.has(user.id)) {
          const displayName = user.email?.split('@')[0] || 'Unknown';
          usersMap.set(user.id, {
            full_name: displayName,
            email: user.email,
            source: 'auth_users'
          });
        }
      });

      console.log('Combined users map created:', usersMap.size, 'entries');
      console.log('User map contents:', Array.from(usersMap.entries()));

      // Combine data
      const combinedMovements: MovementData[] = logs.map(log => {
        const detail = detailsMap.get(log.inventory_detail_id);
        const user = usersMap.get(log.performed_by);

        console.log(`Log ${log.id}: performed_by=${log.performed_by}, user found:`, user);

        // Determine display name based on what we found
        let displayName = 'System';
        if (log.performed_by) {
          if (user?.full_name) {
            displayName = user.full_name;
          } else {
            displayName = `Unknown User (${log.performed_by.substring(0, 8)})`;
          }
        }

        return {
          ...log,
          product_name: detail?.product_name || `Unknown Product (${log.inventory_detail_id?.substring(0, 8)})`,
          sku: detail?.sku || 'UNKNOWN',
          warehouse_location: detail?.warehouse_location || 'Unknown Warehouse',
          user_name: displayName
        };
      });

      // Group movements by time and inventory_detail_id to handle duplicates
      // Keep the entry with the most information (notes, reason, etc.)
      const movementGroups = new Map();

      combinedMovements.forEach(movement => {
        const timeKey = new Date(movement.occurred_at).getTime();
        const groupKey = `${movement.inventory_detail_id}-${movement.movement_type}-${movement.quantity}-${Math.floor(timeKey / 10000)}`; // Group within 10 seconds

        const existing = movementGroups.get(groupKey);
        if (!existing ||
            (movement.notes && !existing.notes) ||
            (movement.reason && !existing.reason) ||
            (movement.reference_type && !existing.reference_type)) {
          movementGroups.set(groupKey, movement);
        }
      });

      const filteredMovements = Array.from(movementGroups.values())
        .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());

      setMovements(filteredMovements);
    } catch (error) {
      console.error('Error fetching movements:', error);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, []);

  // Filtering and search logic like inventory page
  const filteredData = useMemo(() => {
    let filtered = movements;

    // Date filtering
    if (selectedDate) {
      const selectedDateString = format(selectedDate, 'yyyy-MM-dd');
      filtered = filtered.filter(item => {
        const itemDate = format(new Date(item.occurred_at), 'yyyy-MM-dd');
        return itemDate === selectedDateString;
      });
    }

    // Product filtering
    if (selectedProduct !== 'all') {
      filtered = filtered.filter(item => item.product_name === selectedProduct);
    }

    // Search functionality
    if (searchTerm) {
      const fuse = new Fuse(filtered, {
        keys: [
          { name: 'product_name', weight: 0.4 },
          { name: 'sku', weight: 0.3 },
          { name: 'movement_type', weight: 0.2 },
          { name: 'notes', weight: 0.1 }
        ],
        threshold: 0.3,
        includeScore: true
      });

      const results = fuse.search(searchTerm);
      filtered = results.map(result => result.item);
    }

    // Filter by movement types
    if (!selectedTypes.includes('all')) {
      filtered = filtered.filter(item => selectedTypes.includes(item.movement_type));
    }

    // Filter by warehouses
    if (!selectedWarehouses.includes('all')) {
      filtered = filtered.filter(item => selectedWarehouses.includes(item.warehouse_location || ''));
    }

    // Sorting
    if (sortField) {
      filtered.sort((a, b) => {
        let aVal: any = '';
        let bVal: any = '';

        switch (sortField) {
          case 'product_name':
            aVal = a.product_name?.toLowerCase() || '';
            bVal = b.product_name?.toLowerCase() || '';
            break;
          case 'movement_type':
            aVal = a.movement_type;
            bVal = b.movement_type;
            break;
          case 'quantity':
            aVal = a.quantity || 0;
            bVal = b.quantity || 0;
            break;
          case 'occurred_at':
            aVal = new Date(a.occurred_at);
            bVal = new Date(b.occurred_at);
            break;
          case 'warehouse_location':
            aVal = a.warehouse_location?.toLowerCase() || '';
            bVal = b.warehouse_location?.toLowerCase() || '';
            break;
          default:
            return 0;
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [movements, searchTerm, selectedDate, selectedProduct, selectedTypes, selectedWarehouses, sortField, sortDirection]);

  // Sorting functions like inventory page
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    }
    return sortDirection === 'asc' ?
      <ArrowUp className="h-3 w-3 text-primary" /> :
      <ArrowDown className="h-3 w-3 text-primary" />;
  };

  // Get unique values for filters
  const uniqueProducts = [...new Set(movements.map(m => m.product_name).filter(Boolean))].sort();
  const uniqueTypes = [...new Set(movements.map(m => m.movement_type))];
  const uniqueWarehouses = [...new Set(movements.map(m => m.warehouse_location).filter(Boolean))];

  // Calculate summary statistics from filtered data
  const summary = {
    totalIn: filteredData
      .filter(m => m.movement_type === 'IN')
      .reduce((sum, m) => sum + m.quantity, 0),
    totalOut: filteredData
      .filter(m => m.movement_type === 'OUT')
      .reduce((sum, m) => sum + m.quantity, 0),
    adjustments: filteredData
      .filter(m => m.movement_type === 'ADJUST')
      .length,
    transfers: filteredData
      .filter(m => m.movement_type === 'TRANSFER')
      .length,
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Inventory Movement History
          </h1>
          <p className="text-muted-foreground">
            Complete history of all inventory movements ({filteredData.length} of {movements.length} movements)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/inventory')}
            className="rounded-none"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inventory
          </Button>

          <Button
            onClick={fetchMovements}
            variant="outline"
            className="rounded-none"
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <RefreshCw className="h-12 w-12 mx-auto animate-spin text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Loading movement history...</h3>
          <p className="text-muted-foreground">Fetching inventory movement data</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="rounded-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Stock In
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{summary.totalIn}</div>
                <p className="text-sm text-muted-foreground mt-1">Total units received</p>
              </CardContent>
            </Card>

            <Card className="rounded-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  Stock Out
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{summary.totalOut}</div>
                <p className="text-sm text-muted-foreground mt-1">Total units dispatched</p>
              </CardContent>
            </Card>

            <Card className="rounded-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-blue-600" />
                  Adjustments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{summary.adjustments}</div>
                <p className="text-sm text-muted-foreground mt-1">Inventory adjustments</p>
              </CardContent>
            </Card>

            <Card className="rounded-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-orange-600" />
                  Transfers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{summary.transfers}</div>
                <p className="text-sm text-muted-foreground mt-1">Location transfers</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters like inventory page */}
          <Card className="mb-6 rounded-none">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[250px]">
                  <Input
                    placeholder="Search products, SKU, movement type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-4 rounded-none h-10 w-full"
                  />
                </div>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[240px] justify-start text-left font-normal rounded-none h-10"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Filter by date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-none" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      className="rounded-none"
                    />
                    {selectedDate && (
                      <div className="p-3 border-t">
                        <Button
                          variant="outline"
                          onClick={() => setSelectedDate(undefined)}
                          className="w-full rounded-none"
                          size="sm"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Clear Date
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>

                <Select
                  value={selectedProduct}
                  onValueChange={(value) => setSelectedProduct(value)}
                >
                  <SelectTrigger className="w-[220px] rounded-none h-10">
                    <SelectValue placeholder="Select Product" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none max-h-[200px] overflow-y-auto">
                    <SelectItem value="all">All Products</SelectItem>
                    {uniqueProducts.map(product => (
                      <SelectItem key={product} value={product}>
                        {product}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedTypes.includes('all') ? 'all' : selectedTypes[0]}
                  onValueChange={(value) => setSelectedTypes(value === 'all' ? ['all'] : [value])}
                >
                  <SelectTrigger className="w-[180px] rounded-none h-10">
                    <SelectValue placeholder="Movement Type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="all">All Types</SelectItem>
                    {uniqueTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedWarehouses.includes('all') ? 'all' : selectedWarehouses[0]}
                  onValueChange={(value) => setSelectedWarehouses(value === 'all' ? ['all'] : [value])}
                >
                  <SelectTrigger className="w-[180px] rounded-none h-10">
                    <SelectValue placeholder="Warehouse" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="all">All Warehouses</SelectItem>
                    {uniqueWarehouses.map(warehouse => (
                      <SelectItem key={warehouse} value={warehouse}>
                        {warehouse}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedDate(undefined);
                    setSelectedProduct('all');
                    setSelectedTypes(['all']);
                    setSelectedWarehouses(['all']);
                    setSortField('');
                  }}
                  className="rounded-none h-10"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Movements Table */}
          {filteredData.length === 0 ? (
            <Card className="rounded-none">
              <CardContent className="text-center py-16">
                <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No movements found</h3>
                <p className="text-muted-foreground mb-4">
                  {movements.length === 0
                    ? "No stock movements have been recorded yet."
                    : "No movements match your current filters. Try adjusting your search criteria."
                  }
                </p>
                <Button
                  onClick={() => navigate('/inventory')}
                  className="rounded-none"
                >
                  Go to Inventory
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-none">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead
                          className="w-[140px] cursor-pointer hover:bg-muted/50 transition-colors text-center"
                          onClick={() => handleSort('occurred_at')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Date & Time</span>
                            {getSortIcon('occurred_at')}
                          </div>
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50 transition-colors text-center"
                          onClick={() => handleSort('product_name')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Product</span>
                            {getSortIcon('product_name')}
                          </div>
                        </TableHead>
                        <TableHead
                          className="w-[100px] cursor-pointer hover:bg-muted/50 transition-colors text-center"
                          onClick={() => handleSort('movement_type')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Type</span>
                            {getSortIcon('movement_type')}
                          </div>
                        </TableHead>
                        <TableHead
                          className="w-[100px] cursor-pointer hover:bg-muted/50 transition-colors text-center"
                          onClick={() => handleSort('quantity')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Quantity</span>
                            {getSortIcon('quantity')}
                          </div>
                        </TableHead>
                        <TableHead
                          className="w-[140px] cursor-pointer hover:bg-muted/50 transition-colors text-center"
                          onClick={() => handleSort('warehouse_location')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Warehouse</span>
                            {getSortIcon('warehouse_location')}
                          </div>
                        </TableHead>
                        <TableHead className="w-[120px] text-center">Reference</TableHead>
                        <TableHead className="w-[140px] text-center">Mover</TableHead>
                        <TableHead className="text-center">Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((movement) => (
                        <TableRow key={movement.id}>
                          <TableCell className="text-center border-r border-border/50">
                            <div className="text-sm">
                              <div className="font-medium">
                                {format(new Date(movement.occurred_at), 'MMM dd, yyyy')}
                              </div>
                              <div className="text-muted-foreground">
                                {format(new Date(movement.occurred_at), 'HH:mm')}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="text-center border-r border-border/50">
                            <div className="text-sm">
                              <div className="font-medium">
                                {movement.product_name}
                              </div>
                              <div className="text-muted-foreground">
                                SKU: {movement.sku}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="text-center border-r border-border/50">
                            <div className="flex justify-center">
                              <Badge
                                variant="outline"
                                className={`${movementTypeColors[movement.movement_type as keyof typeof movementTypeColors] || 'bg-gray-100 text-gray-800'} flex items-center gap-1 w-fit rounded-none`}
                              >
                                {movementTypeIcons[movement.movement_type as keyof typeof movementTypeIcons]}
                                {movement.movement_type}
                              </Badge>
                            </div>
                          </TableCell>

                          <TableCell className="text-center border-r border-border/50">
                            <span className={`font-medium ${
                              movement.movement_type === 'IN' ? 'text-green-600' :
                              movement.movement_type === 'OUT' ? 'text-red-600' :
                              'text-blue-600'
                            }`}>
                              {movement.movement_type === 'IN' ? '+' :
                               movement.movement_type === 'OUT' ? '-' : '±'}
                              {movement.quantity}
                            </span>
                          </TableCell>

                          <TableCell className="text-center border-r border-border/50">
                            <div className="text-sm">
                              <div className="font-medium">{movement.warehouse_location}</div>
                            </div>
                          </TableCell>

                          <TableCell className="text-center border-r border-border/50">
                            {movement.reference_type ? (
                              <div className="text-sm">
                                <div className="font-medium capitalize">{movement.reference_type.replace('_', ' ')}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>

                          <TableCell className="text-center border-r border-border/50">
                            <div className="text-sm">
                              <div className="font-medium">
                                {movement.user_name || 'System'}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="text-center">
                            {movement.notes || movement.reason ? (
                              <span className="text-sm">{movement.notes || movement.reason}</span>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}