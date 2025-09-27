import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';

interface AttendanceStatus {
  isPresent: boolean;
  isLoading: boolean;
  attendanceRecord: any | null;
  error: string | null;
}

export const useUserAttendanceStatus = (): AttendanceStatus => {
  const [isPresent, setIsPresent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [attendanceRecord, setAttendanceRecord] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { profile, loading: profileLoading } = useUserProfile();

  const checkUserAttendance = async () => {
    if (profileLoading || !profile?.appUser) {
      setIsLoading(false);
      return;
    }

    // Super admins don't need to check in
    if (profile.appUser.role === 'super_admin') {
      setIsPresent(true);
      setAttendanceRecord(null);
      setIsLoading(false);
      return;
    }

    // If no employee_id, user doesn't need attendance tracking
    if (!profile.appUser.employee_id) {
      setIsPresent(true);
      setAttendanceRecord(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const startOfDay = `${today}T00:00:00.000Z`;
      const endOfDay = `${today}T23:59:59.999Z`;

      // Check if user has checked in today
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', profile.appUser.employee_id)
        .gte('check_in_time', startOfDay)
        .lt('check_in_time', endOfDay)
        .maybeSingle();

      if (attendanceError && attendanceError.code !== 'PGRST116') {
        throw attendanceError;
      }

      if (attendanceData) {
        setIsPresent(true);
        setAttendanceRecord(attendanceData);
      } else {
        setIsPresent(false);
        setAttendanceRecord(null);
      }
    } catch (err) {
      console.error('Error checking user attendance:', err);
      setError(err instanceof Error ? err.message : 'Failed to check attendance');
      setIsPresent(false);
      setAttendanceRecord(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkUserAttendance();

    // Only set up subscription if user needs attendance tracking
    let subscription: any = null;

    if (profile?.appUser?.role !== 'super_admin' && profile?.appUser?.employee_id) {
      // Set up real-time subscription for attendance updates
      subscription = supabase
        .channel('user_attendance_changes')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'attendance_records'
          },
          (payload) => {
            // Only refresh if the change affects current user
            if (payload.new?.employee_id === profile?.appUser?.employee_id ||
                payload.old?.employee_id === profile?.appUser?.employee_id) {
              checkUserAttendance();
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [profile?.appUser?.employee_id, profile?.appUser?.role, profileLoading]);

  return {
    isPresent,
    isLoading,
    attendanceRecord,
    error
  };
};