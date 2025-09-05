// Example Supabase update calls for the new shot_list fields
// Usage examples for the updated shot list functionality

import { supabase } from '@/integrations/supabase/client';

// Example 1: Creating a new shot with all new fields
export async function createShotExample() {
  const { data, error } = await supabase
    .from('shot_list')
    .insert([
      {
        content_id: 'your-content-id',
        shot_number: 1,
        description: 'Opening scene with product showcase',
        camera: 'Medium shot',
        action: 'Model holds necklace up to camera',
        background: 'White studio backdrop with soft shadows',
        location: 'studio', // NEW FIELD
        props: ['necklace', 'packaging box', 'table', 'lights'], // NEW FIELD - array
        talent: 'Model', // NEW FIELD
        lighting_notes: 'Soft light from left, backlit for rim lighting', // NEW FIELD
        references: ['https://example.com/reference1.jpg'],
        completed: false,
        order_index: 0
      }
    ]);

  if (error) {
    console.error('Error creating shot:', error);
    return null;
  }

  return data;
}

// Example 2: Updating an existing shot with new fields
export async function updateShotExample(shotId: string) {
  const { data, error } = await supabase
    .from('shot_list')
    .update({
      location: 'outdoor',
      props: ['bracelet', 'natural stones', 'wooden table'],
      talent: 'Hand model',
      lighting_notes: 'Natural light, golden hour'
    })
    .eq('id', shotId);

  if (error) {
    console.error('Error updating shot:', error);
    return null;
  }

  return data;
}

// Example 3: Querying shots with new fields
export async function fetchShotsWithNewFields(contentId: string) {
  const { data, error } = await supabase
    .from('shot_list')
    .select(`
      id,
      shot_number,
      description,
      camera,
      action,
      background,
      location,
      props,
      talent,
      lighting_notes,
      references,
      completed,
      order_index,
      created_at,
      updated_at
    `)
    .eq('content_id', contentId)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching shots:', error);
    return [];
  }

  return data;
}

// Example 4: Bulk update shots (useful for drag-reorder)
export async function bulkUpdateShotsExample(shots: Array<{id: string, order_index: number}>) {
  const updates = shots.map(shot => 
    supabase
      .from('shot_list')
      .update({ order_index: shot.order_index })
      .eq('id', shot.id)
  );

  const results = await Promise.all(updates);
  
  // Check for errors
  const errors = results.filter(result => result.error);
  if (errors.length > 0) {
    console.error('Bulk update errors:', errors);
    return false;
  }

  return true;
}

// Example 5: Search shots by location or talent
export async function searchShotsByNewFields(contentId: string, searchTerm: string) {
  const { data, error } = await supabase
    .from('shot_list')
    .select('*')
    .eq('content_id', contentId)
    .or(`location.ilike.%${searchTerm}%,talent.ilike.%${searchTerm}%,lighting_notes.ilike.%${searchTerm}%`);

  if (error) {
    console.error('Error searching shots:', error);
    return [];
  }

  return data;
}

// Example 6: Update props array (add/remove props)
export async function updatePropsExample(shotId: string, newProps: string[]) {
  // Validate props (trim whitespace, remove empty strings)
  const validatedProps = newProps
    .map(prop => prop.trim())
    .filter(prop => prop.length > 0);

  const { data, error } = await supabase
    .from('shot_list')
    .update({
      props: validatedProps
    })
    .eq('id', shotId);

  if (error) {
    console.error('Error updating props:', error);
    return null;
  }

  return data;
}

// Example 7: RLS-compatible query (if Row Level Security is enabled)
export async function fetchShotsWithRLS(contentId: string, userId: string) {
  const { data, error } = await supabase
    .from('shot_list')
    .select(`
      id,
      shot_number,
      description,
      camera,
      action,
      background,
      location,
      props,
      talent,
      lighting_notes,
      references,
      completed,
      order_index
    `)
    .eq('content_id', contentId)
    // Add any RLS-required filters here
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching shots with RLS:', error);
    return [];
  }

  return data;
}

// Type definition for the updated Shot interface
export interface UpdatedShot {
  id?: string;
  content_id: string;
  shot_number: number;
  description?: string;
  camera?: string;
  action?: string;
  background?: string;
  location?: string;          // NEW
  props?: string[];           // NEW
  talent?: string;            // NEW
  lighting_notes?: string;    // NEW
  references?: string[];
  completed?: boolean;
  order_index?: number;
  created_at?: string;
  updated_at?: string;
}