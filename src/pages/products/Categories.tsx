import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Edit2, Trash2, Package } from 'lucide-react'
import { useCategories, Category } from '@/hooks/useCategories'

export default function Categories() {
  const { categories, allCategories, loading, error, actions } = useCategories()
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editCategoryName, setEditCategoryName] = useState('')
  const [isEditing, setIsEditing] = useState(false)


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

  const handleDeleteCategory = async (id: string, categoryName: string) => {
    if (window.confirm(`Are you sure you want to delete "${categoryName}"? This action cannot be undone.`)) {
      try {
        await actions.deleteCategory(id)
      } catch (err) {
        console.error('Error deleting category:', err)
        alert(err instanceof Error ? err.message : 'Failed to delete category')
      }
    }
  }

  const displayCategories = allCategories

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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayCategories.map((category, index) => (
                    <TableRow key={category.id || index}>
                      <TableCell className="font-medium">
                        {category.name}
                        {category.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {category.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {category.parent_category_id ? 'Sub-category' : 'Main Category'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(category.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleEditCategory(category)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteCategory(category.id, category.name)}
                          >
                            <Trash2 className="h-4 w-4" />
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