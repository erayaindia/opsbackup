import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';

type AttendanceRecord = Database['public']['Tables']['attendance_records']['Row'];
type AppUser = Database['public']['Tables']['app_users']['Row'];

export interface AttendanceSummaryStats {
  totalEmployees: number;
  averageAttendanceRate: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
}

export interface DailyAttendanceData {
  date: string;
  present: number;
  late: number;
  absent: number;
  total: number;
}

export interface EmployeeAttendanceData {
  employeeId: string;
  employeeName: string;
  department: string;
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  attendanceRate: number;
  profilePictureUrl: string | null;
}

export interface AttendanceSummaryData {
  stats: AttendanceSummaryStats;
  chartData: DailyAttendanceData[];
  employeeData: EmployeeAttendanceData[];
}

export type ViewType = 'week' | 'month' | 'year';

export const useAttendanceSummary = (viewType: ViewType, selectedDate: Date, selectedDepartment?: string) => {
  const [data, setData] = useState<AttendanceSummaryData>({
    stats: {
      totalEmployees: 0,
      averageAttendanceRate: 0,
      presentDays: 0,
      lateDays: 0,
      absentDays: 0,
    },
    chartData: [],
    employeeData: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDateRange = (type: ViewType, date: Date) => {
    switch (type) {
      case 'week':
        return {
          start: startOfWeek(date, { weekStartsOn: 1 }), // Monday start
          end: endOfWeek(date, { weekStartsOn: 1 }),
        };
      case 'month':
        return {
          start: startOfMonth(date),
          end: endOfMonth(date),
        };
      case 'year':
        return {
          start: startOfYear(date),
          end: endOfYear(date),
        };
    }
  };

  const fetchAttendanceSummary = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { start, end } = getDateRange(viewType, selectedDate);
      const startStr = format(start, 'yyyy-MM-dd');
      const endStr = format(end, 'yyyy-MM-dd');

      // Fetch all active employees (excluding super_admin)
      let employeesQuery = supabase
        .from('app_users')
        .select('*')
        .eq('status', 'active')
        .neq('role', 'super_admin');

      if (selectedDepartment && selectedDepartment !== 'all') {
        employeesQuery = employeesQuery.eq('department', selectedDepartment);
      }

      const { data: employees, error: employeesError } = await employeesQuery;
      if (employeesError) throw employeesError;

      // Fetch employee details separately
      const { data: employeeDetails, error: employeeDetailsError } = await supabase
        .from('employees_details')
        .select('id, personal_email, company_email, documents');

      if (employeeDetailsError) {
        console.error('Error fetching employee details:', employeeDetailsError);
      }

      // Fetch attendance records for the date range
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('*')
        .gte('check_in_time', `${startStr}T00:00:00`)
        .lte('check_in_time', `${endStr}T23:59:59`);

      if (attendanceError) throw attendanceError;

      // Create date intervals based on view type
      let dateIntervals: Date[] = [];
      switch (viewType) {
        case 'week':
          dateIntervals = eachDayOfInterval({ start, end });
          break;
        case 'month':
          dateIntervals = eachDayOfInterval({ start, end });
          break;
        case 'year':
          dateIntervals = eachMonthOfInterval({ start, end });
          break;
      }

      // Generate chart data
      const chartData: DailyAttendanceData[] = dateIntervals.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayRecords = attendanceRecords?.filter(record => {
          const recordDate = format(new Date(record.check_in_time), 'yyyy-MM-dd');
          return recordDate === dateStr;
        }) || [];

        const present = dayRecords.filter(r => r.status === 'present' || r.status === 'checked_out').length;
        const late = dayRecords.filter(r => r.status === 'late').length;
        const totalEmployeesForDay = employees?.length || 0;
        const absent = totalEmployeesForDay - present - late;

        return {
          date: viewType === 'year' ? format(date, 'MMM yyyy') : format(date, 'MMM dd'),
          present,
          late,
          absent: Math.max(0, absent),
          total: totalEmployeesForDay,
        };
      });

      // Generate signed URLs for profile pictures
      const getProfilePictureUrl = async (employee: any): Promise<string | null> => {
        // Find matching employee details by email
        const matchingDetails = employeeDetails?.find((details: any) =>
          details.personal_email === employee.personal_email ||
          details.company_email === employee.company_email ||
          details.personal_email === employee.company_email ||
          details.company_email === employee.personal_email
        );

        if (!matchingDetails?.documents || !Array.isArray(matchingDetails.documents)) {
          return null;
        }

        // Find the profile photo document
        const photoDoc = matchingDetails.documents.find((doc: any) => doc.type === 'Photo');
        if (!photoDoc?.path) {
          return null;
        }

        try {
          const { data, error } = await supabase.storage
            .from('employee-documents')
            .createSignedUrl(photoDoc.path, 3600);

          return error ? null : data?.signedUrl || null;
        } catch (error) {
          console.error('Failed to get signed URL for profile picture:', error);
          return null;
        }
      };

      // Calculate employee-specific data
      const employeeData: EmployeeAttendanceData[] = await Promise.all(
        (employees || []).map(async (employee) => {
          const employeeRecords = attendanceRecords?.filter(record =>
            record.app_user_id === employee.id ||
            (record.employee_id && record.employee_id === employee.employee_id)
          ) || [];

          const presentDays = employeeRecords.filter(r => r.status === 'present' || r.status === 'checked_out').length;
          const lateDays = employeeRecords.filter(r => r.status === 'late').length;
          const totalDays = dateIntervals.length;
          const absentDays = totalDays - presentDays - lateDays;
          const attendanceRate = totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 0;

          // Get profile picture URL
          const profilePictureUrl = await getProfilePictureUrl(employee);

          return {
            employeeId: employee.employee_id || employee.id,
            employeeName: employee.full_name || 'Unknown',
            department: employee.department || 'Unknown',
            totalDays,
            presentDays,
            lateDays,
            absentDays: Math.max(0, absentDays),
            attendanceRate,
            profilePictureUrl,
          };
        })
      );

      // Calculate overall stats
      const totalEmployees = employees?.length || 0;
      const totalPresentDays = employeeData.reduce((sum, emp) => sum + emp.presentDays, 0);
      const totalLateDays = employeeData.reduce((sum, emp) => sum + emp.lateDays, 0);
      const totalAbsentDays = employeeData.reduce((sum, emp) => sum + emp.absentDays, 0);
      const totalPossibleDays = totalEmployees * dateIntervals.length;
      const averageAttendanceRate = totalPossibleDays > 0
        ? Math.round(((totalPresentDays + totalLateDays) / totalPossibleDays) * 100)
        : 0;

      setData({
        stats: {
          totalEmployees,
          averageAttendanceRate,
          presentDays: totalPresentDays,
          lateDays: totalLateDays,
          absentDays: totalAbsentDays,
        },
        chartData,
        employeeData,
      });

    } catch (err) {
      console.error('Error fetching attendance summary:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceSummary();
  }, [viewType, selectedDate, selectedDepartment]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchAttendanceSummary,
  };
};