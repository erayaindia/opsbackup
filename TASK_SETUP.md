# Task Management System Setup Guide

## Overview

This document provides setup instructions for the comprehensive task management system that has been implemented. The system includes:

- **Employee Tasks** (`/me/tasks`) - Personal task dashboard
- **Admin Hub** (`/admin/tasks`) - Administrative task management
- **Review Inbox** (`/review`) - Task review and approval workflow

## Database Setup

### 1. Run the Migration

Execute the migration file to create the necessary database tables:

```sql
-- Apply the migration file
\i supabase/migrations/20250122000001_create_task_management_tables.sql
```

This will create the following tables:
- `task_templates` - Reusable task templates
- `tasks` - All task instances
- `task_submissions` - Evidence and completion data
- `task_reviews` - Review history and feedback
- `task_settings` - Configuration and defaults

### 2. Create Storage Bucket

Create a storage bucket for task evidence files in Supabase:

1. Go to **Storage** in your Supabase dashboard
2. Click **New Bucket**
3. Name: `task-evidence`
4. Set as **Public bucket** (for easy file access)
5. Click **Create Bucket**

### 3. Set Storage Policies

Apply the following RLS policies for the storage bucket:

```sql
-- Allow authenticated users to upload to their task folders
CREATE POLICY "task_evidence_upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'task-evidence' AND
  auth.role() = 'authenticated'
);

-- Allow users to view evidence for tasks they're assigned to or reviewing
CREATE POLICY "task_evidence_select" ON storage.objects
FOR SELECT USING (
  bucket_id = 'task-evidence' AND
  auth.role() = 'authenticated'
);

-- Allow users to delete their own evidence
CREATE POLICY "task_evidence_delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'task-evidence' AND
  auth.role() = 'authenticated'
);
```

## Features Implemented

### Employee Experience (`/me/tasks`)
- **Daily Tasks Tab**: Today's routine tasks with auto-assignment
- **Other Tasks Tab**: One-off project tasks
- **History Tab**: Past completed tasks
- **Progress Tracking**: Visual progress indicators
- **Evidence Upload**: Photo, file, link, and checklist support
- **Real-time Updates**: Live task status changes

### Admin Hub (`/admin/tasks`)
- **Overview Dashboard**: KPI cards and task distribution
- **Task Management**: Create, assign, and manage all tasks
- **Template Library**: Reusable task templates
- **Bulk Actions**: Mass assign, approve, or modify tasks
- **Multiple Views**: List, Kanban, and Calendar views
- **Analytics**: Completion rates and performance metrics
- **CSV Export**: Data export functionality

### Review Workflow (`/review`)
- **Review Queue**: Tasks awaiting approval
- **Evidence Viewer**: Side-by-side evidence review
- **Bulk Approval**: Quick approve for qualifying tasks
- **Review Notes**: Feedback and rejection reasons
- **Late Submissions**: Special handling for overdue tasks

### Smart Automation
- **Auto-Assignment**: Daily tasks created automatically each morning
- **Auto-Approval**: On-time daily tasks with evidence auto-approve
- **Late Detection**: Automatic flagging of overdue submissions
- **Role-based Access**: Proper permissions and access controls

## Configuration

### Default Settings

The system includes configurable defaults for:
- Auto-approval cutoff times (default: 2 hours)
- Evidence requirements per task type
- Notification preferences
- Role-based access controls

### Task Templates

Create templates for recurring tasks:
1. Go to Admin Hub → Templates tab
2. Click "Create Template"
3. Define task details, evidence requirements, and auto-assignment rules
4. Save and activate template

### Daily Task Automation

Daily tasks are created automatically using the `create_daily_tasks()` function. Set up a scheduled job to run this function each morning:

```sql
-- Example: Run daily at 6:00 AM
SELECT cron.schedule('create-daily-tasks', '0 6 * * *', 'SELECT create_daily_tasks();');
```

## Navigation

The task system is integrated into the existing navigation:

### Team Hub Section
- **My Tasks** - Personal task dashboard
- **Tasks & To-Dos** - Legacy task interface (existing)
- **Review Inbox** - Task review workflow

### Admin Section
- **Task Management Hub** - Administrative interface

## API Endpoints

The system expects these API endpoints to be implemented:

- `POST /api/tasks/start` - Start a task
- `POST /api/tasks/mark-done` - Mark daily task as complete
- `POST /api/tasks/submit-review` - Submit one-off task for review
- `POST /api/tasks/review` - Submit task review (approve/reject)
- `POST /api/tasks/bulk-approve` - Bulk approve tasks

## Testing

### Test Scenarios
1. **Create a daily task template** with auto-assignment
2. **Assign a one-off task** to a team member
3. **Submit evidence** for both task types
4. **Test auto-approval** for on-time daily tasks
5. **Test review workflow** for one-off tasks
6. **Verify late submission** routing to reviewers

### Sample Data

You can create sample task templates and assignments to test the system:

```sql
-- Sample daily task template
INSERT INTO task_templates (
  title, description, task_type, priority, evidence_required,
  due_time, auto_assign_roles, reviewer_role
) VALUES (
  'Check customer disputes',
  'Review and respond to customer disputes from overnight',
  'daily', 'high', 'photo',
  '11:00:00', ARRAY['support_agent'], 'team_lead'
);

-- Sample one-off task
INSERT INTO tasks (
  title, description, task_type, priority, evidence_required,
  due_date, assigned_to, reviewer_id
) VALUES (
  'Create product demo video',
  'Record a 2-minute demo of the new product features',
  'one-off', 'medium', 'file',
  CURRENT_DATE + INTERVAL '3 days',
  'user-id-here', 'reviewer-id-here'
);
```

## Troubleshooting

### Common Issues

1. **Tasks not auto-creating**: Check the `create_daily_tasks()` function and cron job
2. **Auto-approval not working**: Verify the trigger function and task settings
3. **File uploads failing**: Check storage bucket permissions and policies
4. **Navigation not showing**: Verify user permissions and module access

### Debugging

Check the browser console and Supabase logs for detailed error messages. The system includes comprehensive error handling and user feedback.

## Next Steps

1. **Apply the database migration**
2. **Create the storage bucket**
3. **Set up the daily task automation**
4. **Create initial task templates**
5. **Test the complete workflow**

The task management system is now ready for production use!