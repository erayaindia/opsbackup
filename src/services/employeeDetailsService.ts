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

export interface EmployeeApplication {
  id: string;
  app_user_id: string | null;
  status: string;
  full_name: string;
  personal_email: string;
  phone_number: string;
  date_of_birth: string;
  gender: string;
  designation: string;
  work_location: string;
  employment_type: string;
  joining_date: string;
  current_address: any;
  permanent_address: any;
  same_as_current: boolean;
  emergency_contact: any;
  bank_details: any;
  documents: any;
  nda_accepted: boolean;
  data_privacy_accepted: boolean;
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
  employee_application?: EmployeeApplication;
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

      // Fetch employee details for all users
      const userIds = users.map(user => user.id);
      const { data: employeeDetails, error: detailsError } = await supabase
        .from('employees_details')
        .select('*')
        .in('app_user_id', userIds);

      if (detailsError) {
        console.error('Error fetching employee details:', detailsError);
        // Don't throw error here, just log it and continue without details
      }

      // Fetch employee applications for all users
      const { data: employeeApplications, error: applicationsError } = await supabase
        .from('employee_applications')
        .select('*')
        .in('app_user_id', userIds);

      if (applicationsError) {
        console.error('Error fetching employee applications:', applicationsError);
        // Don't throw error here, just log it and continue without applications
      }

      // Combine users with their employee details and applications
      const usersWithDetails: UserWithEmployeeDetails[] = users.map(user => ({
        ...user,
        employee_details: employeeDetails?.find(detail => detail.app_user_id === user.id) || undefined,
        employee_application: employeeApplications?.find(app => app.app_user_id === user.id) || undefined
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