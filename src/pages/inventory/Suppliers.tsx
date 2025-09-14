import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SuppliersTable } from '@/components/suppliers/SuppliersTable';
import { AddSupplierDialog } from '@/components/suppliers/AddSupplierDialog';
import { useSuppliers, Supplier } from '@/hooks/useSuppliers';
import { 
  Download, 
  BarChart3, 
  Building, 
  Plus,
  Search,
  Star,
  Clock,
  DollarSign,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

export default function Suppliers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { suppliers, loading, error, actions } = useSuppliers();

  // Filter suppliers based on search term
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    // TODO: Open edit dialog/modal
    console.log('Edit supplier:', supplier);
  };

  const handleAddSupplier = () => {
    setIsAddDialogOpen(true);
  };

  const handleSupplierAdded = () => {
    actions.refreshSuppliers();
  };

  const handleExportCSV = () => {
    // Create CSV headers
    const headers = [
      'Supplier Name',
      'Code',
      'Contact Person',
      'Email',
      'Phone',
      'Status',
      'Lead Time (Days)',
      'Min Order Value',
      'Rating',
      'Payment Terms',
      'Tax ID',
      'Created Date',
      'Notes'
    ];

    // Create CSV content
    const csvData = filteredSuppliers.map(supplier => [
      supplier.name,
      supplier.code || '',
      supplier.contact_person || '',
      supplier.email || '',
      supplier.phone || '',
      supplier.status,
      supplier.lead_time_days,
      supplier.minimum_order_value || '',
      supplier.rating || '',
      supplier.payment_terms || '',
      supplier.tax_id || '',
      supplier.created_at,
      supplier.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `suppliers_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast.success(`Exported ${filteredSuppliers.length} suppliers to CSV`);
  };

  // Calculate stats
  const stats = {
    total: suppliers.length,
    active: suppliers.filter(s => s.status === 'active').length,
    pending: suppliers.filter(s => s.status === 'pending').length,
    blocked: suppliers.filter(s => s.status === 'blocked').length,
    avgRating: suppliers.reduce((sum, s) => sum + (s.rating || 0), 0) / suppliers.filter(s => s.rating).length || 0,
    avgLeadTime: suppliers.reduce((sum, s) => sum + s.lead_time_days, 0) / suppliers.length || 0
  };

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Suppliers Management</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-destructive">
              <p>Error loading suppliers: {error}</p>
              <Button onClick={actions.refreshSuppliers} className="mt-4">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Suppliers Management</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={actions.refreshSuppliers} disabled={loading}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportCSV} disabled={loading || suppliers.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleAddSupplier}>
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Suppliers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-muted-foreground">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.blocked}</div>
            <div className="text-sm text-muted-foreground">Blocked</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {stats.avgRating.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">Avg Rating</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {Math.round(stats.avgLeadTime)}
            </div>
            <div className="text-sm text-muted-foreground">Avg Lead Time</div>
          </CardContent>
        </Card>
      </div>

      {/* Search Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search suppliers by name, code, contact, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {filteredSuppliers.length} of {suppliers.length} suppliers
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardContent className="p-0">
          <SuppliersTable
            suppliers={filteredSuppliers}
            onEdit={handleEdit}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Add Supplier Dialog */}
      <AddSupplierDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSupplierAdded={handleSupplierAdded}
        onAddSupplier={actions.addSupplier}
      />
    </div>
  );
}