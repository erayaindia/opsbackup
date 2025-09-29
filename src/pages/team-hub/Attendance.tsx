import React from 'react';
import AttendanceDashboard from '@/components/attendance/AttendanceDashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, BarChart, Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserPermissions } from '@/components/PermissionGuard';

const Attendance = () => {
  const navigate = useNavigate();
  const { hasRole, loading, currentUser } = useUserPermissions();

  const handleGoToCheckIn = () => {
    navigate('/checkin');
  };

  const handleGoToSummary = () => {
    navigate('/attendance/summary');
  };

  // Show loading while checking permissions
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is admin or super admin
  const isAdminOrSuperAdmin = hasRole(['admin', 'super_admin']);

  // Regular user view - only check-in functionality
  if (!isAdminOrSuperAdmin) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Attendance Check-in</h1>
          <p className="text-muted-foreground">
            Click the button below to check in for your shift
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                Employee Check-in
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Ready to start your day? Click below to check in.
              </p>
              <Button
                onClick={handleGoToCheckIn}
                className="w-full bg-primary hover:bg-primary/90"
                size="lg"
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Check In Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Admin/Super Admin view - full attendance dashboard
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Attendance Management</h1>
          <p className="text-muted-foreground mt-2">
            View attendance records, manage settings, and monitor employee check-ins.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleGoToSummary}
            variant="outline"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <BarChart className="mr-2 h-4 w-4" />
            Summary
          </Button>
          <Button
            onClick={handleGoToCheckIn}
            className="bg-primary hover:bg-primary/90"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Employee Check-in
          </Button>
        </div>
      </div>

      <AttendanceDashboard />
    </div>
  );
};

export default Attendance;