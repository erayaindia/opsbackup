import { supabase } from '@/integrations/supabase/client'
import { format } from 'date-fns'

export interface CourierHandoverItem {
  id: string
  order_number: string | null
  awb_number: string | null
  courier: string
  bag_letter: string | null
  batch_id: string | null
  scan_type: 'awb' | 'order_id'
  scanned_by: string
  scanned_at: string
  is_manual_entry: boolean
  is_duplicate: boolean
  status: 'scanned' | 'handed_over' | 'cancelled'
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
}

export interface CreateCourierHandoverItem {
  order_number?: string
  awb_number?: string
  courier: string
  bag_letter?: string
  batch_id?: string
  scan_type: 'awb' | 'order_id'
  is_manual_entry?: boolean
}

export interface UpdateCourierHandoverItem {
  order_number?: string
  awb_number?: string
  courier?: string
  bag_letter?: string
  batch_id?: string
  scan_type?: 'awb' | 'order_id'
  status?: 'scanned' | 'handed_over' | 'cancelled'
}

export interface CourierHandoverFilters {
  courier?: string
  bag_letter?: string
  date_from?: string
  date_to?: string
  search?: string
  status?: string
  quick_filter?: 'all' | 'recent' | 'duplicates'
}

export interface CourierHandoverSummary {
  total_items: number
  courier: string
  bag_letter: string
  scanned_today: number
  manual_entries: number
  duplicates_prevented: number
}

// CRUD Functions

/**
 * Create a new courier handover item
 */
