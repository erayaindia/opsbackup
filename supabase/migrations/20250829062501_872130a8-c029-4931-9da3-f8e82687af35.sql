-- Fix security warnings detected after previous migration

-- Fix function search path for get_user_role function to make it more secure
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (SELECT role FROM profiles WHERE clerk_user_id = auth.jwt() ->> 'sub');
END;
$function$;

-- The function already exists and has the correct search_path, so this just ensures consistency