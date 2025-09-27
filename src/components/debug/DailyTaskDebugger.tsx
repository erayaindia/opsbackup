import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Bug,
  RefreshCw,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  User,
  Database
} from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/components/ui/use-toast';

interface DebugInfo {
  userInfo: any;
  dailyTemplates: any[];
  dailyInstances: any[];
  databaseFunction: any;
  attendance: any;
  errors: string[];
  recommendations: string[];
}

interface DailyTaskDebuggerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DailyTaskDebugger: React.FC<DailyTaskDebuggerProps> = ({
  open,
  onOpenChange
}) => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const { profile } = useUserProfile();
  const { toast } = useToast();

  const runDiagnostics = async () => {
    if (!profile?.appUser?.id) {
      toast({
        title: "No User Profile",
        description: "Please make sure you're logged in",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const errors: string[] = [];
    const recommendations: string[] = [];

    try {
      const { supabase } = await import('@/integrations/supabase/client');

      // 1. Check user info
      const userInfo = {
        id: profile.appUser.id,
        name: profile.appUser.full_name,
        role: profile.appUser.role,
        department: profile.appUser.department,
        employee_id: profile.appUser.employee_id
      };

      // 2. Check daily templates
      const { data: templates, error: templatesError } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', profile.appUser.id)
        .eq('task_type', 'daily')
        .eq('is_recurring_instance', false);

      if (templatesError) {
        errors.push(`Template fetch error: ${templatesError.message}`);
      }

      if (!templates || templates.length === 0) {
        errors.push('No daily task templates found for this user');
        recommendations.push('Create daily task templates in the admin panel');
      }

      // 3. Check daily instances for today
      const today = new Date().toISOString().split('T')[0];
      const { data: instances, error: instancesError } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', profile.appUser.id)
        .eq('task_type', 'daily')
        .eq('is_recurring_instance', true)
        .eq('instance_date', today);

      if (instancesError) {
        errors.push(`Instance fetch error: ${instancesError.message}`);
      }

      // 4. Test database function
      let functionResult = null;
      try {
        const { data: funcData, error: funcError } = await supabase.rpc('create_daily_task_instances_for_user', {
          user_id: profile.appUser.id,
          target_date: today
        });

        if (funcError) {
          errors.push(`Database function error: ${funcError.message}`);
        } else {
          functionResult = funcData;
        }
      } catch (funcException) {
        errors.push(`Database function exception: ${funcException}`);
      }

      // 5. Check attendance status
      let attendance = null;
      let attendanceError = null;

      if (profile.appUser.employee_id) {
        const startOfDay = `${today}T00:00:00.000Z`;
        const endOfDay = `${today}T23:59:59.999Z`;

        const result = await supabase
          .from('attendance_records')
          .select('*')
          .eq('employee_id', profile.appUser.employee_id)
          .gte('check_in_time', startOfDay)
          .lt('check_in_time', endOfDay)
          .maybeSingle();

        attendance = result.data;
        attendanceError = result.error;
      }

      if (attendanceError && attendanceError.code !== 'PGRST116') {
        errors.push(`Attendance check error: ${attendanceError.message}`);
      }

      // 6. Analysis and recommendations
      if (templates && templates.length > 0 && (!instances || instances.length === 0)) {
        recommendations.push('Daily task instances should be created automatically on check-in');
        recommendations.push('Try checking in/out or refresh the page');
      }

      if (functionResult && functionResult.instances_created === 0 && functionResult.templates_found > 0) {
        recommendations.push('Templates exist but no instances were created - check for existing instances');
      }

      if (!profile.appUser.employee_id) {
        recommendations.push('User does not have employee_id - attendance tracking not required');
      } else if (!attendance) {
        recommendations.push('User is not checked in today - daily tasks are created on check-in');
      }

      // 7. Check for database permissions
      try {
        const { error: permError } = await supabase
          .from('tasks')
          .select('count')
          .eq('assigned_to', profile.appUser.id)
          .single();

        if (permError) {
          errors.push(`Database permission issue: ${permError.message}`);
        }
      } catch (permException) {
        errors.push(`Database access exception: ${permException}`);
      }

      setDebugInfo({
        userInfo,
        dailyTemplates: templates || [],
        dailyInstances: instances || [],
        databaseFunction: functionResult,
        attendance,
        errors,
        recommendations
      });

    } catch (error) {
      console.error('Debug diagnostics failed:', error);
      toast({
        title: "Diagnostic Failed",
        description: "Failed to run daily task diagnostics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fixDailyTasks = async () => {
    if (!profile?.appUser?.id) return;

    setLoading(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const today = new Date().toISOString().split('T')[0];

      // Force create daily task instances
      const { data, error } = await supabase.rpc('create_daily_task_instances_for_user', {
        user_id: profile.appUser.id,
        target_date: today
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Daily Tasks Fixed",
        description: `Created ${data?.instances_created || 0} daily task instances`,
      });

      // Re-run diagnostics
      await runDiagnostics();

    } catch (error) {
      console.error('Fix daily tasks failed:', error);
      toast({
        title: "Fix Failed",
        description: "Failed to fix daily tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && profile?.appUser?.id) {
      runDiagnostics();
    }
  }, [open, profile?.appUser?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Daily Tasks Diagnostic Tool
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={runDiagnostics} disabled={loading} className="flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Run Diagnostics
            </Button>
            <Button onClick={fixDailyTasks} disabled={loading} variant="outline" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Try Fix
            </Button>
          </div>

          {debugInfo && (
            <div className="space-y-4">
              {/* User Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    User Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>ID:</strong> {debugInfo.userInfo.id}</div>
                    <div><strong>Name:</strong> {debugInfo.userInfo.name}</div>
                    <div><strong>Role:</strong> {debugInfo.userInfo.role}</div>
                    <div><strong>Department:</strong> {debugInfo.userInfo.department}</div>
                    <div><strong>Employee ID:</strong> {debugInfo.userInfo.employee_id || 'Not set'}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Daily Templates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Daily Task Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {debugInfo.dailyTemplates.length === 0 ? (
                    <p className="text-destructive">❌ No daily task templates found</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-green-600">✅ {debugInfo.dailyTemplates.length} templates found</p>
                      <div className="space-y-1">
                        {debugInfo.dailyTemplates.map((template, index) => (
                          <div key={index} className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                            <strong>{template.title}</strong>
                            <div className="text-xs text-muted-foreground">
                              ID: {template.id} | Priority: {template.priority} | Status: {template.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Daily Instances */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Daily Task Instances (Today)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {debugInfo.dailyInstances.length === 0 ? (
                    <p className="text-destructive">❌ No daily task instances found for today</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-green-600">✅ {debugInfo.dailyInstances.length} instances found</p>
                      <div className="space-y-1">
                        {debugInfo.dailyInstances.map((instance, index) => (
                          <div key={index} className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                            <strong>{instance.title}</strong>
                            <div className="text-xs text-muted-foreground">
                              Status: {instance.status} | Date: {instance.instance_date} | From Template: {instance.original_task_id}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Database Function Result */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Database Function Test
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {debugInfo.databaseFunction ? (
                    <div className="text-sm">
                      <p>✅ Function executed successfully</p>
                      <p>Templates Found: {debugInfo.databaseFunction.templates_found}</p>
                      <p>Instances Created: {debugInfo.databaseFunction.instances_created}</p>
                    </div>
                  ) : (
                    <p className="text-destructive">❌ Database function failed</p>
                  )}
                </CardContent>
              </Card>

              {/* Attendance Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Attendance Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!debugInfo.userInfo.employee_id ? (
                    <div className="text-sm">
                      <p className="text-blue-600">ℹ️ Attendance tracking not required for this user</p>
                      <p className="text-xs text-muted-foreground">User does not have employee_id</p>
                    </div>
                  ) : debugInfo.attendance ? (
                    <div className="text-sm">
                      <p>✅ User checked in today</p>
                      <p>Check-in: {new Date(debugInfo.attendance.check_in_time).toLocaleTimeString()}</p>
                      {debugInfo.attendance.check_out_time && (
                        <p>Check-out: {new Date(debugInfo.attendance.check_out_time).toLocaleTimeString()}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-yellow-600">⚠️ User not checked in today</p>
                  )}
                </CardContent>
              </Card>

              {/* Errors */}
              {debugInfo.errors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <XCircle className="h-4 w-4" />
                      Errors Found
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {debugInfo.errors.map((error, index) => (
                        <div key={index} className="text-sm text-destructive bg-red-50 dark:bg-red-950/20 p-2 rounded">
                          {error}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {debugInfo.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-600">
                      <CheckCircle className="h-4 w-4" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {debugInfo.recommendations.map((rec, index) => (
                        <div key={index} className="text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/20 p-2 rounded">
                          💡 {rec}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};