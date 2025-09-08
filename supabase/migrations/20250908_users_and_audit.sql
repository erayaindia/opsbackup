-- Phase 1: Users Table and Audit System Migration
-- Single-table + audit model for user management

-- Create app schema
CREATE SCHEMA IF NOT EXISTS app;

-- =============================================================================
-- TABLE: app.users (Main business table)
-- =============================================================================
CREATE TABLE app.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL,                -- Supabase Auth linkage
  
  -- Basic Info
  full_name TEXT NOT NULL,
  company_email TEXT UNIQUE,
  personal_email TEXT,
  phone TEXT,
  
  -- Employment
  department TEXT CHECK (department IN ('Content','Fulfillment','Support','Marketing','Finance','Admin','Ops','HR','IT')) DEFAULT 'Ops',
  designation TEXT,
  work_location TEXT DEFAULT 'Patna',
  employment_type TEXT CHECK (employment_type IN ('Full-time','Part-time','Intern','Contractor')) DEFAULT 'Full-time',
  status TEXT CHECK (status IN ('active','probation','on_leave','suspended','resigned','terminated')) DEFAULT 'active',
  role TEXT CHECK (role IN ('super_admin','admin','manager','employee','intern','external')) DEFAULT 'employee',
  joined_at DATE DEFAULT NOW(),
  exited_at DATE,
  
  -- Business Logic
  payroll_enabled BOOLEAN DEFAULT FALSE,            -- only a flag; payroll module is separate
  module_access TEXT[] DEFAULT '{}',               -- e.g., {'content','orders','support'}
  
  -- JSONB Flexible Fields
  permissions_json JSONB DEFAULT '{}'::jsonb,      -- per-module CRUD map if needed
  onboarding_json JSONB DEFAULT '{}'::jsonb,       -- checklists: policies, tools, training
  documents_json JSONB DEFAULT '[]'::jsonb,        -- array of {type, url, verified_at}
  devices_json JSONB DEFAULT '[]'::jsonb,          -- array of {kind, serial, note}
  kpis_json JSONB DEFAULT '{}'::jsonb,             -- role-specific KPIs
  assets_json JSONB DEFAULT '[]'::jsonb,           -- assigned equipment
  
  -- Additional
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLE: app.user_activity_logs (Audit table)
-- =============================================================================
CREATE TABLE app.user_activity_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_auth_user_id UUID NOT NULL,               -- who did the action (Auth user)
  target_user_id UUID NOT NULL,                   -- acted user (app.users.id)
  action TEXT NOT NULL,                           -- 'create_user','set_status','delete_user','update_profile',...
  module TEXT NOT NULL DEFAULT 'admin/users',
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================
-- Users table indexes
CREATE UNIQUE INDEX idx_users_company_email ON app.users(company_email);
CREATE INDEX idx_users_role ON app.users(role);
CREATE INDEX idx_users_status ON app.users(status);
CREATE INDEX idx_users_auth_user_id ON app.users(auth_user_id);
CREATE INDEX idx_users_department ON app.users(department);

-- JSONB GIN indexes for fast queries
CREATE INDEX idx_users_permissions_json ON app.users USING GIN(permissions_json);
CREATE INDEX idx_users_documents_json ON app.users USING GIN(documents_json);
CREATE INDEX idx_users_onboarding_json ON app.users USING GIN(onboarding_json);

-- Activity logs indexes
CREATE INDEX idx_activity_logs_target_user ON app.user_activity_logs(target_user_id);
CREATE INDEX idx_activity_logs_actor ON app.user_activity_logs(actor_auth_user_id);
CREATE INDEX idx_activity_logs_action ON app.user_activity_logs(action);
CREATE INDEX idx_activity_logs_created_at ON app.user_activity_logs(created_at DESC);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Check if current user is super admin
CREATE OR REPLACE FUNCTION app.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM app.users
    WHERE auth_user_id = auth.uid()
    AND role = 'super_admin'
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is active
CREATE OR REPLACE FUNCTION app.is_active_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM app.users
    WHERE auth_user_id = auth.uid()
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on both tables
ALTER TABLE app.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for app.users
-- Super admins can SELECT/INSERT/UPDATE/DELETE any row
CREATE POLICY "superadmins_select_all" ON app.users
  FOR SELECT USING (app.is_super_admin());

CREATE POLICY "superadmins_insert_all" ON app.users
  FOR INSERT WITH CHECK (app.is_super_admin());

CREATE POLICY "superadmins_update_all" ON app.users
  FOR UPDATE USING (app.is_super_admin())
  WITH CHECK (app.is_super_admin());

