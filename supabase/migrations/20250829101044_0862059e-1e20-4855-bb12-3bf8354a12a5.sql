-- Fix search_path security warnings for the trigger functions

-- Update the auto_add_user_to_channels function with proper search_path
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Update the auto_add_users_to_channel function with proper search_path
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';