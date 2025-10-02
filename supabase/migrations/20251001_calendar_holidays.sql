-- Create calendar_holidays table for tracking non-working days
CREATE TABLE IF NOT EXISTS calendar_holidays (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  holiday_date date NOT NULL,
  holiday_name text NOT NULL,
  holiday_type text DEFAULT 'public' CHECK (holiday_type IN ('public', 'company', 'weekend')),
  is_mandatory boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES app_users(id),
  UNIQUE(holiday_date, holiday_type)
);

-- Add RLS policies
ALTER TABLE calendar_holidays ENABLE ROW LEVEL SECURITY;

-- Admin can view all holidays
CREATE POLICY "Admin can view holidays" ON calendar_holidays
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can manage holidays
CREATE POLICY "Admin can manage holidays" ON calendar_holidays
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert weekend days for current year (Saturdays and Sundays)
INSERT INTO calendar_holidays (holiday_date, holiday_name, holiday_type, is_mandatory)
SELECT
  date_series::date,
  CASE
    WHEN EXTRACT(DOW FROM date_series) = 0 THEN 'Sunday'
    WHEN EXTRACT(DOW FROM date_series) = 6 THEN 'Saturday'
  END as holiday_name,
  'weekend' as holiday_type,
  true as is_mandatory
FROM generate_series(
  date_trunc('year', CURRENT_DATE),
  date_trunc('year', CURRENT_DATE) + interval '1 year' - interval '1 day',
  interval '1 day'
) as date_series
WHERE EXTRACT(DOW FROM date_series) IN (0, 6);

-- Insert some public holidays for 2024-2025 (Indian holidays as example)
INSERT INTO calendar_holidays (holiday_date, holiday_name, holiday_type, is_mandatory) VALUES
  ('2024-01-26', 'Republic Day', 'public', true),
  ('2024-03-29', 'Holi', 'public', true),
  ('2024-08-15', 'Independence Day', 'public', true),
  ('2024-10-02', 'Gandhi Jayanti', 'public', true),
  ('2024-11-01', 'Diwali', 'public', true),
  ('2025-01-26', 'Republic Day', 'public', true),
  ('2025-03-17', 'Holi', 'public', true),
  ('2025-08-15', 'Independence Day', 'public', true),
  ('2025-10-02', 'Gandhi Jayanti', 'public', true),
  ('2025-10-21', 'Diwali', 'public', true)
ON CONFLICT (holiday_date, holiday_type) DO NOTHING;

-- Function to calculate working days between two dates
CREATE OR REPLACE FUNCTION calculate_working_days(
  start_date date,
  end_date date
) RETURNS integer AS $$
DECLARE
  total_days integer;
  holidays_count integer;
BEGIN
  -- Calculate total days
  total_days := end_date - start_date + 1;

  -- Count holidays in the period
  SELECT COUNT(*)::integer INTO holidays_count
  FROM calendar_holidays
  WHERE holiday_date BETWEEN start_date AND end_date
    AND is_mandatory = true;

  RETURN total_days - holidays_count;
END;
$$ LANGUAGE plpgsql;