-- =====================================================
-- RENAME CONTENT LIBRARY TABLES
-- Run this to rename all tables with content_library_ prefix
-- =====================================================

-- =====================================================
-- 1. DROP ALL EXISTING TRIGGERS FIRST
-- =====================================================
drop trigger if exists update_user_profiles_updated_at on user_profiles;
drop trigger if exists update_campaigns_updated_at on campaigns;
drop trigger if exists update_products_updated_at on products;
drop trigger if exists update_assets_updated_at on assets;
drop trigger if exists update_asset_comments_updated_at on asset_comments;
drop trigger if exists log_asset_changes on assets;
drop trigger if exists increment_version_trigger on asset_versions;

-- =====================================================
-- 2. DROP ALL EXISTING FUNCTIONS (we'll recreate them)
-- =====================================================
drop function if exists get_assets_with_stats();
drop function if exists get_asset_comments_with_replies(uuid);
drop function if exists log_asset_activity();
drop function if exists increment_asset_version();
drop function if exists update_updated_at_column();

-- =====================================================
-- 3. RENAME ALL TABLES
-- =====================================================

-- Rename main tables with content_library_ prefix
alter table if exists user_profiles rename to content_library_user_profiles;
alter table if exists campaigns rename to content_library_campaigns;
alter table if exists products rename to content_library_products;
alter table if exists assets rename to content_library_assets;
alter table if exists asset_comments rename to content_library_comments;
alter table if exists asset_activity rename to content_library_activity;
alter table if exists asset_versions rename to content_library_versions;

-- =====================================================
-- 4. UPDATE FOREIGN KEY REFERENCES
-- =====================================================

-- Update foreign key constraints to reference new table names
-- Note: PostgreSQL automatically updates constraint names, but we need to ensure references work

-- Drop and recreate foreign key constraints for content_library_campaigns
alter table content_library_campaigns drop constraint if exists campaigns_created_by_fkey;
alter table content_library_campaigns add constraint content_library_campaigns_created_by_fkey 
  foreign key (created_by) references auth.users(id) on delete set null;

-- Drop and recreate foreign key constraints for content_library_products  
alter table content_library_products drop constraint if exists products_created_by_fkey;
alter table content_library_products add constraint content_library_products_created_by_fkey 
  foreign key (created_by) references auth.users(id) on delete set null;

-- Drop and recreate foreign key constraints for content_library_assets
alter table content_library_assets drop constraint if exists assets_uploaded_by_fkey;
alter table content_library_assets drop constraint if exists assets_campaign_id_fkey;
alter table content_library_assets drop constraint if exists assets_product_id_fkey;

alter table content_library_assets add constraint content_library_assets_uploaded_by_fkey 
  foreign key (uploaded_by) references auth.users(id) on delete set null;
alter table content_library_assets add constraint content_library_assets_campaign_id_fkey 
  foreign key (campaign_id) references content_library_campaigns(id) on delete set null;
alter table content_library_assets add constraint content_library_assets_product_id_fkey 
  foreign key (product_id) references content_library_products(id) on delete set null;

-- Drop and recreate foreign key constraints for content_library_comments
alter table content_library_comments drop constraint if exists asset_comments_asset_id_fkey;
alter table content_library_comments drop constraint if exists asset_comments_author_id_fkey;
alter table content_library_comments drop constraint if exists asset_comments_parent_id_fkey;

alter table content_library_comments add constraint content_library_comments_asset_id_fkey 
  foreign key (asset_id) references content_library_assets(id) on delete cascade;
alter table content_library_comments add constraint content_library_comments_author_id_fkey 
  foreign key (author_id) references auth.users(id) on delete set null;
alter table content_library_comments add constraint content_library_comments_parent_id_fkey 
  foreign key (parent_id) references content_library_comments(id) on delete cascade;

-- Drop and recreate foreign key constraints for content_library_activity
alter table content_library_activity drop constraint if exists asset_activity_asset_id_fkey;
alter table content_library_activity drop constraint if exists asset_activity_actor_id_fkey;

alter table content_library_activity add constraint content_library_activity_asset_id_fkey 
  foreign key (asset_id) references content_library_assets(id) on delete cascade;
alter table content_library_activity add constraint content_library_activity_actor_id_fkey 
  foreign key (actor_id) references auth.users(id) on delete set null;

-- Drop and recreate foreign key constraints for content_library_versions
alter table content_library_versions drop constraint if exists asset_versions_asset_id_fkey;
alter table content_library_versions drop constraint if exists asset_versions_created_by_fkey;

alter table content_library_versions add constraint content_library_versions_asset_id_fkey 
  foreign key (asset_id) references content_library_assets(id) on delete cascade;
alter table content_library_versions add constraint content_library_versions_created_by_fkey 
  foreign key (created_by) references auth.users(id) on delete set null;

-- =====================================================
-- 5. RECREATE INDEXES WITH NEW NAMES
-- =====================================================

-- Drop old indexes (they may have been renamed automatically)
drop index if exists idx_assets_status;
drop index if exists idx_assets_uploaded_at;
drop index if exists idx_assets_uploaded_by;
drop index if exists idx_assets_file_type;
drop index if exists idx_assets_campaign_id;
drop index if exists idx_assets_product_id;
drop index if exists idx_assets_tags;
drop index if exists idx_assets_metadata;
drop index if exists idx_assets_deleted_at;
drop index if exists idx_asset_comments_asset;
drop index if exists idx_asset_comments_parent;
drop index if exists idx_asset_comments_author;
drop index if exists idx_asset_comments_deleted_at;
drop index if exists idx_asset_activity_asset;
drop index if exists idx_asset_activity_actor;
drop index if exists idx_asset_activity_created_at;
drop index if exists idx_asset_versions_asset;
drop index if exists idx_asset_versions_created_by;
drop index if exists idx_user_profiles_role;
drop index if exists idx_campaigns_status;
drop index if exists idx_campaigns_created_by;
drop index if exists idx_products_category;
drop index if exists idx_products_created_by;

-- Create new indexes with proper names
create index idx_content_library_assets_status on content_library_assets(status) where deleted_at is null;
create index idx_content_library_assets_uploaded_at on content_library_assets(uploaded_at desc) where deleted_at is null;
create index idx_content_library_assets_uploaded_by on content_library_assets(uploaded_by) where deleted_at is null;
create index idx_content_library_assets_file_type on content_library_assets(file_type) where deleted_at is null;
create index idx_content_library_assets_campaign_id on content_library_assets(campaign_id) where deleted_at is null;
create index idx_content_library_assets_product_id on content_library_assets(product_id) where deleted_at is null;
create index idx_content_library_assets_tags on content_library_assets using gin(tags);
create index idx_content_library_assets_metadata on content_library_assets using gin(metadata);
create index idx_content_library_assets_deleted_at on content_library_assets(deleted_at);

create index idx_content_library_comments_asset on content_library_comments(asset_id, created_at desc) where deleted_at is null;
create index idx_content_library_comments_parent on content_library_comments(parent_id) where deleted_at is null;
create index idx_content_library_comments_author on content_library_comments(author_id) where deleted_at is null;
create index idx_content_library_comments_deleted_at on content_library_comments(deleted_at);

create index idx_content_library_activity_asset on content_library_activity(asset_id, created_at desc);
create index idx_content_library_activity_actor on content_library_activity(actor_id);
create index idx_content_library_activity_created_at on content_library_activity(created_at desc);

create index idx_content_library_versions_asset on content_library_versions(asset_id, version_number desc);
create index idx_content_library_versions_created_by on content_library_versions(created_by);

create index idx_content_library_user_profiles_role on content_library_user_profiles(role);
create index idx_content_library_campaigns_status on content_library_campaigns(status);
create index idx_content_library_campaigns_created_by on content_library_campaigns(created_by);
create index idx_content_library_products_category on content_library_products(category);
create index idx_content_library_products_created_by on content_library_products(created_by);

-- =====================================================
-- 6. RECREATE FUNCTIONS WITH NEW TABLE NAMES
-- =====================================================

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Function to log asset activity (updated for new table names)
create or replace function log_content_library_activity()
returns trigger as $$
declare
  action_text text;
  old_vals jsonb := null;
  new_vals jsonb := null;
  asset_id_val uuid;
begin
  case tg_op
    when 'INSERT' then
      action_text := 'created';
      new_vals := to_jsonb(new);
      asset_id_val := new.id;
      
    when 'UPDATE' then
      if old.status::text != new.status::text then
        action_text := 'status:' || old.status::text || '->' || new.status::text;
      elsif old.name != new.name then
        action_text := 'renamed from "' || old.name || '" to "' || new.name || '"';
      elsif old.deleted_at is null and new.deleted_at is not null then
        action_text := 'soft deleted';
      elsif old.deleted_at is not null and new.deleted_at is null then
        action_text := 'restored';
      else
        action_text := 'updated';
      end if;
      old_vals := to_jsonb(old);
      new_vals := to_jsonb(new);
      asset_id_val := new.id;
      
    when 'DELETE' then
      action_text := 'hard deleted';
      old_vals := to_jsonb(old);
      asset_id_val := old.id;
      
    else
      action_text := 'unknown operation';
      asset_id_val := coalesce(new.id, old.id);
  end case;

  insert into content_library_activity (
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

  return case tg_op 
    when 'DELETE' then old 
    else new 
  end;
end;
$$ language plpgsql security definer;

-- Function to auto-increment version numbers
create or replace function increment_content_library_version()
returns trigger as $$
begin
  new.version_number := coalesce(
    (select max(version_number) + 1 from content_library_versions where asset_id = new.asset_id),
    1
  );
  return new;
end;
$$ language plpgsql;

-- =====================================================
-- 7. RECREATE TRIGGERS WITH NEW NAMES
-- =====================================================

create trigger update_content_library_user_profiles_updated_at
  before update on content_library_user_profiles
  for each row execute function update_updated_at_column();

create trigger update_content_library_campaigns_updated_at
  before update on content_library_campaigns
  for each row execute function update_updated_at_column();

create trigger update_content_library_products_updated_at
  before update on content_library_products
  for each row execute function update_updated_at_column();

create trigger update_content_library_assets_updated_at
  before update on content_library_assets
  for each row execute function update_updated_at_column();

create trigger update_content_library_comments_updated_at
  before update on content_library_comments
  for each row execute function update_updated_at_column();

create trigger log_content_library_asset_changes
  after insert or update or delete on content_library_assets
  for each row execute function log_content_library_activity();

create trigger increment_content_library_version_trigger
  before insert on content_library_versions
  for each row execute function increment_content_library_version();

-- =====================================================
-- 8. UPDATE RLS POLICIES WITH NEW TABLE NAMES
-- =====================================================

-- Drop all old policies
drop policy if exists "Users can view all profiles" on content_library_user_profiles;
drop policy if exists "Users can insert own profile" on content_library_user_profiles;
drop policy if exists "Users can update own profile" on content_library_user_profiles;
drop policy if exists "Everyone can view campaigns" on content_library_campaigns;
drop policy if exists "Authenticated users can manage campaigns" on content_library_campaigns;
drop policy if exists "Everyone can view products" on content_library_products;
drop policy if exists "Authenticated users can manage products" on content_library_products;
drop policy if exists "Everyone can view non-deleted assets" on content_library_assets;
drop policy if exists "Authenticated users can create assets" on content_library_assets;
drop policy if exists "Authenticated users can update assets" on content_library_assets;
drop policy if exists "Authenticated users can delete assets" on content_library_assets;
drop policy if exists "Everyone can view non-deleted comments" on content_library_comments;
drop policy if exists "Authenticated users can create comments" on content_library_comments;
drop policy if exists "Authenticated users can update comments" on content_library_comments;
drop policy if exists "Authenticated users can delete comments" on content_library_comments;
drop policy if exists "Everyone can view activity logs" on content_library_activity;
drop policy if exists "System can insert activity logs" on content_library_activity;
drop policy if exists "Everyone can view asset versions" on content_library_versions;
drop policy if exists "Authenticated users can create versions" on content_library_versions;

-- Create new policies
create policy "Users can view all profiles" on content_library_user_profiles
  for select using (true);

create policy "Users can insert own profile" on content_library_user_profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on content_library_user_profiles
  for update using (auth.uid() = id);

create policy "Everyone can view campaigns" on content_library_campaigns
  for select using (true);

create policy "Authenticated users can manage campaigns" on content_library_campaigns
  for all using (auth.uid() is not null);

create policy "Everyone can view products" on content_library_products
  for select using (true);

create policy "Authenticated users can manage products" on content_library_products
  for all using (auth.uid() is not null);

create policy "Everyone can view non-deleted assets" on content_library_assets
  for select using (deleted_at is null);

create policy "Authenticated users can create assets" on content_library_assets
  for insert with check (
    auth.uid() is not null and 
    auth.uid() = uploaded_by
  );

create policy "Authenticated users can update assets" on content_library_assets
  for update using (auth.uid() is not null);

create policy "Authenticated users can delete assets" on content_library_assets
  for delete using (auth.uid() is not null);

create policy "Everyone can view non-deleted comments" on content_library_comments
  for select using (deleted_at is null);

create policy "Authenticated users can create comments" on content_library_comments
  for insert with check (
    auth.uid() is not null and 
    auth.uid() = author_id
  );

create policy "Authenticated users can update comments" on content_library_comments
  for update using (auth.uid() is not null);

create policy "Authenticated users can delete comments" on content_library_comments
  for delete using (auth.uid() is not null);

create policy "Everyone can view activity logs" on content_library_activity
  for select using (true);

create policy "System can insert activity logs" on content_library_activity
  for insert with check (true);

create policy "Everyone can view asset versions" on content_library_versions
  for select using (true);

create policy "Authenticated users can create versions" on content_library_versions
  for insert with check (
    auth.uid() is not null and 
    auth.uid() = created_by
  );

-- =====================================================
-- 9. RECREATE HELPER FUNCTIONS WITH NEW TABLE NAMES
-- =====================================================

-- Function to get assets with stats
create or replace function get_content_library_assets_with_stats()
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
  from content_library_assets a
  left join content_library_campaigns c on a.campaign_id = c.id
  left join content_library_products p on a.product_id = p.id
  left join content_library_comments ac on a.id = ac.asset_id and ac.deleted_at is null
  where a.deleted_at is null
  group by a.id, c.name, p.name
  order by a.uploaded_at desc;
$$;

-- Function to get comments with replies
create or replace function get_content_library_comments_with_replies(asset_uuid uuid)
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
    coalesce(up.full_name, u.email, 'Unknown User') as author_name,
    ac.parent_id,
    ac.timestamp_sec,
    ac.category,
    ac.body,
    ac.created_at,
    count(replies.id) as reply_count
  from content_library_comments ac
  left join auth.users u on ac.author_id = u.id
  left join content_library_user_profiles up on ac.author_id = up.id
  left join content_library_comments replies on ac.id = replies.parent_id and replies.deleted_at is null
  where ac.asset_id = asset_uuid 
    and ac.deleted_at is null
  group by ac.id, up.full_name, u.email
  order by ac.created_at asc;
$$;

-- =====================================================
-- 10. UPDATE GRANTS
-- =====================================================

grant execute on function get_content_library_assets_with_stats() to authenticated;
grant execute on function get_content_library_comments_with_replies(uuid) to authenticated;

-- =====================================================
-- 11. SUCCESS CONFIRMATION
-- =====================================================

do $$
begin
  raise notice '✅ Content Library Tables Renamed Successfully!';
  raise notice '📋 New Table Names:';
  raise notice '   - content_library_user_profiles';
  raise notice '   - content_library_campaigns';  
  raise notice '   - content_library_products';
  raise notice '   - content_library_assets (main table)';
  raise notice '   - content_library_comments';
  raise notice '   - content_library_activity';
  raise notice '   - content_library_versions';
  raise notice '⚡ Updated Functions:';
  raise notice '   - get_content_library_assets_with_stats()';
  raise notice '   - get_content_library_comments_with_replies()';
  raise notice '🔒 All RLS policies and triggers updated!';
end $$;