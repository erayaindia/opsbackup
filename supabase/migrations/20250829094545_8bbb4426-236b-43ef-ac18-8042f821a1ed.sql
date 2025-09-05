-- Insert a default "general" channel if it doesn't exist
INSERT INTO public.channels (name, description, created_by)
SELECT 'general', 'General discussion channel for the team', '0505cb90-1bc9-44a4-8685-0dc7d264f067'
WHERE NOT EXISTS (
  SELECT 1 FROM public.channels WHERE name = 'general'
);

-- Get the general channel ID
DO $$
DECLARE
  general_channel_id UUID;
BEGIN
  SELECT id INTO general_channel_id FROM public.channels WHERE name = 'general' LIMIT 1;
  
  IF general_channel_id IS NOT NULL THEN
    -- Add all existing users to the general channel
    INSERT INTO public.channel_members (channel_id, user_id, supabase_user_id, role)
    SELECT 
      general_channel_id,
      p.user_id::text,
      p.user_id,
      'member'
    FROM public.profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM public.channel_members cm 
      WHERE cm.channel_id = general_channel_id AND cm.user_id = p.user_id::text
    );
  END IF;
END $$;