import { supabase } from '@/integrations/supabase/client';

export async function linkUserAccount(email: string) {
  try {
    console.log(`🔗 Attempting to link user account for ${email}`);
    
    // Get current auth user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      console.error('❌ No authenticated user found:', authError);
      return { success: false, error: 'No authenticated user' };
    }

    console.log(`✅ Auth user found: ${authUser.email} (ID: ${authUser.id})`);

    // Find the app user by email
    const { data: appUser, error: findError } = await supabase
      .from('app_users')
      .select('id, auth_user_id, company_email, full_name')
      .eq('company_email', email.toLowerCase())
      .single();

    if (findError || !appUser) {
      console.error('❌ App user not found in database:', findError);
      return { success: false, error: 'App user not found in database' };
    }

    console.log(`✅ App user found:`, appUser);

    // Check if already linked
    if (appUser.auth_user_id === authUser.id) {
      console.log('✅ User already properly linked');
      return { success: true, message: 'User already linked' };
    }

    // Use our emergency update method that bypasses the database issues
    const { emergencyUpdateUser } = await import('./emergencyUserUpdate');
    
    const updateResult = await emergencyUpdateUser(appUser.id, {
      auth_user_id: authUser.id,
      updated_at: new Date().toISOString()
    });

    if (!updateResult.success) {
      console.error('❌ Failed to link accounts via emergency update:', updateResult.error);
      return { success: false, error: updateResult.error };
    }

    console.log(`✅ Successfully linked auth user ${authUser.id} to app user ${appUser.id}`);
    return { 
      success: true, 
      message: `Successfully linked ${authUser.email} to ${appUser.full_name}` 
    };

  } catch (error) {
    console.error('❌ Error in linkUserAccount:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}