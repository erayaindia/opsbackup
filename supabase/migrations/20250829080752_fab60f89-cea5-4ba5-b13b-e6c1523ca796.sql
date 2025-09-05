-- Fix security issues
-- Update get_user_role function to use explicit search path
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE user_id = auth.uid());
END;
$$;

-- Update handle_new_user function to use explicit search path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;