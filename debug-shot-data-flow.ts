// Debug script to test shot data flow
// Add this to your ContentDetail.tsx temporarily to debug

// Add this function to debug what data is being sent
export function debugShotDataFlow(shotList: any[]) {
  console.log('🔍 DEBUG: Shot List Data Flow');
  console.log('========================');
  
  shotList.forEach((shot, index) => {
    console.log(`Shot ${index + 1}:`);
    console.log('  UI Data:', {
      id: shot.id,
      description: shot.description,
      talent: shot.talent,
      lightingNotes: shot.lightingNotes,
      props: shot.props,
      location: shot.location
    });
    
    // This is what gets sent to saveShotList
    const mappedData = {
      shot_number: index + 1,
      shot_type: shot.shot_type || '',
      description: shot.description || '',
      duration: shot.duration || null,
      location: shot.location || '',
      equipment: shot.equipment || [],
      notes: shot.notes || '',
      status: shot.status || 'planned',
      order_index: index,
      action: shot.action || '',
      camera: shot.camera || '',
      background: shot.background || '',
      overlays: shot.overlays || '',
      assignee_id: shot.assignee_id || null,
      references: shot.references || [],
      completed: shot.completed || false,
      // NEW FIELDS - Check these carefully
      props: shot.props || [],
      talent: shot.talent || '',
      lighting_notes: shot.lightingNotes || '' // NOTE: lightingNotes -> lighting_notes
    };
    
    console.log('  Mapped for DB:', {
      talent: mappedData.talent,
      lighting_notes: mappedData.lighting_notes,
      props: mappedData.props
    });
    console.log('  Full mapped data:', mappedData);
    console.log('---');
  });
}

// Test function to insert a shot directly (for testing)
export async function testDirectShotInsert() {
  const { supabase } = await import('@/integrations/supabase/client');
  
  const testShot = {
    content_id: 'your-test-content-id', // Replace with actual content ID
    shot_number: 999,
    description: 'Test shot for debugging',
    talent: 'Test Model',
    lighting_notes: 'Test lighting setup',
    props: ['test prop 1', 'test prop 2'],
    location: 'Test Studio',
    camera: 'Wide shot',
    action: 'Test action',
    background: 'Test background',
    completed: false,
    order_index: 0
  };
  
  console.log('🧪 Testing direct shot insert:', testShot);
  
  const { data, error } = await supabase
    .from('shot_list')
    .insert([testShot])
    .select();
  
  if (error) {
    console.error('❌ Test insert failed:', error);
    return false;
  }
  
  console.log('✅ Test insert successful:', data);
  return true;
}

// Function to check what columns exist in the database
export async function checkDatabaseColumns() {
  const { supabase } = await import('@/integrations/supabase/client');
  
  // Query to get table structure
  const { data, error } = await supabase
    .from('shot_list')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('❌ Failed to check columns:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('📋 Available columns in shot_list:', Object.keys(data[0]));
  } else {
    console.log('📋 Table is empty, cannot determine columns');
  }
}

// Call these functions in your browser console or temporarily in your component:
// debugShotDataFlow(editable.shotList)
// testDirectShotInsert()
// checkDatabaseColumns()