CREATE POLICY "superadmins_delete_all" ON app.users
  FOR DELETE USING (app.is_super_admin());

-- Active users can SELECT their own row
CREATE POLICY "self_read" ON app.users
  FOR SELECT USING (auth_user_id = auth.uid() AND app.is_active_user());

-- Active non-super-admins can UPDATE only allowed columns (enforced by trigger)
CREATE POLICY "self_limited_update" ON app.users
  FOR UPDATE USING (
    auth_user_id = auth.uid() 
    AND app.is_active_user() 
    AND NOT app.is_super_admin()
  );

-- RLS Policies for app.user_activity_logs
-- Super admins can read all logs
CREATE POLICY "superadmins_read_logs" ON app.user_activity_logs
  FOR SELECT USING (app.is_super_admin());

-- Active users can insert activity logs
CREATE POLICY "active_can_insert_logs" ON app.user_activity_logs
  FOR INSERT WITH CHECK (app.is_active_user());

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION app.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER touch_users_updated_at
  BEFORE UPDATE ON app.users
  FOR EACH ROW
  EXECUTE FUNCTION app.touch_updated_at();

-- Restrict self-update to allowed columns only (non-super-admins)
CREATE OR REPLACE FUNCTION app.restrict_user_self_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only apply restrictions to non-super-admins updating their own record
  IF NOT app.is_super_admin() AND NEW.auth_user_id = auth.uid() THEN
    -- Check if any disallowed columns were changed
    IF OLD.full_name IS DISTINCT FROM NEW.full_name OR
       OLD.company_email IS DISTINCT FROM NEW.company_email OR
       OLD.department IS DISTINCT FROM NEW.department OR
       OLD.designation IS DISTINCT FROM NEW.designation OR
       OLD.work_location IS DISTINCT FROM NEW.work_location OR
       OLD.employment_type IS DISTINCT FROM NEW.employment_type OR
       OLD.role IS DISTINCT FROM NEW.role OR
       OLD.status IS DISTINCT FROM NEW.status OR
       OLD.joined_at IS DISTINCT FROM NEW.joined_at OR
       OLD.exited_at IS DISTINCT FROM NEW.exited_at OR
       OLD.payroll_enabled IS DISTINCT FROM NEW.payroll_enabled OR
       OLD.module_access IS DISTINCT FROM NEW.module_access OR
       OLD.permissions_json IS DISTINCT FROM NEW.permissions_json OR
       OLD.kpis_json IS DISTINCT FROM NEW.kpis_json OR
       OLD.assets_json IS DISTINCT FROM NEW.assets_json THEN
      RAISE EXCEPTION 'Not allowed to update restricted fields. You can only update: personal_email, phone, documents_json, devices_json, notes, onboarding_json';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER restrict_self_update
  BEFORE UPDATE ON app.users
  FOR EACH ROW
  EXECUTE FUNCTION app.restrict_user_self_update();

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA app TO authenticated;

-- Grant permissions on tables
GRANT SELECT, INSERT, UPDATE, DELETE ON app.users TO authenticated;
GRANT SELECT, INSERT ON app.user_activity_logs TO authenticated;

-- Grant permissions on sequences
GRANT USAGE, SELECT ON SEQUENCE app.user_activity_logs_id_seq TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION app.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION app.is_active_user() TO authenticated;

-- =============================================================================
-- COMMENTS (Documentation)
-- =============================================================================

COMMENT ON TABLE app.users IS 'Main user management table with JSONB fields for flexibility';
COMMENT ON TABLE app.user_activity_logs IS 'Audit trail for all user management actions';

COMMENT ON COLUMN app.users.auth_user_id IS 'Links to Supabase auth.users table';
COMMENT ON COLUMN app.users.module_access IS 'Array of modules user can access: content, orders, support, etc.';
COMMENT ON COLUMN app.users.permissions_json IS 'Per-module CRUD permissions map';
COMMENT ON COLUMN app.users.onboarding_json IS 'Checklists: policies, tools, training completion';
COMMENT ON COLUMN app.users.documents_json IS 'Array of {type, url, verified_at} objects';
COMMENT ON COLUMN app.users.devices_json IS 'Array of {kind, serial, note} objects';
COMMENT ON COLUMN app.users.kpis_json IS 'Role-specific KPIs and metrics';
COMMENT ON COLUMN app.users.assets_json IS 'Assigned equipment and assets';

COMMENT ON FUNCTION app.is_super_admin() IS 'Returns true if current user is an active super admin';
COMMENT ON FUNCTION app.is_active_user() IS 'Returns true if current user has active status';