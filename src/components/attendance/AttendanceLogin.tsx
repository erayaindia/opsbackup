import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, LogIn, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AttendanceLoginProps {
  onEmployeeVerified: (employeeId: string, userId: string) => Promise<boolean>;
  isLoading?: boolean;
}

const AttendanceLogin: React.FC<AttendanceLoginProps> = ({
  onEmployeeVerified,
  isLoading = false
}) => {
  const [employeeId, setEmployeeId] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const validateEmployeeId = (id: string): boolean => {
    // Updated validation for your employee ID format: RD001, EE001, PB001
    const employeeIdRegex = /^[A-Z]{2}\d{3}$/; // Example: RD001, EE001, PB001
    return employeeIdRegex.test(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!employeeId.trim()) {
      setError('Please enter your employee ID');
      return;
    }

    if (!validateEmployeeId(employeeId.toUpperCase())) {
      setError('Invalid employee ID format. Use format: RD001');
      return;
    }

    setIsValidating(true);

    try {
      // Verify employee exists in app_users table
      const { data: appUser, error: verifyError } = await supabase
        .from('app_users')
        .select('*')
        .eq('employee_id', employeeId.toUpperCase())
        .eq('status', 'active')
        .single();

      if (verifyError || !appUser) {
        setError('Employee ID not found or inactive');
        return;
      }

      const verificationSuccess = await onEmployeeVerified(employeeId.toUpperCase(), appUser.auth_user_id);

      // Only show success toast if employee was successfully processed (no duplicate found)
      if (verificationSuccess) {
        toast({
          title: "Employee verified",
          description: `Welcome, ${appUser.full_name}!`,
        });
      } else {
        // Reset form to allow trying with different employee ID
        setEmployeeId('');
      }
    } catch (error) {
      console.error('Employee verification error:', error);
      setError('Unable to verify employee. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Employee Check-in</CardTitle>
        <CardDescription>
          Enter your employee ID to access the attendance system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="employeeId" className="text-sm font-medium">
              Employee ID
            </label>
            <Input
              id="employeeId"
              type="text"
              placeholder="Enter your ID (e.g., RD001)"
              value={employeeId}
              onChange={(e) => {
                setEmployeeId(e.target.value.toUpperCase());
                setError('');
              }}
              disabled={isValidating || isLoading}
              className="text-center text-lg font-mono"
              maxLength={5}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isValidating || isLoading || !employeeId.trim()}
          >
            {isValidating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Continue
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Having trouble? Contact IT support</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceLogin;