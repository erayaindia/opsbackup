import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Checkbox
} from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users as UsersIcon,
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Eye,
  UserCheck,
  UserX,
  Building2,
  Mail,
  Phone,
  MapPin,
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Activity,
  TrendingUp,
  Settings,
  Archive,
  History,
  Calendar,
  Bell
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// User interface based on app_users table
interface User {
  id: string;
  auth_user_id: string | null;
  full_name: string;
  company_email: string;
  personal_email: string | null;
  phone: string | null;
  role: string;
  department: string | null;
  designation: string | null;
  work_location: string | null;
  employment_type: string | null;
  status: string;
  hire_date: string | null;
  reporting_to: string | null;
  employee_id: string | null;
  module_access: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Statistics and chart types
type SortField = 'full_name' | 'company_email' | 'role' | 'department' | 'status' | 'created_at';
type SortDirection = 'asc' | 'desc';

// Constants
const ROLES = ['employee', 'manager', 'admin', 'super_admin'];
const DEPARTMENTS = ['Content', 'Fulfillment', 'Support', 'Marketing', 'Finance', 'Admin', 'Ops', 'HR', 'IT'];
const STATUSES = ['active', 'inactive', 'suspended', 'on_leave'];
const WORK_LOCATIONS = ['Patna', 'Delhi', 'Remote', 'Hybrid'];
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Intern', 'Contractor'];


export const Users: React.FC = () => {
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('full_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditRoleDialog, setShowEditRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('');

  // Form states
  const [newUserForm, setNewUserForm] = useState({
    full_name: '',
    company_email: '',
    personal_email: '',
    phone: '',
    role: '',
    department: '',
    designation: '',
    work_location: '',
    employment_type: '',
    status: 'active',
    hire_date: '',
    employee_id: '',
    notes: ''
  });

  // Fetch users from app_users table
  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching users...');
      
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users: ' + error.message);
        return;
      }

      console.log('Users fetched:', data?.length || 0);
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter and search logic
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.company_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.personal_email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (user.phone?.includes(searchTerm) || false) ||
        (user.department?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (user.designation?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (user.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) || false);

      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesDepartment = departmentFilter === 'all' || user.department === departmentFilter;

      return matchesSearch && matchesStatus && matchesRole && matchesDepartment;
    });
  }, [users, searchTerm, statusFilter, roleFilter, departmentFilter]);

  // Sorting logic
  const sortedUsers = useMemo(() => {
    if (!sortField) return filteredUsers;

    return [...filteredUsers].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (aValue === null) aValue = '';
      if (bValue === null) bValue = '';
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredUsers, sortField, sortDirection]);

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.status === 'active').length;
    const inactive = users.filter(u => u.status === 'inactive').length;
    const suspended = users.filter(u => u.status === 'suspended').length;
    const onLeave = users.filter(u => u.status === 'on_leave').length;

    return {
      total,
      active,
      inactive, 
      suspended,
      onLeave
    };
  }, [users]);

  // Event handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(sortedUsers.map(user => user.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (userId: string, checked: boolean) => {
    const newSelection = new Set(selectedRows);
    if (checked) {
      newSelection.add(userId);
    } else {
      newSelection.delete(userId);
    }
    setSelectedRows(newSelection);
  };

  const handleAddUser = async () => {
    try {
      const userData = {
        full_name: newUserForm.full_name,
        company_email: newUserForm.company_email,
        personal_email: newUserForm.personal_email || null,
        phone: newUserForm.phone || null,
        role: newUserForm.role,
        department: newUserForm.department || null,
        designation: newUserForm.designation || null,
        work_location: newUserForm.work_location || null,
        employment_type: newUserForm.employment_type || null,
        status: newUserForm.status,
        hire_date: newUserForm.hire_date || null,
        employee_id: newUserForm.employee_id || null,
        notes: newUserForm.notes || null,
        module_access: []
      };

      const { error } = await supabase
        .from('app_users')
        .insert([userData]);

      if (error) {
        console.error('Error creating user:', error);
        toast.error('Failed to create user: ' + error.message);
        return;
      }

      toast.success('User created successfully');
      setShowAddUserModal(false);
      setNewUserForm({
        full_name: '',
        company_email: '',
        personal_email: '',
        phone: '',
        role: '',
        department: '',
        designation: '',
        work_location: '',
        employment_type: '',
        status: 'active',
        hire_date: '',
        employee_id: '',
        notes: ''
      });
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('app_users')
        .delete()
        .eq('id', selectedUser.id);

      if (error) {
        console.error('Error deleting user:', error);
        toast.error('Failed to delete user: ' + error.message);
        return;
      }

      toast.success('User deleted successfully');
      setShowDeleteDialog(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleEditRole = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowEditRoleDialog(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedUser || !newRole) return;

    try {
      const { error } = await supabase
        .from('app_users')
        .update({ role: newRole })
        .eq('id', selectedUser.id);

      if (error) {
        console.error('Error updating user role:', error);
        toast.error('Failed to update user role: ' + error.message);
        return;
      }

      toast.success(`Role updated to ${newRole.charAt(0).toUpperCase() + newRole.slice(1)} successfully`);
      setShowEditRoleDialog(false);
      setSelectedUser(null);
      setNewRole('');
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const getUserInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200';
      case 'on_leave': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'manager': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'employee': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full">
        {/* Header with sticky search and filters */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
          <div className="px-4 py-8 pb-6">
            {/* Page Title */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex-1 max-w-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <UsersIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-foreground leading-tight">Users Management</h1>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-muted-foreground">Real-time access control</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <UserCheck className="h-2 w-2 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span>Role-based access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <Shield className="h-2 w-2 text-green-600 dark:text-green-400" />
                    </div>
                    <span>Security management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                      <Activity className="h-2 w-2 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span>Activity tracking</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="default" 
                  className="px-6 shadow-sm"
                  onClick={fetchUsers}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>
            </div>

            {/* Advanced Search and Filters */}
            <Card className="border-0 shadow-lg rounded-2xl bg-card/50">
              <CardContent className="px-6 py-8 space-y-6">
                {/* Top Row - Search and Filters */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Search */}
                    <div className="relative flex-1 max-w-lg">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        placeholder="Search users, email, department..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 pr-4 h-12 text-base rounded-xl border-2 focus:border-primary"
                      />
                    </div>
                    
                    {/* Filters */}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40 h-12 rounded-xl border-2">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="on_leave">On Leave</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-40 h-12 rounded-xl border-2">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        {ROLES.map(role => (
                          <SelectItem key={role} value={role}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger className="w-48 h-12 rounded-xl border-2">
                        <SelectValue placeholder="Department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {DEPARTMENTS.map(dept => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedRows.size > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="px-3 py-1">
                        {selectedRows.size} selected
                      </Badge>
                      <Button variant="outline" size="sm">
                        Bulk Actions
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="px-4 pt-8 mb-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
            <Card className="border-0 shadow-lg rounded-xl p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Users</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</p>
                  <div className="flex items-center gap-1 text-sm text-blue-600">
                    <TrendingUp className="h-3 w-3" />
                    <span>+12% vs last month</span>
                  </div>
                </div>
                <UsersIcon className="h-8 w-8 text-blue-600" />
              </div>
            </Card>

            <Card className="border-0 shadow-lg rounded-xl p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Active</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.active}</p>
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <TrendingUp className="h-3 w-3" />
                    <span>+8% vs last month</span>
                  </div>
                </div>
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
            </Card>

            <Card className="border-0 shadow-lg rounded-xl p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Inactive</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.inactive}</p>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <TrendingUp className="h-3 w-3" />
                    <span>-2% vs last month</span>
                  </div>
                </div>
                <UserX className="h-8 w-8 text-gray-600" />
              </div>
            </Card>

            <Card className="border-0 shadow-lg rounded-xl p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">Suspended</p>
                  <p className="text-3xl font-bold text-red-900 dark:text-red-100">{stats.suspended}</p>
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <TrendingUp className="h-3 w-3" />
                    <span>+1% vs last month</span>
                  </div>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </Card>

            <Card className="border-0 shadow-lg rounded-xl p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">On Leave</p>
                  <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">{stats.onLeave}</p>
                  <div className="flex items-center gap-1 text-sm text-yellow-600">
                    <Clock className="h-3 w-3" />
                    <span>Seasonal variation</span>
                  </div>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </Card>
          </div>


          {/* Users Table */}
          <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
              <div className="flex items-center justify-end">
                <div className="text-sm text-muted-foreground">
                  {selectedRows.size > 0 && `${selectedRows.size} selected`}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading users...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b-2 border-border/50">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="py-4 px-6 w-16 border-r border-border/30">
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              className="rounded border-border/50 text-primary focus:ring-primary/20 focus:ring-2"
                              checked={selectedRows.size === sortedUsers.length && sortedUsers.length > 0}
                              onChange={(e) => handleSelectAll(e.target.checked)}
                            />
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-foreground py-4 px-6 w-80 border-r border-border/30">
                          <button
                            className="flex items-center gap-2 hover:text-primary transition-colors"
                            onClick={() => handleSort('full_name')}
                          >
                            User
                            {sortField === 'full_name' ? (
                              sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                            ) : (
                              <ArrowUpDown className="h-4 w-4 opacity-50" />
                            )}
                          </button>
                        </TableHead>
                        <TableHead className="font-semibold text-foreground py-4 px-6 border-r border-border/30">
                          <button
                            className="flex items-center gap-2 hover:text-primary transition-colors"
                            onClick={() => handleSort('role')}
                          >
                            Role
                            {sortField === 'role' ? (
                              sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                            ) : (
                              <ArrowUpDown className="h-4 w-4 opacity-50" />
                            )}
                          </button>
                        </TableHead>
                        <TableHead className="font-semibold text-foreground py-4 px-6 border-r border-border/30">
                          <button
                            className="flex items-center gap-2 hover:text-primary transition-colors"
                            onClick={() => handleSort('department')}
                          >
                            Department
                            {sortField === 'department' ? (
                              sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                            ) : (
                              <ArrowUpDown className="h-4 w-4 opacity-50" />
                            )}
                          </button>
                        </TableHead>
                        <TableHead className="font-semibold text-foreground py-4 px-6 border-r border-border/30">
                          <button
                            className="flex items-center gap-2 hover:text-primary transition-colors"
                            onClick={() => handleSort('status')}
                          >
                            Status
                            {sortField === 'status' ? (
                              sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                            ) : (
                              <ArrowUpDown className="h-4 w-4 opacity-50" />
                            )}
                          </button>
                        </TableHead>
                        <TableHead className="font-semibold text-foreground py-4 px-6 border-r border-border/30">Phone</TableHead>
                        <TableHead className="font-semibold text-foreground py-4 px-6 border-r border-border/30">City</TableHead>
                        <TableHead className="text-center font-semibold text-foreground py-4 px-6 w-32">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedUsers.map((user) => (
                        <TableRow 
                          key={user.id} 
                          className="hover:bg-muted/50 transition-colors border-b border-border/30"
                        >
                          <TableCell className="py-4 px-6 border-r border-border/30">
                            <div className="flex items-center justify-center">
                              <input
                                type="checkbox"
                                className="rounded border-border/50 text-primary focus:ring-primary/20 focus:ring-2"
                                checked={selectedRows.has(user.id)}
                                onChange={(e) => handleSelectRow(user.id, e.target.checked)}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-6 border-r border-border/30">
                            <div className="flex items-center space-x-4">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {getUserInitials(user.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="space-y-1">
                                <p className="font-medium text-foreground">{user.full_name}</p>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  <span className="truncate max-w-48">{user.company_email}</span>
                                </div>
                                {user.employee_id && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <span>ID: {user.employee_id}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-6 border-r border-border/30">
                            <Badge className={`${getRoleColor(user.role)} border font-medium`}>
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4 px-6 border-r border-border/30">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{user.department || 'N/A'}</span>
                            </div>
                            {user.designation && (
                              <div className="text-sm text-muted-foreground mt-1">
                                {user.designation}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-4 px-6 border-r border-border/30">
                            <Badge className={`${getStatusColor(user.status)} border font-medium`}>
                              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4 px-6 border-r border-border/30">
                            <div className="flex items-center gap-2">
                              {user.phone ? (
                                <>
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-foreground">{user.phone}</span>
                                </>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-6 border-r border-border/30">
                            <div className="flex items-center gap-2">
                              {user.work_location ? (
                                <>
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-foreground">{user.work_location}</span>
                                </>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <div className="flex items-center justify-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    onClick={() => handleEditRole(user)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Change Role
                                  </DropdownMenuItem>
                                  {user.role !== 'super_admin' && (
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setShowDeleteDialog(true);
                                      }}
                                      className="text-red-600 focus:text-red-600"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete User
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add User Modal */}
      <Dialog open={showAddUserModal} onOpenChange={setShowAddUserModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with role and permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={newUserForm.full_name}
                onChange={(e) => setNewUserForm(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="employee_id">Employee ID</Label>
              <Input
                id="employee_id"
                value={newUserForm.employee_id}
                onChange={(e) => setNewUserForm(prev => ({ ...prev, employee_id: e.target.value }))}
                placeholder="Enter employee ID"
              />
            </div>
            <div>
              <Label htmlFor="company_email">Company Email *</Label>
              <Input
                id="company_email"
                type="email"
                value={newUserForm.company_email}
                onChange={(e) => setNewUserForm(prev => ({ ...prev, company_email: e.target.value }))}
                placeholder="user@company.com"
              />
            </div>
            <div>
              <Label htmlFor="personal_email">Personal Email</Label>
              <Input
                id="personal_email"
                type="email"
                value={newUserForm.personal_email}
                onChange={(e) => setNewUserForm(prev => ({ ...prev, personal_email: e.target.value }))}
                placeholder="user@gmail.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newUserForm.phone}
                onChange={(e) => setNewUserForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 234 567 8900"
              />
            </div>
            <div>
              <Label htmlFor="role">Role *</Label>
              <Select value={newUserForm.role} onValueChange={(value) => setNewUserForm(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(role => (
                    <SelectItem key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Select value={newUserForm.department} onValueChange={(value) => setNewUserForm(prev => ({ ...prev, department: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(dept => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="work_location">Work Location</Label>
              <Select value={newUserForm.work_location} onValueChange={(value) => setNewUserForm(prev => ({ ...prev, work_location: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {WORK_LOCATIONS.map(location => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newUserForm.notes}
                onChange={(e) => setNewUserForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes..."
                className="h-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUserModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddUser}
              disabled={!newUserForm.full_name || !newUserForm.company_email || !newUserForm.role}
            >
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.full_name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={showEditRoleDialog} onOpenChange={setShowEditRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Change the role for {selectedUser?.full_name}. This will affect their permissions and access level.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="role">New Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(role => (
                    <SelectItem key={role} value={role}>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getRoleColor(role)} border font-medium text-xs`}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedUser && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm">
                  <span className="font-medium">Current Role: </span>
                  <Badge className={`${getRoleColor(selectedUser.role)} border font-medium`}>
                    {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                  </Badge>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditRoleDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateRole}
              disabled={!newRole || newRole === selectedUser?.role}
            >
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};