-- =============================================================================
-- Employee Onboarding System Migration
-- Creates table and functions for employee onboarding workflow
-- =============================================================================

-- Create onboarding_applicants table
CREATE TABLE IF NOT EXISTS public.onboarding_applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected', 'withdrawn')),
  
  -- Basic Information
  full_name TEXT NOT NULL CHECK (length(trim(full_name)) >= 2 AND length(trim(full_name)) <= 100),
  personal_email TEXT NOT NULL CHECK (personal_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone TEXT CHECK (phone IS NULL OR phone ~* '^\+?[\d\s\-\(\)]{10,15}$'),
  
  -- Work Details
  designation TEXT CHECK (length(designation) <= 100),
  work_location TEXT NOT NULL DEFAULT 'Patna' CHECK (length(work_location) <= 100),
  employment_type TEXT NOT NULL DEFAULT 'Full-time' CHECK (employment_type IN ('Full-time', 'Part-time', 'Intern', 'Contractor')),
  joined_at DATE,
  
  -- JSONB Fields for structured data
  addresses JSONB NOT NULL DEFAULT '{}'::jsonb,
  emergency JSONB NOT NULL DEFAULT '{}'::jsonb,
  documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Additional Info
  notes TEXT CHECK (length(notes) <= 2000),
  
  -- Mapping to created user
  mapped_app_user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  
  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_onboarding_status ON public.onboarding_applicants(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_email ON public.onboarding_applicants(personal_email);
CREATE INDEX IF NOT EXISTS idx_onboarding_created ON public.onboarding_applicants(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_onboarding_mapped_user ON public.onboarding_applicants(mapped_app_user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_onboarding_updated_at ON public.onboarding_applicants;
CREATE TRIGGER trigger_onboarding_updated_at
  BEFORE UPDATE ON public.onboarding_applicants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Helper function to check if current user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.app_users
    WHERE auth_user_id = auth.uid()
      AND role = 'super_admin'
      AND status IN ('active', 'on_leave', 'pending')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on onboarding_applicants
ALTER TABLE public.onboarding_applicants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "super_admin_all_access" ON public.onboarding_applicants;
CREATE POLICY "super_admin_all_access" ON public.onboarding_applicants
  FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Allow service role full access (for Edge Functions)
DROP POLICY IF EXISTS "service_role_access" ON public.onboarding_applicants;
CREATE POLICY "service_role_access" ON public.onboarding_applicants
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create storage bucket for employee documents
DO $$
BEGIN
  -- Create bucket if it doesn't exist
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'employee-docs',
    'employee-docs',
    false,  -- private bucket
    52428800,  -- 50MB limit
    ARRAY[
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  )
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Storage policies for employee-docs bucket
DROP POLICY IF EXISTS "super_admin_upload" ON storage.objects;
CREATE POLICY "super_admin_upload" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'employee-docs' 
    AND public.is_super_admin()
  );

DROP POLICY IF EXISTS "service_role_upload" ON storage.objects;
CREATE POLICY "service_role_upload" ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'employee-docs')
  WITH CHECK (bucket_id = 'employee-docs');

DROP POLICY IF EXISTS "super_admin_view" ON storage.objects;
CREATE POLICY "super_admin_view" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'employee-docs'
    AND public.is_super_admin()
  );

-- =============================================================================
-- VERIFICATION QUERIES (commented out - for manual testing)
-- =============================================================================

-- Test the helper function
-- SELECT public.is_super_admin() as is_admin;

-- Verify table structure
-- \d public.onboarding_applicants

-- Check policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'onboarding_applicants';

-- Test insertion (as super admin)
-- INSERT INTO public.onboarding_applicants (
--   full_name, personal_email, phone, designation, work_location
-- ) VALUES (
--   'Test User', 'test@example.com', '+91 9876543210', 'Developer', 'Patna'
-- );

-- =============================================================================
-- DEPLOYMENT NOTES
-- =============================================================================

-- After running this migration:
-- 1. Verify super admin user exists in app_users with role='super_admin'
-- 2. Test is_super_admin() function returns true for super admin
-- 3. Test onboarding_applicants table accepts insertions
-- 4. Verify storage bucket 'employee-docs' is created
-- 5. Test storage policies allow document uploads

COMMENT ON TABLE public.onboarding_applicants IS 'Stores employee onboarding applications before user account creation';
COMMENT ON FUNCTION public.is_super_admin() IS 'Helper function to check if current user is a super admin';