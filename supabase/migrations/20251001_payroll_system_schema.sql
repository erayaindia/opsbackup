-- =====================================================
-- PAYROLL SYSTEM - PHASE 1: DATABASE SCHEMA
-- =====================================================

-- 1. PAYROLL PERIODS TABLE
-- Represents each month's payroll cycle (Oct 2025, Nov 2025, etc.)
CREATE TABLE IF NOT EXISTS payroll_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_name TEXT NOT NULL, -- e.g., "October 2025"
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year INTEGER NOT NULL CHECK (period_year >= 2024),
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  working_days INTEGER NOT NULL DEFAULT 26,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'approved', 'paid', 'locked')),
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES app_users(id),
  locked_at TIMESTAMPTZ,
  notes TEXT,
  UNIQUE(period_month, period_year)
);

-- 2. PAYROLL RECORDS TABLE
-- One row per employee per pay period
CREATE TABLE IF NOT EXISTS payroll_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_period_id UUID NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
  app_user_id UUID NOT NULL REFERENCES app_users(id),
  employee_id TEXT,

  -- Employee Info (snapshot at time of payroll)
  employee_name TEXT NOT NULL,
  employee_role TEXT,
  employee_type TEXT NOT NULL CHECK (employee_type IN ('monthly', 'daily', 'hourly')),

  -- Attendance Summary
  days_present INTEGER DEFAULT 0,
  days_paid_leave INTEGER DEFAULT 0,
  days_unpaid_leave INTEGER DEFAULT 0,
  days_late INTEGER DEFAULT 0,
  overtime_hours NUMERIC(5,2) DEFAULT 0,

  -- Base Salary Calculation
  base_salary_rate NUMERIC(12,2) NOT NULL, -- Monthly salary / Daily rate / Hourly rate
  calculated_base_pay NUMERIC(12,2) DEFAULT 0,

  -- Earnings (additions to base pay)
  overtime_pay NUMERIC(10,2) DEFAULT 0,
  attendance_bonus NUMERIC(10,2) DEFAULT 0,
  incentives NUMERIC(10,2) DEFAULT 0,
  reimbursements NUMERIC(10,2) DEFAULT 0,
  other_earnings NUMERIC(10,2) DEFAULT 0,
  total_earnings NUMERIC(12,2) DEFAULT 0,

  -- Deductions (subtractions from gross pay)
  late_penalty NUMERIC(10,2) DEFAULT 0,
  unpaid_leave_deduction NUMERIC(10,2) DEFAULT 0,
  advance_recovery NUMERIC(10,2) DEFAULT 0,
  damage_penalty NUMERIC(10,2) DEFAULT 0,
  pf_deduction NUMERIC(10,2) DEFAULT 0,
  esi_deduction NUMERIC(10,2) DEFAULT 0,
  tds_deduction NUMERIC(10,2) DEFAULT 0,
  other_deductions NUMERIC(10,2) DEFAULT 0,
  total_deductions NUMERIC(12,2) DEFAULT 0,

  -- Final Amounts
  gross_pay NUMERIC(12,2) DEFAULT 0, -- base + earnings
  net_pay NUMERIC(12,2) DEFAULT 0, -- gross - deductions

  -- Status & Payment Tracking
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'paid', 'on_hold')),
  payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'upi', 'cash')),
  payment_date DATE,
  payment_reference TEXT,
  paid_by UUID REFERENCES app_users(id),

  -- Metadata
  notes TEXT,
  adjustments_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES app_users(id),

  UNIQUE(payroll_period_id, app_user_id)
);

-- 3. LEDGER ENTRIES TABLE
-- Track advances, reimbursements, incentives, penalties mid-month
CREATE TABLE IF NOT EXISTS payroll_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_user_id UUID NOT NULL REFERENCES app_users(id),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('advance', 'reimbursement', 'incentive', 'penalty', 'adjustment')),
  category TEXT, -- e.g., 'travel', 'medical', 'performance_bonus', etc.
  amount NUMERIC(10,2) NOT NULL,
  description TEXT NOT NULL,

  -- Link to payroll (if already processed)
  payroll_record_id UUID REFERENCES payroll_records(id),
  is_processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,

  -- Approval
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  approved_by UUID REFERENCES app_users(id),
  approved_at TIMESTAMPTZ,

  -- Metadata
  created_by UUID NOT NULL REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- 4. PAYSLIPS TABLE (Optional - for storing generated payslip metadata)
CREATE TABLE IF NOT EXISTS payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_record_id UUID NOT NULL REFERENCES payroll_records(id) ON DELETE CASCADE,
  app_user_id UUID NOT NULL REFERENCES app_users(id),
  payslip_number TEXT UNIQUE,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  pdf_url TEXT, -- Link to generated PDF in storage
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  whatsapp_sent BOOLEAN DEFAULT FALSE,
  whatsapp_sent_at TIMESTAMPTZ,
  downloaded_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_payroll_periods_status ON payroll_periods(status);
CREATE INDEX IF NOT EXISTS idx_payroll_periods_date ON payroll_periods(period_year, period_month);

CREATE INDEX IF NOT EXISTS idx_payroll_records_period ON payroll_records(payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_employee ON payroll_records(app_user_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_status ON payroll_records(status);

CREATE INDEX IF NOT EXISTS idx_ledger_employee ON payroll_ledger(app_user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_processed ON payroll_ledger(is_processed);
CREATE INDEX IF NOT EXISTS idx_ledger_status ON payroll_ledger(status);
CREATE INDEX IF NOT EXISTS idx_ledger_date ON payroll_ledger(entry_date);

CREATE INDEX IF NOT EXISTS idx_payslips_record ON payslips(payroll_record_id);
CREATE INDEX IF NOT EXISTS idx_payslips_employee ON payslips(app_user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage payroll_periods" ON payroll_periods
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.auth_user_id = auth.uid()
      AND app_users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage payroll_records" ON payroll_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.auth_user_id = auth.uid()
      AND app_users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage payroll_ledger" ON payroll_ledger
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.auth_user_id = auth.uid()
      AND app_users.role IN ('admin', 'super_admin')
    )
  );

-- Employees can view their own payslips
CREATE POLICY "Employees can view own payslips" ON payslips
  FOR SELECT USING (
    app_user_id = (
      SELECT id FROM app_users WHERE auth_user_id = auth.uid()
    )
  );

-- Admins can manage all payslips
CREATE POLICY "Admins can manage payslips" ON payslips
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.auth_user_id = auth.uid()
      AND app_users.role IN ('admin', 'super_admin')
    )
  );

-- =====================================================
-- TRIGGERS FOR AUTO-UPDATE timestamps
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payroll_periods_updated_at BEFORE UPDATE ON payroll_periods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_records_updated_at BEFORE UPDATE ON payroll_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_ledger_updated_at BEFORE UPDATE ON payroll_ledger
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE payroll_periods IS 'Monthly payroll cycles (Oct 2025, Nov 2025, etc.)';
COMMENT ON TABLE payroll_records IS 'One row per employee per pay period - main payroll calculation table';
COMMENT ON TABLE payroll_ledger IS 'Mid-month advances, reimbursements, incentives, penalties';
COMMENT ON TABLE payslips IS 'Generated payslip metadata with PDF links';
