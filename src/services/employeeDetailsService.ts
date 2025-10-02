import { supabase } from '@/integrations/supabase/client';

export interface EmployeeDetails {
  id: string;
  app_user_id: string;
  employee_id: string;
  personal_email: string;
  personal_phone: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  date_of_birth: string;
  nationality: string;
  national_id: string;
  passport_number: string;
  visa_status: string;
  visa_expiry: string;
  work_permit_number: string;
  work_permit_expiry: string;
  address: string;
  bank_name: string;
  account_number: string;
  iban: string;
  salary: number;
  position: string;
  employment_type: string;
  probation_period: number;
  manager: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserWithEmployeeDetails {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department: string;
  joined_at: string;
  created_at: string;
  employee_details?: EmployeeDetails;
}

export interface CreateEmployeeDetailsData {
  app_user_id: string;
  employee_id: string;
  personal_email: string;
  personal_phone: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  date_of_birth: string;
  nationality: string;
  national_id: string;
  passport_number?: string;
  visa_status?: string;
  visa_expiry?: string;
  work_permit_number?: string;
  work_permit_expiry?: string;
  address: string;
  bank_name: string;
  account_number: string;
  iban: string;
  salary: number;
  position: string;
  employment_type: string;
  probation_period: number;
  manager: string;
  start_date: string;
  end_date?: string;
}

export interface UpdateEmployeeDetailsData extends Partial<CreateEmployeeDetailsData> {}

export const employeeDetailsService = {
  // Fetch users with employee details
  async fetchUsersWithEmployeeDetails(): Promise<UserWithEmployeeDetails[]> {
    try {
      // Fetch all users
      const { data: users, error: usersError } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Error fetching users:', usersError);
        throw new Error(`Failed to fetch users: ${usersError.message}`);
      }

      if (!users || users.length === 0) {
        return [];
      }

      // Fetch employee details for all users (employees_details contains all employee info including onboarding data)
      const userIds = users.map(user => user.id);
      const { data: employeeDetails, error: detailsError } = await supabase
        .from('employees_details')
        .select('*')
        .in('app_user_id', userIds);

      if (detailsError) {
        console.error('Error fetching employee details:', detailsError);
        // Don't throw error here, just log it and continue without details
      }

      console.log('🔍 Fetched employee_details records:', employeeDetails?.length || 0);
      if (employeeDetails && employeeDetails.length > 0) {
        console.log('📋 Sample employee_details:', employeeDetails[0]);
        console.log('🔗 app_user_ids in employee_details:', employeeDetails.map(d => d.app_user_id));
      }

      // Also check for records with NULL app_user_id
      const { data: orphanedRecords } = await supabase
        .from('employees_details')
        .select('*')
        .is('app_user_id', null);

      if (orphanedRecords && orphanedRecords.length > 0) {
        console.log('⚠️ Found employee_details with NULL app_user_id:', orphanedRecords.length);
        console.log('📋 Orphaned records:', orphanedRecords);
      }

      // Combine users with their employee details
      const usersWithDetails: UserWithEmployeeDetails[] = users.map(user => ({
        ...user,
        employee_details: employeeDetails?.find(detail => detail.app_user_id === user.id) || undefined
      }));

      return usersWithDetails;
    } catch (error) {
      console.error('Error in fetchUsersWithEmployeeDetails:', error);
      throw error;
    }
  },

  // Create employee details
  async createEmployeeDetails(data: CreateEmployeeDetailsData): Promise<EmployeeDetails> {
    try {
      const { data: employeeDetails, error } = await supabase
        .from('employees_details')
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error('Error creating employee details:', error);
        throw new Error(`Failed to create employee details: ${error.message}`);
      }

      return employeeDetails;
    } catch (error) {
      console.error('Error in createEmployeeDetails:', error);
      throw error;
    }
  },

  // Update employee details
  async updateEmployeeDetails(appUserId: string, updates: UpdateEmployeeDetailsData): Promise<EmployeeDetails> {
    try {
      const { data: employeeDetails, error } = await supabase
        .from('employees_details')
        .update(updates)
        .eq('app_user_id', appUserId)
        .select()
        .single();

      if (error) {
        console.error('Error updating employee details:', error);
        throw new Error(`Failed to update employee details: ${error.message}`);
      }

      return employeeDetails;
    } catch (error) {
      console.error('Error in updateEmployeeDetails:', error);
      throw error;
    }
  },

  // Delete employee details
  async deleteEmployeeDetails(appUserId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('employees_details')
        .delete()
        .eq('app_user_id', appUserId);

      if (error) {
        console.error('Error deleting employee details:', error);
        throw new Error(`Failed to delete employee details: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteEmployeeDetails:', error);
      throw error;
    }
  },

  // Get employee details by app_user_id
  async getEmployeeDetailsByUserId(appUserId: string): Promise<EmployeeDetails | null> {
    try {
      const { data: employeeDetails, error } = await supabase
        .from('employees_details')
        .select('*')
        .eq('app_user_id', appUserId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return null;
        }
        console.error('Error fetching employee details:', error);
        throw new Error(`Failed to fetch employee details: ${error.message}`);
      }

      return employeeDetails;
    } catch (error) {
      console.error('Error in getEmployeeDetailsByUserId:', error);
      throw error;
    }
  }
};