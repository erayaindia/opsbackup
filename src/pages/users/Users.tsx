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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Users as UsersIcon,
  Edit,
  Trash2,
  RefreshCw,
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
  XCircle,
  Clock,
  Shield,
  Activity,
  TrendingUp,
  Eye,
  UserCog,
  FileText
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUserPermissions } from '@/components/PermissionGuard';
import { employeeDetailsService, UserWithEmployeeDetails } from '@/services/employeeDetailsService';

// User interface based on app_users table with employee details
interface User extends UserWithEmployeeDetails {}

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
  // Permission check
  const { hasRole, loading: permissionsLoading, currentUser } = useUserPermissions();
  const isSuperAdmin = hasRole(['super_admin']);

  // State management
  const [users, setUsers] = useState<UserWithEmployeeDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('full_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditRoleDialog, setShowEditRoleDialog] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showViewUserModal, setShowViewUserModal] = useState(false);
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
    joined_at: '',
    employee_id: '',
    notes: ''
  });

  const [editUserForm, setEditUserForm] = useState({
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
    joined_at: '',
    employee_id: '',
    notes: ''
  });

  // Fetch users with employee details from both tables
  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching users with employee details...');

      const usersWithDetails = await employeeDetailsService.fetchUsersWithEmployeeDetails();

      console.log('Users fetched:', usersWithDetails?.length || 0);
      setUsers(usersWithDetails || []);
    } catch (error) {
      console.error('Error fetching users with employee details:', error);
      toast.error('Failed to load users: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);


  // Role priority for sorting (super_admin first, then admin, then employee, then others)
  const getRolePriority = (role: string) => {
    switch (role) {
      case 'super_admin': return 1;
      case 'admin': return 2;
      case 'employee': return 3;
      case 'manager': return 4;
      default: return 5;
    }
  };

  // Sorting logic
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      // Always prioritize by role first
      const aRolePriority = getRolePriority(a.role);
      const bRolePriority = getRolePriority(b.role);

      if (aRolePriority !== bRolePriority) {
        return aRolePriority - bRolePriority;
      }

      // If roles are the same priority, then sort by the selected field
      if (sortField) {
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
      }

      return 0;
    });
  }, [users, sortField, sortDirection]);

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
        joined_at: newUserForm.joined_at || null,
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
        joined_at: '',
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

  // Open edit user modal and populate form
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditUserForm({
      full_name: user.full_name,
      company_email: user.company_email,
      personal_email: user.personal_email || '',
      phone: user.phone || '',
      role: user.role,
      department: user.department || '',
      designation: user.designation || '',
      work_location: user.work_location || '',
      employment_type: user.employment_type || '',
      status: user.status,
      joined_at: user.joined_at || '',
      employee_id: user.employee_id || '',
      notes: user.notes || ''
    });
    setShowEditUserModal(true);
  };

  // Handle comprehensive user update
  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const updateData = {
        full_name: editUserForm.full_name,
        company_email: editUserForm.company_email,
        personal_email: editUserForm.personal_email || null,
        phone: editUserForm.phone || null,
        role: editUserForm.role,
        department: editUserForm.department || null,
        designation: editUserForm.designation || null,
        work_location: editUserForm.work_location || null,
        employment_type: editUserForm.employment_type || null,
        status: editUserForm.status,
        joined_at: editUserForm.joined_at || null,
        employee_id: editUserForm.employee_id || null,
        notes: editUserForm.notes || null
      };

      const { error } = await supabase
        .from('app_users')
        .update(updateData)
        .eq('id', selectedUser.id);

      if (error) {
        console.error('Error updating user:', error);
        toast.error('Failed to update user: ' + error.message);
        return;
      }

      toast.success('User updated successfully');
      setShowEditUserModal(false);
      setSelectedUser(null);
      setEditUserForm({
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
        joined_at: '',
        employee_id: '',
        notes: ''
      });
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  // Handle view user details
  const handleViewUser = (user: User) => {
    console.log('Viewing user:', user);
    console.log('Has employee_application:', !!user.employee_application);
    if (user.employee_application) {
      console.log('Application data:', user.employee_application);
    }
    setSelectedUser(user);
    setShowViewUserModal(true);
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

  // Show loading while checking permissions
  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user has super_admin access
  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You need Super Admin permissions to access this page.</p>
        </div>
      </div>
    );
  }

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
                    <h1 className="text-4xl font-bold text-foreground leading-tight">People & Roles</h1>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-muted-foreground">Real-time access control</span>
                    </div>
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
          </div>

        {/* Statistics Cards */}
        <div className="px-4 pt-2 mb-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
            <Card className="border-0 shadow-lg rounded-xl p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Total Users</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</p>
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <TrendingUp className="h-3 w-3" />
                    <span>+12% vs last month</span>
                  </div>
                </div>
                <UsersIcon className="h-6 w-6 text-blue-600" />
              </div>
            </Card>

            <Card className="border-0 shadow-lg rounded-xl p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-green-700 dark:text-green-300">Active</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.active}</p>
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <TrendingUp className="h-3 w-3" />
                    <span>+8% vs last month</span>
                  </div>
                </div>
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </Card>

            <Card className="border-0 shadow-lg rounded-xl p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Inactive</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.inactive}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <TrendingUp className="h-3 w-3" />
                    <span>-2% vs last month</span>
                  </div>
                </div>
                <UserX className="h-6 w-6 text-gray-600" />
              </div>
            </Card>

            <Card className="border-0 shadow-lg rounded-xl p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-red-700 dark:text-red-300">Suspended</p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.suspended}</p>
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <TrendingUp className="h-3 w-3" />
                    <span>+1% vs last month</span>
                  </div>
                </div>
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </Card>

            <Card className="border-0 shadow-lg rounded-xl p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300">On Leave</p>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.onLeave}</p>
                  <div className="flex items-center gap-1 text-xs text-yellow-600">
                    <Clock className="h-3 w-3" />
                    <span>Seasonal variation</span>
                  </div>
                </div>
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </Card>
          </div>


          {/* Users Table */}
          <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
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
                        <TableHead className="font-semibold text-foreground py-4 px-6 border-r border-border/30">Position</TableHead>
                        <TableHead className="font-semibold text-foreground py-4 px-6 border-r border-border/30">Salary</TableHead>
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
                            <div className="flex items-center space-x-4">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {getUserInitials(user.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="space-y-1">
                                <p className="font-medium text-foreground">{user.full_name}</p>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  <span className="truncate max-w-48">{user.company_email}</span>
                                </div>
                                {user.employee_id && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <span>ID: {user.employee_id}</span>
                                  </div>
                                )}
                                {user.employee_details?.employee_id && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <span>EMP: {user.employee_details.employee_id}</span>
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
                          <TableCell className="py-4 px-6 border-r border-border/30">
                            <div className="space-y-1">
                              {user.employee_details?.position ? (
                                <>
                                  <span className="text-foreground font-medium">{user.employee_details.position}</span>
                                  {user.employee_details.employment_type && (
                                    <div className="text-xs text-muted-foreground">
                                      {user.employee_details.employment_type}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-6 border-r border-border/30">
                            <div className="space-y-1">
                              {user.employee_details?.salary ? (
                                <>
                                  <span className="text-foreground font-medium">₹{user.employee_details.salary.toLocaleString()}</span>
                                  <div className="text-xs text-muted-foreground">
                                    Per month
                                  </div>
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
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleViewUser(user)}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleEditUser(user)}
                                  >
                                    <UserCog className="mr-2 h-4 w-4" />
                                    Edit User
                                  </DropdownMenuItem>
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
            <div>
              <Label htmlFor="joined_at">Joining Date</Label>
              <Input
                id="joined_at"
                type="date"
                value={newUserForm.joined_at}
                onChange={(e) => setNewUserForm(prev => ({ ...prev, joined_at: e.target.value }))}
              />
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

      {/* Edit User Modal */}
      <Dialog open={showEditUserModal} onOpenChange={setShowEditUserModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User Details</DialogTitle>
            <DialogDescription>
              Update all user information and permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit_full_name">Full Name *</Label>
              <Input
                id="edit_full_name"
                value={editUserForm.full_name}
                onChange={(e) => setEditUserForm(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="edit_employee_id">Employee ID</Label>
              <Input
                id="edit_employee_id"
                value={editUserForm.employee_id}
                onChange={(e) => setEditUserForm(prev => ({ ...prev, employee_id: e.target.value }))}
                placeholder="Enter employee ID"
              />
            </div>
            <div>
              <Label htmlFor="edit_company_email">Company Email *</Label>
              <Input
                id="edit_company_email"
                type="email"
                value={editUserForm.company_email}
                onChange={(e) => setEditUserForm(prev => ({ ...prev, company_email: e.target.value }))}
                placeholder="user@company.com"
              />
            </div>
            <div>
              <Label htmlFor="edit_personal_email">Personal Email</Label>
              <Input
                id="edit_personal_email"
                type="email"
                value={editUserForm.personal_email}
                onChange={(e) => setEditUserForm(prev => ({ ...prev, personal_email: e.target.value }))}
                placeholder="user@gmail.com"
              />
            </div>
            <div>
              <Label htmlFor="edit_phone">Phone</Label>
              <Input
                id="edit_phone"
                value={editUserForm.phone}
                onChange={(e) => setEditUserForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 234 567 8900"
              />
            </div>
            <div>
              <Label htmlFor="edit_role">Role *</Label>
              <Select value={editUserForm.role} onValueChange={(value) => setEditUserForm(prev => ({ ...prev, role: value }))}>
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
              <Label htmlFor="edit_department">Department</Label>
              <Select value={editUserForm.department} onValueChange={(value) => setEditUserForm(prev => ({ ...prev, department: value }))}>
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
              <Label htmlFor="edit_designation">Designation</Label>
              <Input
                id="edit_designation"
                value={editUserForm.designation}
                onChange={(e) => setEditUserForm(prev => ({ ...prev, designation: e.target.value }))}
                placeholder="Enter designation"
              />
            </div>
            <div>
              <Label htmlFor="edit_work_location">Work Location</Label>
              <Select value={editUserForm.work_location} onValueChange={(value) => setEditUserForm(prev => ({ ...prev, work_location: value }))}>
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
            <div>
              <Label htmlFor="edit_employment_type">Employment Type</Label>
              <Select value={editUserForm.employment_type} onValueChange={(value) => setEditUserForm(prev => ({ ...prev, employment_type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_status">Status *</Label>
              <Select value={editUserForm.status} onValueChange={(value) => setEditUserForm(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(status => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_joined_at">Joining Date</Label>
              <Input
                id="edit_joined_at"
                type="date"
                value={editUserForm.joined_at}
                onChange={(e) => setEditUserForm(prev => ({ ...prev, joined_at: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="edit_notes">Notes</Label>
              <Textarea
                id="edit_notes"
                value={editUserForm.notes}
                onChange={(e) => setEditUserForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes..."
                className="h-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditUserModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateUser}
              disabled={!editUserForm.full_name || !editUserForm.company_email || !editUserForm.role}
            >
              Update User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View User Modal */}
      <Dialog open={showViewUserModal} onOpenChange={setShowViewUserModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View complete user information.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* User Header */}
              <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {getUserInitials(selectedUser.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedUser.full_name}</h3>
                  <p className="text-muted-foreground">{selectedUser.company_email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${getRoleColor(selectedUser.role)} border font-medium`}>
                      {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                    </Badge>
                    <Badge className={`${getStatusColor(selectedUser.status)} border font-medium`}>
                      {selectedUser.status.charAt(0).toUpperCase() + selectedUser.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Basic User Details */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-foreground border-b pb-2">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Employee ID</Label>
                    <p className="text-sm">{selectedUser.employee_id || 'Not provided'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Personal Email</Label>
                    <p className="text-sm">{selectedUser.personal_email || 'Not provided'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                    <p className="text-sm">{selectedUser.phone || 'Not provided'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Department</Label>
                    <p className="text-sm">{selectedUser.department || 'Not assigned'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Designation</Label>
                    <p className="text-sm">{selectedUser.designation || 'Not specified'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Work Location</Label>
                    <p className="text-sm">{selectedUser.work_location || 'Not specified'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Employment Type</Label>
                    <p className="text-sm">{selectedUser.employment_type || 'Not specified'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Joining Date</Label>
                    <p className="text-sm">{selectedUser.joined_at ? new Date(selectedUser.joined_at).toLocaleDateString() : 'Not provided'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Created At</Label>
                    <p className="text-sm">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                    <p className="text-sm">{new Date(selectedUser.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Employee Details Section */}
              {selectedUser.employee_details && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-foreground border-b pb-2">Employee Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Employee ID</Label>
                      <p className="text-sm">{selectedUser.employee_details.employee_id}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Position</Label>
                      <p className="text-sm">{selectedUser.employee_details.position}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Salary</Label>
                      <p className="text-sm font-semibold text-green-600">₹{selectedUser.employee_details.salary.toLocaleString()}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Employment Type</Label>
                      <p className="text-sm">{selectedUser.employee_details.employment_type}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Start Date</Label>
                      <p className="text-sm">{new Date(selectedUser.employee_details.start_date).toLocaleDateString()}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Manager</Label>
                      <p className="text-sm">{selectedUser.employee_details.manager}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Personal Email</Label>
                      <p className="text-sm">{selectedUser.employee_details.personal_email}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Personal Phone</Label>
                      <p className="text-sm">{selectedUser.employee_details.personal_phone}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Date of Birth</Label>
                      <p className="text-sm">{new Date(selectedUser.employee_details.date_of_birth).toLocaleDateString()}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Nationality</Label>
                      <p className="text-sm">{selectedUser.employee_details.nationality}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">National ID</Label>
                      <p className="text-sm">{selectedUser.employee_details.national_id}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Bank Name</Label>
                      <p className="text-sm">{selectedUser.employee_details.bank_name}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Account Number</Label>
                      <p className="text-sm">{selectedUser.employee_details.account_number}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">IBAN</Label>
                      <p className="text-sm">{selectedUser.employee_details.iban}</p>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                      <p className="text-sm">{selectedUser.employee_details.address}</p>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-2">
                    <h5 className="text-md font-medium text-foreground">Emergency Contact</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                        <p className="text-sm">{selectedUser.employee_details.emergency_contact_name}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                        <p className="text-sm">{selectedUser.employee_details.emergency_contact_phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Visa/Work Permit Information */}
                  {(selectedUser.employee_details.visa_status || selectedUser.employee_details.work_permit_number) && (
                    <div className="space-y-2">
                      <h5 className="text-md font-medium text-foreground">Visa & Work Permit</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedUser.employee_details.visa_status && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-muted-foreground">Visa Status</Label>
                            <p className="text-sm">{selectedUser.employee_details.visa_status}</p>
                          </div>
                        )}
                        {selectedUser.employee_details.visa_expiry && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-muted-foreground">Visa Expiry</Label>
                            <p className="text-sm">{new Date(selectedUser.employee_details.visa_expiry).toLocaleDateString()}</p>
                          </div>
                        )}
                        {selectedUser.employee_details.work_permit_number && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-muted-foreground">Work Permit Number</Label>
                            <p className="text-sm">{selectedUser.employee_details.work_permit_number}</p>
                          </div>
                        )}
                        {selectedUser.employee_details.work_permit_expiry && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-muted-foreground">Work Permit Expiry</Label>
                            <p className="text-sm">{new Date(selectedUser.employee_details.work_permit_expiry).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Application Details Section */}
              {selectedUser.employee_application && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-foreground border-b pb-2">Application Details</h4>

                  {/* Gender */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Gender</Label>
                      <p className="text-sm">{selectedUser.employee_application.gender}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Application Status</Label>
                      <Badge>{selectedUser.employee_application.status}</Badge>
                    </div>
                  </div>

                  {/* Addresses */}
                  {selectedUser.employee_application.current_address && (
                    <div className="space-y-2">
                      <h5 className="text-md font-medium text-foreground">Current Address</h5>
                      <div className="p-3 bg-muted/30 rounded-md">
                        <p className="text-sm">
                          {typeof selectedUser.employee_application.current_address === 'string'
                            ? JSON.parse(selectedUser.employee_application.current_address).street
                            : selectedUser.employee_application.current_address.street}
                        </p>
                        <p className="text-sm">
                          {typeof selectedUser.employee_application.current_address === 'string'
                            ? `${JSON.parse(selectedUser.employee_application.current_address).city}, ${JSON.parse(selectedUser.employee_application.current_address).state} ${JSON.parse(selectedUser.employee_application.current_address).pincode || ''}`
                            : `${selectedUser.employee_application.current_address.city}, ${selectedUser.employee_application.current_address.state} ${selectedUser.employee_application.current_address.pincode || ''}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedUser.employee_application.permanent_address && !selectedUser.employee_application.same_as_current && (
                    <div className="space-y-2">
                      <h5 className="text-md font-medium text-foreground">Permanent Address</h5>
                      <div className="p-3 bg-muted/30 rounded-md">
                        <p className="text-sm">
                          {typeof selectedUser.employee_application.permanent_address === 'string'
                            ? JSON.parse(selectedUser.employee_application.permanent_address).street
                            : selectedUser.employee_application.permanent_address.street}
                        </p>
                        <p className="text-sm">
                          {typeof selectedUser.employee_application.permanent_address === 'string'
                            ? `${JSON.parse(selectedUser.employee_application.permanent_address).city}, ${JSON.parse(selectedUser.employee_application.permanent_address).state} ${JSON.parse(selectedUser.employee_application.permanent_address).pincode || ''}`
                            : `${selectedUser.employee_application.permanent_address.city}, ${selectedUser.employee_application.permanent_address.state} ${selectedUser.employee_application.permanent_address.pincode || ''}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Bank Details */}
                  {selectedUser.employee_application.bank_details && (
                    <div className="space-y-2">
                      <h5 className="text-md font-medium text-foreground">Bank Details</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">Bank Name</Label>
                          <p className="text-sm">
                            {typeof selectedUser.employee_application.bank_details === 'string'
                              ? JSON.parse(selectedUser.employee_application.bank_details).bank_name
                              : selectedUser.employee_application.bank_details.bank_name}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">Account Number</Label>
                          <p className="text-sm">
                            {typeof selectedUser.employee_application.bank_details === 'string'
                              ? JSON.parse(selectedUser.employee_application.bank_details).account_number
                              : selectedUser.employee_application.bank_details.account_number}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">IFSC Code</Label>
                          <p className="text-sm">
                            {typeof selectedUser.employee_application.bank_details === 'string'
                              ? JSON.parse(selectedUser.employee_application.bank_details).ifsc_code
                              : selectedUser.employee_application.bank_details.ifsc_code}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">UPI ID</Label>
                          <p className="text-sm">
                            {typeof selectedUser.employee_application.bank_details === 'string'
                              ? JSON.parse(selectedUser.employee_application.bank_details).upi_id
                              : selectedUser.employee_application.bank_details.upi_id}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  {selectedUser.employee_application.documents && (
                    <div className="space-y-2">
                      <h5 className="text-md font-medium text-foreground">Documents</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {(typeof selectedUser.employee_application.documents === 'string'
                          ? JSON.parse(selectedUser.employee_application.documents)
                          : selectedUser.employee_application.documents
                        ).map((doc: any, index: number) => (
                          <a
                            key={index}
                            href={doc.signed_url || `${doc.path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors"
                          >
                            <FileText className="h-4 w-4" />
                            <span className="text-sm">{doc.type || doc.filename}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* NDA and Data Privacy */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">NDA Accepted</Label>
                      <Badge variant={selectedUser.employee_application.nda_accepted ? "default" : "secondary"}>
                        {selectedUser.employee_application.nda_accepted ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Data Privacy Accepted</Label>
                      <Badge variant={selectedUser.employee_application.data_privacy_accepted ? "default" : "secondary"}>
                        {selectedUser.employee_application.data_privacy_accepted ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes Section */}
              {selectedUser.notes && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                  <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-sm whitespace-pre-wrap">{selectedUser.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewUserModal(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowViewUserModal(false);
              if (selectedUser) handleEditUser(selectedUser);
            }}>
              <Edit className="mr-2 h-4 w-4" />
              Edit User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};