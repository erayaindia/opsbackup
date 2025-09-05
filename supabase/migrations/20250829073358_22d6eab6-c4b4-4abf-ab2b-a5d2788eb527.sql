-- Create a default general channel for team chat
INSERT INTO public.channels (name, description, created_by) 
VALUES ('general', 'General discussion channel for all team members', 'system')
ON CONFLICT (name) DO NOTHING;