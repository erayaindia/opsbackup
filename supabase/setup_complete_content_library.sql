-- =====================================================
-- COMPLETE SUPABASE SETUP FOR CONTENT LIBRARY
-- Run this entire file in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. EXTENSIONS
-- =====================================================
create extension if not exists "uuid-ossp";

-- =====================================================
-- 2. ENUMS FOR TYPE SAFETY
-- =====================================================
create type file_type_enum as enum ('image', 'video', 'doc');
create type asset_status_enum as enum ('Approved', 'Pending', 'Rejected', 'Reshoot');
create type comment_category_enum as enum ('Fix', 'Good', 'Optional');

-- =====================================================
-- 3. TABLES
-- =====================================================

-- Users profile table
create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role text default 'user' check (role in ('admin', 'editor', 'viewer', 'user')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Campaigns table (optional)
create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  start_date date,
  end_date date,
  status text default 'active' check (status in ('active', 'paused', 'completed', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Products table (optional)
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  sku text unique,
  category text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Main assets table
create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  file_url text not null,
  file_type file_type_enum not null,
  file_size bigint,
  mime_type text,
  thumbnail_url text,
  duration_seconds int,
  dimensions jsonb,
  status asset_status_enum not null default 'Pending',
  uploaded_by uuid references auth.users(id) on delete set null,
  uploaded_at timestamptz not null default now(),
  updated_at timestamptz default now(),
  campaign_id uuid references campaigns(id) on delete set null,
  product_id uuid references products(id) on delete set null,
  tags text[] default '{}',
  metadata jsonb default '{}'::jsonb,
  deleted_at timestamptz null
);

-- Asset comments table
create table if not exists asset_comments (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references assets(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  parent_id uuid null references asset_comments(id) on delete cascade,
  timestamp_sec int null,
  category comment_category_enum not null default 'Fix',
  body text not null check (length(body) > 0 and length(body) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz null
);

-- Asset activity log table
create table if not exists asset_activity (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references assets(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Asset versions table
create table if not exists asset_versions (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references assets(id) on delete cascade,
  version_number int not null default 1,
  file_url text not null,
  changes_summary text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- =====================================================
-- 4. INDEXES FOR PERFORMANCE
-- =====================================================

-- Assets indexes
create index if not exists idx_assets_status on assets(status) where deleted_at is null;
create index if not exists idx_assets_uploaded_at on assets(uploaded_at desc) where deleted_at is null;
create index if not exists idx_assets_uploaded_by on assets(uploaded_by) where deleted_at is null;
create index if not exists idx_assets_file_type on assets(file_type) where deleted_at is null;
create index if not exists idx_assets_campaign_id on assets(campaign_id) where deleted_at is null;
create index if not exists idx_assets_product_id on assets(product_id) where deleted_at is null;
create index if not exists idx_assets_tags on assets using gin(tags);
create index if not exists idx_assets_metadata on assets using gin(metadata);
create index if not exists idx_assets_deleted_at on assets(deleted_at);

-- Comments indexes  
create index if not exists idx_asset_comments_asset on asset_comments(asset_id, created_at desc) where deleted_at is null;
create index if not exists idx_asset_comments_parent on asset_comments(parent_id) where deleted_at is null;
create index if not exists idx_asset_comments_author on asset_comments(author_id) where deleted_at is null;
create index if not exists idx_asset_comments_deleted_at on asset_comments(deleted_at);

-- Activity indexes
create index if not exists idx_asset_activity_asset on asset_activity(asset_id, created_at desc);
create index if not exists idx_asset_activity_actor on asset_activity(actor_id);
create index if not exists idx_asset_activity_created_at on asset_activity(created_at desc);

-- Versions indexes
create index if not exists idx_asset_versions_asset on asset_versions(asset_id, version_number desc);
create index if not exists idx_asset_versions_created_by on asset_versions(created_by);

-- User profiles indexes
create index if not exists idx_user_profiles_role on user_profiles(role);

-- Campaigns indexes
create index if not exists idx_campaigns_status on campaigns(status);
create index if not exists idx_campaigns_created_by on campaigns(created_by);

-- Products indexes
create index if not exists idx_products_category on products(category);
create index if not exists idx_products_created_by on products(created_by);

-- =====================================================
-- 5. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Function to log asset activity
create or replace function log_asset_activity()
returns trigger as $$
declare
  action_text text;
  old_vals jsonb;
  new_vals jsonb;
  asset_id_val uuid;
begin
  if tg_op = 'INSERT' then
    action_text := 'created';
    old_vals := null;
    new_vals := to_jsonb(new);
    asset_id_val := new.id;
  elsif tg_op = 'UPDATE' then
    if old.status != new.status then
      action_text := 'status:' || old.status || '->' || new.status;
    elsif old.name != new.name then
      action_text := 'renamed from "' || old.name || '" to "' || new.name || '"';
    else
      action_text := 'updated';
    end if;
    old_vals := to_jsonb(old);
    new_vals := to_jsonb(new);
    asset_id_val := new.id;
  elsif tg_op = 'DELETE' then
    action_text := 'deleted';
    old_vals := to_jsonb(old);
    new_vals := null;
    asset_id_val := old.id;
  end if;

  insert into asset_activity (
    asset_id,
    actor_id,
    action,
    old_values,
    new_values,
    ip_address
  ) values (
    asset_id_val,
    auth.uid(),
    action_text,
    old_vals,
    new_vals,
    inet_client_addr()
  );

  return coalesce(new, old);
end;
$$ language plpgsql security definer;

-- Function to auto-increment version numbers
create or replace function increment_asset_version()
returns trigger as $$
begin
  new.version_number := coalesce(
    (select max(version_number) + 1 from asset_versions where asset_id = new.asset_id),
    1
  );
  return new;
end;
$$ language plpgsql;

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

-- Updated_at triggers
create trigger update_user_profiles_updated_at
  before update on user_profiles
  for each row execute function update_updated_at_column();

create trigger update_campaigns_updated_at
  before update on campaigns
  for each row execute function update_updated_at_column();

create trigger update_products_updated_at
  before update on products
  for each row execute function update_updated_at_column();

create trigger update_assets_updated_at
  before update on assets
  for each row execute function update_updated_at_column();

create trigger update_asset_comments_updated_at
  before update on asset_comments
  for each row execute function update_updated_at_column();

-- Activity logging triggers
create trigger log_asset_changes
  after insert or update or delete on assets
  for each row execute function log_asset_activity();

-- Version increment trigger
create trigger increment_version_trigger
  before insert on asset_versions
  for each row execute function increment_asset_version();

-- =====================================================
-- 7. CREATE STORAGE BUCKET
-- =====================================================

-- Create the storage bucket for content library
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'content-library',
  'content-library',
  true,
  52428800, -- 50MB limit
  array[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/mov',
    'video/avi',
    'video/webm',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
) on conflict (id) do nothing;

-- =====================================================
-- 8. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
alter table user_profiles enable row level security;
alter table campaigns enable row level security;
alter table products enable row level security;
alter table assets enable row level security;
alter table asset_comments enable row level security;
alter table asset_activity enable row level security;
alter table asset_versions enable row level security;

-- =====================================================
-- 9. DATABASE TABLE RLS POLICIES
-- =====================================================

-- USER PROFILES POLICIES
create policy "Users can view all profiles" on user_profiles
  for select using (true);

create policy "Users can insert own profile" on user_profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on user_profiles
  for update using (auth.uid() = id);

create policy "Admins can update any profile" on user_profiles
  for update using (
    exists(
      select 1 from user_profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

-- CAMPAIGNS POLICIES
create policy "Everyone can view active campaigns" on campaigns
  for select using (status = 'active' or status = 'completed');

create policy "Editors and admins can manage campaigns" on campaigns
  for all using (
    exists(
      select 1 from user_profiles 
      where id = auth.uid() and role in ('admin', 'editor')
    )
  );

-- PRODUCTS POLICIES  
create policy "Everyone can view products" on products
  for select using (true);

create policy "Editors and admins can manage products" on products
  for all using (
    exists(
      select 1 from user_profiles 
      where id = auth.uid() and role in ('admin', 'editor')
    )
  );

-- ASSETS POLICIES
create policy "Everyone can view non-deleted assets" on assets
  for select using (deleted_at is null);

create policy "Authenticated users can create assets" on assets
  for insert with check (
    auth.uid() is not null and 
    auth.uid() = uploaded_by
  );

create policy "Asset owners and editors can update assets" on assets
  for update using (
    deleted_at is null and (
      auth.uid() = uploaded_by or
      exists(
        select 1 from user_profiles 
        where id = auth.uid() and role in ('admin', 'editor')
      )
    )
  );

create policy "Asset owners and admins can soft delete assets" on assets
  for update using (
    auth.uid() = uploaded_by or
    exists(
      select 1 from user_profiles 
      where id = auth.uid() and role = 'admin'
    )
  ) with check (
    (old.deleted_at is null and new.deleted_at is not null) or
    deleted_at is null
  );

-- ASSET COMMENTS POLICIES
create policy "Everyone can view non-deleted comments" on asset_comments
  for select using (deleted_at is null);

create policy "Authenticated users can create comments" on asset_comments
  for insert with check (
    auth.uid() is not null and 
    auth.uid() = author_id and
    exists(select 1 from assets where id = asset_id and deleted_at is null)
  );

create policy "Comment authors can update own comments" on asset_comments
  for update using (
    deleted_at is null and 
    auth.uid() = author_id
  );

create policy "Comment authors and admins can soft delete comments" on asset_comments
  for update using (
    auth.uid() = author_id or
    exists(
      select 1 from user_profiles 
      where id = auth.uid() and role = 'admin'
    )
  ) with check (
    (old.deleted_at is null and new.deleted_at is not null) or
    deleted_at is null
  );

-- ASSET ACTIVITY POLICIES
create policy "Everyone can view activity logs" on asset_activity
  for select using (true);

create policy "System can insert activity logs" on asset_activity
  for insert with check (true);

-- ASSET VERSIONS POLICIES
create policy "Everyone can view asset versions" on asset_versions
  for select using (
    exists(select 1 from assets where id = asset_id and deleted_at is null)
  );

create policy "Authenticated users can create versions" on asset_versions
  for insert with check (
    auth.uid() is not null and 
    auth.uid() = created_by and
    exists(select 1 from assets where id = asset_id and deleted_at is null)
  );

-- =====================================================
-- 10. STORAGE BUCKET RLS POLICIES
-- =====================================================

-- Allow authenticated users to upload files
create policy "Authenticated users can upload files" 
  on storage.objects for insert 
  with check (
    bucket_id = 'content-library' and 
    auth.uid() is not null
  );

-- Allow everyone to view files (since bucket is public)
create policy "Anyone can view content library files" 
  on storage.objects for select 
  using (bucket_id = 'content-library');

-- Allow users to update their own files
create policy "Users can update own files" 
  on storage.objects for update 
  using (
    bucket_id = 'content-library' and 
    owner = auth.uid()
  );

-- Allow users to delete their own files or admins to delete any
create policy "Users can delete own files or admins can delete any" 
  on storage.objects for delete 
  using (
    bucket_id = 'content-library' and (
      owner = auth.uid() or
      exists(
        select 1 from user_profiles 
        where id = auth.uid() and role = 'admin'
      )
    )
  );

-- =====================================================
-- 11. HELPER FUNCTIONS FOR FRONTEND
-- =====================================================

-- Function to get assets with stats
create or replace function get_assets_with_stats()
returns table (
  id uuid,
  name text,
  file_url text,
  file_type file_type_enum,
  file_size bigint,
  thumbnail_url text,
  status asset_status_enum,
  uploaded_by uuid,
  uploaded_at timestamptz,
  campaign_name text,
  product_name text,
  comment_count bigint,
  latest_comment_at timestamptz
)
language sql
security definer
as $$
  select 
    a.id,
    a.name,
    a.file_url,
    a.file_type,
    a.file_size,
    a.thumbnail_url,
    a.status,
    a.uploaded_by,
    a.uploaded_at,
    c.name as campaign_name,
    p.name as product_name,
    count(ac.id) as comment_count,
    max(ac.created_at) as latest_comment_at
  from assets a
  left join campaigns c on a.campaign_id = c.id
  left join products p on a.product_id = p.id
  left join asset_comments ac on a.id = ac.asset_id and ac.deleted_at is null
  where a.deleted_at is null
  group by a.id, c.name, p.name
  order by a.uploaded_at desc;
$$;

-- Function to get comments with replies
create or replace function get_asset_comments_with_replies(asset_uuid uuid)
returns table (
  id uuid,
  asset_id uuid,
  author_id uuid,
  author_name text,
  parent_id uuid,
  timestamp_sec int,
  category comment_category_enum,
  body text,
  created_at timestamptz,
  reply_count bigint
)
language sql
security definer
as $$
  select 
    ac.id,
    ac.asset_id,
    ac.author_id,
    coalesce(up.full_name, u.email) as author_name,
    ac.parent_id,
    ac.timestamp_sec,
    ac.category,
    ac.body,
    ac.created_at,
    count(replies.id) as reply_count
  from asset_comments ac
  left join auth.users u on ac.author_id = u.id
  left join user_profiles up on ac.author_id = up.id
  left join asset_comments replies on ac.id = replies.parent_id and replies.deleted_at is null
  where ac.asset_id = asset_uuid 
    and ac.deleted_at is null
  group by ac.id, up.full_name, u.email
  order by ac.created_at asc;
$$;

-- =====================================================
-- 12. GRANTS
-- =====================================================

-- Grant usage on sequences and functions
grant usage on all sequences in schema public to authenticated;
grant execute on function get_assets_with_stats() to authenticated;
grant execute on function get_asset_comments_with_replies(uuid) to authenticated;

-- =====================================================
-- 13. SUCCESS MESSAGE
-- =====================================================

-- Create a simple table to confirm setup completion
create table if not exists setup_status (
  id serial primary key,
  component text not null,
  status text not null,
  created_at timestamptz default now()
);

insert into setup_status (component, status) values 
  ('Database Tables', 'Created'),
  ('Storage Bucket', 'Created'),
  ('RLS Policies', 'Applied'),
  ('Helper Functions', 'Created');

-- Query to show setup completion
select 
  '✅ Content Library Database Setup Complete!' as message,
  count(*) as components_created
from setup_status;