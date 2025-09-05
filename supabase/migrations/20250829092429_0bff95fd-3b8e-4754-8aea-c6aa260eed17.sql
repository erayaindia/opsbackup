-- Add missing columns to existing tables
ALTER TABLE messages ADD COLUMN IF NOT EXISTS parent_message_id uuid REFERENCES messages(id) ON DELETE CASCADE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at timestamp with time zone;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;

-- Create message_reads table for tracking unread messages
CREATE TABLE IF NOT EXISTS public.message_reads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  channel_id uuid NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  read_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Create pinned_messages table for pinned message tracking
CREATE TABLE IF NOT EXISTS public.pinned_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  pinned_by text NOT NULL,
  pinned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id)
);

-- Create message_attachments table for file uploads
CREATE TABLE IF NOT EXISTS public.message_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  file_size bigint NOT NULL,
  width integer,
  height integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create storage bucket for chat uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-uploads', 'chat-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_channel_created_desc ON messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_parent ON messages(parent_message_id) WHERE parent_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reactions_message ON reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_channel_user ON message_reads(channel_id, user_id);
CREATE INDEX IF NOT EXISTS idx_message_attachments_message ON message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_pinned_messages_channel ON pinned_messages(channel_id);

-- Enable RLS on new tables
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinned_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for message_reads
CREATE POLICY "Users can view reads in their channels" ON message_reads
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM channel_members cm 
    WHERE cm.channel_id = message_reads.channel_id 
    AND cm.user_id = auth.jwt() ->> 'sub'
  )
);

CREATE POLICY "Users can track their own reads" ON message_reads
FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own reads" ON message_reads
FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

-- RLS policies for pinned_messages
CREATE POLICY "Members can view pinned messages in their channels" ON pinned_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM channel_members cm 
    WHERE cm.channel_id = pinned_messages.channel_id 
    AND cm.user_id = auth.jwt() ->> 'sub'
  )
);

CREATE POLICY "Channel moderators can pin messages" ON pinned_messages
FOR INSERT WITH CHECK (
  is_channel_moderator(channel_id) AND pinned_by = auth.jwt() ->> 'sub'
);

CREATE POLICY "Channel moderators can unpin messages" ON pinned_messages
FOR DELETE USING (is_channel_moderator(channel_id));

-- RLS policies for message_attachments
CREATE POLICY "Members can view attachments in their channels" ON message_attachments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM messages m
    JOIN channel_members cm ON cm.channel_id = m.channel_id
    WHERE m.id = message_attachments.message_id 
    AND cm.user_id = auth.jwt() ->> 'sub'
  )
);

CREATE POLICY "Users can add attachments to their messages" ON message_attachments
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM messages m
    WHERE m.id = message_attachments.message_id 
    AND m.user_id = auth.jwt() ->> 'sub'
  )
);

-- Storage policies for chat uploads
CREATE POLICY "Users can view attachments in their channels" ON storage.objects
FOR SELECT USING (
  bucket_id = 'chat-uploads' AND
  EXISTS (
    SELECT 1 FROM message_attachments ma
    JOIN messages m ON m.id = ma.message_id
    JOIN channel_members cm ON cm.channel_id = m.channel_id
    WHERE ma.file_path = storage.objects.name
    AND cm.user_id = auth.jwt() ->> 'sub'
  )
);

CREATE POLICY "Authenticated users can upload to chat" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'chat-uploads' AND
  auth.role() = 'authenticated'
);

-- Add realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE message_reads;
ALTER PUBLICATION supabase_realtime ADD TABLE pinned_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE message_attachments;

-- Set replica identity for realtime
ALTER TABLE message_reads REPLICA IDENTITY FULL;
ALTER TABLE pinned_messages REPLICA IDENTITY FULL;
ALTER TABLE message_attachments REPLICA IDENTITY FULL;