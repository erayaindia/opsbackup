import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EmployeeAttendanceData {
  id: string;
  employee_id: string | null;
  full_name: string;
  department: string | null;
  designation: string | null;
  status: 'active' | 'inactive';
  isCheckedIn: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
  lastActivity: string;
  attendanceStatus: 'present' | 'late' | 'absent' | 'checked_out';
}

export function useEmployeeAttendance() {
  const [employees, setEmployees] = useState<EmployeeAttendanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployeeAttendance();
  }, []);

  const fetchEmployeeAttendance = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get today's date range
      const today = new Date().toISOString().split('T')[0];
      const startOfDay = `${today}T00:00:00.000Z`;
      const endOfDay = `${today}T23:59:59.999Z`;

      // Fetch all app users (employees)
      const { data: appUsers, error: usersError } = await supabase
        .from('app_users')
        .select('id, employee_id, full_name, department, designation, status, role')
        .order('full_name');

      if (usersError) {
        throw usersError;
      }

      if (!appUsers) {
        setEmployees([]);
        return;
      }

      // Fetch today's attendance records
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('*')
        .gte('check_in_time', startOfDay)
        .lt('check_in_time', endOfDay);

      if (attendanceError) {
        console.warn('Error fetching attendance records:', attendanceError);
        // Continue with just user data if attendance fetch fails
      }

      // Combine user data with attendance data
      const employeeAttendanceData: EmployeeAttendanceData[] = appUsers.map(user => {
        // Find today's attendance record for this user
        const todayAttendance = attendanceRecords?.find(
          record => record.app_user_id === user.id || record.employee_id === user.employee_id
        );

        const isCheckedIn = todayAttendance ? !todayAttendance.check_out_time : false;
        const attendanceStatus = todayAttendance?.status || 'absent';

        // Determine last activity based on attendance data
        let lastActivity = 'Not checked in today';
        if (todayAttendance) {
          if (todayAttendance.check_out_time) {
            lastActivity = `Checked out at ${new Date(todayAttendance.check_out_time).toLocaleTimeString()}`;
          } else {
            const checkInTime = new Date(todayAttendance.check_in_time).toLocaleTimeString();
            switch (attendanceStatus) {
              case 'present':
                lastActivity = `Present since ${checkInTime}`;
                break;
              case 'late':
                lastActivity = `Late arrival at ${checkInTime}`;
                break;
              default:
                lastActivity = `Checked in at ${checkInTime}`;
            }
          }
        }

        return {
          id: user.id,
          employee_id: user.employee_id,
          full_name: user.full_name || 'Unknown Employee',
          department: user.department,
          designation: user.designation || user.role,
          status: user.status as 'active' | 'inactive',
          isCheckedIn,
          checkInTime: todayAttendance?.check_in_time || null,
          checkOutTime: todayAttendance?.check_out_time || null,
          lastActivity,
          attendanceStatus: attendanceStatus as 'present' | 'late' | 'absent' | 'checked_out'
        };
      });

      setEmployees(employeeAttendanceData);
    } catch (err) {
      console.error('Error fetching employee attendance:', err);
      setError('Failed to fetch employee attendance data');
    } finally {
      setLoading(false);
    }
  };

  const getOnlineCount = () => {
    return employees.filter(emp => emp.isCheckedIn && emp.status === 'active').length;
  };

  const getCheckedInCount = () => {
    return employees.filter(emp => emp.isCheckedIn).length;
  };

  const getTotalActiveEmployees = () => {
    return employees.filter(emp => emp.status === 'active').length;
  };

  // Refresh data function for real-time updates
  const refreshData = () => {
    fetchEmployeeAttendance();
  };

  return {
    employees,
    loading,
    error,
    getOnlineCount,
    getCheckedInCount,
    getTotalActiveEmployees,
    refreshData
  };
}