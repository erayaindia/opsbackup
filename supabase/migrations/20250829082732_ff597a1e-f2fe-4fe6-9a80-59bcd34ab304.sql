-- Remove the foreign key constraint that references clerk_user_id
ALTER TABLE public.channel_members DROP CONSTRAINT IF EXISTS channel_members_user_id_fkey;
ALTER TABLE public.channels DROP CONSTRAINT IF EXISTS channels_created_by_fkey;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_user_id_fkey;
ALTER TABLE public.reactions DROP CONSTRAINT IF EXISTS reactions_user_id_fkey;

-- Make user_id the primary key since it references auth.users
ALTER TABLE public.profiles DROP CONSTRAINT profiles_pkey;
ALTER TABLE public.profiles ADD PRIMARY KEY (user_id);

-- Now make clerk_user_id nullable since we're removing Clerk
ALTER TABLE public.profiles ALTER COLUMN clerk_user_id DROP NOT NULL;

-- Add foreign key constraints that reference user_id instead of clerk_user_id
ALTER TABLE public.channel_members 
ADD CONSTRAINT channel_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);

ALTER TABLE public.channels 
ADD CONSTRAINT channels_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(user_id);

ALTER TABLE public.messages 
ADD CONSTRAINT messages_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);

ALTER TABLE public.reactions 
ADD CONSTRAINT reactions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);