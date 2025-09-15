# Attendance System Documentation

## Overview

The Eraya Ops Hub now includes a comprehensive attendance system that allows employees to check in/out with multi-layer verification including:

- **Employee ID validation**
- **Location verification (IP + GPS)**
- **Selfie capture for identity verification**
- **Real-time dashboard for managers**
- **Attendance history and reporting**

## Features

### 🔐 Security Features
- **Multi-factor verification**: Employee ID + Location + Selfie
- **IP whitelisting**: Only allows check-ins from office network
- **GPS verification**: Ensures employees are within office radius
- **Facial verification**: Captures selfie for each check-in
- **Rate limiting**: Prevents multiple rapid check-ins

### 📱 Employee Experience
- **Simple 3-step process**: Login → Location → Selfie
- **Visual progress indicator**: Clear steps with completion status
- **Instant feedback**: Real-time verification results
- **Mobile-friendly**: Works on phones and tablets
- **Error handling**: Clear error messages and retry options

### 📊 Management Dashboard
- **Real-time overview**: Live attendance status
- **Statistics**: Present, late, absent, checked-out counts
- **Employee filtering**: View by status, department, etc.
- **Attendance history**: Detailed records with export
- **Photo verification**: View selfies for verification

## Setup Instructions

### 1. Database Setup

Run the SQL script to set up the required tables:

```bash
# Copy the contents of sql/attendance_setup.sql
# Run in your Supabase SQL Editor
```

### 2. Environment Configuration

Update your attendance settings in the database:

```sql
UPDATE attendance_settings SET
    office_name = 'Your Office Name',
    office_ip_ranges = ARRAY['192.168.1.', '10.0.0.', 'your.office.ip.'],
    office_latitude = 40.7128,  -- Your office latitude
    office_longitude = -74.0060, -- Your office longitude
    allowed_radius_meters = 100,
    work_start_time = '09:00:00',
    work_end_time = '17:00:00',
    late_threshold_minutes = 15
WHERE is_active = true;
```

### 3. Employee Setup

Create employee profiles:

```sql
INSERT INTO employee_profiles (
    user_id,
    employee_id,
    department,
    position,
    hire_date
) VALUES
    ('user-uuid-1', 'AB1234', 'Engineering', 'Developer', '2024-01-01'),
    ('user-uuid-2', 'CD5678', 'Marketing', 'Manager', '2024-01-15');
```

### 4. Permissions Setup

Ensure proper user roles in the `profiles` table:

```sql
UPDATE profiles SET role = 'admin' WHERE user_id = 'admin-user-uuid';
UPDATE profiles SET role = 'employee' WHERE user_id = 'employee-user-uuid';
```

## Usage Guide

### For Employees

1. **Access the System**
   - Navigate to `/attendance` in the app
   - Click "Employee Check-in" mode

2. **Step 1: Login**
   - Enter your employee ID (format: AB1234)
   - System validates against database

3. **Step 2: Location Verification**
   - Click "Verify Location"
   - System checks IP address and GPS
   - Both must pass to continue

4. **Step 3: Selfie Capture**
   - Click "Start Camera"
   - Take a clear selfie
   - Review and confirm photo

5. **Check-out**
   - Same process or automatic at end of day

### For Managers/Admins

1. **Dashboard Access**
   - Navigate to `/attendance`
   - Click "View Dashboard"

2. **Real-time Monitoring**
   - View current attendance status
   - See who's present, late, or absent
   - Monitor check-in/out times

3. **Reports & History**
   - Export attendance data as CSV
   - Filter by date, employee, or status
   - View selfies for verification

## Security Considerations

### IP Whitelisting
- Configure your office IP ranges in `attendance_settings`
- Supports multiple IP prefixes
- Blocks check-ins from external networks

### GPS Verification
- Set office coordinates accurately
- Adjust radius based on building size
- Consider GPS accuracy limitations

### Photo Storage
- Selfies stored securely in Supabase Storage
- Access controlled by RLS policies
- Automatic file naming with timestamps

### Data Privacy
- Photos only accessible to authorized users
- Attendance data protected by RLS
- Audit trail for all actions

## Customization Options

### Employee ID Format
Update validation in `AttendanceLogin.tsx`:

```typescript
const validateEmployeeId = (id: string): boolean => {
  const employeeIdRegex = /^[A-Z]{2}\d{4}$/; // Your format
  return employeeIdRegex.test(id);
};
```

### Work Hours
Configure in database:

```sql
UPDATE attendance_settings SET
    work_start_time = '08:30:00',
    work_end_time = '17:30:00',
    late_threshold_minutes = 10;
```

### Location Settings
Adjust office coordinates and radius:

```sql
UPDATE attendance_settings SET
    office_latitude = YOUR_LATITUDE,
    office_longitude = YOUR_LONGITUDE,
    allowed_radius_meters = 200; -- Adjust as needed
```

## Troubleshooting

### Common Issues

1. **Employee ID Not Found**
   - Check employee_profiles table
   - Ensure employee_id matches exactly
   - Verify is_active = true

2. **Location Verification Failed**
   - Check IP ranges in attendance_settings
   - Verify GPS permissions in browser
   - Confirm office coordinates are correct

3. **Camera Not Working**
   - Check browser permissions
   - Ensure HTTPS connection
   - Try different browser

4. **Photos Not Saving**
   - Verify storage bucket exists
   - Check storage policies
   - Confirm file upload permissions

### Debug Mode

Enable debug logging:

```typescript
// In LocationVerifier.tsx
console.log('Current IP:', ip);
console.log('Allowed ranges:', OFFICE_SETTINGS.allowedIpRanges);
console.log('GPS coords:', latitude, longitude);
console.log('Distance from office:', distance);
```

## API Endpoints

### Employee Verification
```
POST /api/employees/verify
Body: { employee_id: "AB1234" }
```

### Attendance Records
```
GET /api/attendance/today
GET /api/attendance/history?from=date&to=date
POST /api/attendance/checkin
POST /api/attendance/checkout
```

## Component Architecture

```
src/components/attendance/
├── AttendanceLogin.tsx      # Employee ID validation
├── LocationVerifier.tsx     # IP + GPS verification
├── SelfieCapture.tsx       # Camera and photo capture
├── AttendanceDashboard.tsx # Real-time overview
└── AttendanceHistory.tsx   # Historical records

src/hooks/
└── useAttendance.ts        # Data management hook

src/pages/team-hub/
└── Attendance.tsx          # Main attendance page
```

## Browser Support

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 14.3+)
- **Mobile browsers**: Supported with camera access

## Performance Notes

- Real-time updates via Supabase subscriptions
- Auto-refresh every 5 minutes
- Optimized image compression for selfies
- Lazy loading for historical data

## Future Enhancements

- [ ] Facial recognition comparison
- [ ] QR code check-in option
- [ ] Shift scheduling integration
- [ ] Mobile app notifications
- [ ] Biometric authentication
- [ ] Advanced analytics and insights

---

For technical support or feature requests, contact the development team.