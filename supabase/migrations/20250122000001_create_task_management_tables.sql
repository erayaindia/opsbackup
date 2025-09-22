-- Task Management System Tables

-- Task Templates for reusable task definitions
CREATE TABLE task_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  task_type text NOT NULL CHECK (task_type IN ('daily', 'one-off')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  evidence_required text NOT NULL DEFAULT 'none' CHECK (evidence_required IN ('none', 'photo', 'file', 'link', 'checklist')),
  due_time time, -- For daily tasks (e.g., 11:00 AM)
  duration_hours integer, -- For one-off tasks (how long they take)
  checklist_items jsonb DEFAULT '[]'::jsonb, -- Array of checklist items
  tags text[] DEFAULT '{}',
  department text,
  role_access text[] DEFAULT '{}', -- Which roles can be assigned this template
  auto_assign_roles text[] DEFAULT '{}', -- Roles that get this task auto-assigned
  reviewer_role text, -- Default reviewer role
  reviewer_user_id uuid REFERENCES app_users(id),
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES app_users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Main tasks table for all task instances
CREATE TABLE tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id uuid REFERENCES task_templates(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  task_type text NOT NULL CHECK (task_type IN ('daily', 'one-off')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'submitted_for_review', 'approved', 'rejected', 'done_auto_approved')),
  evidence_required text NOT NULL DEFAULT 'none' CHECK (evidence_required IN ('none', 'photo', 'file', 'link', 'checklist')),
  due_date date NOT NULL,
  due_time time, -- For daily tasks
  due_datetime timestamp with time zone, -- For one-off tasks
  checklist_items jsonb DEFAULT '[]'::jsonb,
  tags text[] DEFAULT '{}',

  -- Assignment
  assigned_to uuid NOT NULL REFERENCES app_users(id),
  assigned_by uuid REFERENCES app_users(id),
  reviewer_id uuid REFERENCES app_users(id),

  -- Timestamps
  assigned_at timestamp with time zone DEFAULT now(),
  started_at timestamp with time zone,
  submitted_at timestamp with time zone,
  completed_at timestamp with time zone,

  -- Flags
  is_late boolean DEFAULT false,
  auto_approved boolean DEFAULT false,

  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Task submissions for evidence and completion details
CREATE TABLE task_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  submission_type text NOT NULL CHECK (submission_type IN ('evidence', 'completion', 'note')),

  -- Evidence details
  evidence_type text CHECK (evidence_type IN ('photo', 'file', 'link', 'checklist', 'note')),
  file_path text, -- Supabase storage path
  file_url text, -- Public URL
  file_name text,
  file_size integer,
  link_url text,
  notes text,
  checklist_data jsonb, -- Completed checklist items

  submitted_by uuid NOT NULL REFERENCES app_users(id),
  submitted_at timestamp with time zone DEFAULT now()
);

-- Task reviews for approval/rejection workflow
CREATE TABLE task_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES app_users(id),
  status text NOT NULL CHECK (status IN ('approved', 'rejected')),
  review_notes text,
  reviewed_at timestamp with time zone DEFAULT now()
);

-- Task settings for configuration and defaults
CREATE TABLE task_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_type text NOT NULL CHECK (setting_type IN ('global', 'role', 'team', 'user')),
  target_id text, -- role name, team name, or user id

  -- Auto-approval settings
  auto_approve_daily boolean DEFAULT true,
  auto_approve_cutoff_hours integer DEFAULT 2, -- How many hours late still allows auto-approval

  -- Notification settings
  notifications_enabled boolean DEFAULT true,
  email_notifications boolean DEFAULT false,
  due_reminder_hours integer DEFAULT 1, -- Remind X hours before due

  -- Default evidence requirements
  default_evidence_daily text DEFAULT 'photo',
  default_evidence_oneoff text DEFAULT 'file',

  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  UNIQUE(setting_type, target_id)
);

-- Create indexes for performance
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_reviewer_id ON tasks(reviewer_id);
CREATE INDEX idx_tasks_template_id ON tasks(template_id);
CREATE INDEX idx_task_submissions_task_id ON task_submissions(task_id);
CREATE INDEX idx_task_reviews_task_id ON task_reviews(task_id);
CREATE INDEX idx_task_reviews_reviewer_id ON task_reviews(reviewer_id);

