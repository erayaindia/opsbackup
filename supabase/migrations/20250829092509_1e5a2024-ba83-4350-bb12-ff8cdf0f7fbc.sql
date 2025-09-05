-- Enable RLS on profiles table which was missing
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add basic RLS policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles
FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON profiles
FOR INSERT WITH CHECK (user_id = auth.uid());