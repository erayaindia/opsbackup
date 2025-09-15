import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VendorsTable } from '@/components/vendors/VendorsTable';
import { AddVendorDialog } from '@/components/vendors/AddVendorDialog';
import { useVendors, Vendor } from '@/hooks/useSuppliers';
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

export default function Vendors() {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: vendors = [], isLoading: loading, error } = useVendors();

  // Filter vendors based on search term
  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.gstin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contact_phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    // TODO: Open edit dialog/modal
    console.log('Edit vendor:', vendor);
  };

  const handleAddVendor = () => {
    setIsAddDialogOpen(true);
  };

  const handleVendorAdded = () => {
    // Refresh vendors list - useVendors handles this automatically with React Query
  };

  const handleExportCSV = () => {
    // Create CSV headers
    const headers = [
      'Vendor Name',
      'GSTIN',
      'Contact Person',
      'Email',
      'Phone',
      'Status',
      'Payment Terms',
      'Address',
      'City',
      'State',
      'Country',
      'Postal Code',
      'Created Date'
    ];

    // Create CSV content
    const csvData = filteredVendors.map(vendor => [
      vendor.name,
      vendor.gstin || '',
      vendor.contact_person || '',
      vendor.contact_email || '',
      vendor.contact_phone || '',
      vendor.status,
      vendor.payment_terms || '',
      vendor.address || '',
      vendor.city || '',
      vendor.state || '',
      vendor.country || '',
      vendor.postal_code || '',
      vendor.created_at
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
      link.setAttribute('download', `vendors_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast.success(`Exported ${filteredVendors.length} vendors to CSV`);
  };

  // Calculate stats
  const stats = {
    total: vendors.length,
    active: vendors.filter(v => v.status === 'active').length,
    inactive: vendors.filter(v => v.status === 'inactive').length,
    withGSTIN: vendors.filter(v => v.gstin && v.gstin.trim() !== '').length,
    withPaymentTerms: vendors.filter(v => v.payment_terms && v.payment_terms.trim() !== '').length,
    totalCities: new Set(vendors.map(v => v.city).filter(city => city)).size
  };

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Vendors Management</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-destructive">
              <p>Error loading vendors: {error.message || 'Unknown error'}</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
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
        <h1 className="text-3xl font-bold">Vendors Management</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.location.reload()} disabled={loading}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportCSV} disabled={loading || vendors.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleAddVendor}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Vendors</div>
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
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
            <div className="text-sm text-muted-foreground">Inactive</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.withGSTIN}</div>
            <div className="text-sm text-muted-foreground">With GSTIN</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.withPaymentTerms}</div>
            <div className="text-sm text-muted-foreground">With Payment Terms</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.totalCities}</div>
            <div className="text-sm text-muted-foreground">Cities</div>
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
                placeholder="Search vendors by name, GSTIN, contact, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {filteredVendors.length} of {vendors.length} vendors
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vendors Table */}
      <Card>
        <CardContent className="p-0">
          <VendorsTable
            vendors={filteredVendors}
            onEdit={handleEdit}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Add Vendor Dialog */}
      <AddVendorDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onVendorAdded={handleVendorAdded}
      />
    </div>
  );
}