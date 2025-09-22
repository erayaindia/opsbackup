import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Users,
  Clock,
  UserCheck,
  UserX,
  Calendar,
  TrendingUp,
  Download,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowLeft,
} from 'lucide-react';
import { useAttendanceSummary, ViewType } from '@/hooks/useAttendanceSummary';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const COLORS = {
  present: '#10b981',
  late: '#f59e0b',
  absent: '#ef4444',
};

const AttendanceSummary: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<ViewType>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  const { data, isLoading, error, refresh } = useAttendanceSummary(
    selectedPeriod,
    selectedDate,
    selectedDepartment
  );

  const handleBackToAttendance = () => {
    navigate('/attendance');
  };

  const handlePeriodChange = (period: ViewType) => {
    setSelectedPeriod(period);
  };

  const handleDateChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);

    switch (selectedPeriod) {
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
        break;
    }

    setSelectedDate(newDate);
  };

  const getDateRangeText = () => {
    switch (selectedPeriod) {
      case 'week':
        return `Week of ${format(selectedDate, 'MMM dd, yyyy')}`;
      case 'month':
        return format(selectedDate, 'MMMM yyyy');
      case 'year':
        return format(selectedDate, 'yyyy');
    }
  };

  const pieChartData = [
    { name: 'Present', value: data.stats.presentDays, color: COLORS.present },
    { name: 'Late', value: data.stats.lateDays, color: COLORS.late },
    { name: 'Absent', value: data.stats.absentDays, color: COLORS.absent },
  ];

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={refresh} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Attendance Summary</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive attendance analytics and insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={refresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Period Selection and Date Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToAttendance}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Attendance
          </Button>
          <Tabs value={selectedPeriod} onValueChange={(value) => handlePeriodChange(value as ViewType)}>
            <TabsList>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-4">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="engineering">Engineering</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="hr">Human Resources</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="operations">Operations</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDateChange('prev')}
            >
              Previous
            </Button>
            <span className="text-sm font-medium min-w-40 text-center">
              {getDateRangeText()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDateChange('next')}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Active employees in selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.averageAttendanceRate}%</div>
            <p className="text-xs text-muted-foreground">
              Average across all employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Days</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.stats.presentDays}</div>
            <p className="text-xs text-muted-foreground">
              Total present days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Days</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data.stats.absentDays}</div>
            <p className="text-xs text-muted-foreground">
              Total absent days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Daily Attendance Trends
            </CardTitle>
            <CardDescription>
              Attendance patterns over the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="present" name="Present" fill={COLORS.present} />
                <Bar dataKey="late" name="Late" fill={COLORS.late} />
                <Bar dataKey="absent" name="Absent" fill={COLORS.absent} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Overall Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of attendance status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Employee Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Attendance Details</CardTitle>
          <CardDescription>
            Individual attendance records for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Total Days</TableHead>
                <TableHead>Present</TableHead>
                <TableHead>Late</TableHead>
                <TableHead>Absent</TableHead>
                <TableHead>Attendance Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.employeeData.map((employee) => (
                <TableRow key={employee.employeeId}>
                  <TableCell className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={employee.profilePictureUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${employee.employeeName}`}
                        alt={`${employee.employeeName} profile picture`}
                      />
                      <AvatarFallback>
                        {employee.employeeName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{employee.employeeName}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {employee.employeeId}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {employee.department}
                    </Badge>
                  </TableCell>
                  <TableCell>{employee.totalDays}</TableCell>
                  <TableCell>
                    <span className="text-green-600 font-medium">
                      {employee.presentDays}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-yellow-600 font-medium">
                      {employee.lateDays}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-red-600 font-medium">
                      {employee.absentDays}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={employee.attendanceRate >= 90 ? "default" : employee.attendanceRate >= 75 ? "secondary" : "destructive"}
                    >
                      {employee.attendanceRate}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {data.employeeData.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              No employee data found for the selected period and filters.
            </div>
          )}

          {isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Loading attendance data...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceSummary;