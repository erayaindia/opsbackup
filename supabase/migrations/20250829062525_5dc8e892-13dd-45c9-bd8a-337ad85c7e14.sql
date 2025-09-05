-- Fix search path for all security definer functions to prevent SQL injection

-- Update is_channel_moderator function
CREATE OR REPLACE FUNCTION public.is_channel_moderator(channel_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM channel_members 
    WHERE channel_id = channel_uuid 
    AND user_id = auth.jwt() ->> 'sub'
    AND role IN ('owner', 'moderator')
  );
END;
$function$;

-- Update is_channel_member function  
CREATE OR REPLACE FUNCTION public.is_channel_member(channel_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM channel_members 
    WHERE channel_id = channel_uuid 
    AND user_id = auth.jwt() ->> 'sub'
  );
END;
$function$;