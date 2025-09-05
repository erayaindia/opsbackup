-- Drop all existing constraints that might conflict
ALTER TABLE public.support_tickets 
DROP CONSTRAINT IF EXISTS support_tickets_status_check,
DROP CONSTRAINT IF EXISTS support_tickets_priority_check;

-- Update existing status values to match new schema
UPDATE public.support_tickets 
SET status = CASE 
  WHEN status = 'Pending' THEN 'new'
  WHEN status = 'Packed' THEN 'solved'
  WHEN status = 'Dispute' THEN 'open'
  WHEN status = 'Invalid' THEN 'closed'
  WHEN status = 'Missing Photo' THEN 'waiting'
  ELSE 'new'
END;

-- Add missing columns
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS ticket_id TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS contact_channel TEXT,
ADD COLUMN IF NOT EXISTS order_id TEXT,
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS issue_type TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT,
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT,
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS has_attachments BOOLEAN,
ADD COLUMN IF NOT EXISTS attachment_count INTEGER,
ADD COLUMN IF NOT EXISTS consent_given BOOLEAN,
ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN;

-- Set default values for all records
UPDATE public.support_tickets 
SET 
  priority = COALESCE(priority, 'normal'),
  has_attachments = COALESCE(has_attachments, FALSE),
  attachment_count = COALESCE(attachment_count, 0),
  consent_given = COALESCE(consent_given, FALSE),
  is_urgent = COALESCE(is_urgent, FALSE);

-- Set column defaults
ALTER TABLE public.support_tickets 
ALTER COLUMN status SET DEFAULT 'new',
ALTER COLUMN priority SET DEFAULT 'normal',
ALTER COLUMN has_attachments SET DEFAULT FALSE,
ALTER COLUMN attachment_count SET DEFAULT 0,
ALTER COLUMN consent_given SET DEFAULT FALSE,
ALTER COLUMN is_urgent SET DEFAULT FALSE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON public.support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_email ON public.support_tickets(email);
CREATE INDEX IF NOT EXISTS idx_support_tickets_ticket_id ON public.support_tickets(ticket_id);