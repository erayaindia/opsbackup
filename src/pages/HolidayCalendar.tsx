import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar as CalendarIcon,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfYear, endOfYear, addDays, getDay, startOfMonth, endOfMonth } from "date-fns";

interface Holiday {
  id: string;
  holiday_date: string;
  holiday_name: string;
  holiday_type: 'public' | 'company' | 'weekend';
  is_mandatory: boolean;
  created_at: string;
  created_by: string;
}

interface HolidayFormData {
  holiday_date: string;
  holiday_name: string;
  holiday_type: 'public' | 'company' | 'weekend';
  is_mandatory: boolean;
}

export default function HolidayCalendar() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [showWeekends, setShowWeekends] = useState(true);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [canManage, setCanManage] = useState(false);

  const [formData, setFormData] = useState<HolidayFormData>({
    holiday_date: '',
    holiday_name: '',
    holiday_type: 'public',
    is_mandatory: true
  });

  // Check user role and permissions
  const checkUserPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Get user role from app_users table
        const { data: userData, error } = await supabase
          .from('app_users')
          .select('role, full_name')
          .eq('id', user.id)
          .single();

        if (!error && userData) {
          console.log(`User: ${userData.full_name}, Role: ${userData.role}`);

          setUserRole(userData.role);
          // Only super_admin can manage holidays
          const canManageHolidays = userData.role === 'super_admin';
          setCanManage(canManageHolidays);

          // Also verify with database function
          const { data: canManageDB, error: rpcError } = await supabase
            .rpc('can_manage_holidays');

          if (!rpcError && canManageDB !== null) {
            // Use database function result if available
            setCanManage(canManageDB);
            console.log(`Permissions: ${canManageDB ? 'Full CRUD access' : 'View only'}`);
          }
        }
      }
    } catch (err) {
      console.error('Error checking permissions:', err);
    }
  };

  // Fetch holidays
  const fetchHolidays = async () => {
    try {
      setLoading(true);

      // Debug: Check if we can access the table
      const { count, error: countError } = await supabase
        .from('calendar_holidays')
        .select('*', { count: 'exact', head: true });

      console.log('Total records in calendar_holidays table:', count);
      if (countError) {
        console.error('Error accessing calendar_holidays:', countError);
      }

      let query = supabase
        .from('calendar_holidays')
        .select('*');

      // Filter by year
      const yearStart = startOfYear(new Date(selectedYear, 0, 1));
      const yearEnd = endOfYear(new Date(selectedYear, 0, 1));

      query = query
        .gte('holiday_date', format(yearStart, 'yyyy-MM-dd'))
        .lte('holiday_date', format(yearEnd, 'yyyy-MM-dd'));

      // Filter by month if selected
      if (selectedMonth !== null) {
        const monthStart = startOfMonth(new Date(selectedYear, selectedMonth, 1));
        const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth, 1));

        query = query
          .gte('holiday_date', format(monthStart, 'yyyy-MM-dd'))
          .lte('holiday_date', format(monthEnd, 'yyyy-MM-dd'));
      }

      // Filter weekends if needed
      if (!showWeekends) {
        query = query.neq('holiday_type', 'weekend');
      }

      const { data, error } = await query.order('holiday_date');

      if (error) {
        console.error('Error fetching holidays:', error);
        toast.error('Failed to fetch holidays: ' + error.message);
        return;
      }

      console.log(`Fetched ${data?.length || 0} holidays for year ${selectedYear}`);
      setHolidays(data || []);
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to load holidays');
    } finally {
      setLoading(false);
    }
  };

  // Add holiday
  const handleAddHoliday = async () => {
    if (!formData.holiday_date || !formData.holiday_name) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const user = (await supabase.auth.getUser()).data.user;
      const holidayData = {
        ...formData,
        created_by: user?.id || null
      };

      console.log('Adding holiday:', holidayData);

      const { error } = await supabase
        .from('calendar_holidays')
        .insert(holidayData);

      if (error) {
        console.error('Error adding holiday:', error);
        toast.error(`Failed to add holiday: ${error.message}`);
        return;
      }

      console.log('Holiday added successfully');
      toast.success('Holiday added successfully');
      setShowAddDialog(false);
      setFormData({
        holiday_date: '',
        holiday_name: '',
        holiday_type: 'public',
        is_mandatory: true
      });
      fetchHolidays();
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to add holiday');
    }
  };

  // Edit holiday
  const handleEditHoliday = async () => {
    if (!selectedHoliday || !formData.holiday_name) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      console.log('Updating holiday ID:', selectedHoliday.id);
      console.log('Update data:', {
        holiday_name: formData.holiday_name,
        holiday_type: formData.holiday_type,
        is_mandatory: formData.is_mandatory
      });

      // Perform the update
      const { data: updateData, error, count } = await supabase
        .from('calendar_holidays')
        .update({
          holiday_name: formData.holiday_name,
          holiday_type: formData.holiday_type,
          is_mandatory: formData.is_mandatory
        })
        .eq('id', selectedHoliday.id)
        .select();

      console.log('Update response:', { updateData, error, count });

      if (error) {
        console.error('Error updating holiday:', error);
        toast.error(`Failed to update: ${error.message || error.code || 'Unknown error'}`);

        // Try to get more details about the error
        const { data: testData, error: testError } = await supabase
          .from('calendar_holidays')
          .select('*')
          .eq('id', selectedHoliday.id)
          .single();

        console.log('Current record state:', testData, testError);
        return;
      }

      // Check if any rows were actually updated
      if (!updateData || updateData.length === 0) {
        console.warn('No rows were updated');
        toast.warning('No changes were made. The holiday may not exist.');
        return;
      }

      console.log('Update successful, updated record:', updateData[0]);
      toast.success('Holiday updated successfully');
      setShowEditDialog(false);
      setSelectedHoliday(null);
      setFormData({
        holiday_date: '',
        holiday_name: '',
        holiday_type: 'public',
        is_mandatory: true
      });

      // Refresh the list to show updated data
      await fetchHolidays();
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred');
    }
  };

  // Delete holiday
  const handleDeleteHoliday = async (id: string) => {
    if (!confirm('Are you sure you want to delete this holiday?')) return;

    try {
      console.log('Deleting holiday:', id);

      // Delete without select to avoid the single row error
      const { error } = await supabase
        .from('calendar_holidays')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting holiday:', error);
        toast.error(`Failed to delete: ${error.message}`);
        return;
      }

      console.log('Delete successful');
      toast.success('Holiday deleted successfully');
      fetchHolidays();
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to delete holiday');
    }
  };

  // Generate weekends for a year
  const generateWeekends = async () => {
    setBulkGenerating(true);

    try {
      const weekends = [];
      const yearStart = startOfYear(new Date(selectedYear, 0, 1));
      const yearEnd = endOfYear(new Date(selectedYear, 0, 1));

      let currentDate = yearStart;
      while (currentDate <= yearEnd) {
        const dayOfWeek = getDay(currentDate);

        if (dayOfWeek === 0 || dayOfWeek === 6) {
          weekends.push({
            holiday_date: format(currentDate, 'yyyy-MM-dd'),
            holiday_name: dayOfWeek === 0 ? 'Sunday' : 'Saturday',
            holiday_type: 'weekend',
            is_mandatory: true,
            created_by: (await supabase.auth.getUser()).data.user?.id
          });
        }

        currentDate = addDays(currentDate, 1);
      }

      // Insert weekends (will skip duplicates due to unique constraint)
      for (const weekend of weekends) {
        await supabase
          .from('calendar_holidays')
          .insert(weekend)
          .select()
          .single();
      }

      toast.success(`Generated weekends for ${selectedYear}`);
      fetchHolidays();
    } catch (err) {
      console.error('Error generating weekends:', err);
      toast.error('Some weekends may already exist');
    } finally {
      setBulkGenerating(false);
    }
  };

  // Export holidays to CSV
  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'Holiday Name', 'Type', 'Mandatory'],
      ...holidays.map(h => [
        h.holiday_date,
        h.holiday_name,
        h.holiday_type,
        h.is_mandatory ? 'Yes' : 'No'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `holidays_${selectedYear}.csv`;
    a.click();
  };

  useEffect(() => {
    checkUserPermissions();
  }, []);

  useEffect(() => {
    fetchHolidays();
  }, [selectedYear, selectedMonth, showWeekends]);

  // Get holiday dates for calendar marking
  const holidayDates = holidays.map(h => new Date(h.holiday_date));

  // Calculate statistics
  const stats = {
    totalHolidays: holidays.length,
    publicHolidays: holidays.filter(h => h.holiday_type === 'public').length,
    companyHolidays: holidays.filter(h => h.holiday_type === 'company').length,
    weekends: holidays.filter(h => h.holiday_type === 'weekend').length,
    workingDays: 365 - holidays.filter(h => h.is_mandatory).length
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Holiday Calendar</h1>
          <p className="text-muted-foreground">
            Manage public holidays, company holidays, and weekends
          </p>
          {userRole && (
            <div className="mt-2 space-y-1">
              <p className="text-sm">
                Role: <Badge variant={userRole === 'super_admin' ? 'default' : 'outline'}>{userRole}</Badge>
                {canManage ? (
                  <span className="text-green-600 ml-2">✓ Full CRUD access</span>
                ) : (
                  <span className="text-muted-foreground ml-2">📖 View only</span>
                )}
              </p>
              {userRole === 'super_admin' && (
                <p className="text-xs text-muted-foreground">
                  You can create, update, and delete holidays
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={holidays.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          {canManage && (
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Holiday
            </Button>
          )}
        </div>
      </div>

      {/* Year and Month Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div>
              <Label>Year</Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(v) => setSelectedYear(parseInt(v))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Month</Label>
              <Select
                value={selectedMonth?.toString() ?? 'all'}
                onValueChange={(v) => setSelectedMonth(v === 'all' ? null : parseInt(v))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {monthNames.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="show-weekends"
                checked={showWeekends}
                onCheckedChange={(checked) => setShowWeekends(checked as boolean)}
              />
              <Label htmlFor="show-weekends" className="cursor-pointer">
                Show Weekends
              </Label>
            </div>

            {canManage && (
              <Button
                variant="outline"
                onClick={generateWeekends}
                disabled={bulkGenerating}
              >
                {bulkGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Generate Weekends
                  </>
                )}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={fetchHolidays}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Holidays</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalHolidays}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Public Holidays</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{stats.publicHolidays}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Company Holidays</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">{stats.companyHolidays}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Weekends</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-600">{stats.weekends}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Working Days</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.workingDays}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        {/* List View */}
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Holidays in {selectedMonth !== null ? monthNames[selectedMonth] : ''} {selectedYear}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : holidays.length === 0 ? (
                <div className="p-8 text-center">
                  <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No holidays found for the selected period</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Holiday Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Mandatory</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holidays.map((holiday) => {
                      const date = new Date(holiday.holiday_date);
                      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

                      return (
                        <TableRow key={holiday.id}>
                          <TableCell>
                            {format(date, 'dd MMM yyyy')}
                          </TableCell>
                          <TableCell>
                            <span className={dayName === 'Sunday' || dayName === 'Saturday' ? 'text-red-600 font-medium' : ''}>
                              {dayName}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">{holiday.holiday_name}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                holiday.holiday_type === 'public' ? 'default' :
                                holiday.holiday_type === 'company' ? 'secondary' :
                                'outline'
                              }
                            >
                              {holiday.holiday_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {holiday.is_mandatory ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-400" />
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2 justify-center">
                              {canManage ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedHoliday(holiday);
                                      setFormData({
                                        holiday_date: holiday.holiday_date,
                                        holiday_name: holiday.holiday_name,
                                        holiday_type: holiday.holiday_type,
                                        is_mandatory: holiday.is_mandatory
                                      });
                                      setShowEditDialog(true);
                                    }}
                                    disabled={holiday.holiday_type === 'weekend'}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => handleDeleteHoliday(holiday.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </>
                              ) : (
                                <span className="text-sm text-muted-foreground">View Only</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar View */}
        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
              <p className="text-sm text-muted-foreground">
                Holidays are marked with dots. Public holidays in blue, company in purple, weekends in gray.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                  modifiers={{
                    holiday: holidayDates
                  }}
                  modifiersStyles={{
                    holiday: {
                      fontWeight: 'bold',
                      textDecoration: 'underline'
                    }
                  }}
                />
              </div>

              {selectedDate && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">
                    {format(selectedDate, 'EEEE, dd MMMM yyyy')}
                  </h3>
                  {holidays
                    .filter(h => h.holiday_date === format(selectedDate, 'yyyy-MM-dd'))
                    .map(h => (
                      <div key={h.id} className="flex items-center gap-2">
                        <Badge variant={
                          h.holiday_type === 'public' ? 'default' :
                          h.holiday_type === 'company' ? 'secondary' :
                          'outline'
                        }>
                          {h.holiday_type}
                        </Badge>
                        <span>{h.holiday_name}</span>
                      </div>
                    ))
                  }
                  {holidays.filter(h => h.holiday_date === format(selectedDate, 'yyyy-MM-dd')).length === 0 && (
                    <p className="text-muted-foreground">No holiday on this date</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Holiday Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Holiday</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.holiday_date}
                onChange={(e) => setFormData({...formData, holiday_date: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="name">Holiday Name *</Label>
              <Input
                id="name"
                value={formData.holiday_name}
                onChange={(e) => setFormData({...formData, holiday_name: e.target.value})}
                placeholder="e.g., Diwali, Christmas"
              />
            </div>

            <div>
              <Label htmlFor="type">Holiday Type</Label>
              <Select
                value={formData.holiday_type}
                onValueChange={(v: 'public' | 'company' | 'weekend') =>
                  setFormData({...formData, holiday_type: v})
                }
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public Holiday</SelectItem>
                  <SelectItem value="company">Company Holiday</SelectItem>
                  <SelectItem value="weekend">Weekend</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="mandatory"
                checked={formData.is_mandatory}
                onCheckedChange={(checked) =>
                  setFormData({...formData, is_mandatory: checked as boolean})
                }
              />
              <Label htmlFor="mandatory" className="cursor-pointer">
                Mandatory holiday (non-working day)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddHoliday}>
              Add Holiday
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Holiday Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Holiday</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Date</Label>
              <Input
                value={formData.holiday_date}
                disabled
              />
            </div>

            <div>
              <Label htmlFor="edit-name">Holiday Name *</Label>
              <Input
                id="edit-name"
                value={formData.holiday_name}
                onChange={(e) => setFormData({...formData, holiday_name: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="edit-type">Holiday Type</Label>
              <Select
                value={formData.holiday_type}
                onValueChange={(v: 'public' | 'company' | 'weekend') =>
                  setFormData({...formData, holiday_type: v})
                }
              >
                <SelectTrigger id="edit-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public Holiday</SelectItem>
                  <SelectItem value="company">Company Holiday</SelectItem>
                  <SelectItem value="weekend">Weekend</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-mandatory"
                checked={formData.is_mandatory}
                onCheckedChange={(checked) =>
                  setFormData({...formData, is_mandatory: checked as boolean})
                }
              />
              <Label htmlFor="edit-mandatory" className="cursor-pointer">
                Mandatory holiday (non-working day)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditHoliday}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}