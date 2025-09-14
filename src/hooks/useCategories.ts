import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: string;
  name: string;
  parent_category_id?: string;
  created_at: string;
  updated_at: string;
  parent_category?: {
    name: string;
  };
  subcategories?: Category[];
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('product_categories')
        .select(`
          *,
          parent_category:product_categories!parent_category_id (
            name
          )
        `)
        .order('name');

      if (error) throw error;

      // Build hierarchy
      const categoryMap = new Map<string, Category>();
      const rootCategories: Category[] = [];

      // First pass: create all categories
      data?.forEach(cat => {
        const category: Category = {
          ...cat,
          subcategories: []
        };
        categoryMap.set(cat.id, category);
      });

      // Second pass: build hierarchy
      data?.forEach(cat => {
        const category = categoryMap.get(cat.id);
        if (!category) return;

        if (cat.parent_category_id) {
          const parent = categoryMap.get(cat.parent_category_id);
          if (parent) {
            parent.subcategories = parent.subcategories || [];
            parent.subcategories.push(category);
          }
        } else {
          rootCategories.push(category);
        }
      });

      setCategories(rootCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getAllCategories = () => {
    const flatCategories: Category[] = [];
    
    const flatten = (cats: Category[]) => {
      cats.forEach(cat => {
        flatCategories.push(cat);
        if (cat.subcategories) {
          flatten(cat.subcategories);
        }
      });
    };
    
    flatten(categories);
    return flatCategories;
  };

  const addCategory = async (categoryData: {
    name: string;
    parent_category_id?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .insert(categoryData)
        .select()
        .single();

      if (error) throw error;

      await fetchCategories(); // Refresh the list
      return data;
    } catch (err) {
      console.error('Error adding category:', err);
      throw err;
    }
  };

  const updateCategory = async (id: string, updates: {
    name?: string;
    parent_category_id?: string;
  }) => {
    try {
      const { error } = await supabase
        .from('product_categories')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchCategories(); // Refresh the list
    } catch (err) {
      console.error('Error updating category:', err);
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      // Check if category has products
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('category_id', id)
        .limit(1);

      if (products && products.length > 0) {
        throw new Error('Cannot delete category that contains products');
      }

      // Check if category has subcategories
      const { data: subcategories } = await supabase
        .from('product_categories')
        .select('id')
        .eq('parent_category_id', id)
        .limit(1);

      if (subcategories && subcategories.length > 0) {
        throw new Error('Cannot delete category that has subcategories');
      }

      const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchCategories(); // Refresh the list
    } catch (err) {
      console.error('Error deleting category:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    allCategories: getAllCategories(),
    loading,
    error,
    actions: {
      addCategory,
      updateCategory,
      deleteCategory,
      refreshCategories: fetchCategories
    }
  };
};