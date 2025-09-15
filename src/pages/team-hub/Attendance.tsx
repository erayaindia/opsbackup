import React from 'react';
import AttendanceDashboard from '@/components/attendance/AttendanceDashboard';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


const Attendance = () => {
  const navigate = useNavigate();





  const handleGoToCheckIn = () => {
    navigate('/checkin');
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Attendance Management</h1>
          <p className="text-muted-foreground mt-2">
            View attendance records, manage settings, and monitor employee check-ins.
          </p>
        </div>
        <Button
          onClick={handleGoToCheckIn}
          className="bg-primary hover:bg-primary/90"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Employee Check-in
        </Button>
      </div>

      <AttendanceDashboard />
    </div>
  );
};

export default Attendance;