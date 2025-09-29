import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LogOut, ArrowLeft, Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AttendanceLogin from '@/components/attendance/AttendanceLogin';

interface AttendanceRecord {
  id: string;
  employee_id: string;
  check_in_time: string;
  check_out_time?: string;
  app_users: {
    full_name: string;
    employee_id: string;
  };
}

const CheckOut = () => {
  const [currentStep, setCurrentStep] = useState<'login' | 'confirm' | 'complete'>('login');
  const [employeeData, setEmployeeData] = useState<{ employeeId: string; userId: string; name: string } | null>(null);
  const [attendanceRecord, setAttendanceRecord] = useState<AttendanceRecord | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAlreadyCheckedOut, setShowAlreadyCheckedOut] = useState(false);
  const [existingRecord, setExistingRecord] = useState<AttendanceRecord | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleEmployeeVerified = async (employeeId: string, userId: string): Promise<boolean> => {
    setIsProcessing(true);
    try {
      // Check if employee has an active check-in record for today (not checked out yet)
      const today = new Date().toISOString().split('T')[0];
      const startOfDay = `${today}T00:00:00.000Z`;
      const endOfDay = `${today}T23:59:59.999Z`;

      console.log('🔍 Checking for active attendance record:', {
        employeeId,
        today,
        startOfDay,
        endOfDay
      });

      const { data: activeRecord, error } = await supabase
        .from('attendance_records')
        .select('*, app_users!inner(full_name, employee_id)')
        .eq('employee_id', employeeId)
        .gte('check_in_time', startOfDay)
        .lt('check_in_time', endOfDay)
        .maybeSingle();

      console.log('🔍 Active record result:', { activeRecord, error });

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!activeRecord) {
        // No check-in record found for today
        toast({
          title: "No Check-in Found",
          description: "You need to check in first before you can check out.",
          variant: "destructive"
        });
        return false;
      }

      if (activeRecord.check_out_time) {
        // Already checked out
        setExistingRecord(activeRecord);
        setShowAlreadyCheckedOut(true);
        return false;
      }

      // Valid check-in found, proceed to confirmation
      setAttendanceRecord(activeRecord);
      setEmployeeData({
        employeeId,
        userId,
        name: activeRecord.app_users.full_name
      });
      setCurrentStep('confirm');
      return true;

    } catch (error) {
      console.error('Error checking attendance record:', error);
      toast({
        title: "Error",
        description: "Unable to verify attendance status. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    if (!attendanceRecord) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('attendance_records')
        .update({
          check_out_time: new Date().toISOString()
        })
        .eq('id', attendanceRecord.id);

      if (error) {
        throw error;
      }

      console.log('✅ Check-out successful for:', attendanceRecord.employee_id);

      toast({
        title: "Check-out Successful",
        description: `${employeeData?.name} has been checked out successfully!`,
      });

      setCurrentStep('complete');

    } catch (error) {
      console.error('Error checking out:', error);
      toast({
        title: "Check-out Failed",
        description: "Unable to check out. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoToAttendance = () => {
    navigate('/attendance');
  };

  const handleStartOver = () => {
    setCurrentStep('login');
    setEmployeeData(null);
    setAttendanceRecord(null);
    setExistingRecord(null);
    setShowAlreadyCheckedOut(false);
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString();
  };

  const calculateWorkingHours = (checkInTime: string, checkOutTime?: string) => {
    const checkIn = new Date(checkInTime);
    const checkOut = checkOutTime ? new Date(checkOutTime) : new Date();
    const diffMs = checkOut.getTime() - checkIn.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (currentStep === 'login') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGoToAttendance}
            className="rounded-none"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Attendance
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Employee Check-out</h1>
            <p className="text-muted-foreground">
              Enter your employee ID to check out for the day
            </p>
          </div>
        </div>

        {/* Employee Login */}
        <div className="flex justify-center">
          <AttendanceLogin
            onEmployeeVerified={handleEmployeeVerified}
            isLoading={isProcessing}
          />
        </div>

        {/* Already Checked Out Dialog */}
        <Dialog open={showAlreadyCheckedOut} onOpenChange={setShowAlreadyCheckedOut}>
          <DialogContent className="rounded-none max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                Already Checked Out
              </DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-4">
                  <p>This employee has already checked out for today.</p>

                  {existingRecord && (
                    <div className="bg-muted rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Employee:</span>
                        <span className="text-sm">{existingRecord.app_users.full_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Check-in:</span>
                        <span className="text-sm">{formatTime(existingRecord.check_in_time)}</span>
                      </div>
                      {existingRecord.check_out_time && (
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Check-out:</span>
                          <span className="text-sm">{formatTime(existingRecord.check_out_time)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Working Hours:</span>
                        <span className="text-sm font-semibold text-blue-600">
                          {calculateWorkingHours(existingRecord.check_in_time, existingRecord.check_out_time)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleStartOver}
                      className="flex-1 rounded-none"
                    >
                      Try Another ID
                    </Button>
                    <Button
                      onClick={handleGoToAttendance}
                      className="flex-1 rounded-none"
                    >
                      Back to Attendance
                    </Button>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (currentStep === 'confirm' && attendanceRecord && employeeData) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleStartOver}
            className="rounded-none"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Confirm Check-out</h1>
            <p className="text-muted-foreground">
              Review details and confirm your check-out
            </p>
          </div>
        </div>

        {/* Confirmation Card */}
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <LogOut className="h-6 w-6 text-blue-600" />
                Ready to Check Out
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Employee:</span>
                  <span className="text-sm font-semibold">{employeeData.name}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Employee ID:</span>
                  <span className="text-sm font-mono font-semibold">{employeeData.employeeId}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Check-in Time:</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span className="text-sm font-semibold">{formatTime(attendanceRecord.check_in_time)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Working Hours:</span>
                  <span className="text-sm font-semibold text-green-600">
                    {calculateWorkingHours(attendanceRecord.check_in_time)}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleCheckOut}
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Clock className="mr-2 h-5 w-5 animate-spin" />
                    Checking Out...
                  </>
                ) : (
                  <>
                    <LogOut className="mr-2 h-5 w-5" />
                    Confirm Check-out
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (currentStep === 'complete') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Check-out Complete!</h1>
          <p className="text-muted-foreground">
            Have a great rest of your day!
          </p>
        </div>

        {/* Success Card */}
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl text-green-700">Successfully Checked Out</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {employeeData && attendanceRecord && (
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Employee:</span>
                    <span className="text-sm font-semibold">{employeeData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Check-in:</span>
                    <span className="text-sm">{formatTime(attendanceRecord.check_in_time)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Check-out:</span>
                    <span className="text-sm">{formatTime(new Date().toISOString())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Hours:</span>
                    <span className="text-sm font-semibold text-green-600">
                      {calculateWorkingHours(attendanceRecord.check_in_time)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleStartOver}
                  className="flex-1 rounded-none"
                >
                  Check Out Another Employee
                </Button>
                <Button
                  onClick={handleGoToAttendance}
                  className="flex-1 rounded-none"
                >
                  Back to Attendance
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
};

export default CheckOut;