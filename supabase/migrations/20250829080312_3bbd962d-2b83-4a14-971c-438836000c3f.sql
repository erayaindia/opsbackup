-- Update profiles table to work with Supabase Auth instead of Clerk
-- First, let's handle existing data by creating a new column for Supabase user IDs
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies to work with Supabase auth
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Channel members can view each other" ON public.profiles;

-- Create new RLS policies for Supabase auth
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (role = 'admin');

CREATE POLICY "Channel members can view each other" 
ON public.profiles 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM channel_members cm1
  JOIN channel_members cm2 ON cm1.channel_id = cm2.channel_id
  WHERE cm1.user_id = auth.uid()::text AND cm2.user_id = user_id::text
));

-- Update channel_members table to work with Supabase auth
-- The user_id column should reference the profiles.user_id (UUID) instead of text
ALTER TABLE public.channel_members 
ADD COLUMN IF NOT EXISTS supabase_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update messages table to work with Supabase auth
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS supabase_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update reactions table to work with Supabase auth  
ALTER TABLE public.reactions
ADD COLUMN IF NOT EXISTS supabase_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create a function to handle new user profiles when they sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'employee'
  );
  
  -- Add user to general channel if it exists
  INSERT INTO public.channel_members (channel_id, user_id, supabase_user_id, role)
  SELECT id, NEW.id::text, NEW.id, 'member'
  FROM public.channels 
  WHERE name = 'general'
  LIMIT 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a general channel if it doesn't exist
INSERT INTO public.channels (name, description, created_by)
SELECT 'general', 'General discussion channel', 'system'
WHERE NOT EXISTS (SELECT 1 FROM public.channels WHERE name = 'general');