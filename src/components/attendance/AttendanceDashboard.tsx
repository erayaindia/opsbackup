import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Clock,
  UserCheck,
  UserX,
  Calendar,
  TrendingUp,
  Download,
  RefreshCw,
  Camera,
  MapPin,
  CalendarIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Employee {
  id: string;
  employee_id: string;
  name: string;
  avatar_url?: string;
  department: string;
  position: string;
  status: 'present' | 'late' | 'absent' | 'checked_out';
  check_in_time?: string;
  check_out_time?: string;
  selfie_url?: string;
  location_verified: boolean;
}

interface AttendanceStats {
  total_employees: number;
  present: number;
  late: number;
  absent: number;
  checked_out: number;
}

const AttendanceDashboard: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    total_employees: 0,
    present: 0,
    late: 0,
    absent: 0,
    checked_out: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selfieUrls, setSelfieUrls] = useState<Record<string, string>>({});
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const fetchAttendanceData = async (dateToFetch?: Date) => {
    setIsLoading(true);
    try {
      const targetDate = dateToFetch || selectedDate;

      // Get local date string (YYYY-MM-DD) without timezone conversion
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const day = String(targetDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      console.log('📅 Fetching attendance for date:', dateStr);
      console.log('📅 Target date object:', targetDate);

      // Fetch all active employees from app_users (excluding super admins)
      const { data: appUsers, error: usersError } = await supabase
        .from('app_users')
        .select('*')
        .eq('status', 'active')
        .not('employee_id', 'is', null)
        .neq('role', 'super_admin');

      if (usersError) {
        console.error('Error fetching app_users:', usersError);
        throw usersError;
      }

      console.log('👥 Found active employees:', appUsers?.length);

      // Fetch attendance records for the selected date
      // Use a date range that covers the entire day
      const startOfDay = `${dateStr}T00:00:00`;
      const endOfDay = `${dateStr}T23:59:59.999`;

      console.log('📅 Querying from:', startOfDay, 'to:', endOfDay);

      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('*')
        .gte('check_in_time', startOfDay)
        .lte('check_in_time', endOfDay);

      if (attendanceError) {
        console.error('Error fetching attendance records:', attendanceError);
        throw attendanceError;
      }

      console.log('📋 Found attendance records:', attendanceRecords?.length);
      console.log('📸 Attendance records with selfies:', attendanceRecords?.filter(r => r.selfie_url));

      // Debug: Log all selfie_url values
      attendanceRecords?.forEach(record => {
        if (record.selfie_url) {
          console.log('📸 Found selfie_url in database:', record.selfie_url, 'for employee:', record.employee_id);
        }
      });

      // Combine employee data with attendance records
      const employeesWithAttendance: Employee[] = (appUsers || []).map(employee => {
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
          id: employee.id,
          employee_id: employee.employee_id || 'N/A',
          name: employee.full_name || 'Unknown',
          department: employee.department || 'N/A',
          position: employee.designation || 'N/A',
          status,
          check_in_time: attendanceRecord?.check_in_time,
          check_out_time: attendanceRecord?.check_out_time,
          location_verified: attendanceRecord?.location_verified || false,
          selfie_url: attendanceRecord?.selfie_url
        };
      });

      console.log('📊 Processed employees with attendance:', employeesWithAttendance);

      setEmployees(employeesWithAttendance);

      // Calculate advanced statistics
      const presentCount = employeesWithAttendance.filter(e => e.status === 'present').length;
      const lateCount = employeesWithAttendance.filter(e => e.status === 'late').length;
      const absentCount = employeesWithAttendance.filter(e => e.status === 'absent').length;
      const checkedOutCount = employeesWithAttendance.filter(e => e.status === 'checked_out').length;
      const totalEmployees = employeesWithAttendance.length;

      // Calculate early birds (employees who checked in before 9 AM)
      const earlyBirds = employeesWithAttendance.filter(e => {
        if (!e.check_in_time) return false;
        const checkInHour = new Date(e.check_in_time).getHours();
        return checkInHour < 9;
      }).length;

      // Calculate average check-in time
      const checkInTimes = employeesWithAttendance
        .filter(e => e.check_in_time)
        .map(e => new Date(e.check_in_time!));

      const averageCheckInTime = checkInTimes.length > 0
        ? new Date(checkInTimes.reduce((sum, time) => sum + time.getTime(), 0) / checkInTimes.length)
        : new Date();

      // Calculate punctuality score (percentage of on-time arrivals)
      const onTimeEmployees = employeesWithAttendance.filter(e => e.status === 'present').length;
      const punctualityScore = totalEmployees > 0 ? Math.round((onTimeEmployees / totalEmployees) * 100) : 0;

      // Get previous day attendance rate for trend calculation
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // For now, simulate previous day rate (in a real app, you'd fetch this from DB)
      const previousDayRate = Math.round(Math.random() * 20 + 80); // Random between 80-100%
      const currentRate = totalEmployees > 0 ? Math.round(((presentCount + lateCount + checkedOutCount) / totalEmployees) * 100) : 0;

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (currentRate > previousDayRate + 2) trend = 'up';
      else if (currentRate < previousDayRate - 2) trend = 'down';

      setStats({
        total_employees: totalEmployees,
        present: presentCount,
        late: lateCount,
        absent: absentCount,
        checked_out: checkedOutCount,
        attendance_rate: currentRate,
        average_check_in_time: averageCheckInTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        early_birds: earlyBirds,
        punctuality_score: punctualityScore,
        previous_day_rate: previousDayRate,
        trend: trend
      });

      setLastUpdated(new Date());
      console.log('✅ Attendance data updated successfully');

      // Load selfie URLs for employees with selfies
      loadSelfieUrls(employeesWithAttendance);
    } catch (error) {
      console.error('Failed to fetch attendance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSelfieUrls = (employees: Employee[]) => {
    const newSelfieUrls: Record<string, string> = {};

    employees.forEach(employee => {
      if (employee.selfie_url) {
        console.log('📸 Processing selfie for employee:', employee.name, 'ID:', employee.id);
        try {
          const url = getSelfieUrl(employee.selfie_url);
          if (url) {
            newSelfieUrls[employee.id] = url;
            console.log('📸 Added URL for', employee.name, ':', url);
          } else {
            console.log('📸 No URL generated for', employee.name);
          }
        } catch (error) {
          console.error(`📸 Failed to load selfie for ${employee.name}:`, error);
        }
      }
    });

    console.log('📸 Final selfie URLs:', newSelfieUrls);
    setSelfieUrls(prev => ({ ...prev, ...newSelfieUrls }));
  };

  useEffect(() => {
    fetchAttendanceData();

    // Set up real-time subscription for attendance updates (only for today)
    const isToday = selectedDate.toDateString() === new Date().toDateString();
    let subscription: any = null;
    let interval: any = null;

    if (isToday) {
      subscription = supabase
        .channel('attendance_dashboard_updates')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'attendance_records'
          },
          (payload) => {
            console.log('🔄 Real-time attendance update:', payload);
            fetchAttendanceData();
          }
        )
        .subscribe();

      // Set up auto-refresh every 5 minutes as backup for today
      interval = setInterval(fetchAttendanceData, 5 * 60 * 1000);
    }

    return () => {
      if (subscription) subscription.unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, [selectedDate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'checked_out':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'N/A';
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSelfieUrl = (selfiePath?: string): string | null => {
    if (!selfiePath) {
      console.log('📸 No selfie path provided');
      return null;
    }
    console.log('📸 Getting public URL for path:', selfiePath);

    try {
      // Use public URL approach (simpler for debugging)
      const { data: publicData } = supabase.storage
        .from('attendance-photos')
        .getPublicUrl(selfiePath);

      console.log('📸 Generated public URL:', publicData.publicUrl);
      console.log('📸 URL contains undefined?', publicData.publicUrl.includes('undefined'));

      // Return the URL regardless - let the browser handle loading
      return publicData.publicUrl;

    } catch (error) {
      console.error('📸 Error getting selfie URL:', error);
      return null;
    }
  };

  const exportAttendanceReport = () => {
    // In a real app, this would generate and download a CSV/Excel file
    console.log('Exporting attendance report...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">

          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(selectedDate, "MMM d, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                    }
                  }}
                  disabled={(date) => {
                    // Disable future dates
                    return date > new Date();
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Quick Date Buttons */}
            <div className="flex items-center gap-1 border-l pl-2 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(new Date())}
                className={selectedDate.toDateString() === new Date().toDateString() ? "bg-primary/10" : ""}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  setSelectedDate(yesterday);
                }}
              >
                Yesterday
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => fetchAttendanceData()}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={exportAttendanceReport}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_employees}</div>
            <p className="text-xs text-muted-foreground mt-1">Active employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently present</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
            <p className="text-xs text-muted-foreground mt-1">Late today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
            <p className="text-xs text-muted-foreground mt-1">Not present</p>
          </CardContent>
        </Card>
      </div>

      {/* Employee List */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Employees</TabsTrigger>
          <TabsTrigger value="present">Present ({stats.present})</TabsTrigger>
          <TabsTrigger value="late">Late ({stats.late})</TabsTrigger>
          <TabsTrigger value="absent">Absent ({stats.absent})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="border-r border-border/50 whitespace-nowrap">Employee</TableHead>
                  <TableHead className="w-32 border-r border-border/50 whitespace-nowrap">Employee ID</TableHead>
                  <TableHead className="w-32 border-r border-border/50 whitespace-nowrap">Department</TableHead>
                  <TableHead className="w-32 border-r border-border/50 whitespace-nowrap">Position</TableHead>
                  <TableHead className="w-28 border-r border-border/50 whitespace-nowrap">Check-in</TableHead>
                  <TableHead className="w-28 border-r border-border/50 whitespace-nowrap">Check-out</TableHead>
                  <TableHead className="w-24 whitespace-nowrap">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees
                  .sort((a, b) => {
                    // Present employees first, then absent
                    const statusOrder = { 'present': 1, 'late': 2, 'checked_out': 3, 'absent': 4 };
                    return (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5);
                  })
                  .map((employee) => (
                  <TableRow
                    key={employee.id}
                    className="hover:bg-muted/50 transition-colors h-16"
                  >
                    <TableCell className="border-r border-border/50 py-2 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        {employee.selfie_url && selfieUrls[employee.id] ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <div className="relative cursor-pointer">
                                <Avatar className="h-10 w-10 hover:ring-2 hover:ring-primary transition-all">
                                  <AvatarImage
                                    src={selfieUrls[employee.id]}
                                    alt={`${employee.name} - Today's check-in`}
                                    onError={(e) => {
                                      console.error('📸 Image failed to load:', selfieUrls[employee.id]);
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                  <AvatarFallback>
                                    {employee.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
                                  <Camera className="h-2 w-2" />
                                </div>
                              </div>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>{employee.name} - Check-in Photo</DialogTitle>
                              </DialogHeader>
                              <div className="flex justify-center">
                                <img
                                  src={selfieUrls[employee.id]}
                                  alt={`${employee.name} check-in selfie`}
                                  className="max-w-full max-h-96 rounded-lg"
                                />
                              </div>
                              <div className="text-sm text-muted-foreground text-center">
                                Check-in time: {formatTime(employee.check_in_time)}
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {employee.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-sm">{employee.name}</div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="border-r border-border/50 py-2 text-sm font-mono whitespace-nowrap">
                      {employee.employee_id}
                    </TableCell>

                    <TableCell className="border-r border-border/50 py-2 text-sm whitespace-nowrap">
                      {employee.department}
                    </TableCell>

                    <TableCell className="border-r border-border/50 py-2 text-sm whitespace-nowrap">
                      {employee.position}
                    </TableCell>

                    <TableCell className="border-r border-border/50 py-2 text-sm whitespace-nowrap">
                      {formatTime(employee.check_in_time)}
                    </TableCell>

                    <TableCell className="border-r border-border/50 py-2 text-sm whitespace-nowrap">
                      {employee.check_out_time ? formatTime(employee.check_out_time) : '-'}
                    </TableCell>

                    <TableCell className="py-2 whitespace-nowrap">
                      <Badge
                        className={`${getStatusColor(employee.status)} whitespace-nowrap text-xs px-2 py-0.5`}
                      >
                        {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {employees.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No employees found
              </div>
            )}
          </div>
        </TabsContent>

        {/* Similar TabsContent for other status filters */}
        <TabsContent value="present" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="border-r border-border/50 whitespace-nowrap">Employee</TableHead>
                  <TableHead className="w-32 border-r border-border/50 whitespace-nowrap">Employee ID</TableHead>
                  <TableHead className="w-32 border-r border-border/50 whitespace-nowrap">Department</TableHead>
                  <TableHead className="w-32 border-r border-border/50 whitespace-nowrap">Position</TableHead>
                  <TableHead className="w-28 border-r border-border/50 whitespace-nowrap">Check-in</TableHead>
                  <TableHead className="w-24 whitespace-nowrap">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.filter(e => e.status === 'present').map((employee) => (
                  <TableRow key={employee.id} className="hover:bg-muted/50 transition-colors h-16">
                    <TableCell className="border-r border-border/50 py-2 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        {employee.selfie_url && selfieUrls[employee.id] ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <div className="relative cursor-pointer">
                                <Avatar className="h-10 w-10 hover:ring-2 hover:ring-primary transition-all">
                                  <AvatarImage src={selfieUrls[employee.id]} alt={employee.name} />
                                  <AvatarFallback>{employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
                                  <Camera className="h-2 w-2" />
                                </div>
                              </div>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>{employee.name} - Check-in Photo</DialogTitle>
                              </DialogHeader>
                              <div className="flex justify-center">
                                <img src={selfieUrls[employee.id]} alt={`${employee.name} check-in selfie`} className="max-w-full max-h-96 rounded-lg" />
                              </div>
                              <div className="text-sm text-muted-foreground text-center">Check-in time: {formatTime(employee.check_in_time)}</div>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-sm">{employee.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="border-r border-border/50 py-2 text-sm font-mono whitespace-nowrap">{employee.employee_id}</TableCell>
                    <TableCell className="border-r border-border/50 py-2 text-sm whitespace-nowrap">{employee.department}</TableCell>
                    <TableCell className="border-r border-border/50 py-2 text-sm whitespace-nowrap">{employee.position}</TableCell>
                    <TableCell className="border-r border-border/50 py-2 text-sm whitespace-nowrap">{formatTime(employee.check_in_time)}</TableCell>
                    <TableCell className="py-2 whitespace-nowrap">
                      <Badge className="bg-green-100 text-green-800 whitespace-nowrap text-xs px-2 py-0.5">Present</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {employees.filter(e => e.status === 'present').length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No present employees</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="late" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="border-r border-border/50 whitespace-nowrap">Employee</TableHead>
                  <TableHead className="w-32 border-r border-border/50 whitespace-nowrap">Employee ID</TableHead>
                  <TableHead className="w-32 border-r border-border/50 whitespace-nowrap">Department</TableHead>
                  <TableHead className="w-32 border-r border-border/50 whitespace-nowrap">Position</TableHead>
                  <TableHead className="w-28 border-r border-border/50 whitespace-nowrap">Check-in</TableHead>
                  <TableHead className="w-24 whitespace-nowrap">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.filter(e => e.status === 'late').map((employee) => (
                  <TableRow key={employee.id} className="hover:bg-muted/50 transition-colors h-16">
                    <TableCell className="border-r border-border/50 py-2 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        {employee.selfie_url && selfieUrls[employee.id] ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <div className="relative cursor-pointer">
                                <Avatar className="h-10 w-10 hover:ring-2 hover:ring-primary transition-all">
                                  <AvatarImage src={selfieUrls[employee.id]} alt={employee.name} />
                                  <AvatarFallback>{employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
                                  <Camera className="h-2 w-2" />
                                </div>
                              </div>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>{employee.name} - Check-in Photo</DialogTitle>
                              </DialogHeader>
                              <div className="flex justify-center">
                                <img src={selfieUrls[employee.id]} alt={`${employee.name} check-in selfie`} className="max-w-full max-h-96 rounded-lg" />
                              </div>
                              <div className="text-sm text-muted-foreground text-center">Check-in time: {formatTime(employee.check_in_time)}</div>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-sm">{employee.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="border-r border-border/50 py-2 text-sm font-mono whitespace-nowrap">{employee.employee_id}</TableCell>
                    <TableCell className="border-r border-border/50 py-2 text-sm whitespace-nowrap">{employee.department}</TableCell>
                    <TableCell className="border-r border-border/50 py-2 text-sm whitespace-nowrap">{employee.position}</TableCell>
                    <TableCell className="border-r border-border/50 py-2 text-sm whitespace-nowrap">{formatTime(employee.check_in_time)}</TableCell>
                    <TableCell className="py-2 whitespace-nowrap">
                      <Badge className="bg-yellow-100 text-yellow-800 whitespace-nowrap text-xs px-2 py-0.5">Late</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {employees.filter(e => e.status === 'late').length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No late employees</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="absent" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="border-r border-border/50 whitespace-nowrap">Employee</TableHead>
                  <TableHead className="w-32 border-r border-border/50 whitespace-nowrap">Employee ID</TableHead>
                  <TableHead className="w-32 border-r border-border/50 whitespace-nowrap">Department</TableHead>
                  <TableHead className="w-32 border-r border-border/50 whitespace-nowrap">Position</TableHead>
                  <TableHead className="w-24 whitespace-nowrap">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.filter(e => e.status === 'absent').map((employee) => (
                  <TableRow key={employee.id} className="hover:bg-muted/50 transition-colors h-16">
                    <TableCell className="border-r border-border/50 py-2 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium text-sm">{employee.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="border-r border-border/50 py-2 text-sm font-mono whitespace-nowrap">{employee.employee_id}</TableCell>
                    <TableCell className="border-r border-border/50 py-2 text-sm whitespace-nowrap">{employee.department}</TableCell>
                    <TableCell className="border-r border-border/50 py-2 text-sm whitespace-nowrap">{employee.position}</TableCell>
                    <TableCell className="py-2 whitespace-nowrap">
                      <Badge className="bg-red-100 text-red-800 whitespace-nowrap text-xs px-2 py-0.5">Absent</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {employees.filter(e => e.status === 'absent').length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No absent employees</div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AttendanceDashboard;