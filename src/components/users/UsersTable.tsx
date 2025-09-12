import React, { useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table'
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
  MoreHorizontal, 
  ArrowUpDown, 
  Eye, 
  Edit, 
  Trash2,
  Shield,
  Building2,
  Calendar,
  Mail,
  MapPin
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

const columnHelper = createColumnHelper<User>()

export const UsersTable: React.FC<UsersTableProps> = ({ users, loading, onUserUpdate }) => {
  const [sorting, setSorting] = useState<SortingState>([])
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  })
  
  const [editDialog, setEditDialog] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  })
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Status badge removed - no longer using status field

  const getRoleBadge = (role: string) => {
    const colors = {
      super_admin: 'text-purple-700 bg-purple-100',
      admin: 'text-blue-700 bg-blue-100',
      manager: 'text-indigo-700 bg-indigo-100',
      employee: 'text-gray-700 bg-gray-100',
      intern: 'text-orange-700 bg-orange-100',
      external: 'text-cyan-700 bg-cyan-100',
    } as const

    return (
      <Badge variant="outline" className={colors[role as keyof typeof colors] || 'text-gray-700 bg-gray-100'}>
        {role.replace('_', ' ')}
      </Badge>
    )
  }

  // Status change functionality removed

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

  const columns = [
    columnHelper.accessor('full_name', {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold"
        >
          User
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const user = row.original
        const initials = user.full_name
          .split(' ')
          .map(name => name[0])
          .join('')
          .toUpperCase()

        return (
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
        )
      },
    }),

    columnHelper.accessor('role', {
      header: 'Role',
      cell: ({ getValue }) => getRoleBadge(getValue()),
    }),

    columnHelper.accessor('department', {
      header: 'Department',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          {getValue()}
        </div>
      ),
    }),


    columnHelper.accessor('designation', {
      header: 'Designation',
      cell: ({ getValue }) => getValue() || '—',
    }),

    columnHelper.accessor('work_location', {
      header: 'Location',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          {getValue()}
        </div>
      ),
    }),

    columnHelper.accessor('joined_at', {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold"
        >
          Joined
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {format(new Date(getValue()), 'MMM d, yyyy')}
        </div>
      ),
    }),

    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const user = row.original
        const isLoading = actionLoading === user.id

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                View Profile
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => setEditDialog({ open: true, user })}
                disabled={isLoading}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit User
              </DropdownMenuItem>

              {/* Status change menu items removed */}

              {user.role !== 'super_admin' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setDeleteDialog({ open: true, user })}
                    disabled={isLoading}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete User
                  </DropdownMenuItem>
                </>
              )}
              
              
              {user.role === 'super_admin' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled className="text-purple-600">
                    <Shield className="mr-2 h-4 w-4" />
                    Protected Admin
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    }),
  ]

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-semibold">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
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