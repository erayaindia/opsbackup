-- Add the current user to the fulfillment channel
INSERT INTO public.channel_members (user_id, channel_id, joined_at)
SELECT '0505cb90-1bc9-44a4-8685-0dc7d264f067', '08a11ab1-36b6-446d-8147-9b2efbb0fdb0', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.channel_members 
  WHERE user_id = '0505cb90-1bc9-44a4-8685-0dc7d264f067' 
  AND channel_id = '08a11ab1-36b6-446d-8147-9b2efbb0fdb0'
);

-- Add all existing users to all existing channels they're not already members of
INSERT INTO public.channel_members (user_id, channel_id, joined_at)
SELECT p.user_id::text, c.id, now()
FROM public.profiles p
CROSS JOIN public.channels c
WHERE NOT EXISTS (
  SELECT 1 FROM public.channel_members cm
  WHERE cm.user_id = p.user_id::text AND cm.channel_id = c.id
);