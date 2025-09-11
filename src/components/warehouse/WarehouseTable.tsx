import React, { useState } from 'react';
import { Warehouse } from '@/hooks/useWarehouses';
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
import { 
  Edit,
  Building,
  MapPin,
  Users,
  Package,
  ChevronDown,
  ChevronRight,
  Calendar,
  Hash
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WarehouseTableProps {
  warehouses: Warehouse[];
  onEdit: (warehouse: Warehouse) => void;
  loading?: boolean;
}

export const WarehouseTable: React.FC<WarehouseTableProps> = ({
  warehouses,
  onEdit,
  loading = false
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRowExpansion = (warehouseId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(warehouseId)) {
        newSet.delete(warehouseId);
      } else {
        newSet.add(warehouseId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAddress = (address: Record<string, any> | null | undefined) => {
    if (!address) return 'No address';
    
    const parts = [
      address.street,
      address.city,
      address.state,
      address.postal_code
    ].filter(Boolean);
    
    return parts.join(', ') || 'No address';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-muted-foreground">Loading warehouses...</div>
      </div>
    );
  }

  if (warehouses.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No warehouses found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border/50">
            <TableHead className="border-r border-border/50 w-10"></TableHead>
            <TableHead className="border-r border-border/50">Warehouse</TableHead>
            <TableHead className="border-r border-border/50">Code</TableHead>
            <TableHead className="border-r border-border/50">Address</TableHead>
            <TableHead className="border-r border-border/50">Capacity</TableHead>
            <TableHead className="border-r border-border/50">Status</TableHead>
            <TableHead className="border-r border-border/50">Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {warehouses.map((warehouse) => (
            <React.Fragment key={warehouse.id}>
              <TableRow 
                className="cursor-pointer hover:bg-muted/50 transition-colors h-12"
                onClick={() => toggleRowExpansion(warehouse.id)}
              >
                <TableCell className="border-r border-border/50 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRowExpansion(warehouse.id);
                    }}
                  >
                    {expandedRows.has(warehouse.id) ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </Button>
                </TableCell>
                
                <TableCell className="border-r border-border/50 py-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                      <Building className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{warehouse.name}</div>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="border-r border-border/50 py-2">
                  <code className="bg-muted px-2 py-1 rounded text-sm">
                    {warehouse.code}
                  </code>
                </TableCell>

                <TableCell className="border-r border-border/50 py-2">
                  <div className="flex items-center space-x-2 max-w-48">
                    <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-muted-foreground truncate" title={formatAddress(warehouse.address)}>
                      {formatAddress(warehouse.address)}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="border-r border-border/50 py-2">
                  <div className="flex items-center space-x-2">
                    <Package className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm">
                      {warehouse.capacity ? warehouse.capacity.toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="border-r border-border/50 py-2">
                  <Badge variant={warehouse.active ? "default" : "secondary"}>
                    {warehouse.active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>

                <TableCell className="border-r border-border/50 py-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {formatDate(warehouse.created_at)}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(warehouse)}
                    className="h-8 px-2"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                </TableCell>
              </TableRow>

              {/* Expanded Row Content */}
              {expandedRows.has(warehouse.id) && (
                <TableRow className="bg-muted/20">
                  <TableCell colSpan={8} className="p-0">
                    <div className="p-6 border-t border-border/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <Hash className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">Warehouse ID</div>
                              <div className="text-sm text-muted-foreground font-mono">{warehouse.id}</div>
                            </div>
                          </div>

                          {warehouse.manager_id && (
                            <div className="flex items-center space-x-3">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <div className="text-sm font-medium">Manager ID</div>
                                <div className="text-sm text-muted-foreground font-mono">{warehouse.manager_id}</div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">Full Address</div>
                              <div className="text-sm text-muted-foreground">
                                {warehouse.address ? (
                                  <div className="space-y-1">
                                    {warehouse.address.street && <div>{warehouse.address.street}</div>}
                                    <div>
                                      {[warehouse.address.city, warehouse.address.state].filter(Boolean).join(', ')}
                                    </div>
                                    <div>
                                      {[warehouse.address.country, warehouse.address.postal_code].filter(Boolean).join(' ')}
                                    </div>
                                  </div>
                                ) : (
                                  'No address provided'
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">Last Updated</div>
                              <div className="text-sm text-muted-foreground">{formatDate(warehouse.updated_at)}</div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <Package className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">Capacity Details</div>
                              <div className="text-sm text-muted-foreground">
                                {warehouse.capacity ? `${warehouse.capacity.toLocaleString()} units` : 'Not specified'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};