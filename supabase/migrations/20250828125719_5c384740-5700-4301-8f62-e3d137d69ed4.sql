-- Temporarily allow read access to support_tickets for development
-- This will let us see the data while we set up proper authentication

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can read all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Authenticated users can insert tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Authenticated users can update all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Authenticated users can delete tickets" ON public.support_tickets;

-- Create new policies that allow public read access for now
-- In production, you should implement proper authentication
CREATE POLICY "Allow public read access to support tickets" 
ON public.support_tickets FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert to support tickets" 
ON public.support_tickets FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update to support tickets" 
ON public.support_tickets FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete to support tickets" 
ON public.support_tickets FOR DELETE 
USING (true);