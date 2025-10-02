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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  Download,
  FileText,
  Upload
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
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditRoleDialog, setShowEditRoleDialog] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showViewUserModal, setShowViewUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('');
  const [uploadingProfilePicture, setUploadingProfilePicture] = useState(false);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);

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
    notes: '',
    salary: '',
    date_of_birth: '',
    gender: '',
    current_address: '',
    permanent_address: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    upi_id: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: ''
  });

  // Fetch users with employee details from both tables
  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching users with employee details...');

      const usersWithDetails = await employeeDetailsService.fetchUsersWithEmployeeDetails();

      console.log('✅ Users fetched:', usersWithDetails?.length || 0);

      // Log how many users have employee_details
      const withDetails = usersWithDetails?.filter(u => u.employee_details).length || 0;

      console.log(`📊 Users with employee_details: ${withDetails}/${usersWithDetails?.length || 0}`);

      if (usersWithDetails && usersWithDetails.length > 0) {
        console.log('Sample user data:', usersWithDetails[0]);

        // Log users who HAVE employee_details
        const usersWithEmployeeData = usersWithDetails.filter(u => u.employee_details);
        if (usersWithEmployeeData.length > 0) {
          console.log('✅ Users WITH employee_details:', usersWithEmployeeData.map(u => ({
            name: u.full_name,
            id: u.id,
            has_details: !!u.employee_details
          })));
        } else {
          console.log('⚠️ NO users have employee_details in the database');
        }
      }

      setUsers(usersWithDetails || []);
    } catch (error) {
      console.error('❌ Error fetching users with employee details:', error);
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

  // Status priority for sorting (active first, then others, suspended last)
  const getStatusPriority = (status: string) => {
    switch (status) {
      case 'active': return 1;
      case 'on_leave': return 2;
      case 'inactive': return 3;
      case 'suspended': return 4;
      default: return 5;
    }
  };

  // Sorting logic
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      // First: Sort by status (active first, suspended last)
      const aStatusPriority = getStatusPriority(a.status);
      const bStatusPriority = getStatusPriority(b.status);

      if (aStatusPriority !== bStatusPriority) {
        return aStatusPriority - bStatusPriority;
      }

      // Second: Prioritize by role
      const aRolePriority = getRolePriority(a.role);
      const bRolePriority = getRolePriority(b.role);

      if (aRolePriority !== bRolePriority) {
        return aRolePriority - bRolePriority;
      }

      // Third: Sort by the selected field
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
    console.log('Editing user:', user);
    console.log('User full_name:', user.full_name);
    console.log('User email:', user.email);
    console.log('User role:', user.role);

    setSelectedUser(user);

    // Parse bank details if it's a JSON string
    const bankDetails = user.employee_details?.bank_details
      ? (typeof user.employee_details.bank_details === 'string'
          ? JSON.parse(user.employee_details.bank_details)
          : user.employee_details.bank_details)
      : {};

    // Parse emergency contact if it's a JSON string
    const emergencyContact = user.employee_details?.emergency_contact
      ? (typeof user.employee_details.emergency_contact === 'string'
          ? JSON.parse(user.employee_details.emergency_contact)
          : user.employee_details.emergency_contact)
      : {};

    // Parse current address if it's a JSON string
    const currentAddr = user.employee_details?.current_address
      ? (typeof user.employee_details.current_address === 'string'
          ? JSON.parse(user.employee_details.current_address)
          : user.employee_details.current_address)
      : {};

    // Parse permanent address if it's a JSON string
    const permanentAddr = user.employee_details?.permanent_address
      ? (typeof user.employee_details.permanent_address === 'string'
          ? JSON.parse(user.employee_details.permanent_address)
          : user.employee_details.permanent_address)
      : {};

    const formData = {
      full_name: user.full_name || '',
      company_email: user.company_email || '',
      personal_email: user.email || user.personal_email || user.employee_details?.personal_email || '',
      phone: user.phone || user.employee_details?.phone_number || '',
      role: user.role || '',
      department: user.department || '',
      designation: user.designation || user.employee_details?.designation || '',
      work_location: user.work_location || user.employee_details?.work_location || '',
      employment_type: user.employment_type || user.employee_details?.employment_type || '',
      status: user.status || 'active',
      joined_at: user.joined_at || user.employee_details?.joining_date || '',
      employee_id: user.employee_id || user.employee_details?.employee_id || '',
      notes: user.notes || user.employee_details?.notes || '',
      salary: user.employee_details?.salary?.toString() || '',
      date_of_birth: user.employee_details?.date_of_birth || '',
      gender: user.employee_details?.gender || '',
      current_address: currentAddr.street ? `${currentAddr.street}, ${currentAddr.city}, ${currentAddr.state} ${currentAddr.pincode}` : '',
      permanent_address: permanentAddr.street ? `${permanentAddr.street}, ${permanentAddr.city}, ${permanentAddr.state} ${permanentAddr.pincode}` : '',
      bank_name: bankDetails.bank_name || '',
      account_number: bankDetails.account_number || '',
      ifsc_code: bankDetails.ifsc_code || '',
      upi_id: bankDetails.upi_id || '',
      emergency_contact_name: emergencyContact.name || '',
      emergency_contact_phone: emergencyContact.phone || '',
      emergency_contact_relationship: emergencyContact.relationship || ''
    };

    console.log('Form data:', formData);
    setEditUserForm(formData);
    setShowEditUserModal(true);
  };

  // Handle profile picture file selection
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setProfilePictureFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload profile picture to storage
  const uploadProfilePicture = async (userId: string, employeeId: string): Promise<string | null> => {
    if (!profilePictureFile) return null;

    try {
      setUploadingProfilePicture(true);

      const fileExt = profilePictureFile.name.split('.').pop();
      const fileName = `${employeeId || userId}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      console.log('📤 Uploading profile picture:', filePath);

      const { error: uploadError } = await supabase.storage
        .from('employee-documents')
        .upload(filePath, profilePictureFile, {
          upsert: true,
          contentType: profilePictureFile.type
        });

      if (uploadError) {
        console.error('Error uploading profile picture:', uploadError);
        toast.error('Failed to upload profile picture');
        return null;
      }

      console.log('✅ Profile picture uploaded successfully');
      return filePath;
    } catch (error) {
      console.error('Error in uploadProfilePicture:', error);
      toast.error('Failed to upload profile picture');
      return null;
    } finally {
      setUploadingProfilePicture(false);
    }
  };

  // Handle comprehensive user update
  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      console.log('🔄 Starting user update...');
      console.log('Selected user ID:', selectedUser.id);
      console.log('Form data:', editUserForm);

      const updateData = {
        full_name: editUserForm.full_name,
        company_email: editUserForm.company_email || null,
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

      console.log('📝 Updating app_users with:', updateData);
      const { data: userData, error } = await supabase
        .from('app_users')
        .update(updateData)
        .eq('id', selectedUser.id)
        .select();

      if (error) {
        console.error('❌ Error updating user:', error);
        toast.error('Failed to update user: ' + error.message);
        return;
      }
      console.log('✅ User updated successfully:', userData);

      // Upload profile picture if selected
      let profilePictureUrl = null;
      if (profilePictureFile) {
        profilePictureUrl = await uploadProfilePicture(selectedUser.id, editUserForm.employee_id);
      }

      // Update all fields in employees_details table (only if record exists)
      if (selectedUser.employee_details) {
        console.log('💼 Updating employee details...');

        const employeeDetailsUpdate: any = {};

        // Add profile picture URL if uploaded
        if (profilePictureUrl) {
          employeeDetailsUpdate.profile_picture_url = profilePictureUrl;
        }

        // Add salary if provided
        if (editUserForm.salary) {
          const salaryValue = parseFloat(editUserForm.salary);
          if (!isNaN(salaryValue)) {
            employeeDetailsUpdate.salary = salaryValue;
          }
        }

        // Add personal details
        if (editUserForm.date_of_birth) employeeDetailsUpdate.date_of_birth = editUserForm.date_of_birth;
        if (editUserForm.gender) employeeDetailsUpdate.gender = editUserForm.gender;
        if (editUserForm.phone) employeeDetailsUpdate.phone_number = editUserForm.phone;
        if (editUserForm.personal_email) employeeDetailsUpdate.personal_email = editUserForm.personal_email;
        if (editUserForm.designation) employeeDetailsUpdate.designation = editUserForm.designation;
        if (editUserForm.work_location) employeeDetailsUpdate.work_location = editUserForm.work_location;
        if (editUserForm.employment_type) employeeDetailsUpdate.employment_type = editUserForm.employment_type;
        if (editUserForm.joined_at) employeeDetailsUpdate.joining_date = editUserForm.joined_at;

        // Update bank details as JSON
        if (editUserForm.bank_name || editUserForm.account_number || editUserForm.ifsc_code || editUserForm.upi_id) {
          employeeDetailsUpdate.bank_details = JSON.stringify({
            bank_name: editUserForm.bank_name || '',
            account_number: editUserForm.account_number || '',
            ifsc_code: editUserForm.ifsc_code || '',
            upi_id: editUserForm.upi_id || ''
          });
        }

        // Update emergency contact as JSON
        if (editUserForm.emergency_contact_name || editUserForm.emergency_contact_phone || editUserForm.emergency_contact_relationship) {
          employeeDetailsUpdate.emergency_contact = JSON.stringify({
            name: editUserForm.emergency_contact_name || '',
            phone: editUserForm.emergency_contact_phone || '',
            relationship: editUserForm.emergency_contact_relationship || ''
          });
        }

        // Update current address as JSON (simplified - you may want to parse it better)
        if (editUserForm.current_address) {
          employeeDetailsUpdate.current_address = JSON.stringify({
            street: editUserForm.current_address,
            city: '',
            state: '',
            pincode: ''
          });
        }

        // Update permanent address as JSON
        if (editUserForm.permanent_address) {
          employeeDetailsUpdate.permanent_address = JSON.stringify({
            street: editUserForm.permanent_address,
            city: '',
            state: '',
            pincode: ''
          });
        }

        if (editUserForm.notes) employeeDetailsUpdate.notes = editUserForm.notes;

        // Only update if there are fields to update
        if (Object.keys(employeeDetailsUpdate).length > 0) {
          const { data: empData, error: empError } = await supabase
            .from('employees_details')
            .update(employeeDetailsUpdate)
            .eq('app_user_id', selectedUser.id)
            .select();

          if (empError) {
            console.error('❌ Error updating employee details:', empError);
            toast.error('User updated but failed to save employee details: ' + empError.message);
            return;
          }
          console.log('✅ Employee details updated successfully:', empData);
        }
      } else if (Object.values(editUserForm).some(val => val !== '' && val !== 'active')) {
        console.log('⚠️ No employee_details record exists for this user');
        toast.warning('Some fields not saved - employee details record does not exist.');
      }

      toast.success('User updated successfully');
      setShowEditUserModal(false);
      setSelectedUser(null);

      // Reset profile picture states
      setProfilePictureFile(null);
      setProfilePicturePreview(null);
      setUploadingProfilePicture(false);

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
        notes: '',
        salary: '',
        date_of_birth: '',
        gender: '',
        current_address: '',
        permanent_address: '',
        bank_name: '',
        account_number: '',
        ifsc_code: '',
        upi_id: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_relationship: ''
      });
      fetchUsers();
    } catch (error) {
      console.error('❌ Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  // Handle view user details
  const handleViewUser = (user: User) => {
    console.log('=== Viewing User Details ===');
    console.log('User ID:', user.id);
    console.log('Full Name:', user.full_name);
    console.log('Has employee_details:', !!user.employee_details);

    if (user.employee_details) {
      console.log('Employee Details:', user.employee_details);
    } else {
      console.log('⚠️ No employee_details found for this user');
    }

    console.log('Full user object:', user);
    console.log('========================');

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
                          className="hover:bg-muted/50 transition-colors border-b border-border/30 cursor-pointer"
                          onClick={() => handleViewUser(user)}
                        >
                          <TableCell className="py-4 px-6 border-r border-border/30">
                            <div className="flex items-center space-x-4">
                              <Avatar className="h-10 w-10">
                                {user.employee_details?.profile_picture_url ? (
                                  <img
                                    src={supabase.storage.from('employee-documents').getPublicUrl(user.employee_details.profile_picture_url).data.publicUrl}
                                    alt={user.full_name}
                                    className="h-full w-full object-cover rounded-full"
                                  />
                                ) : (
                                  <AvatarFallback className="bg-primary/10 text-primary">
                                    {getUserInitials(user.full_name)}
                                  </AvatarFallback>
                                )}
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
                            {user.employee_details?.salary ? (
                              <div className="space-y-1">
                                <span className="text-foreground font-semibold">₹{user.employee_details.salary.toLocaleString()}</span>
                                <div className="text-xs text-muted-foreground">
                                  Per month
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
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
      <Dialog open={showEditUserModal} onOpenChange={(open) => {
        setShowEditUserModal(open);
        if (!open) {
          // Reset profile picture states when modal closes
          setProfilePictureFile(null);
          setProfilePicturePreview(null);
          setUploadingProfilePicture(false);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User Details</DialogTitle>
            <DialogDescription>
              Update all user information and permissions.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="personal">Personal Details</TabsTrigger>
              <TabsTrigger value="bank">Bank & Emergency</TabsTrigger>
              <TabsTrigger value="documents">Documents & Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-4">
          {/* Profile Picture Upload Section */}
          <div className="mb-6 p-4 border rounded-lg bg-muted/30">
            <Label className="text-sm font-medium mb-2 block">Profile Picture</Label>
            <div className="flex items-center gap-4">
              {/* Current or Preview Image */}
              <div className="relative">
                {profilePicturePreview || selectedUser?.employee_details?.profile_picture_url ? (
                  <img
                    src={profilePicturePreview || (selectedUser?.employee_details?.profile_picture_url
                      ? supabase.storage.from('employee-documents').getPublicUrl(selectedUser.employee_details.profile_picture_url).data.publicUrl
                      : '')}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-2 border-primary"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-2 border-dashed border-primary/30">
                    <UserCog className="h-10 w-10 text-primary/50" />
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <div className="flex-1">
                <Input
                  id="profile_picture_upload"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('profile_picture_upload')?.click()}
                  disabled={uploadingProfilePicture}
                >
                  {uploadingProfilePicture ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      {profilePicturePreview ? 'Change Picture' : 'Upload Picture'}
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Max size: 5MB. Formats: JPG, PNG, GIF
                </p>
              </div>
            </div>
          </div>

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
            <div>
              <Label htmlFor="edit_salary">Salary (₹)</Label>
              <Input
                id="edit_salary"
                type="number"
                value={editUserForm.salary}
                onChange={(e) => setEditUserForm(prev => ({ ...prev, salary: e.target.value }))}
                placeholder="Enter monthly salary"
              />
            </div>
          </div>
            </TabsContent>

            <TabsContent value="personal" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_dob">Date of Birth</Label>
                  <Input
                    id="edit_dob"
                    type="date"
                    value={editUserForm.date_of_birth || ''}
                    onChange={(e) => setEditUserForm(prev => ({ ...prev, date_of_birth: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_gender">Gender</Label>
                  <Select value={editUserForm.gender || ''} onValueChange={(value) => setEditUserForm(prev => ({ ...prev, gender: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label>Current Address</Label>
                  <Textarea
                    value={editUserForm.current_address || ''}
                    onChange={(e) => setEditUserForm(prev => ({ ...prev, current_address: e.target.value }))}
                    placeholder="Enter current address"
                    className="h-20"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Permanent Address</Label>
                  <Textarea
                    value={editUserForm.permanent_address || ''}
                    onChange={(e) => setEditUserForm(prev => ({ ...prev, permanent_address: e.target.value }))}
                    placeholder="Enter permanent address"
                    className="h-20"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="bank" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <h4 className="text-sm font-semibold mb-3">Bank Details</h4>
                </div>
                <div>
                  <Label>Bank Name</Label>
                  <Input
                    value={editUserForm.bank_name || ''}
                    onChange={(e) => setEditUserForm(prev => ({ ...prev, bank_name: e.target.value }))}
                    placeholder="Enter bank name"
                  />
                </div>
                <div>
                  <Label>Account Number</Label>
                  <Input
                    value={editUserForm.account_number || ''}
                    onChange={(e) => setEditUserForm(prev => ({ ...prev, account_number: e.target.value }))}
                    placeholder="Enter account number"
                  />
                </div>
                <div>
                  <Label>IFSC Code</Label>
                  <Input
                    value={editUserForm.ifsc_code || ''}
                    onChange={(e) => setEditUserForm(prev => ({ ...prev, ifsc_code: e.target.value }))}
                    placeholder="Enter IFSC code"
                  />
                </div>
                <div>
                  <Label>UPI ID</Label>
                  <Input
                    value={editUserForm.upi_id || ''}
                    onChange={(e) => setEditUserForm(prev => ({ ...prev, upi_id: e.target.value }))}
                    placeholder="Enter UPI ID"
                  />
                </div>

                <div className="md:col-span-2 mt-4">
                  <h4 className="text-sm font-semibold mb-3">Emergency Contact</h4>
                </div>
                <div>
                  <Label>Contact Name</Label>
                  <Input
                    value={editUserForm.emergency_contact_name || ''}
                    onChange={(e) => setEditUserForm(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                    placeholder="Enter contact name"
                  />
                </div>
                <div>
                  <Label>Contact Phone</Label>
                  <Input
                    value={editUserForm.emergency_contact_phone || ''}
                    onChange={(e) => setEditUserForm(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                    placeholder="Enter contact phone"
                  />
                </div>
                <div>
                  <Label>Relationship</Label>
                  <Input
                    value={editUserForm.emergency_contact_relationship || ''}
                    onChange={(e) => setEditUserForm(prev => ({ ...prev, emergency_contact_relationship: e.target.value }))}
                    placeholder="Enter relationship"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="edit_notes">Notes</Label>
                  <Textarea
                    id="edit_notes"
                    value={editUserForm.notes}
                    onChange={(e) => setEditUserForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes..."
                    className="h-32"
                  />
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Document management will be available in a future update.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowEditUserModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateUser}
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
            <>
              {/* User Header */}
              <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
                <Avatar className="h-16 w-16">
                  {selectedUser.employee_details?.profile_picture_url ? (
                    <img
                      src={supabase.storage.from('employee-documents').getPublicUrl(selectedUser.employee_details.profile_picture_url).data.publicUrl}
                      alt={selectedUser.full_name}
                      className="h-full w-full object-cover rounded-full"
                    />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {getUserInitials(selectedUser.full_name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedUser.full_name}</h3>
                  <p className="text-muted-foreground">{selectedUser.company_email || selectedUser.personal_email}</p>
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

              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="personal">Personal Details</TabsTrigger>
                  <TabsTrigger value="bank">Bank & Emergency</TabsTrigger>
                  <TabsTrigger value="employment">Employment</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="mt-4">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-foreground border-b pb-2">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Employee ID</Label>
                    <p className="text-sm font-medium">{selectedUser.employee_id || 'Not provided'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Company Email</Label>
                    <p className="text-sm font-medium">{selectedUser.company_email}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Personal Email</Label>
                    <p className="text-sm font-medium">{selectedUser.personal_email || 'Not provided'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                    <p className="text-sm font-medium">{selectedUser.phone || 'Not provided'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Department</Label>
                    <p className="text-sm font-medium">{selectedUser.department || 'Not assigned'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Designation</Label>
                    <p className="text-sm font-medium">{selectedUser.designation || 'Not specified'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Work Location</Label>
                    <p className="text-sm font-medium">{selectedUser.work_location || 'Not specified'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Employment Type</Label>
                    <p className="text-sm font-medium">{selectedUser.employment_type || 'Not specified'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Joining Date</Label>
                    <p className="text-sm font-medium">{selectedUser.joined_at ? new Date(selectedUser.joined_at).toLocaleDateString() : 'Not provided'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Account Status</Label>
                    <Badge className={`${getStatusColor(selectedUser.status)} border font-medium`}>
                      {selectedUser.status.charAt(0).toUpperCase() + selectedUser.status.slice(1).replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Created At</Label>
                    <p className="text-sm text-muted-foreground">{new Date(selectedUser.created_at).toLocaleDateString()} at {new Date(selectedUser.created_at).toLocaleTimeString()}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                    <p className="text-sm text-muted-foreground">{new Date(selectedUser.updated_at).toLocaleDateString()} at {new Date(selectedUser.updated_at).toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
                </TabsContent>

                <TabsContent value="personal" className="mt-4">
              <div className="space-y-4">
                {selectedUser.employee_details ? (
                  <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Date of Birth</Label>
                      <p className="text-sm font-medium">{selectedUser.employee_details.date_of_birth ? new Date(selectedUser.employee_details.date_of_birth).toLocaleDateString() : 'Not provided'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Gender</Label>
                      <p className="text-sm font-medium">{selectedUser.employee_details.gender || 'Not provided'}</p>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Phone Number</Label>
                      <p className="text-sm font-medium">{selectedUser.employee_details.phone_number || 'Not provided'}</p>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Current Address</Label>
                      <p className="text-sm">{selectedUser.employee_details.current_address ?
                        (typeof selectedUser.employee_details.current_address === 'string'
                          ? JSON.parse(selectedUser.employee_details.current_address).street
                          : selectedUser.employee_details.current_address.street)
                        : 'Not provided'}</p>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Permanent Address</Label>
                      <p className="text-sm">{selectedUser.employee_details.permanent_address ?
                        (typeof selectedUser.employee_details.permanent_address === 'string'
                          ? JSON.parse(selectedUser.employee_details.permanent_address).street
                          : selectedUser.employee_details.permanent_address.street)
                        : 'Not provided'}</p>
                    </div>
                  </div>
                  </div>
                ) : (
                  <div className="p-6 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20 text-center">
                    <p className="text-sm text-muted-foreground">No personal details available</p>
                  </div>
                )}
              </div>
                </TabsContent>

                <TabsContent value="bank" className="mt-4">
              <div className="space-y-4">
                {selectedUser.employee_details ? (
                  <div className="space-y-6">
                    {/* Bank Details */}
                    <div>
                      <h5 className="text-md font-medium text-foreground mb-3">Bank Details</h5>
                      {selectedUser.employee_details.bank_details ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(() => {
                            const bankDetails = typeof selectedUser.employee_details.bank_details === 'string'
                              ? JSON.parse(selectedUser.employee_details.bank_details)
                              : selectedUser.employee_details.bank_details;
                            return (
                              <>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-muted-foreground">Bank Name</Label>
                                  <p className="text-sm">{bankDetails.bank_name || 'Not provided'}</p>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-muted-foreground">Account Number</Label>
                                  <p className="text-sm">{bankDetails.account_number || 'Not provided'}</p>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-muted-foreground">IFSC Code</Label>
                                  <p className="text-sm">{bankDetails.ifsc_code || 'Not provided'}</p>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-muted-foreground">UPI ID</Label>
                                  <p className="text-sm">{bankDetails.upi_id || 'Not provided'}</p>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-muted-foreground">Account Holder Name</Label>
                                  <p className="text-sm">{bankDetails.account_holder_name || 'Not provided'}</p>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-muted-foreground">Branch Name</Label>
                                  <p className="text-sm">{bankDetails.branch_name || 'Not provided'}</p>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No bank details available</p>
                      )}
                    </div>

                    {/* Emergency Contact */}
                    <div>
                      <h5 className="text-md font-medium text-foreground mb-3">Emergency Contact</h5>
                      {selectedUser.employee_details.emergency_contact ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(() => {
                            const emergencyContact = typeof selectedUser.employee_details.emergency_contact === 'string'
                              ? JSON.parse(selectedUser.employee_details.emergency_contact)
                              : selectedUser.employee_details.emergency_contact;
                            return (
                              <>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                                  <p className="text-sm">{emergencyContact.name || 'Not provided'}</p>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                                  <p className="text-sm">{emergencyContact.phone || 'Not provided'}</p>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-muted-foreground">Relationship</Label>
                                  <p className="text-sm">{emergencyContact.relationship || 'Not provided'}</p>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No emergency contact available</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20 text-center">
                    <p className="text-sm text-muted-foreground">No bank details available</p>
                  </div>
                )}
              </div>
                </TabsContent>

                <TabsContent value="employment" className="mt-4">
              <div className="space-y-4">
                {selectedUser.employee_details ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Position</Label>
                      <p className="text-sm font-medium">{selectedUser.employee_details.designation || selectedUser.employee_details.position || 'Not provided'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Salary</Label>
                      <p className="text-sm font-semibold text-green-600">
                        {selectedUser.employee_details.salary
                          ? `₹${selectedUser.employee_details.salary.toLocaleString()}`
                          : 'Not set'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Employment Type</Label>
                      <p className="text-sm font-medium">{selectedUser.employee_details.employment_type || 'Not provided'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Work Location</Label>
                      <p className="text-sm font-medium">{selectedUser.employee_details.work_location || 'Not provided'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Joining Date</Label>
                      <p className="text-sm font-medium">{selectedUser.employee_details.joining_date ? new Date(selectedUser.employee_details.joining_date).toLocaleDateString() : 'Not provided'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                      <Badge className={`${getStatusColor(selectedUser.status)} border font-medium`}>
                        {selectedUser.status.charAt(0).toUpperCase() + selectedUser.status.slice(1).replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                      {selectedUser.employee_details.notes || selectedUser.notes ? (
                        <div className="p-3 bg-muted/50 rounded-md">
                          <p className="text-sm whitespace-pre-wrap">{selectedUser.employee_details.notes || selectedUser.notes}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No notes</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20 text-center">
                    <p className="text-sm text-muted-foreground">No employment details available</p>
                  </div>
                )}
              </div>
                </TabsContent>

                <TabsContent value="documents" className="mt-4">
                  <div className="space-y-4">
                    {selectedUser.employee_details && selectedUser.employee_details.documents ? (
                      <div className="space-y-4">
                        <h5 className="text-md font-medium text-foreground">Uploaded Documents</h5>
                        {(() => {
                          const documents = typeof selectedUser.employee_details.documents === 'string'
                            ? JSON.parse(selectedUser.employee_details.documents)
                            : selectedUser.employee_details.documents;

                          if (!Array.isArray(documents) || documents.length === 0) {
                            return (
                              <div className="p-6 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20 text-center">
                                <p className="text-sm text-muted-foreground">No documents uploaded</p>
                              </div>
                            );
                          }

                          // Function to get multiple signed URLs in parallel (faster!)
                          const getBatchSignedUrls = async (paths: string[]) => {
                            const urlMap = new Map<string, string>();

                            const promises = paths.map(async (path) => {
                              try {
                                const { data, error } = await supabase.storage
                                  .from('employee-documents')
                                  .createSignedUrl(path, 3600);

                                if (!error && data?.signedUrl) {
                                  urlMap.set(path, data.signedUrl);
                                }
                              } catch (error) {
                                console.error('Error creating signed URL for', path, error);
                              }
                            });

                            await Promise.all(promises);
                            return urlMap;
                          };

                          const getSignedUrl = async (path: string) => {
                            try {
                              const { data, error } = await supabase.storage
                                .from('employee-documents')
                                .createSignedUrl(path, 3600);

                              if (error) {
                                console.error('Error creating signed URL:', error);
                                return null;
                              }

                              return data.signedUrl;
                            } catch (error) {
                              console.error('Error getting signed URL:', error);
                              return null;
                            }
                          };

                          const handleViewDocument = async (doc: any) => {
                            if (doc.path) {
                              // Try public URL first for instant loading
                              const { data: publicData } = supabase.storage
                                .from('employee-documents')
                                .getPublicUrl(doc.path);

                              if (publicData?.publicUrl) {
                                // Use public URL instantly
                                setSelectedDocument(doc);
                                setDocumentPreviewUrl(publicData.publicUrl);
                                setShowDocumentModal(true);
                              } else {
                                // Fallback to signed URL if public URL not available
                                const url = await getSignedUrl(doc.path);
                                if (url) {
                                  setSelectedDocument(doc);
                                  setDocumentPreviewUrl(url);
                                  setShowDocumentModal(true);
                                }
                              }
                            } else {
                              toast.error('Document path not found');
                            }
                          };

                          const handleDownloadDocument = async (doc: any) => {
                            if (doc.path) {
                              // Try public URL first for instant download
                              const { data: publicData } = supabase.storage
                                .from('employee-documents')
                                .getPublicUrl(doc.path);

                              const url = publicData?.publicUrl || await getSignedUrl(doc.path);
                              if (url) {
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = doc.filename || 'document';
                                link.click();
                              }
                            } else {
                              toast.error('Document path not found');
                            }
                          };

                          // Create a separate component for document card - now receives previewUrl as prop
                          const DocumentCard = ({ doc, previewUrl, onView }: { doc: any; previewUrl: string | null; onView: (doc: any) => void }) => {
                            return (
                              <div className="border rounded-lg overflow-hidden bg-card hover:shadow-lg transition-all cursor-pointer group">
                                {/* Document Preview */}
                                <div
                                  className="aspect-[3/4] bg-muted relative overflow-hidden"
                                  onClick={() => {
                                    if (previewUrl) {
                                      window.open(previewUrl, '_blank');
                                    }
                                  }}
                                >
                                  {previewUrl ? (
                                    doc.mime_type?.startsWith('image/') ? (
                                      <img
                                        src={previewUrl}
                                        alt={doc.filename}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                                        <FileText className="h-16 w-16 text-blue-600 dark:text-blue-400" />
                                      </div>
                                    )
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin" />
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
                                    <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                  </div>
                                </div>

                                {/* Document Info */}
                                <div className="p-3 space-y-1">
                                  <p className="font-medium text-xs text-foreground truncate">{doc.type || 'Document'}</p>
                                  <p className="text-xs text-muted-foreground truncate">{doc.filename || 'Unknown'}</p>
                                  {doc.size && (
                                    <p className="text-xs text-muted-foreground">
                                      {(doc.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          };

                          // Try public URLs first for instant loading, fallback to signed URLs
                          const DocumentGrid = () => {
                            const [previewUrls, setPreviewUrls] = React.useState<Map<string, string>>(() => {
                              // Instantly generate public URLs (no API call needed!)
                              const urlMap = new Map<string, string>();
                              documents.forEach((doc: any) => {
                                if (doc.path) {
                                  const { data } = supabase.storage
                                    .from('employee-documents')
                                    .getPublicUrl(doc.path);
                                  if (data?.publicUrl) {
                                    urlMap.set(doc.path, data.publicUrl);
                                  }
                                }
                              });
                              return urlMap;
                            });

                            const [fallbackChecked, setFallbackChecked] = React.useState(false);

                            React.useEffect(() => {
                              // If public URLs don't work (bucket is private), fallback to signed URLs
                              if (!fallbackChecked) {
                                const checkAndFallback = async () => {
                                  const firstDoc = documents[0];
                                  if (firstDoc?.path) {
                                    const publicUrl = previewUrls.get(firstDoc.path);
                                    if (publicUrl) {
                                      // Test if public URL works
                                      try {
                                        const response = await fetch(publicUrl, { method: 'HEAD' });
                                        if (!response.ok) {
                                          // Public URLs don't work, use signed URLs
                                          documents.forEach(async (doc: any) => {
                                            if (doc.path) {
                                              const { data } = await supabase.storage
                                                .from('employee-documents')
                                                .createSignedUrl(doc.path, 3600);
                                              if (data?.signedUrl) {
                                                setPreviewUrls(prev => new Map(prev).set(doc.path, data.signedUrl));
                                              }
                                            }
                                          });
                                        }
                                      } catch (error) {
                                        console.error('Error checking public URL:', error);
                                      }
                                    }
                                  }
                                  setFallbackChecked(true);
                                };
                                checkAndFallback();
                              }
                            }, [fallbackChecked]);

                            return (
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {documents.map((doc: any, index: number) => (
                                  <DocumentCard
                                    key={index}
                                    doc={doc}
                                    previewUrl={previewUrls.get(doc.path) || null}
                                    onView={handleViewDocument}
                                  />
                                ))}
                              </div>
                            );
                          };

                          return <DocumentGrid />;
                        })()}
                      </div>
                    ) : (
                      <div className="p-6 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20 text-center">
                        <p className="text-sm text-muted-foreground">No documents available</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </>
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

      {/* Document Viewer Modal */}
      <Dialog open={showDocumentModal} onOpenChange={setShowDocumentModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.type || 'Document'}</DialogTitle>
            <DialogDescription>
              {selectedDocument?.filename || 'Document preview'}
            </DialogDescription>
          </DialogHeader>

          {documentPreviewUrl && selectedDocument && (
            <div className="space-y-4">
              {/* Document Preview */}
              <div className="max-h-[60vh] overflow-auto bg-muted/30 rounded-lg flex items-center justify-center p-4">
                {selectedDocument.mime_type?.startsWith('image/') ? (
                  <img
                    src={documentPreviewUrl}
                    alt={selectedDocument.filename}
                    className="max-w-full max-h-full object-contain rounded"
                  />
                ) : selectedDocument.mime_type === 'application/pdf' ? (
                  <iframe
                    src={documentPreviewUrl}
                    className="w-full h-[60vh] rounded"
                    title={selectedDocument.filename}
                  />
                ) : (
                  <div className="text-center space-y-4 p-8">
                    <FileText className="h-24 w-24 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Preview not available for this file type
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedDocument.mime_type}
                    </p>
                  </div>
                )}
              </div>

              {/* Document Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <p className="text-sm font-medium">{selectedDocument.type}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">File Name</Label>
                  <p className="text-sm font-medium truncate">{selectedDocument.filename}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Size</Label>
                  <p className="text-sm font-medium">
                    {selectedDocument.size
                      ? `${(selectedDocument.size / 1024 / 1024).toFixed(2)} MB`
                      : 'Unknown'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Uploaded</Label>
                  <p className="text-sm font-medium">
                    {selectedDocument.uploaded_at
                      ? new Date(selectedDocument.uploaded_at).toLocaleDateString()
                      : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDocumentModal(false)}>
              Close
            </Button>
            <Button
              onClick={async () => {
                if (selectedDocument?.path) {
                  const { data, error } = await supabase.storage
                    .from('employee-documents')
                    .createSignedUrl(selectedDocument.path, 3600);

                  if (!error && data?.signedUrl) {
                    const link = document.createElement('a');
                    link.href = data.signedUrl;
                    link.download = selectedDocument.filename || 'document';
                    link.click();
                    toast.success('Download started');
                  } else {
                    toast.error('Failed to download document');
                  }
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};