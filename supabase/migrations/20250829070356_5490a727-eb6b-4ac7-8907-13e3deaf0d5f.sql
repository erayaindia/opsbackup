-- Update RLS policies to allow anyone (including anonymous users) to access support tickets
DROP POLICY IF EXISTS "Authenticated users can view all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Authenticated users can update tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Authenticated users can delete tickets" ON public.support_tickets;

-- Create new policies for anyone (no authentication required)
CREATE POLICY "Anyone can view all tickets" 
ON public.support_tickets 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can update tickets" 
ON public.support_tickets 
FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete tickets" 
ON public.support_tickets 
FOR DELETE 
USING (true);