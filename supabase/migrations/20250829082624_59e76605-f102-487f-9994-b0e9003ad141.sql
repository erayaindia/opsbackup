-- Remove clerk_user_id dependency and make it nullable
ALTER TABLE public.profiles 
ALTER COLUMN clerk_user_id DROP NOT NULL;

-- Update the handle_new_user function to work with Supabase auth only
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;