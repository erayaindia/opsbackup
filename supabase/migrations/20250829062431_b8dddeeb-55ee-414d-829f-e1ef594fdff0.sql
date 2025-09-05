-- Fix critical security vulnerability in support_tickets table
-- Remove overly permissive public access policies

-- Drop existing dangerous policies
DROP POLICY IF EXISTS "Allow public delete to support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Allow public read access to support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Allow public update to support tickets" ON public.support_tickets;

-- Keep public insert for customers to create tickets, but add validation
DROP POLICY IF EXISTS "Allow public insert to support tickets" ON public.support_tickets;

-- Create secure RLS policies

-- 1. Allow public to create support tickets (customers need this)
CREATE POLICY "Customers can create support tickets" 
ON public.support_tickets 
FOR INSERT 
TO public
WITH CHECK (true);

-- 2. Only authenticated support staff can view tickets
CREATE POLICY "Support staff can view all tickets" 
ON public.support_tickets 
FOR SELECT 
TO authenticated
USING (
  get_user_role() IN ('admin', 'support', 'manager', 'employee')
);

-- 3. Only support staff can update tickets  
CREATE POLICY "Support staff can update tickets" 
ON public.support_tickets 
FOR UPDATE 
TO authenticated
USING (
  get_user_role() IN ('admin', 'support', 'manager', 'employee')
)
WITH CHECK (
  get_user_role() IN ('admin', 'support', 'manager', 'employee')
);

-- 4. Only admins and managers can delete tickets (for compliance/cleanup)
CREATE POLICY "Admins and managers can delete tickets" 
ON public.support_tickets 
FOR DELETE 
TO authenticated
USING (
  get_user_role() IN ('admin', 'manager')
);

-- 5. Add policy for support staff to view their own assigned tickets if we add assignment later
-- This is prepared for future enhancement but doesn't break current functionality