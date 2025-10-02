-- Add salary-related columns to employees_details table if they don't exist
ALTER TABLE employees_details
ADD COLUMN IF NOT EXISTS salary_type text DEFAULT 'monthly' CHECK (salary_type IN ('monthly', 'daily', 'hourly')),
ADD COLUMN IF NOT EXISTS monthly_salary numeric(10, 2),
ADD COLUMN IF NOT EXISTS daily_rate numeric(10, 2),
ADD COLUMN IF NOT EXISTS hourly_rate numeric(10, 2);

-- Add comments to document the columns
COMMENT ON COLUMN employees_details.salary_type IS 'Type of salary structure for the employee';
COMMENT ON COLUMN employees_details.monthly_salary IS 'Monthly salary amount for monthly-paid employees';
COMMENT ON COLUMN employees_details.daily_rate IS 'Daily rate for daily-paid employees';
COMMENT ON COLUMN employees_details.hourly_rate IS 'Hourly rate for hourly-paid employees';

-- Update existing employees to have default values
-- Use existing salary column as monthly_salary if it exists
UPDATE employees_details
SET
  salary_type = COALESCE(salary_type, 'monthly'),
  monthly_salary = COALESCE(monthly_salary, salary, 0)
WHERE salary_type IS NULL;