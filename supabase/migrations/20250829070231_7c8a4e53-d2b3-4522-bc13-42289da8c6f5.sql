-- Update RLS policies to allow any authenticated user to access support tickets
DROP POLICY IF EXISTS "Support staff can view all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Support staff can update tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins and managers can delete tickets" ON public.support_tickets;

-- Create new policies for any authenticated user
CREATE POLICY "Authenticated users can view all tickets" 
ON public.support_tickets 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can update tickets" 
ON public.support_tickets 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tickets" 
ON public.support_tickets 
FOR DELETE 
TO authenticated
USING (true);