import React from 'react';
import AttendanceDashboard from '@/components/attendance/AttendanceDashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, BarChart, Clock, CheckCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserPermissions } from '@/components/PermissionGuard';

const Attendance = () => {
  const navigate = useNavigate();
  const { hasRole, loading, currentUser } = useUserPermissions();

  const handleGoToCheckIn = () => {
    navigate('/checkin');
  };

  const handleGoToCheckOut = () => {
    navigate('/checkout');
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

  // Regular user view - check-in and check-out functionality
  if (!isAdminOrSuperAdmin) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Attendance</h1>
          <p className="text-muted-foreground">
            Manage your check-in and check-out for today
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Check-in Card */}
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  Employee Check In
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Ready to start your day? Click below to check in.
                </p>
                <Button
                  onClick={handleGoToCheckIn}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <UserPlus className="mr-2 h-5 w-5" />
                  Check In Now
                </Button>
              </CardContent>
            </Card>

            {/* Check-out Card */}
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <LogOut className="h-6 w-6 text-blue-600" />
                  Employee Check Out
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Ready to end your day? Click below to check out.
                </p>
                <Button
                  onClick={handleGoToCheckOut}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  Check Out Now
                </Button>
              </CardContent>
            </Card>
          </div>
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
            className="bg-green-600 hover:bg-green-700"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Employee Check-in
          </Button>
          <Button
            onClick={handleGoToCheckOut}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Employee Check-out
          </Button>
        </div>
      </div>

      <AttendanceDashboard />
    </div>
  );
};

export default Attendance;