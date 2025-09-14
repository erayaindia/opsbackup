import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  BaseTable,
  TableHeader as SharedTableHeader,
  TablePagination,
  TableFilters,
  TableExport,
  useTableState,
  type FilterOption,
  type ExportColumn
} from '@/components/shared/tables'
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Shield,
  Building2,
  Calendar,
  Mail,
  MapPin,
  Users
} from 'lucide-react'
import { User, deleteUser } from '@/services/usersService'
import { EditUserModal } from './EditUserModal'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface UsersTableProps {
  users: User[]
  loading: boolean
  onUserUpdate: () => void
}

export const UsersTable: React.FC<UsersTableProps> = ({ users, loading, onUserUpdate }) => {
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  })

  const [editDialog, setEditDialog] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  })
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Define filter options for the table
  const filterOptions: FilterOption[] = [
    {
      key: 'role',
      label: 'Role',
      options: [
        { value: 'super_admin', label: 'Super Admin' },
        { value: 'admin', label: 'Admin' },
        { value: 'manager', label: 'Manager' },
        { value: 'employee', label: 'Employee' },
        { value: 'intern', label: 'Intern' },
        { value: 'external', label: 'External' }
      ],
      placeholder: 'Filter by role'
    },
    {
      key: 'department',
      label: 'Department',
      options: [
        { value: 'IT', label: 'IT' },
        { value: 'Operations', label: 'Operations' },
        { value: 'Finance', label: 'Finance' },
        { value: 'Marketing', label: 'Marketing' },
        { value: 'Sales', label: 'Sales' },
        { value: 'HR', label: 'HR' }
      ],
      placeholder: 'Filter by department'
    }
  ];

  // Define export columns
  const exportColumns: ExportColumn[] = [
    { key: 'full_name', header: 'Full Name' },
    { key: 'company_email', header: 'Email' },
    { key: 'role', header: 'Role', transform: (value) => value.replace('_', ' ') },
    { key: 'department', header: 'Department' },
    { key: 'designation', header: 'Designation' },
    { key: 'work_location', header: 'Location' },
    { key: 'employment_type', header: 'Employment Type' },
    { key: 'joined_at', header: 'Joined Date', transform: (value) => format(new Date(value), 'MMM d, yyyy') }
  ];

  // Initialize table state
  const tableState = useTableState({
    data: users,
    defaultSortField: 'full_name',
    defaultSortDirection: 'asc',
    searchFields: ['full_name', 'company_email', 'department', 'designation'],
    filterConfig: {
      role: { field: 'role' },
      department: { field: 'department' }
    }
  });


  const getRoleBadge = (role: string) => {
    const colors = {
      super_admin: 'text-purple-700 bg-purple-100 dark:text-purple-200 dark:bg-purple-900',
      admin: 'text-blue-700 bg-blue-100 dark:text-blue-200 dark:bg-blue-900',
      manager: 'text-indigo-700 bg-indigo-100 dark:text-indigo-200 dark:bg-indigo-900',
      employee: 'text-gray-700 bg-gray-100 dark:text-gray-200 dark:bg-gray-800',
      intern: 'text-orange-700 bg-orange-100 dark:text-orange-200 dark:bg-orange-900',
      external: 'text-cyan-700 bg-cyan-100 dark:text-cyan-200 dark:bg-cyan-900',
    } as const

    return (
      <Badge variant="outline" className={colors[role as keyof typeof colors] || 'text-gray-700 bg-gray-100 dark:text-gray-200 dark:bg-gray-800'}>
        {role.replace('_', ' ')}
      </Badge>
    )
  }


  const handleDelete = async () => {
    if (!deleteDialog.user) return

    try {
      setActionLoading(deleteDialog.user.id)
      const result = await deleteUser(deleteDialog.user.id)
      
      if (result.success) {
        toast.success(`User ${deleteDialog.user.full_name} has been permanently deleted`)
        onUserUpdate()
      } else {
        toast.error(result.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    } finally {
      setActionLoading(null)
      setDeleteDialog({ open: false, user: null })
    }
  }

  const getUserInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="space-y-0">
        <BaseTable loading={loading} className="rounded-none" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-0">
        {/* Table Filters */}
        <TableFilters
          searchTerm={tableState.searchTerm}
          onSearchChange={tableState.setSearchTerm}
          searchPlaceholder="Search users by name, email, department or designation..."
          filterOptions={filterOptions}
          filters={tableState.filters}
          onFilterChange={tableState.setFilter}
          onClearFilters={tableState.clearFilters}
          className="rounded-none"
        />

        {/* Export and Stats Bar */}
        <div className="flex items-center justify-between p-4 bg-muted/20 border-b border-border/50">
          <div className="flex items-center gap-4">
            <TableExport
              data={tableState.filteredData}
              columns={exportColumns}
              filename={`users_export_${new Date().toISOString().split('T')[0]}.csv`}
              className="rounded-none"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Showing {tableState.startIndex}-{tableState.endIndex} of {tableState.filteredData.length} users
            {tableState.filteredData.length !== users.length && ` (filtered from ${users.length} total)`}
          </div>
        </div>

        {/* Table */}
        <BaseTable className="rounded-none border-t-0">
          <TableHeader className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
            <TableRow className="hover:bg-transparent border-none">
              <SharedTableHeader
                field="full_name"
                sortable={true}
                onSort={tableState.handleSort}
                sortField={tableState.sortField}
                sortDirection={tableState.sortDirection}
                className="border-r border-border/50 bg-muted/30 whitespace-nowrap"
                align="left"
              >
                User
              </SharedTableHeader>
              <TableHead className="border-r border-border/50 bg-muted/30 whitespace-nowrap">Role</TableHead>
              <TableHead className="border-r border-border/50 bg-muted/30 whitespace-nowrap">Department</TableHead>
              <TableHead className="border-r border-border/50 bg-muted/30 whitespace-nowrap">Designation</TableHead>
              <TableHead className="border-r border-border/50 bg-muted/30 whitespace-nowrap">Location</TableHead>
              <SharedTableHeader
                field="joined_at"
                sortable={true}
                onSort={tableState.handleSort}
                sortField={tableState.sortField}
                sortDirection={tableState.sortDirection}
                className="border-r border-border/50 bg-muted/30 whitespace-nowrap"
              >
                Joined
              </SharedTableHeader>
              <TableHead className="bg-muted/30 whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableState.paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-8 w-8 text-muted-foreground/50" />
                    <p>No users found matching your criteria</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              tableState.paginatedData.map((user) => {
                const isLoading = actionLoading === user.id
                const initials = getUserInitials(user.full_name)

                return (
                  <TableRow key={user.id} className="hover:bg-muted/20 transition-all duration-200 h-16 border-b border-border/30">
                    <TableCell className="border-r border-border/50">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="text-sm font-medium">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.company_email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="border-r border-border/50">
                      {getRoleBadge(user.role)}
                    </TableCell>
                    <TableCell className="border-r border-border/50">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {user.department}
                      </div>
                    </TableCell>
                    <TableCell className="border-r border-border/50">
                      {user.designation || '—'}
                    </TableCell>
                    <TableCell className="border-r border-border/50">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {user.work_location}
                      </div>
                    </TableCell>
                    <TableCell className="border-r border-border/50">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(user.joined_at), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 rounded-none" disabled={isLoading}>
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-none">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>

                          <DropdownMenuItem className="rounded-none">
                            <Eye className="mr-2 h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => setEditDialog({ open: true, user })}
                            disabled={isLoading}
                            className="rounded-none"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>

                          {user.role !== 'super_admin' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteDialog({ open: true, user })}
                                disabled={isLoading}
                                className="text-red-600 focus:text-red-600 rounded-none"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
                              </DropdownMenuItem>
                            </>
                          )}

                          {user.role === 'super_admin' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem disabled className="text-purple-600 rounded-none">
                                <Shield className="mr-2 h-4 w-4" />
                                Protected Admin
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </BaseTable>

        {/* Pagination */}
        <TablePagination
          currentPage={tableState.currentPage}
          totalPages={tableState.totalPages}
          itemsPerPage={tableState.itemsPerPage}
          totalItems={tableState.filteredData.length}
          onPageChange={tableState.setCurrentPage}
          onItemsPerPageChange={tableState.setItemsPerPage}
          startIndex={tableState.startIndex}
          endIndex={tableState.endIndex}
          className="rounded-none border-t-0"
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>{deleteDialog.user?.full_name}</strong>?
              <br /><br />
              This action will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Remove their account from the system</li>
                <li>Delete all their authentication data</li>
                <li>Cannot be undone</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 rounded-none"
              disabled={actionLoading === deleteDialog.user?.id}
            >
              {actionLoading === deleteDialog.user?.id ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit User Modal */}
      <EditUserModal
        open={editDialog.open}
        onOpenChange={(open) => setEditDialog({ ...editDialog, open })}
        user={editDialog.user}
        onUserUpdated={onUserUpdate}
      />
    </>
  )
}