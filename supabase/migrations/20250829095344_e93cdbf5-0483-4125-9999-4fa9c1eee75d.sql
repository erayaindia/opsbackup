-- Fix the foreign key relationship for messages to profiles
-- First, ensure all messages have valid user_id references in profiles table
UPDATE public.messages 
SET supabase_user_id = (SELECT user_id FROM public.profiles WHERE user_id::text = messages.user_id LIMIT 1)
WHERE supabase_user_id IS NULL AND user_id IS NOT NULL;

-- Add proper foreign key to profiles table instead of auth.users
ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS fk_messages_user_profile;

ALTER TABLE public.messages 
ADD CONSTRAINT fk_messages_user_profile 
FOREIGN KEY (supabase_user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;