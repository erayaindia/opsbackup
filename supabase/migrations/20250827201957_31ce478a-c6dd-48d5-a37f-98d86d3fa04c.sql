-- Create profiles table with clerk_user_id as primary key
CREATE TABLE public.profiles (
  clerk_user_id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('admin', 'employee')) DEFAULT 'employee',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create channels table
CREATE TABLE public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_by TEXT REFERENCES profiles(clerk_user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create channel_members table with last_read_at for unread counts
CREATE TABLE public.channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('member', 'moderator', 'owner')) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT now(),
  last_read_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES profiles(clerk_user_id) ON DELETE SET NULL,
  content TEXT,
  attachments JSONB,
  reply_to UUID NULL REFERENCES messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ NULL
);

-- Create reactions table
CREATE TABLE public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
  emoji TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Create indexes for performance
CREATE INDEX messages_channel_created_idx ON messages(channel_id, created_at DESC);
CREATE INDEX channel_members_user_channel_idx ON channel_members(user_id, channel_id);
CREATE INDEX reactions_message_idx ON reactions(message_id);
CREATE INDEX messages_reply_to_idx ON messages(reply_to);

-- Create trigger function for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for messages updated_at
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM profiles WHERE clerk_user_id = auth.jwt() ->> 'sub');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function to check if user is channel member
CREATE OR REPLACE FUNCTION is_channel_member(channel_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM channel_members 
    WHERE channel_id = channel_uuid 
    AND user_id = auth.jwt() ->> 'sub'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function to check if user is channel owner/moderator
CREATE OR REPLACE FUNCTION is_channel_moderator(channel_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM channel_members 
    WHERE channel_id = channel_uuid 
    AND user_id = auth.jwt() ->> 'sub'
    AND role IN ('owner', 'moderator')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (get_user_role() = 'admin');

CREATE POLICY "Channel members can view each other" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM channel_members cm1
      JOIN channel_members cm2 ON cm1.channel_id = cm2.channel_id
      WHERE cm1.user_id = auth.jwt() ->> 'sub'
      AND cm2.user_id = profiles.clerk_user_id
    )
  );

-- RLS Policies for channels
CREATE POLICY "Members can view their channels" ON channels
  FOR SELECT USING (is_channel_member(id));

CREATE POLICY "Users can create channels" ON channels
  FOR INSERT WITH CHECK (created_by = auth.jwt() ->> 'sub');

CREATE POLICY "Owners and admins can update channels" ON channels
  FOR UPDATE USING (
    is_channel_moderator(id) OR get_user_role() = 'admin'
  );

CREATE POLICY "Owners and admins can delete channels" ON channels
  FOR DELETE USING (
    is_channel_moderator(id) OR get_user_role() = 'admin'
  );

-- RLS Policies for channel_members
CREATE POLICY "Users can view channel members of their channels" ON channel_members
  FOR SELECT USING (
    is_channel_member(channel_id) OR get_user_role() = 'admin'
  );

CREATE POLICY "Users can join channels themselves" ON channel_members
  FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Moderators can add members to their channels" ON channel_members
  FOR INSERT WITH CHECK (
    is_channel_moderator(channel_id) OR get_user_role() = 'admin'
  );

CREATE POLICY "Users can leave channels" ON channel_members
  FOR DELETE USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Moderators can remove members" ON channel_members
  FOR DELETE USING (
    is_channel_moderator(channel_id) OR get_user_role() = 'admin'
  );

CREATE POLICY "Users can update their own membership" ON channel_members
  FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Moderators can update memberships" ON channel_members
  FOR UPDATE USING (
    is_channel_moderator(channel_id) OR get_user_role() = 'admin'
  );

-- RLS Policies for messages
CREATE POLICY "Members can view messages in their channels" ON messages
  FOR SELECT USING (
    is_channel_member(channel_id) AND deleted_at IS NULL
  );

CREATE POLICY "Members can create messages in their channels" ON messages
  FOR INSERT WITH CHECK (
    is_channel_member(channel_id) AND user_id = auth.jwt() ->> 'sub'
  );

CREATE POLICY "Authors can update their own messages" ON messages
  FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Moderators can update messages in their channels" ON messages
  FOR UPDATE USING (
    is_channel_moderator(channel_id) OR get_user_role() = 'admin'
  );

CREATE POLICY "Authors can delete their own messages" ON messages
  FOR DELETE USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Moderators can delete messages in their channels" ON messages
  FOR DELETE USING (
    is_channel_moderator(channel_id) OR get_user_role() = 'admin'
  );

-- RLS Policies for reactions
CREATE POLICY "Members can view reactions in their channels" ON reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m 
      WHERE m.id = reactions.message_id 
      AND is_channel_member(m.channel_id)
    )
  );

CREATE POLICY "Members can add reactions" ON reactions
  FOR INSERT WITH CHECK (
    user_id = auth.jwt() ->> 'sub' AND
    EXISTS (
      SELECT 1 FROM messages m 
      WHERE m.id = reactions.message_id 
      AND is_channel_member(m.channel_id)
    )
  );

CREATE POLICY "Users can remove their own reactions" ON reactions
  FOR DELETE USING (user_id = auth.jwt() ->> 'sub');

-- Create a general channel for all users
INSERT INTO channels (name, description) VALUES ('general', 'General discussion for all team members');