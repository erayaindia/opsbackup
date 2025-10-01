import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserPlus, Loader2 } from 'lucide-react';

interface AppUser {
  id: string;
  full_name: string;
  company_email: string;
  employee_id: string;
}

const AddEmployeeDetails: React.FC = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    personal_email: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    onboarding_status: 'pending',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('app_users')
      .select('id, full_name, company_email, employee_id')
      .order('full_name');

    if (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
      return;
    }

    setUsers(data || []);
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    const user = users.find(u => u.id === userId);
    if (user) {
      setFormData(prev => ({
        ...prev,
        employee_id: user.employee_id || ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }

    setLoading(true);

    try {
      // Create address JSON
      const addressJson = {
        street: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode
      };

      // Insert into employees_details
      const { error } = await supabase
        .from('employees_details')
        .insert({
          app_user_id: selectedUserId,
          employee_id: formData.employee_id,
          personal_email: formData.personal_email || null,
          emergency_contact_name: formData.emergency_contact_name || null,
          emergency_contact_phone: formData.emergency_contact_phone || null,
          address: addressJson,
          onboarding_status: formData.onboarding_status,
        });

      if (error) {
        console.error('Error creating employee details:', error);
        toast.error('Failed to create employee details: ' + error.message);
        return;
      }

      toast.success('Employee details added successfully!');

      // Reset form
      setSelectedUserId('');
      setFormData({
        employee_id: '',
        personal_email: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        onboarding_status: 'pending',
      });

    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Add Employee Details</h1>
        <p className="text-muted-foreground mt-2">
          Add extended employee information for existing users
        </p>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Employee Information Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Select User */}
            <div className="space-y-2">
              <Label htmlFor="user">Select User *</Label>
              <Select value={selectedUserId} onValueChange={handleUserSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name} ({user.company_email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Employee ID */}
            <div className="space-y-2">
              <Label htmlFor="employee_id">Employee ID *</Label>
              <Input
                id="employee_id"
                value={formData.employee_id}
                onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                placeholder="e.g., 1000"
                required
              />
            </div>

            {/* Personal Email */}
            <div className="space-y-2">
              <Label htmlFor="personal_email">Personal Email</Label>
              <Input
                id="personal_email"
                type="email"
                value={formData.personal_email}
                onChange={(e) => setFormData(prev => ({ ...prev, personal_email: e.target.value }))}
                placeholder="personal@example.com"
              />
            </div>

            {/* Emergency Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_name">Emergency Contact Name</Label>
                <Input
                  id="emergency_name"
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                  placeholder="Contact name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_phone">Emergency Contact Phone</Label>
                <Input
                  id="emergency_phone"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                  placeholder="Phone number"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Street address"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="State"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  value={formData.pincode}
                  onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                  placeholder="Pincode"
                />
              </div>
            </div>

            {/* Onboarding Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Onboarding Status</Label>
              <Select
                value={formData.onboarding_status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, onboarding_status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit Button */}
            <Button type="submit" disabled={loading || !selectedUserId} className="w-full" size="lg">
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Adding Details...
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5 mr-2" />
                  Add Employee Details
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-3xl bg-blue-50 dark:bg-blue-950/20 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">After Adding Details</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 dark:text-blue-200">
          <p>
            Once you add employee details, go to the <a href="/people" className="underline font-semibold">/people</a> page, click "View Details" on the user, and you'll see their complete employee information including addresses, emergency contacts, and onboarding status.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddEmployeeDetails;
