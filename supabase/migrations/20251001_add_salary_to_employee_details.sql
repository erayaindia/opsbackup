-- Add salary column to employees_details table (note: plural form)
ALTER TABLE employees_details
ADD COLUMN IF NOT EXISTS salary DECIMAL(10, 2);

-- Add comment to document the column
COMMENT ON COLUMN employees_details.salary IS 'Employee monthly/annual salary amount';
