-- =====================================================
-- SINGLE CONTENT LIBRARY TABLE SETUP
-- This replaces all 7 tables with just 1 comprehensive table
-- =====================================================

-- =====================================================
-- 1. DROP ALL EXISTING CONTENT LIBRARY TABLES
-- =====================================================

-- Drop all triggers first
drop trigger if exists update_content_library_user_profiles_updated_at on content_library_user_profiles;
drop trigger if exists update_content_library_campaigns_updated_at on content_library_campaigns;
drop trigger if exists update_content_library_products_updated_at on content_library_products;
drop trigger if exists update_content_library_assets_updated_at on content_library_assets;
drop trigger if exists update_content_library_comments_updated_at on content_library_comments;
drop trigger if exists log_content_library_asset_changes on content_library_assets;
drop trigger if exists increment_content_library_version_trigger on content_library_versions;

-- Drop functions
drop function if exists get_content_library_assets_with_stats();
drop function if exists get_content_library_comments_with_replies(uuid);
drop function if exists log_content_library_activity();
drop function if exists increment_content_library_version();

-- Drop all tables (in correct order due to foreign keys)
drop table if exists content_library_comments cascade;
drop table if exists content_library_activity cascade;
drop table if exists content_library_versions cascade;
drop table if exists content_library_assets cascade;
drop table if exists content_library_campaigns cascade;
drop table if exists content_library_products cascade;
drop table if exists content_library_user_profiles cascade;

-- Also drop old tables if they exist
drop table if exists asset_comments cascade;
drop table if exists asset_activity cascade;
drop table if exists asset_versions cascade;
drop table if exists assets cascade;
drop table if exists campaigns cascade;
drop table if exists products cascade;
drop table if exists user_profiles cascade;

-- =====================================================
-- 2. ENUMS (keep existing ones)
-- =====================================================
do $$ 
begin
  if not exists (select 1 from pg_type where typname = 'file_type_enum') then
    create type file_type_enum as enum ('image', 'video', 'doc');
  end if;
  if not exists (select 1 from pg_type where typname = 'asset_status_enum') then
    create type asset_status_enum as enum ('Approved', 'Pending', 'Rejected', 'Reshoot');
  end if;
  if not exists (select 1 from pg_type where typname = 'comment_category_enum') then
    create type comment_category_enum as enum ('Fix', 'Good', 'Optional');
  end if;
end $$;

-- =====================================================
-- 3. SINGLE COMPREHENSIVE CONTENT LIBRARY TABLE
-- =====================================================

create table content_library (
  -- Primary asset info
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  
  -- File details
  file_url text not null,
  file_type file_type_enum not null,
  file_size bigint, -- in bytes
  mime_type text,
  thumbnail_url text,
  duration_seconds int, -- for videos
  dimensions jsonb, -- {width: 1920, height: 1080}
  
  -- Status and workflow
  status asset_status_enum not null default 'Pending',
  version_number int default 1,
  
  -- User and timestamps
  uploaded_by uuid references auth.users(id) on delete set null,
  uploaded_at timestamptz not null default now(),
  updated_at timestamptz default now(),
  
  -- Categorization (embedded instead of separate tables)
  campaign_name text,
  campaign_description text,
  product_name text,
  product_category text,
  tags text[] default '{}',
  
  -- Comments system (JSONB array instead of separate table)
  comments jsonb default '[]'::jsonb,
  -- Structure: [{id, author_id, author_name, body, category, timestamp_sec, created_at, parent_id, replies: []}]
  
  -- Activity log (JSONB array instead of separate table) 
  activity_log jsonb default '[]'::jsonb,
  -- Structure: [{id, actor_id, actor_name, action, timestamp, old_values, new_values}]
  
  -- Additional metadata
  metadata jsonb default '{}'::jsonb,
  
  -- Soft delete
  deleted_at timestamptz null,
  
  -- Search optimization (will be updated via trigger)
  search_vector tsvector
);

-- =====================================================
-- 4. INDEXES FOR PERFORMANCE
-- =====================================================

-- Core indexes
create index idx_content_library_status on content_library(status) where deleted_at is null;
create index idx_content_library_uploaded_at on content_library(uploaded_at desc) where deleted_at is null;
create index idx_content_library_uploaded_by on content_library(uploaded_by) where deleted_at is null;
create index idx_content_library_file_type on content_library(file_type) where deleted_at is null;
create index idx_content_library_campaign_name on content_library(campaign_name) where deleted_at is null;
create index idx_content_library_product_name on content_library(product_name) where deleted_at is null;
create index idx_content_library_deleted_at on content_library(deleted_at);