export async function createCourierHandoverItem(item: CreateCourierHandoverItem) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Check for duplicates first
    const isDuplicate = await checkForDuplicates(item.order_number, item.awb_number)
    if (isDuplicate) {
      throw new Error('Duplicate item detected: This order/AWB has already been scanned')
    }

    const { data, error } = await supabase
      .from('courier_handover_items')
      .insert({
        ...item,
        scanned_by: user.id,
        created_by: user.id,
        updated_by: user.id
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error creating courier handover item:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get courier handover items with filters, pagination, and sorting
 */
export async function getCourierHandoverItems({
  filters = {},
  page = 1,
  limit = 10,
  sortBy = 'scanned_at',
  sortOrder = 'desc'
}: {
  filters?: CourierHandoverFilters
  page?: number
  limit?: number
  sortBy?: keyof CourierHandoverItem
  sortOrder?: 'asc' | 'desc'
} = {}) {
  try {
    let query = supabase
      .from('courier_handover_items')
      .select('*', { count: 'exact' })

    // Apply filters
    if (filters.courier) {
      query = query.eq('courier', filters.courier)
    }

    if (filters.bag_letter) {
      query = query.eq('bag_letter', filters.bag_letter)
    }

    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    // Show all items including cancelled ones - no default exclusion

    if (filters.date_from) {
      query = query.gte('scanned_at', filters.date_from)
    }

    if (filters.date_to) {
      // Add 1 day and set to start of day to include the entire end date
      const endDate = new Date(filters.date_to)
      endDate.setDate(endDate.getDate() + 1)
      query = query.lt('scanned_at', endDate.toISOString())
    }

    if (filters.search) {
      query = query.or(
        `order_number.ilike.%${filters.search}%,awb_number.ilike.%${filters.search}%,courier.ilike.%${filters.search}%`
      )
    }

    if (filters.quick_filter === 'recent') {
      const yesterday = new Date()
      yesterday.setHours(yesterday.getHours() - 24)
      query = query.gte('scanned_at', yesterday.toISOString())
    } else if (filters.quick_filter === 'duplicates') {
      query = query.eq('is_duplicate', true)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    return {
      data,
      count: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      error: null
    }
  } catch (error) {
    console.error('Error fetching courier handover items:', error)
    return { data: null, count: 0, page, limit, totalPages: 0, error: error as Error }
  }
}

/**
 * Get a single courier handover item by ID
 */
export async function getCourierHandoverItem(id: string) {
  try {
    const { data, error } = await supabase
      .from('courier_handover_items')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching courier handover item:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Update a courier handover item
 */
export async function updateCourierHandoverItem(id: string, updates: UpdateCourierHandoverItem) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Check for duplicates if order_number or awb_number is being updated
    if (updates.order_number || updates.awb_number) {
      const isDuplicate = await checkForDuplicates(
        updates.order_number,
        updates.awb_number,
        id
      )
      if (isDuplicate) {
        throw new Error('Duplicate item detected: This order/AWB already exists')
      }
    }

    const { data, error } = await supabase
      .from('courier_handover_items')
      .update({
        ...updates,
        updated_by: user.id
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error updating courier handover item:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Delete a courier handover item (soft delete by setting status to cancelled)
 */
export async function deleteCourierHandoverItem(id: string, hardDelete = false) {
  try {
    if (hardDelete) {
      const { data, error } = await supabase
        .from('courier_handover_items')
        .delete()
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } else {
      // Soft delete by updating status
      return await updateCourierHandoverItem(id, { status: 'cancelled' })
    }
  } catch (error) {
    console.error('Error deleting courier handover item:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Bulk delete multiple courier handover items
 */
export async function bulkDeleteCourierHandoverItems(ids: string[], hardDelete = false) {
  try {
    if (hardDelete) {
      const { data, error } = await supabase
        .from('courier_handover_items')
        .delete()
        .in('id', ids)
        .select()

      if (error) throw error
      return { data, error: null }
    } else {
      // Soft delete by updating status
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('courier_handover_items')
        .update({ status: 'cancelled', updated_by: user.id })
        .in('id', ids)
        .select()

      if (error) throw error
      return { data, error: null }
    }
  } catch (error) {
    console.error('Error bulk deleting courier handover items:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Check for duplicate items
 */
export async function checkForDuplicates(
  orderNumber?: string,
  awbNumber?: string,
  excludeId?: string
) {
  try {
    const { data, error } = await supabase.rpc('check_courier_handover_duplicate', {
      p_order_number: orderNumber || null,
      p_awb_number: awbNumber || null,
      p_exclude_id: excludeId || null
    })

    if (error) throw error
    return data || false
  } catch (error) {
    console.error('Error checking for duplicates:', error)
    return false
  }
}

/**
 * Get courier handover summary statistics
 */
export async function getCourierHandoverSummary(filters: {
  courier?: string
  bag_letter?: string
  date_from?: string
  date_to?: string
} = {}) {
  try {
    const { data, error } = await supabase.rpc('get_courier_handover_summary', {
      p_courier: filters.courier || null,
      p_bag_letter: filters.bag_letter || null,
      p_date_from: filters.date_from || null,
      p_date_to: filters.date_to || null
    })

    if (error) throw error
    return { data: data as CourierHandoverSummary[], error: null }
  } catch (error) {
    console.error('Error fetching courier handover summary:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Export courier handover items to CSV format
 */
export async function exportCourierHandoverItems(filters: CourierHandoverFilters = {}) {
  try {
    const { data } = await getCourierHandoverItems({
      filters,
      page: 1,
      limit: 10000, // Large limit to get all items
      sortBy: 'scanned_at',
      sortOrder: 'desc'
    })

    if (!data) throw new Error('No data to export')

    // Convert to CSV format
    const headers = [
      'Order ID',
      'AWB Number',
      'Courier',
      'Bag/Batch',
      'Scanned By',
      'Date',
      'Time',
      'Status',
      'Scan Type',
      'Manual Entry'
    ]

    const csvData = data.map(item => [
      item.order_number || 'N/A',
      (item.awb_number || 'N/A') + ',', // Add comma at the end of AWB number
      item.courier,
      item.bag_letter || '-',
      'Current User', // You might want to fetch actual user names
      format(new Date(item.scanned_at), 'dd/MM/yyyy'),
      format(new Date(item.scanned_at), 'HH:mm') + ' IST',
      item.status,
      item.scan_type,
      item.is_manual_entry ? 'Yes' : 'No'
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    return { data: csvContent, error: null }
  } catch (error) {
    console.error('Error exporting courier handover items:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Mark items as handed over
 */
export async function markItemsAsHandedOver(ids: string[]) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('courier_handover_items')
      .update({
        status: 'handed_over',
        updated_by: user.id
      })
      .in('id', ids)
      .select()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error marking items as handed over:', error)
    return { data: null, error: error as Error }
  }
}