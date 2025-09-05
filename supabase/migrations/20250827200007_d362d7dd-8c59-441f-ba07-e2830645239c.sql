-- Create support_tickets table
CREATE TABLE public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    sku TEXT,
    variant TEXT,
    color TEXT,
    main_photo TEXT,
    polaroids JSONB,
    back_engraving_type TEXT,
    back_engraving_value TEXT,
    status TEXT DEFAULT 'Pending' NOT NULL,
    packer TEXT,
    main_photo_status TEXT,
    polaroid_count INTEGER
);

-- Enable Row Level Security
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to access all support tickets
-- (Assuming this is for internal staff/support team use)
CREATE POLICY "Authenticated users can view all support tickets" 
ON public.support_tickets 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create support tickets" 
ON public.support_tickets 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update support tickets" 
ON public.support_tickets 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete support tickets" 
ON public.support_tickets 
FOR DELETE 
TO authenticated
USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic updated_at updates
CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add constraint for status values
ALTER TABLE public.support_tickets 
ADD CONSTRAINT support_tickets_status_check 
CHECK (status IN ('Pending', 'Packed', 'Dispute', 'Invalid', 'Missing Photo'));