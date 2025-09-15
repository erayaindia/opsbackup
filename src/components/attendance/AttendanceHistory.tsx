import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  CalendarIcon,
  Download,
  Search,
  Filter,
  Clock,
  MapPin,
  Camera,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee_name?: string;
  department?: string;
  check_in_time: string;
  check_out_time?: string;
  status: 'present' | 'late' | 'absent' | 'checked_out';
  selfie_url?: string;
  location_verified: boolean;
  ip_address?: string;
  gps_latitude?: number;
  gps_longitude?: number;
  notes?: string;
}

interface AttendanceHistoryProps {
  employeeId?: string; // If provided, show history for specific employee
}

const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({ employeeId }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  const fetchAttendanceHistory = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('attendance_records')
        .select(`
          *,
          employee_profiles!inner(
            employee_id,
            user_id,
            department,
            position,
            profiles!inner(name)
          )
        `)
        .order('check_in_time', { ascending: false });

      // Filter by specific employee if provided
      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      // Apply date range filter
      if (dateRange.from) {
        query = query.gte('check_in_time', dateRange.from.toISOString());
      }
      if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        query = query.lte('check_in_time', toDate.toISOString());
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;

      // Transform data to include employee names
      const transformedRecords: AttendanceRecord[] = (data || []).map(record => ({
        id: record.id,
        employee_id: record.employee_id,
        employee_name: record.employee_profiles?.profiles?.name || 'Unknown',
        department: record.employee_profiles?.department || 'N/A',
        check_in_time: record.check_in_time,
        check_out_time: record.check_out_time,
        status: record.status as 'present' | 'late' | 'absent' | 'checked_out',
        selfie_url: record.selfie_url,
        location_verified: record.location_verified,
        ip_address: record.ip_address,
        gps_latitude: record.gps_latitude,
        gps_longitude: record.gps_longitude,
        notes: record.notes
      }));

      setRecords(transformedRecords);
      setFilteredRecords(transformedRecords);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceHistory();
  }, [employeeId, dateRange]);

  useEffect(() => {
    // Apply filters
    let filtered = records;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === statusFilter);
    }

    setFilteredRecords(filtered);
  }, [records, searchTerm, statusFilter]);

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

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'HH:mm');
  };

  const calculateWorkingHours = (checkIn: string, checkOut?: string) => {
    if (!checkOut) return 'In progress';

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${diffHours}h ${diffMinutes}m`;
  };

  const exportToCSV = () => {
    const headers = [
      'Date',
      'Employee ID',
      'Employee Name',
      'Department',
      'Check In',
      'Check Out',
      'Working Hours',
      'Status',
      'Location Verified'
    ];

    const csvData = filteredRecords.map(record => [
      format(new Date(record.check_in_time), 'yyyy-MM-dd'),
      record.employee_id,
      record.employee_name || '',
      record.department || '',
      formatTime(record.check_in_time),
      formatTime(record.check_out_time),
      calculateWorkingHours(record.check_in_time, record.check_out_time),
      record.status,
      record.location_verified ? 'Yes' : 'No'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const viewSelfie = async (record: AttendanceRecord) => {
    if (record.selfie_url) {
      try {
        const { data } = await supabase.storage
          .from('attendance-photos')
          .getPublicUrl(record.selfie_url);

        if (data.publicUrl) {
          window.open(data.publicUrl, '_blank');
        }
      } catch (error) {
        console.error('Error loading selfie:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">
            {employeeId ? 'My Attendance History' : 'Attendance History'}
          </h2>
          <p className="text-muted-foreground">
            View and manage attendance records
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="checked_out">Checked Out</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? format(dateRange.from, 'MMM dd, yyyy') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <label className="text-sm font-medium">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.to ? format(dateRange.to, 'MMM dd, yyyy') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchTerm || statusFilter !== 'all' || dateRange.from || dateRange.to) && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setDateRange({});
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            Attendance Records ({filteredRecords.length})
          </CardTitle>
          <CardDescription>
            {isLoading ? 'Loading...' : `Showing ${filteredRecords.length} records`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Working Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {record.employee_name?.split(' ').map(n => n[0]).join('') || record.employee_id.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{record.employee_name}</p>
                          <p className="text-xs text-muted-foreground">{record.employee_id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(record.check_in_time), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(record.check_in_time)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {record.check_out_time ? (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(record.check_out_time)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {calculateWorkingHours(record.check_in_time, record.check_out_time)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(record.status)}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {record.location_verified && (
                          <MapPin className="h-3 w-3 text-green-600" title="Location verified" />
                        )}
                        {record.selfie_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewSelfie(record)}
                            className="h-6 w-6 p-0"
                          >
                            <Camera className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredRecords.length === 0 && !isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                No attendance records found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceHistory;