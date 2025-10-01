-- Add app_user_id column to link payroll records to real users
ALTER TABLE payroll_records
ADD COLUMN IF NOT EXISTS app_user_id uuid;

-- Add foreign key constraint to link to app_users table (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payroll_records_app_user_id_fkey'
  ) THEN
    ALTER TABLE payroll_records
    ADD CONSTRAINT payroll_records_app_user_id_fkey
    FOREIGN KEY (app_user_id) REFERENCES app_users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_payroll_app_user_id
ON payroll_records(app_user_id);

-- Update existing records to link employee_id to app_user_id
-- This will try to match employee_id from employees_details to app_users
UPDATE payroll_records pr
SET app_user_id = ed.app_user_id
FROM employees_details ed
WHERE pr.employee_id = ed.employee_id
AND pr.app_user_id IS NULL;

-- Comment on the new column
COMMENT ON COLUMN payroll_records.app_user_id IS 'Foreign key linking to app_users table for real user identification';
