-- Add the current user to all existing channels they're not already a member of
-- First, let's check what channels exist and add missing memberships

-- Add user to fulfillment channel if they're not already a member
INSERT INTO public.channel_members (user_id, channel_id, joined_at)
SELECT '0505cb90-1bc9-44a4-8685-0dc7d264f067', '08a1fabf-3cb6-446d-8f47-9b2efbb0fdb0', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.channel_members 
  WHERE user_id = '0505cb90-1bc9-44a4-8685-0dc7d264f067' 
  AND channel_id = '08a1fabf-3cb6-446d-8f47-9b2efbb0fdb0'
);

-- Also, let's make sure to add all existing users to all channels automatically
-- This ensures that when a new channel is created, existing users are added
-- And when a new user joins, they're added to all channels

-- Function to auto-add users to all channels
CREATE OR REPLACE FUNCTION auto_add_user_to_channels()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new user profile is created, add them to all existing channels
  INSERT INTO public.channel_members (user_id, channel_id, joined_at)
  SELECT NEW.user_id, c.id, now()
  FROM public.channels c
  WHERE NOT EXISTS (
    SELECT 1 FROM public.channel_members cm
    WHERE cm.user_id = NEW.user_id AND cm.channel_id = c.id
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
  SELECT p.user_id, NEW.id, now()
  FROM public.profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM public.channel_members cm
    WHERE cm.user_id = p.user_id AND cm.channel_id = NEW.id
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