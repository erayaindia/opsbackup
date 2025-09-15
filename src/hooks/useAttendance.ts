import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type AttendanceRecord = Database['public']['Tables']['attendance_records']['Row'];
type AppUser = Database['public']['Tables']['app_users']['Row'];

interface AttendanceStats {
  total_employees: number;
  present: number;
  late: number;
  absent: number;
  checked_out: number;
  attendance_rate: number;
}

interface EmployeeWithAttendance extends AppUser {
  attendance?: AttendanceRecord;
  status: 'present' | 'late' | 'absent' | 'checked_out';
}

export const useAttendance = () => {
  const [employees, setEmployees] = useState<EmployeeWithAttendance[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    total_employees: 0,
    present: 0,
    late: 0,
    absent: 0,
    checked_out: 0,
    attendance_rate: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTodayAttendance = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch all active employees from app_users
      const { data: appUsers, error: employeeError } = await supabase
        .from('app_users')
        .select('*')
        .eq('status', 'active');

      if (employeeError) throw employeeError;

      // Fetch today's attendance records
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('*')
        .gte('check_in_time', `${today}T00:00:00.000Z`)
        .lt('check_in_time', `${today}T23:59:59.999Z`);

      if (attendanceError) throw attendanceError;

      // Combine employee data with attendance records
      const employeesWithAttendance: EmployeeWithAttendance[] = appUsers.map(employee => {
        const attendanceRecord = attendanceRecords?.find(record =>
          record.app_user_id === employee.id ||
          (record.employee_id && record.employee_id === employee.employee_id)
        );

        let status: 'present' | 'late' | 'absent' | 'checked_out' = 'absent';

        if (attendanceRecord) {
          if (attendanceRecord.check_out_time) {
            status = 'checked_out';
          } else if (attendanceRecord.status === 'late') {
            status = 'late';
          } else {
            status = 'present';
          }
        }

        return {
          ...employee,
          attendance: attendanceRecord || undefined,
          status
        };
      });

      setEmployees(employeesWithAttendance);

      // Calculate statistics
      const presentCount = employeesWithAttendance.filter(e => e.status === 'present').length;
      const lateCount = employeesWithAttendance.filter(e => e.status === 'late').length;
      const absentCount = employeesWithAttendance.filter(e => e.status === 'absent').length;
      const checkedOutCount = employeesWithAttendance.filter(e => e.status === 'checked_out').length;
      const totalEmployees = employeesWithAttendance.length;

      setStats({
        total_employees: totalEmployees,
        present: presentCount,
        late: lateCount,
        absent: absentCount,
        checked_out: checkedOutCount,
        attendance_rate: totalEmployees > 0 ? Math.round(((presentCount + lateCount + checkedOutCount) / totalEmployees) * 100) : 0
      });

    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const checkIn = async (
    employeeId: string,
    appUserId: string,
    authUserId: string,
    locationData: {
      ip: string;
      latitude?: number;
      longitude?: number;
    },
    selfieBlob?: Blob
  ) => {
    try {
      let selfieUrl: string | null = null;

      // Upload selfie if provided
      if (selfieBlob) {
        const fileName = `attendance-selfies/${employeeId}-${Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('attendance-photos')
          .upload(fileName, selfieBlob);

        if (uploadError) throw uploadError;
        selfieUrl = uploadData.path;
      }

      // Create attendance record (status will be set by trigger)
      const attendanceRecord = {
        app_user_id: appUserId,
        auth_user_id: authUserId,
        employee_id: employeeId,
        check_in_time: new Date().toISOString(),
        selfie_url: selfieUrl,
        location_verified: true,
        ip_address: locationData.ip,
        gps_latitude: locationData.latitude,
        gps_longitude: locationData.longitude,
        notes: null
      };

      const { error } = await supabase
        .from('attendance_records')
        .insert([attendanceRecord]);

      if (error) throw error;

      // Refresh data
      await fetchTodayAttendance();

      return { success: true };
    } catch (error) {
      console.error('Check-in error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Check-in failed'
      };
    }
  };

  const checkOut = async (employeeId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('attendance_records')
        .update({
          check_out_time: new Date().toISOString(),
          status: 'checked_out'
        })
        .eq('employee_id', employeeId)
        .gte('check_in_time', `${today}T00:00:00.000Z`)
        .lt('check_in_time', `${today}T23:59:59.999Z`)
        .is('check_out_time', null);

      if (error) throw error;

      // Refresh data
      await fetchTodayAttendance();

      return { success: true };
    } catch (error) {
      console.error('Check-out error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Check-out failed'
      };
    }
  };

  const verifyEmployee = async (employeeId: string) => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('status', 'active')
        .single();

      if (error) throw error;

      return {
        success: true,
        employee: data
      };
    } catch (error) {
      console.error('Employee verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Employee not found'
      };
    }
  };

  useEffect(() => {
    fetchTodayAttendance();

    // Set up real-time subscription for attendance updates
    const subscription = supabase
      .channel('attendance_changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records'
        },
        () => {
          fetchTodayAttendance();
        }
      )
      .subscribe();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchTodayAttendance, 5 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return {
    employees,
    stats,
    isLoading,
    error,
    checkIn,
    checkOut,
    verifyEmployee,
    refresh: fetchTodayAttendance
  };
};

export default useAttendance;