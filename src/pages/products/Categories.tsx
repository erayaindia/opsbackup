import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Edit2, Package, ChevronUp, ChevronDown } from 'lucide-react'
import { useCategories, Category } from '@/hooks/useCategories'

type SortField = 'name' | 'created_at' | 'status'
type SortDirection = 'asc' | 'desc'

export default function Categories() {
  const { categories, allCategories, loading, error, actions } = useCategories()
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editCategoryName, setEditCategoryName] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')


  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return

    try {
      setIsAdding(true)
      await actions.addCategory({ name: newCategoryName.trim() })
      setNewCategoryName('')
    } catch (err) {
      console.error('Error adding category:', err)
    } finally {
      setIsAdding(false)
    }
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setEditCategoryName(category.name)
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editCategoryName.trim()) return

    try {
      setIsEditing(true)
      await actions.updateCategory(editingCategory.id, { name: editCategoryName.trim() })
      setEditingCategory(null)
      setEditCategoryName('')
    } catch (err) {
      console.error('Error updating category:', err)
      alert(err instanceof Error ? err.message : 'Failed to update category')
    } finally {
      setIsEditing(false)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronUp className="h-4 w-4 text-muted-foreground" />
    }
    return sortDirection === 'asc'
      ? <ChevronUp className="h-4 w-4" />
      : <ChevronDown className="h-4 w-4" />
  }

  const sortedCategories = [...allCategories].sort((a, b) => {
    let aVal: string | number = a[sortField as keyof Category] || ''
    let bVal: string | number = b[sortField as keyof Category] || ''

    if (sortField === 'created_at') {
      aVal = new Date(aVal as string).getTime()
      bVal = new Date(bVal as string).getTime()
    } else {
      aVal = aVal.toString().toLowerCase()
      bVal = bVal.toString().toLowerCase()
    }

    if (sortDirection === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
    }
  })

  const displayCategories = sortedCategories

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="px-6 py-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading categories...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="px-6 py-6">
          <div className="text-center py-12">
            <p className="text-red-500">Error loading categories: {error}</p>
            <Button onClick={actions.refreshCategories} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="px-6 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground mt-2">Manage product categories and classifications</p>
        </div>

        {/* Add Category Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter category name..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                className="flex-1"
              />
              <Button
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim() || isAdding}
              >
                {isAdding ? 'Adding...' : 'Add Category'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Add Initial Categories Button */}
        {displayCategories.length === 0 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Categories Found</h3>
                <p className="text-muted-foreground mb-4">Get started by adding your first category above, or add some common categories:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['Jewelry', 'Personalized Jewelry', 'Mens Jewelry', 'Combos', 'Crochet', 'Crafted Cards'].map((categoryName) => (
                    <Button
                      key={categoryName}
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await actions.addCategory({ name: categoryName })
                        } catch (err) {
                          console.error('Error adding category:', err)
                        }
                      }}
                    >
                      Add {categoryName}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Categories Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Categories ({displayCategories.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 border-r border-border/50 text-left"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center justify-start gap-1">
                        <span>Category Name</span>
                        {getSortIcon('name')}
                      </div>
                    </TableHead>
                    <TableHead className="border-r border-border/50 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span>Type</span>
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 border-r border-border/50 text-center"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Created</span>
                        {getSortIcon('created_at')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 border-r border-border/50 text-center"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Status</span>
                        {getSortIcon('status')}
                      </div>
                    </TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayCategories.map((category, index) => (
                    <TableRow key={category.id || index}>
                      <TableCell className="border-r border-border/50 text-left">
                        <div className="flex items-center justify-start gap-3">
                          <div className="relative h-12 w-12 overflow-hidden border bg-muted rounded-sm">
                            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100">
                              <Package className="h-6 w-6 text-purple-400" />
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">{category.name}</div>
                            {category.description && (
                              <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {category.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-border/50 text-center">
                        <div className="flex justify-center">
                          <Badge variant="outline" className="rounded-none">
                            {category.parent_category_id ? 'Sub-category' : 'Main Category'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-border/50 text-center">
                        <div className="text-sm">
                          <div className="font-medium">{new Date(category.created_at).toLocaleDateString()}</div>
                          <div className="text-muted-foreground text-xs">
                            {new Date(category.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-border/50 text-center">
                        <div className="flex justify-center">
                          <Badge
                            variant="default"
                            className="rounded-none bg-green-100 text-green-800 hover:bg-green-100"
                          >
                            Active
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCategory(category)}
                            className="text-xs rounded-none"
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

          </CardContent>
        </Card>

        {/* Edit Category Dialog */}
        {editingCategory && (
          <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label htmlFor="editCategoryName" className="text-sm font-medium">
                    Category Name
                  </label>
                  <Input
                    id="editCategoryName"
                    value={editCategoryName}
                    onChange={(e) => setEditCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateCategory()}
                    placeholder="Enter category name..."
                    className="mt-1"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditingCategory(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateCategory}
                    disabled={!editCategoryName.trim() || isEditing}
                  >
                    {isEditing ? 'Updating...' : 'Update Category'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}