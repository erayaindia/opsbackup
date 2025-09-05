-- Add the current user to the fulfillment channel
INSERT INTO public.channel_members (user_id, channel_id, joined_at)
VALUES ('0505cb90-1bc9-44a4-8685-0dc7d264f067', '08a11ab1-36b6-446d-8147-9b2efbb0fdb0', now())
ON CONFLICT (user_id, channel_id) DO NOTHING;

-- Add all existing users to all channels automatically
-- This ensures everyone can see all channels

-- First, let's add all existing users to all existing channels
INSERT INTO public.channel_members (user_id, channel_id, joined_at)
SELECT p.user_id::text, c.id, now()
FROM public.profiles p
CROSS JOIN public.channels c
WHERE NOT EXISTS (
  SELECT 1 FROM public.channel_members cm
  WHERE cm.user_id = p.user_id::text AND cm.channel_id = c.id
);

-- Function to auto-add users to all channels when a new profile is created
CREATE OR REPLACE FUNCTION auto_add_user_to_channels()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new user profile is created, add them to all existing channels
  INSERT INTO public.channel_members (user_id, channel_id, joined_at)
  SELECT NEW.user_id::text, c.id, now()
  FROM public.channels c
  WHERE NOT EXISTS (
    SELECT 1 FROM public.channel_members cm
    WHERE cm.user_id = NEW.user_id::text AND cm.channel_id = c.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new user profiles
DROP TRIGGER IF EXISTS trigger_auto_add_user_to_channels ON public.profiles;
CREATE TRIGGER trigger_auto_add_user_to_channels
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_user_to_channels();

-- Function to auto-add all users to new channels
CREATE OR REPLACE FUNCTION auto_add_users_to_channel()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new channel is created, add all existing users to it
  INSERT INTO public.channel_members (user_id, channel_id, joined_at)
  SELECT p.user_id::text, NEW.id, now()
  FROM public.profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM public.channel_members cm
    WHERE cm.user_id = p.user_id::text AND cm.channel_id = NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new channels
DROP TRIGGER IF EXISTS trigger_auto_add_users_to_channel ON public.channels;
CREATE TRIGGER trigger_auto_add_users_to_channel
  AFTER INSERT ON public.channels
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_users_to_channel();