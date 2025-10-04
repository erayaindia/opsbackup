# Recurring Tasks Feature - User Guide

## Overview

The task management system now supports **Weekly** and **Monthly** recurring tasks in addition to the existing **Daily** and **One-off** tasks.

## What's New

### Task Types

1. **Daily** - Tasks that recur every day (existing)
2. **Weekly** ⭐ NEW - Tasks that recur on specific days of the week
3. **Monthly** ⭐ NEW - Tasks that recur on specific days of the month
4. **One-off** - Tasks that happen once (existing)

## How to Create Recurring Tasks

### Creating a Weekly Task

1. Open the task creation form
2. Select **"Weekly Task"** from the Task Type dropdown
3. Select the days of the week when this task should occur:
   - Check the boxes for the desired days (Mon, Tue, Wed, etc.)
   - You can select multiple days
   - Example: Check Mon, Wed, Fri for a task that recurs 3 times per week
4. Set the **Start Date** (when the recurrence pattern begins)
5. Optionally set an **End Date** (when the recurrence pattern stops)
6. Fill in other task details (title, description, priority, etc.)
7. Click Create Task

**Example:**
- Task Type: Weekly
- Days: Monday, Wednesday, Friday
- Start Date: Oct 7, 2025
- End Date: Dec 31, 2025
- Result: This task will appear every Mon, Wed, and Fri between Oct 7 and Dec 31, 2025

### Creating a Monthly Task

1. Open the task creation form
2. Select **"Monthly Task"** from the Task Type dropdown
3. Select the days of the month when this task should occur:
   - Check the boxes for the desired days (1-31)
   - You can select multiple days
   - Example: Check 1, 15, 30 for a task that recurs on the 1st, 15th, and 30th of each month
4. Set the **Start Date** (when the recurrence pattern begins)
5. Optionally set an **End Date** (when the recurrence pattern stops)
6. Fill in other task details
7. Click Create Task

**Example:**
- Task Type: Monthly
- Days: 1, 15, 30
- Start Date: Oct 1, 2025
- End Date: None (continues indefinitely)
- Result: This task will appear on the 1st, 15th, and 30th of every month

**Note:** For months with fewer than 31 days (e.g., February), day 31 will be skipped automatically.

## How It Works

### Task Templates vs Task Instances

- When you create a recurring task (daily, weekly, or monthly), you're creating a **template**
- The system automatically generates **instances** of that task based on your recurrence pattern
- Instances are created at midnight (12:00 AM) each day for tasks that should occur that day

### Viewing Recurring Tasks

1. **In My Tasks Page:**
   - Filter by task type: All, Daily, Weekly, Monthly, or One-off
   - Group by task type to see them organized
   - Task badges show the recurrence pattern:
     - "Daily"
     - "Weekly (Mon, Wed, Fri)"
     - "Monthly (1, 15, 30)"

2. **Task Grouping:**
   - Daily Tasks
   - Weekly Tasks
   - Monthly Tasks
   - One-off Tasks

## Database Migration

To enable this feature, run the migration:

```bash
# Apply the migration via Supabase CLI
supabase db push
```

Or apply manually:
```sql
-- Run the SQL in: supabase/migrations/20251004_add_recurring_task_patterns.sql
```

## Technical Details

### Database Schema Changes

Three new columns added to the `tasks` table:
- `recurrence_pattern` (JSONB) - Stores the recurrence rule
- `recurrence_start_date` (DATE) - When the pattern starts
- `recurrence_end_date` (DATE) - When the pattern ends (optional)

### Recurrence Pattern Examples

**Daily:**
```json
{ "type": "daily" }
```

**Weekly (Mon, Wed, Fri):**
```json
{ "type": "weekly", "days": [1, 3, 5] }
```
*Days: 0=Sunday, 1=Monday, ..., 6=Saturday*

**Monthly (1st, 15th, Last day):**
```json
{ "type": "monthly", "days": [1, 15, 30] }
```
*Days: 1-31 representing day of month*

### New Database Functions

1. `should_create_task_instance()` - Determines if a task should run on a given date
2. `create_recurring_task_instances_for_user()` - Creates instances for all matching recurring tasks
3. `validate_recurrence_pattern()` - Validates recurrence pattern JSON

## API Changes

### Creating Tasks

When creating a task via the API, include:

```typescript
{
  title: "Weekly Team Meeting",
  task_type: "weekly",
  recurrence_pattern: {
    type: "weekly",
    days: [1, 3] // Monday and Wednesday
  },
  recurrence_start_date: "2025-10-07",
  recurrence_end_date: null, // or "2025-12-31"
  // ... other fields
}
```

## Backward Compatibility

- All existing daily tasks will continue to work
- Existing daily tasks are automatically migrated to use `recurrence_pattern: { "type": "daily" }`
- The old `create_daily_task_instances_for_user()` function still works (it's an alias)

## Troubleshooting

### Tasks not appearing

1. Check that the current date is within the recurrence start/end date range
2. For weekly tasks, verify the current day of week is selected
3. For monthly tasks, verify the current day of month is selected
4. Check that task instances were created (they're created at midnight)

### Manual instance creation

You can manually trigger instance creation:

```sql
SELECT create_recurring_task_instances_for_user(
  'user-uuid-here'::uuid,
  '2025-10-07'::date
);
```

## Examples

### Weekly Standup (Mon, Wed, Fri)

```typescript
{
  title: "Team Standup",
  task_type: "weekly",
  recurrence_pattern: { type: "weekly", days: [1, 3, 5] },
  recurrence_start_date: "2025-10-01",
  recurrence_end_date: null
}
```

### Monthly Report (1st of month)

```typescript
{
  title: "Submit Monthly Report",
  task_type: "monthly",
  recurrence_pattern: { type: "monthly", days: [1] },
  recurrence_start_date: "2025-10-01",
  recurrence_end_date: null
}
```

### Bi-weekly Pay Period Tasks (1st and 15th)

```typescript
{
  title: "Process Payroll",
  task_type: "monthly",
  recurrence_pattern: { type: "monthly", days: [1, 15] },
  recurrence_start_date: "2025-10-01",
  recurrence_end_date: null
}
```

## Future Enhancements

Potential features for future releases:
- Custom recurrence patterns (every N weeks/months)
- Exclude specific dates (holidays)
- "Last day of month" option
- "Every weekday" shortcut
- Recurrence preview calendar

## Support

For issues or questions:
1. Check the Logs page for error messages
2. Verify the migration was applied successfully
3. Check the browser console for client-side errors
4. Contact the development team with details about the issue
