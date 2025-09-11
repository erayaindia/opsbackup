import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Building,
  Search,
  Plus,
  RefreshCw,
  XCircle,
  Grid3X3,
  List,
  Download
} from "lucide-react";

import { useWarehouses } from '@/hooks/useWarehouses';
import { WarehouseTable } from '@/components/warehouse/WarehouseTable';
import { WarehouseDialog } from '@/components/warehouse/WarehouseDialog';

const Warehouse: React.FC = () => {
  const { 
    warehouses, 
    loading, 
    error, 
    actions 
  } = useWarehouses();

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Filter warehouses based on search and filters
  const filteredWarehouses = useMemo(() => {
    return warehouses.filter(warehouse => {
      const matchesSearch = searchTerm === '' || 
        warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        warehouse.code.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && warehouse.active) ||
        (statusFilter === 'inactive' && !warehouse.active);

      return matchesSearch && matchesStatus;
    });
  }, [warehouses, searchTerm, statusFilter]);

  const handleAddWarehouse = async (warehouseData: any) => {
    setActionLoading(true);
    try {
      await actions.addWarehouse(warehouseData);
    } catch (error) {
      console.error('Error adding warehouse:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditWarehouse = (warehouse: any) => {
    setEditingWarehouse(warehouse);
    setWarehouseDialogOpen(true);
  };

  const handleUpdateWarehouse = async (warehouseData: any) => {
    if (!editingWarehouse) return;
    
    setActionLoading(true);
    try {
      await actions.updateWarehouse(editingWarehouse.id, warehouseData);
    } catch (error) {
      console.error('Error updating warehouse:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setWarehouseDialogOpen(false);
    setEditingWarehouse(null);
  };

  if (error) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="bg-destructive/15 border border-destructive/20 rounded-lg p-6 text-center">
          <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Warehouses</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => actions.refreshWarehouses()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          Warehouse Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your warehouse locations, capacity, and details
        </p>
      </div>

      {/* Status Tabs and Filters */}
      <div className="bg-card rounded-xl border p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Tabs */}
          <div className="flex gap-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'active'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'inactive'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              Inactive
            </button>
          </div>

          {/* Search */}
          <div className="flex-1 min-w-0 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search warehouses by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-border h-10"
              />
            </div>
          </div>
          
          {/* Filter Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="border-0 h-10 w-10 p-0"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="border-0 h-10 w-10 p-0"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
            </div>

            <Button
              onClick={() => actions.refreshWarehouses()}
              variant="outline"
              size="sm"
              disabled={loading}
              className="border-0 bg-muted/50 h-10"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>

            <Button 
              onClick={() => setWarehouseDialogOpen(true)}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-10"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Warehouse
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="border-0 bg-muted/50 h-10"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Warehouses Table */}
      <div className="bg-card rounded-xl border">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Warehouses ({filteredWarehouses.length})</h3>
          </div>
        </div>

        {/* Table Content */}
        <div className="p-0">
          {viewMode === 'table' ? (
            <WarehouseTable
              warehouses={filteredWarehouses}
              onEdit={handleEditWarehouse}
              loading={loading}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Grid view coming soon...
            </div>
          )}
        </div>
      </div>

      {/* Warehouse Dialog */}
      <WarehouseDialog
        open={warehouseDialogOpen}
        onOpenChange={handleCloseDialog}
        warehouse={editingWarehouse}
        onSave={editingWarehouse ? handleUpdateWarehouse : handleAddWarehouse}
        loading={actionLoading}
      />
    </div>
  );
};

export default Warehouse;