-- First, disable RLS temporarily to allow modifications
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions DISABLE ROW LEVEL SECURITY;

-- Drop all policies on profiles that might reference user_id
DROP POLICY IF EXISTS "Channel members can view each other" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Delete orphaned profiles
DELETE FROM public.profiles WHERE user_id IS NULL;

-- Remove all foreign key constraints
ALTER TABLE public.channel_members DROP CONSTRAINT IF EXISTS channel_members_user_id_fkey;
ALTER TABLE public.channels DROP CONSTRAINT IF EXISTS channels_created_by_fkey;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_user_id_fkey;
ALTER TABLE public.reactions DROP CONSTRAINT IF EXISTS reactions_user_id_fkey;

-- Drop and recreate the profiles primary key
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey;

-- Update profiles to have user_id as UUID primary key
ALTER TABLE public.profiles ADD PRIMARY KEY (user_id);

-- Make clerk_user_id nullable
ALTER TABLE public.profiles ALTER COLUMN clerk_user_id DROP NOT NULL;