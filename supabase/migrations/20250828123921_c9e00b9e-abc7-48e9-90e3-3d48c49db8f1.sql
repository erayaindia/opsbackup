-- First, let's see what status values currently exist and update them
UPDATE public.support_tickets 
SET status = CASE 
  WHEN status = 'Pending' THEN 'new'
  WHEN status = 'Packed' THEN 'solved'
  WHEN status = 'Dispute' THEN 'open'
  WHEN status = 'Invalid' THEN 'closed'
  WHEN status = 'Missing Photo' THEN 'waiting'
  ELSE 'new'
END;

-- Now add missing columns to support_tickets table for full support ticket functionality
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS ticket_id TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS contact_channel TEXT,
ADD COLUMN IF NOT EXISTS order_id TEXT,
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS issue_type TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT,
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS has_attachments BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS attachment_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT FALSE;

-- Update status column to use proper status values
ALTER TABLE public.support_tickets 
ALTER COLUMN status SET DEFAULT 'new';

-- Add constraints after data is cleaned
ALTER TABLE public.support_tickets 
ADD CONSTRAINT support_tickets_status_check 
CHECK (status IN ('new', 'open', 'waiting', 'solved', 'closed'));

ALTER TABLE public.support_tickets 
ADD CONSTRAINT support_tickets_priority_check 
CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

-- Create indexes for better performance on common queries
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON public.support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_email ON public.support_tickets(email);
CREATE INDEX IF NOT EXISTS idx_support_tickets_ticket_id ON public.support_tickets(ticket_id);

-- Update existing records to have proper default values
UPDATE public.support_tickets 
SET priority = 'normal' 
WHERE priority IS NULL;