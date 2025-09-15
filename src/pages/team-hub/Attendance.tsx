import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AttendanceLogin from '@/components/attendance/AttendanceLogin';
import LocationVerifier from '@/components/attendance/LocationVerifier';
import SelfieCapture from '@/components/attendance/SelfieCapture';
import AttendanceDashboard from '@/components/attendance/AttendanceDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, Clock, LogOut, User } from 'lucide-react';

interface LocationData {
  ip: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

interface AttendanceStep {
  id: string;
  title: string;
  completed: boolean;
  current: boolean;
}

const Attendance = () => {
  const [currentStep, setCurrentStep] = useState<'login' | 'location' | 'selfie' | 'dashboard'>('login');
  const [employeeData, setEmployeeData] = useState<{ employeeId: string; userId: string } | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [existingCheckIn, setExistingCheckIn] = useState<any>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const { toast } = useToast();

  // Check if user has admin permissions to view dashboard
  const [viewMode, setViewMode] = useState<'employee' | 'admin'>('employee');

  const steps: AttendanceStep[] = [
    { id: 'login', title: 'Employee Login', completed: currentStep !== 'login', current: currentStep === 'login' },
    { id: 'location', title: 'Location Verification', completed: ['selfie', 'dashboard'].includes(currentStep), current: currentStep === 'location' },
    { id: 'selfie', title: 'Photo Verification', completed: currentStep === 'dashboard', current: currentStep === 'selfie' },
    { id: 'checkin', title: 'Check-in Complete', completed: isCheckedIn, current: false },
  ];

  const handleEmployeeVerified = async (employeeId: string, userId: string): Promise<boolean> => {
    setIsProcessing(true);
    try {
      // Check if employee already checked in today
      const today = new Date().toISOString().split('T')[0];
      const startOfDay = `${today}T00:00:00.000Z`;
      const endOfDay = `${today}T23:59:59.999Z`;

      console.log('🔍 Checking for duplicate check-in:', {
        employeeId,
        today,
        startOfDay,
        endOfDay
      });

      const { data: existingRecord, error } = await supabase
        .from('attendance_records')
        .select('*, app_users!inner(full_name)')
        .eq('employee_id', employeeId)
        .gte('check_in_time', startOfDay)
        .lt('check_in_time', endOfDay)
        .maybeSingle();

      console.log('🔍 Duplicate check result:', { existingRecord, error });

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (existingRecord) {
        // Employee already checked in today
        setExistingCheckIn(existingRecord);
        setShowDuplicateDialog(true);
        setEmployeeData({ employeeId, userId }); // Store for potential reference
        return false; // Indicate duplicate found
      } else {
        // No existing check-in, proceed with normal flow
        setEmployeeData({ employeeId, userId });
        setCurrentStep('location');
        return true; // Indicate success
      }
    } catch (error) {
      console.error('Error checking existing attendance:', error);
      toast({
        title: "Error",
        description: "Unable to verify attendance status. Please try again.",
        variant: "destructive"
      });
      return false; // Indicate error
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLocationVerified = (data: LocationData) => {
    setLocationData(data);
    setCurrentStep('selfie');
  };

  const handleSelfieCapture = async (imageBlob: Blob, imageDataUrl: string) => {
    console.log('📸 Starting selfie capture process:', {
      employeeData,
      locationData,
      imageBlobSize: imageBlob.size
    });

    if (!employeeData || !locationData) {
      console.error('❌ Missing employee or location data:', { employeeData, locationData });
      return;
    }

    setIsProcessing(true);

    try {
      // Upload selfie to Supabase storage
      const fileName = `attendance-selfies/${employeeData.employeeId}-${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('attendance-photos')
        .upload(fileName, imageBlob);

      if (uploadError) {
        throw uploadError;
      }

      // Get current user from Supabase auth (this could be admin or the employee themselves)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get app_user data for the employee being checked in
      console.log('👤 Looking for app_user with employee_id:', employeeData.employeeId);

      const { data: appUser, error: appUserError } = await supabase
        .from('app_users')
        .select('*')
        .eq('employee_id', employeeData.employeeId)
        .eq('status', 'active')
        .single();

      console.log('👤 App user lookup result:', { appUser, appUserError });

      if (appUserError || !appUser) {
        console.error('❌ Employee not found in app_users table:', { employeeId: employeeData.employeeId, appUserError });
        throw new Error('Employee not found');
      }

      // Create attendance record
      // Use the employee's auth_user_id if available, otherwise use the current user's ID (for admin check-ins)
      const attendanceRecord = {
        app_user_id: appUser.id,
        auth_user_id: appUser.auth_user_id || user.id, // Use employee's auth_user_id or current user as fallback
        employee_id: employeeData.employeeId,
        check_in_time: new Date().toISOString(),
        selfie_url: uploadData.path,
        location_verified: true,
        ip_address: locationData.ip,
        gps_latitude: locationData.latitude,
        gps_longitude: locationData.longitude,
        notes: null
      };

      console.log('💾 Inserting attendance record:', attendanceRecord);

      const { error: insertError } = await supabase
        .from('attendance_records')
        .insert([attendanceRecord]);

      console.log('💾 Insert result:', { insertError });

      if (insertError) {
        console.error('❌ Failed to insert attendance record:', insertError);
        throw insertError;
      }

      console.log('✅ Attendance record inserted successfully!');

      setIsCheckedIn(true);

      toast({
        title: "Check-in successful!",
        description: "Your attendance has been recorded.",
      });

      // Reset after successful check-in
      setTimeout(() => {
        setCurrentStep('login');
        setEmployeeData(null);
        setLocationData(null);
        setIsCheckedIn(false);
      }, 3000);

    } catch (error) {
      console.error('Check-in error:', error);
      toast({
        title: "Check-in failed",
        description: "Unable to record attendance. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setCurrentStep('login');
    setEmployeeData(null);
    setLocationData(null);
    setIsCheckedIn(false);
    setExistingCheckIn(null);
    setShowDuplicateDialog(false);
  };

  if (viewMode === 'admin') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Attendance Management</h1>
          </div>
          <Button
            onClick={() => setViewMode('employee')}
            variant="outline"
          >
            <User className="mr-2 h-4 w-4" />
            Employee Check-in
          </Button>
        </div>
        <AttendanceDashboard />
      </div>
    );
  }

  if (isCheckedIn) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Attendance Management</h1>
            <p className="text-muted-foreground mt-2">
              Welcome! Your attendance has been recorded.
            </p>
          </div>
          <Button
            onClick={() => setViewMode('admin')}
            variant="outline"
          >
            View Dashboard
          </Button>
        </div>

        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Check-in Successful!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Employee ID:</p>
              <p className="font-mono font-bold">{employeeData?.employeeId}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Check-in Time:</p>
              <p className="font-bold">{new Date().toLocaleTimeString()}</p>
            </div>
            <Button onClick={handleReset} className="w-full" variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              New Check-in
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Attendance Management</h1>
          <p className="text-muted-foreground mt-2">
            Complete the verification steps to record your attendance.
          </p>
        </div>
        <Button
          onClick={() => setViewMode('admin')}
          variant="outline"
        >
          View Dashboard
        </Button>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-4 max-w-2xl">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.completed
                      ? 'bg-green-600 text-white'
                      : step.current
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <p className="mt-2 text-xs text-center max-w-20">{step.title}</p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-px w-16 ${
                    step.completed ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex justify-center">
        {currentStep === 'login' && (
          <AttendanceLogin
            onEmployeeVerified={handleEmployeeVerified}
            isLoading={isProcessing}
          />
        )}

        {currentStep === 'location' && (
          <LocationVerifier
            onLocationVerified={handleLocationVerified}
            isLoading={isProcessing}
          />
        )}

        {currentStep === 'selfie' && (
          <SelfieCapture
            onSelfieCapture={handleSelfieCapture}
            employeeId={employeeData?.employeeId || ''}
            isLoading={isProcessing}
          />
        )}
      </div>

      {/* Reset Button */}
      {currentStep !== 'login' && (
        <div className="flex justify-center">
          <Button onClick={handleReset} variant="outline">
            Start Over
          </Button>
        </div>
      )}

      {/* Duplicate Check-in Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Already Checked In Today</DialogTitle>
            <DialogDescription>
              You have already checked in today. Here are your attendance details:
            </DialogDescription>
          </DialogHeader>

          {existingCheckIn && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-center">
                <div className="bg-green-100 rounded-full p-3">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </div>

              <div className="text-center space-y-3">
                <h3 className="text-lg font-semibold text-foreground">
                  {existingCheckIn.app_users?.full_name || 'Unknown Employee'}
                </h3>
                <div className="bg-blue-50 rounded-lg px-3 py-2 inline-block">
                  <p className="text-sm font-medium text-blue-800">
                    Employee ID: {existingCheckIn.employee_id}
                  </p>
                </div>
              </div>

              <div className="bg-background border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-sm font-medium text-foreground">Check-in Time:</span>
                  <span className="text-sm font-semibold text-foreground">
                    {new Date(existingCheckIn.check_in_time).toLocaleString()}
                  </span>
                </div>

                {existingCheckIn.check_out_time && (
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm font-medium text-foreground">Check-out Time:</span>
                    <span className="text-sm font-semibold text-foreground">
                      {new Date(existingCheckIn.check_out_time).toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-sm font-medium text-foreground">Status:</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${existingCheckIn.check_out_time ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                    <span className={`text-sm font-semibold ${existingCheckIn.check_out_time ? 'text-blue-700' : 'text-green-700'}`}>
                      {existingCheckIn.check_out_time ? 'Checked Out' : 'Present'}
                    </span>
                  </div>
                </div>

                {existingCheckIn.location_verified && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-foreground">Location:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm font-semibold text-green-700">Verified</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    setShowDuplicateDialog(false);
                    setViewMode('admin');
                  }}
                >
                  View Dashboard
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowDuplicateDialog(false);
                    handleReset();
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Attendance;