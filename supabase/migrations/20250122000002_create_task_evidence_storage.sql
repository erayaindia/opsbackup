-- Create storage bucket for task evidence
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-evidence', 'task-evidence', true);

-- Enable RLS for storage
CREATE POLICY "Users can view their own task evidence" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'task-evidence' AND
    (
      -- Users can view evidence for tasks assigned to them
      EXISTS (
        SELECT 1 FROM tasks t
        WHERE auth.uid() = t.assigned_to
        AND name LIKE '%' || t.id::text || '%'
      )
      OR
      -- Reviewers can view evidence for tasks they review
      EXISTS (
        SELECT 1 FROM tasks t
        WHERE auth.uid() = t.reviewer_id
        AND name LIKE '%' || t.id::text || '%'
      )
      OR
      -- Admins can view all evidence
      EXISTS (
        SELECT 1 FROM app_users au
        WHERE auth.uid() = au.auth_user_id
        AND au.role IN ('admin', 'super_admin')
      )
    )
  );

CREATE POLICY "Users can upload evidence for their tasks" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'task-evidence' AND
    (
      -- Users can upload evidence for tasks assigned to them
      EXISTS (
        SELECT 1 FROM tasks t
        WHERE auth.uid() = t.assigned_to
        AND name LIKE '%' || t.id::text || '%'
      )
      OR
      -- Admins can upload evidence for any task
      EXISTS (
        SELECT 1 FROM app_users au
        WHERE auth.uid() = au.auth_user_id
        AND au.role IN ('admin', 'super_admin')
      )
    )
  );

CREATE POLICY "Users can update evidence for their tasks" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'task-evidence' AND
    (
      -- Users can update evidence for tasks assigned to them
      EXISTS (
        SELECT 1 FROM tasks t
        WHERE auth.uid() = t.assigned_to
        AND name LIKE '%' || t.id::text || '%'
      )
      OR
      -- Admins can update any evidence
      EXISTS (
        SELECT 1 FROM app_users au
        WHERE auth.uid() = au.auth_user_id
        AND au.role IN ('admin', 'super_admin')
      )
    )
  );

CREATE POLICY "Users can delete evidence for their tasks" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'task-evidence' AND
    (
      -- Users can delete evidence for tasks assigned to them (within time limit)
      EXISTS (
        SELECT 1 FROM tasks t
        WHERE auth.uid() = t.assigned_to
        AND name LIKE '%' || t.id::text || '%'
        AND t.status IN ('pending', 'in_progress') -- Only allow deletion for unsubmitted tasks
      )
      OR
      -- Admins can delete any evidence
      EXISTS (
        SELECT 1 FROM app_users au
        WHERE auth.uid() = au.auth_user_id
        AND au.role IN ('admin', 'super_admin')
      )
    )
  );

-- Create indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_reviewer_id ON tasks(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_app_users_auth_user_id ON app_users(auth_user_id);

-- Add triggers to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language plpgsql;

-- Add triggers for task tables (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'update_tasks_updated_at'
        AND tgrelid = 'tasks'::regclass
    ) THEN
        CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'update_task_templates_updated_at'
        AND tgrelid = 'task_templates'::regclass
    ) THEN
        CREATE TRIGGER update_task_templates_updated_at BEFORE UPDATE ON task_templates
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'update_task_settings_updated_at'
        AND tgrelid = 'task_settings'::regclass
    ) THEN
        CREATE TRIGGER update_task_settings_updated_at BEFORE UPDATE ON task_settings
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Add computed column for late tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_late BOOLEAN GENERATED ALWAYS AS (
  CASE
    WHEN status IN ('approved', 'rejected', 'done_auto_approved') THEN false
    WHEN due_datetime IS NOT NULL THEN due_datetime < now()
    WHEN due_date IS NOT NULL AND due_time IS NOT NULL THEN
      (due_date || ' ' || due_time)::timestamp < now()
    WHEN due_date IS NOT NULL THEN
      due_date < current_date
    ELSE false
  END
) STORED;

-- Create index on computed column
CREATE INDEX IF NOT EXISTS idx_tasks_is_late ON tasks(is_late) WHERE is_late = true;

-- Add function to automatically create daily tasks
CREATE OR REPLACE FUNCTION create_daily_tasks_for_date(target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
  created_count INTEGER,
  template_count INTEGER,
  user_count INTEGER
) AS $$
DECLARE
  template_rec RECORD;
  user_rec RECORD;
  task_count INTEGER := 0;
  template_counter INTEGER := 0;
  user_counter INTEGER := 0;
BEGIN
  -- Loop through active daily templates
  FOR template_rec IN
    SELECT * FROM task_templates
    WHERE task_type = 'daily' AND is_active = true
  LOOP
    template_counter := template_counter + 1;

    -- Loop through eligible users
    FOR user_rec IN
      SELECT DISTINCT au.id, au.role, au.department
      FROM app_users au
      WHERE au.status = 'active'
      AND (
        template_rec.auto_assign_roles IS NULL
        OR array_length(template_rec.auto_assign_roles, 1) = 0
        OR au.role = ANY(template_rec.auto_assign_roles)
      )
    LOOP
      user_counter := user_counter + 1;

      -- Check if task already exists
      IF NOT EXISTS (
        SELECT 1 FROM tasks
        WHERE template_id = template_rec.id
        AND assigned_to = user_rec.id
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
          assigned_to,
          assigned_by,
          reviewer_id,
          tags,
          checklist_items,
          status
        ) VALUES (
          template_rec.id,
          template_rec.title,
          template_rec.description,
          'daily',
          template_rec.priority,
          template_rec.evidence_required,
          target_date,
          template_rec.due_time,
          user_rec.id,
          template_rec.created_by,
          template_rec.reviewer_user_id,
          template_rec.tags,
          template_rec.checklist_items,
          'pending'
        );

        task_count := task_count + 1;
      END IF;
    END LOOP;
  END LOOP;

  RETURN QUERY SELECT task_count, template_counter, user_counter;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_daily_tasks_for_date TO authenticated;