-- Enable Row Level Security
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Task Templates: Admins and managers can manage, everyone can read active ones
CREATE POLICY "task_templates_read" ON task_templates
  FOR SELECT USING (
    is_active = true OR
    auth.uid() IN (
      SELECT auth_user_id FROM app_users
      WHERE role IN ('admin', 'manager', 'team_lead')
    )
  );

CREATE POLICY "task_templates_write" ON task_templates
  FOR ALL USING (
    auth.uid() IN (
      SELECT auth_user_id FROM app_users
      WHERE role IN ('admin', 'manager', 'team_lead')
    )
  );

-- Tasks: Users can see their own tasks, managers can see team tasks
CREATE POLICY "tasks_select" ON tasks
  FOR SELECT USING (
    assigned_to IN (
      SELECT id FROM app_users WHERE auth_user_id = auth.uid()
    ) OR
    reviewer_id IN (
      SELECT id FROM app_users WHERE auth_user_id = auth.uid()
    ) OR
    assigned_by IN (
      SELECT id FROM app_users WHERE auth_user_id = auth.uid()
    ) OR
    auth.uid() IN (
      SELECT auth_user_id FROM app_users
      WHERE role IN ('admin', 'manager', 'team_lead')
    )
  );

CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT auth_user_id FROM app_users
      WHERE role IN ('admin', 'manager', 'team_lead')
    )
  );

CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE USING (
    assigned_to IN (
      SELECT id FROM app_users WHERE auth_user_id = auth.uid()
    ) OR
    reviewer_id IN (
      SELECT id FROM app_users WHERE auth_user_id = auth.uid()
    ) OR
    auth.uid() IN (
      SELECT auth_user_id FROM app_users
      WHERE role IN ('admin', 'manager', 'team_lead')
    )
  );

-- Task Submissions: Users can manage their own submissions
CREATE POLICY "task_submissions_select" ON task_submissions
  FOR SELECT USING (
    submitted_by IN (
      SELECT id FROM app_users WHERE auth_user_id = auth.uid()
    ) OR
    task_id IN (
      SELECT id FROM tasks WHERE
        reviewer_id IN (SELECT id FROM app_users WHERE auth_user_id = auth.uid()) OR
        assigned_by IN (SELECT id FROM app_users WHERE auth_user_id = auth.uid())
    ) OR
    auth.uid() IN (
      SELECT auth_user_id FROM app_users
      WHERE role IN ('admin', 'manager', 'team_lead')
    )
  );

CREATE POLICY "task_submissions_insert" ON task_submissions
  FOR INSERT WITH CHECK (
    submitted_by IN (
      SELECT id FROM app_users WHERE auth_user_id = auth.uid()
    )
  );

-- Task Reviews: Only reviewers can create reviews
CREATE POLICY "task_reviews_select" ON task_reviews
  FOR SELECT USING (
    reviewer_id IN (
      SELECT id FROM app_users WHERE auth_user_id = auth.uid()
    ) OR
    task_id IN (
      SELECT id FROM tasks WHERE
        assigned_to IN (SELECT id FROM app_users WHERE auth_user_id = auth.uid()) OR
        assigned_by IN (SELECT id FROM app_users WHERE auth_user_id = auth.uid())
    ) OR
    auth.uid() IN (
      SELECT auth_user_id FROM app_users
      WHERE role IN ('admin', 'manager', 'team_lead')
    )
  );

CREATE POLICY "task_reviews_insert" ON task_reviews
  FOR INSERT WITH CHECK (
    reviewer_id IN (
      SELECT id FROM app_users WHERE auth_user_id = auth.uid()
    )
  );

-- Task Settings: Admins can manage all, users can read their own
CREATE POLICY "task_settings_select" ON task_settings
  FOR SELECT USING (
    setting_type = 'global' OR
    (setting_type = 'user' AND target_id = (
      SELECT id::text FROM app_users WHERE auth_user_id = auth.uid()
    )) OR
    auth.uid() IN (
      SELECT auth_user_id FROM app_users
      WHERE role IN ('admin', 'manager', 'team_lead')
    )
  );

CREATE POLICY "task_settings_write" ON task_settings
  FOR ALL USING (
    auth.uid() IN (
      SELECT auth_user_id FROM app_users
      WHERE role IN ('admin', 'manager')
    )
  );