-- JSONB indexes for comments and activity
create index idx_content_library_comments on content_library using gin(comments);
create index idx_content_library_activity on content_library using gin(activity_log);
create index idx_content_library_metadata on content_library using gin(metadata);
create index idx_content_library_tags on content_library using gin(tags);

-- Full-text search index
create index idx_content_library_search on content_library using gin(search_vector);

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Function to add a comment to an asset
create or replace function add_content_library_comment(
  asset_id uuid,
  comment_body text,
  comment_category comment_category_enum default 'Fix',
  parent_comment_id text default null,
  timestamp_sec int default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  comment_id uuid;
  new_comment jsonb;
  current_user_id uuid;
  current_user_name text;
begin
  -- Get current user info
  current_user_id := auth.uid();
  select coalesce(email, 'Unknown User') into current_user_name 
  from auth.users where id = current_user_id;
  
  -- Generate comment ID
  comment_id := gen_random_uuid();
  
  -- Build comment object
  new_comment := jsonb_build_object(
    'id', comment_id,
    'author_id', current_user_id,
    'author_name', current_user_name,
    'body', comment_body,
    'category', comment_category,
    'timestamp_sec', timestamp_sec,
    'parent_id', parent_comment_id,
    'created_at', now(),
    'replies', '[]'::jsonb
  );
  
  -- Add comment to the comments array
  update content_library 
  set 
    comments = comments || new_comment,
    updated_at = now()
  where id = asset_id and deleted_at is null;
  
  return comment_id;
end;
$$;

-- Function to add activity log entry
create or replace function add_content_library_activity(
  asset_id uuid,
  action_text text,
  old_values jsonb default null,
  new_values jsonb default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  activity_id uuid;
  new_activity jsonb;
  current_user_id uuid;
  current_user_name text;
begin
  -- Get current user info
  current_user_id := auth.uid();
  select coalesce(email, 'Unknown User') into current_user_name 
  from auth.users where id = current_user_id;
  
  -- Generate activity ID
  activity_id := gen_random_uuid();
  
  -- Build activity object
  new_activity := jsonb_build_object(
    'id', activity_id,
    'actor_id', current_user_id,
    'actor_name', current_user_name,
    'action', action_text,
    'timestamp', now(),
    'old_values', old_values,
    'new_values', new_values
  );
  
  -- Add activity to the activity_log array
  update content_library 
  set 
    activity_log = activity_log || new_activity,
    updated_at = now()
  where id = asset_id and deleted_at is null;
  
  return activity_id;
end;
$$;

-- Function to get assets with comment counts
create or replace function get_content_library_with_stats()
returns table (
  id uuid,
  name text,
  description text,
  file_url text,
  file_type file_type_enum,
  file_size bigint,
  thumbnail_url text,
  status asset_status_enum,
  version_number int,
  uploaded_by uuid,
  uploaded_at timestamptz,
  campaign_name text,
  product_name text,
  tags text[],
  comment_count int,
  activity_count int,
  latest_activity timestamptz
)
language sql
security definer
as $$
  select 
    cl.id,
    cl.name,
    cl.description,
    cl.file_url,
    cl.file_type,
    cl.file_size,
    cl.thumbnail_url,
    cl.status,
    cl.version_number,
    cl.uploaded_by,
    cl.uploaded_at,
    cl.campaign_name,
    cl.product_name,
    cl.tags,
    jsonb_array_length(cl.comments) as comment_count,
    jsonb_array_length(cl.activity_log) as activity_count,
    (
      select max((activity->>'timestamp')::timestamptz) 
      from jsonb_array_elements(cl.activity_log) as activity
    ) as latest_activity
  from content_library cl
  where cl.deleted_at is null
  order by cl.uploaded_at desc;
$$;

-- Function for full-text search
create or replace function search_content_library(search_query text)
returns table (
  id uuid,
  name text,
  file_url text,
  status asset_status_enum,
  campaign_name text,
  product_name text,
  rank real
)
language sql
security definer
as $$
  select 
    cl.id,
    cl.name,
    cl.file_url,
    cl.status,
    cl.campaign_name,
    cl.product_name,
    ts_rank(cl.search_vector, plainto_tsquery('english', search_query)) as rank
  from content_library cl
  where 
    cl.deleted_at is null 
    and cl.search_vector @@ plainto_tsquery('english', search_query)
  order by rank desc, cl.uploaded_at desc;
$$;

-- =====================================================
-- 6. TRIGGERS FOR AUTOMATION
-- =====================================================

-- Function to update search vector
create or replace function update_content_library_search_vector()
returns trigger as $$
begin
  new.search_vector := 
    setweight(to_tsvector('english', coalesce(new.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.campaign_name, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(new.product_name, '')), 'D') ||
    setweight(to_tsvector('english', coalesce(array_to_string(new.tags, ' '), '')), 'D');
  return new;
end;
$$ language plpgsql;

-- Simplified trigger to log basic changes (without recursion)
create or replace function auto_log_content_library_changes()
returns trigger as $$
declare
  action_text text;
  activity_id uuid;
  new_activity jsonb;
  current_user_id uuid;
  current_user_name text;
begin
  -- Get current user info
  current_user_id := auth.uid();
  select coalesce(email, 'System') into current_user_name 
  from auth.users where id = current_user_id;
  
  if tg_op = 'INSERT' then
    action_text := 'Asset created';
  elsif tg_op = 'UPDATE' then
    if old.status != new.status then
      action_text := 'Status changed from ' || old.status || ' to ' || new.status;
    elsif old.name != new.name then
      action_text := 'Asset renamed from "' || old.name || '" to "' || new.name || '"';
    elsif old.deleted_at is null and new.deleted_at is not null then
      action_text := 'Asset soft deleted';
    else
      -- Don't log minor updates to avoid noise
      return coalesce(new, old);
    end if;
  else
    return coalesce(new, old);
  end if;
  
  -- Generate activity ID and build activity object
  activity_id := gen_random_uuid();
  new_activity := jsonb_build_object(
    'id', activity_id,
    'actor_id', current_user_id,
    'actor_name', current_user_name,
    'action', action_text,
    'timestamp', now()
  );
  
  -- Add activity to the activity_log array (avoid recursion)
  if tg_op = 'INSERT' then
    new.activity_log := new.activity_log || new_activity;
  elsif tg_op = 'UPDATE' then
    new.activity_log := new.activity_log || new_activity;
  end if;
  
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

-- Create triggers in correct order
create trigger update_content_library_search_vector_trigger
  before insert or update on content_library
  for each row execute function update_content_library_search_vector();

create trigger auto_log_content_library_changes_trigger
  before insert or update on content_library
  for each row execute function auto_log_content_library_changes();

create trigger update_content_library_updated_at_trigger
  before update on content_library
  for each row execute function update_updated_at_column();

-- =====================================================
-- 7. ROW LEVEL SECURITY
-- =====================================================

alter table content_library enable row level security;

-- Everyone can view non-deleted assets
create policy "Everyone can view non-deleted content" on content_library
  for select using (deleted_at is null);

-- Authenticated users can create assets
create policy "Authenticated users can create content" on content_library
  for insert with check (
    auth.uid() is not null and 
    auth.uid() = uploaded_by
  );

-- Authenticated users can update assets
create policy "Authenticated users can update content" on content_library
  for update using (auth.uid() is not null);

-- Authenticated users can soft delete assets
create policy "Authenticated users can delete content" on content_library
  for delete using (auth.uid() is not null);

-- =====================================================
-- 8. STORAGE BUCKET (keep existing)
-- =====================================================

-- Ensure storage bucket exists
do $$
begin
  if not exists (
    select 1 from storage.buckets where id = 'content-library'
  ) then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'content-library',
      'content-library',
      true,
      52428800, -- 50MB limit
      array[
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'video/mp4', 'video/mov', 'video/avi', 'video/webm', 'video/quicktime',
        'application/pdf', 'text/plain', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
    );
  end if;
end $$;

-- =====================================================
-- 9. GRANTS
-- =====================================================

grant execute on function add_content_library_comment(uuid, text, comment_category_enum, text, int) to authenticated;
grant execute on function add_content_library_activity(uuid, text, jsonb, jsonb) to authenticated;
grant execute on function get_content_library_with_stats() to authenticated;
grant execute on function search_content_library(text) to authenticated;

-- =====================================================
-- 10. SUCCESS CONFIRMATION
-- =====================================================

do $$
begin
  raise notice '✅ Single Content Library Table Created Successfully!';
  raise notice '📋 Table: content_library (replaces all 7 tables)';
  raise notice '💾 Features:';
  raise notice '   - File storage with metadata';
  raise notice '   - Embedded comments system (JSONB)';
  raise notice '   - Embedded activity logging (JSONB)';
  raise notice '   - Full-text search capability';
  raise notice '   - Campaign and product categorization';
  raise notice '   - Version tracking';
  raise notice '   - Automatic activity logging';
  raise notice '⚡ Functions:';
  raise notice '   - add_content_library_comment()';
  raise notice '   - add_content_library_activity()';
  raise notice '   - get_content_library_with_stats()';
  raise notice '   - search_content_library()';
  raise notice '🪣 Storage: content-library bucket';
  raise notice '🔒 RLS: Full security policies applied';
end $$;