-- Functions for auto-approval logic
CREATE OR REPLACE FUNCTION check_auto_approval()
RETURNS TRIGGER AS $$
DECLARE
  task_record tasks%ROWTYPE;
  settings_record task_settings%ROWTYPE;
  is_late boolean := false;
  cutoff_hours integer := 2;
BEGIN
  -- Get the task
  SELECT * INTO task_record FROM tasks WHERE id = NEW.task_id;

  -- Only auto-approve daily tasks
  IF task_record.task_type != 'daily' THEN
    RETURN NEW;
  END IF;

  -- Get settings for auto-approval
  SELECT * INTO settings_record FROM task_settings
  WHERE setting_type = 'global' OR
        (setting_type = 'user' AND target_id = task_record.assigned_to::text)
  ORDER BY
    CASE setting_type
      WHEN 'user' THEN 1
      WHEN 'global' THEN 2
    END
  LIMIT 1;

  IF settings_record IS NOT NULL THEN
    cutoff_hours := COALESCE(settings_record.auto_approve_cutoff_hours, 2);
  END IF;

  -- Check if submission is late
  IF task_record.due_datetime IS NOT NULL THEN
    is_late := NEW.submitted_at > (task_record.due_datetime + INTERVAL '1 hour' * cutoff_hours);
  ELSIF task_record.due_date IS NOT NULL AND task_record.due_time IS NOT NULL THEN
    is_late := NEW.submitted_at > ((task_record.due_date + task_record.due_time) + INTERVAL '1 hour' * cutoff_hours);
  END IF;

  -- Auto-approve if not late and has required evidence
  IF NOT is_late AND NEW.submission_type = 'completion' AND
     (task_record.evidence_required = 'none' OR NEW.evidence_type IS NOT NULL) THEN

    UPDATE tasks
    SET
      status = 'done_auto_approved',
      auto_approved = true,
      completed_at = NEW.submitted_at
    WHERE id = task_record.id;
  ELSE
    -- Route to reviewer
    UPDATE tasks
    SET
      status = 'submitted_for_review',
      is_late = is_late
    WHERE id = task_record.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-approval
CREATE TRIGGER task_submission_auto_approval
  AFTER INSERT ON task_submissions
  FOR EACH ROW
  WHEN (NEW.submission_type = 'completion')
  EXECUTE FUNCTION check_auto_approval();

-- Function to create daily tasks
CREATE OR REPLACE FUNCTION create_daily_tasks()
RETURNS integer AS $$
DECLARE
  template_record task_templates%ROWTYPE;
  user_record app_users%ROWTYPE;
  task_count integer := 0;
  target_date date := CURRENT_DATE;
BEGIN
  -- Loop through active daily templates
  FOR template_record IN
    SELECT * FROM task_templates
    WHERE task_type = 'daily' AND is_active = true
  LOOP
    -- Loop through users who should get this task
    FOR user_record IN
      SELECT * FROM app_users
      WHERE role = ANY(template_record.auto_assign_roles)
        AND status = 'active'
    LOOP
      -- Check if task already exists for today
      IF NOT EXISTS (
        SELECT 1 FROM tasks
        WHERE template_id = template_record.id
          AND assigned_to = user_record.id
          AND due_date = target_date
      ) THEN
        -- Create the task
        INSERT INTO tasks (
          template_id,
          title,
          description,
          task_type,
          priority,
          evidence_required,
          due_date,
          due_time,
          due_datetime,
          checklist_items,
          tags,
          assigned_to,
          reviewer_id
        ) VALUES (
          template_record.id,
          template_record.title,
          template_record.description,
          template_record.task_type,
          template_record.priority,
          template_record.evidence_required,
          target_date,
          template_record.due_time,
          CASE
            WHEN template_record.due_time IS NOT NULL
            THEN (target_date + template_record.due_time)::timestamp with time zone
            ELSE NULL
          END,
          template_record.checklist_items,
          template_record.tags,
          user_record.id,
          template_record.reviewer_user_id
        );

        task_count := task_count + 1;
      END IF;
    END LOOP;
  END LOOP;

  RETURN task_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_task_templates_updated_at BEFORE UPDATE ON task_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_settings_updated_at BEFORE UPDATE ON task_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();