-- ============================================================================
-- CreatorChat — Supabase schema
-- Run this entire file in the Supabase SQL Editor (or via `supabase db push`).
-- It is idempotent: safe to run again after changes.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. UTILITIES
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- 2. PROFILES
-- ============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  full_name text not null default '',
  avatar_url text,
  bio text,
  website text,
  phone text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,30}$'),
  constraint profiles_full_name_length check (char_length(full_name) <= 100),
  constraint profiles_bio_length check (bio is null or char_length(bio) <= 300),
  constraint profiles_website_length check (website is null or char_length(website) <= 2048),
  constraint profiles_phone_length check (phone is null or char_length(phone) <= 24)
);

comment on table public.profiles is 'Public creator profile linked 1:1 with auth.users.';

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Create a profile automatically when an auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_username text;
  base_username text;
  final_username text;
  display_name text;
begin
  raw_username := coalesce(
    new.raw_user_meta_data ->> 'username',
    new.raw_user_meta_data ->> 'preferred_username',
    split_part(coalesce(new.email, ''), '@', 1)
  );

  base_username := lower(regexp_replace(raw_username, '[^a-zA-Z0-9_]', '', 'g'));
  if char_length(base_username) < 3 then
    base_username := 'user_' || substr(new.id::text, 1, 8);
  end if;
  base_username := substr(base_username, 1, 24);

  display_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    initcap(base_username)
  );

  final_username := base_username;

  begin
    insert into public.profiles (id, username, full_name, avatar_url)
    values (
      new.id,
      final_username,
      substr(display_name, 1, 100),
      nullif(new.raw_user_meta_data ->> 'avatar_url', '')
    )
    on conflict (id) do nothing;
  exception when unique_violation then
    final_username := substr(base_username, 1, 20) || '_' || substr(new.id::text, 1, 6);
    insert into public.profiles (id, username, full_name, avatar_url)
    values (
      new.id,
      final_username,
      substr(display_name, 1, 100),
      nullif(new.raw_user_meta_data ->> 'avatar_url', '')
    )
    on conflict (id) do nothing;
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============================================================================
-- 3. FEED
-- ============================================================================

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null default '',
  link_url text,
  media_url text,
  media_type text,
  file_url text,
  file_name text,
  file_size bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_content_length check (char_length(content) <= 5000),
  constraint posts_media_type check (media_type is null or media_type = 'image'),
  constraint posts_non_empty check (
    char_length(btrim(content)) > 0
    or media_url is not null
    or file_url is not null
    or link_url is not null
  ),
  constraint posts_link_length check (link_url is null or char_length(link_url) <= 2048),
  constraint posts_file_name_length check (file_name is null or char_length(file_name) <= 160)
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_author_id_idx on public.posts (author_id, created_at desc);

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
before update on public.posts
for each row execute function public.set_updated_at();

create table if not exists public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists post_likes_user_idx on public.post_likes (user_id);

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  constraint post_comments_content_length check (
    char_length(content) between 1 and 1500
  )
);

create index if not exists post_comments_post_idx on public.post_comments (post_id, created_at asc);

-- Personal reading library. Snapshots are intentional: a saved article must
-- remain readable even if the original post is deleted.
create table if not exists public.saved_articles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid references public.posts (id) on delete set null,
  title text not null,
  content text not null,
  source_url text,
  media_url text,
  author_name text,
  created_at timestamptz not null default now(),
  constraint saved_articles_title_length check (char_length(title) between 1 and 180),
  constraint saved_articles_content_length check (char_length(content) <= 10000)
);

create index if not exists saved_articles_user_idx on public.saved_articles (user_id, created_at desc);

-- A post can only be saved once per user. Rows without a post_id (manual
-- notes) may repeat, so the constraint is partial.
create unique index if not exists saved_articles_user_post_uidx
  on public.saved_articles (user_id, post_id)
  where post_id is not null;

-- ============================================================================
-- 4. GALLERY
-- ============================================================================

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  caption text,
  file_size bigint,
  created_at timestamptz not null default now(),
  constraint gallery_caption_length check (caption is null or char_length(caption) <= 500),
  constraint gallery_path_length check (char_length(storage_path) <= 500 and char_length(public_url) <= 2048)
);

create index if not exists gallery_items_user_idx on public.gallery_items (user_id, created_at desc);

-- ============================================================================
-- 5. PROMO
-- ============================================================================

create table if not exists public.promos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  title text not null,
  description text not null default '',
  image_url text,
  link_url text,
  instagram text,
  tiktok text,
  whatsapp text,
  phone text,
  email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promos_title_length check (char_length(title) between 2 and 120),
  constraint promos_description_length check (char_length(description) <= 1200),
  constraint promos_phone_length check (phone is null or char_length(phone) <= 24),
  constraint promos_email_length check (email is null or char_length(email) <= 254),
  constraint promos_url_length check (
    (link_url is null or char_length(link_url) <= 2048)
    and (image_url is null or char_length(image_url) <= 2048)
  )
);

drop trigger if exists promos_set_updated_at on public.promos;
create trigger promos_set_updated_at
before update on public.promos
for each row execute function public.set_updated_at();

create index if not exists promos_active_idx on public.promos (is_active, updated_at desc);

-- ============================================================================
-- 6. DISCUSSIONS
-- ============================================================================

create table if not exists public.discussions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint discussions_title_length check (char_length(title) between 3 and 120),
  constraint discussions_description_length check (description is null or char_length(description) <= 500)
);

drop trigger if exists discussions_set_updated_at on public.discussions;
create trigger discussions_set_updated_at
before update on public.discussions
for each row execute function public.set_updated_at();

create table if not exists public.discussion_members (
  discussion_id uuid not null references public.discussions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member',
  status text not null default 'pending',
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (discussion_id, user_id),
  constraint discussion_members_role check (role in ('owner', 'member')),
  constraint discussion_members_status check (status in ('pending', 'approved', 'rejected'))
);

create index if not exists discussion_members_user_idx on public.discussion_members (user_id, status);
create index if not exists discussion_members_discussion_idx on public.discussion_members (discussion_id, status);

create table if not exists public.discussion_messages (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references public.discussions (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  constraint discussion_messages_content_length check (char_length(content) between 1 and 3000)
);

create index if not exists discussion_messages_discussion_idx
  on public.discussion_messages (discussion_id, created_at asc);

-- SECURITY DEFINER helpers avoid recursive RLS lookups on discussion_members.
create or replace function public.is_discussion_owner(p_discussion_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.discussions
    where id = p_discussion_id and owner_id = p_user_id
  );
$$;

create or replace function public.is_approved_member(p_discussion_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.discussion_members
    where discussion_id = p_discussion_id
      and user_id = p_user_id
      and status = 'approved'
  );
$$;

create or replace function public.can_view_discussion(p_discussion_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_discussion_owner(p_discussion_id, p_user_id)
      or public.is_approved_member(p_discussion_id, p_user_id);
$$;

revoke all on function public.is_discussion_owner(uuid, uuid) from public;
revoke all on function public.is_approved_member(uuid, uuid) from public;
revoke all on function public.can_view_discussion(uuid, uuid) from public;
grant execute on function public.is_discussion_owner(uuid, uuid) to authenticated;
grant execute on function public.is_approved_member(uuid, uuid) to authenticated;
grant execute on function public.can_view_discussion(uuid, uuid) to authenticated;

-- ============================================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.saved_articles enable row level security;
alter table public.gallery_items enable row level security;
alter table public.promos enable row level security;
alter table public.discussions enable row level security;
alter table public.discussion_members enable row level security;
alter table public.discussion_messages enable row level security;

-- Profiles ------------------------------------------------------------------
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Posts ---------------------------------------------------------------------
drop policy if exists "posts_select_authenticated" on public.posts;
create policy "posts_select_authenticated"
on public.posts for select
to authenticated
using (true);

drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own"
on public.posts for insert
to authenticated
with check (author_id = auth.uid());

drop policy if exists "posts_update_own" on public.posts;
create policy "posts_update_own"
on public.posts for update
to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own"
on public.posts for delete
to authenticated
using (author_id = auth.uid());

-- Likes ---------------------------------------------------------------------
drop policy if exists "post_likes_select_authenticated" on public.post_likes;
create policy "post_likes_select_authenticated"
on public.post_likes for select
to authenticated
using (true);

drop policy if exists "post_likes_insert_own" on public.post_likes;
create policy "post_likes_insert_own"
on public.post_likes for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "post_likes_delete_own" on public.post_likes;
create policy "post_likes_delete_own"
on public.post_likes for delete
to authenticated
using (user_id = auth.uid());

-- Comments ------------------------------------------------------------------
drop policy if exists "post_comments_select_authenticated" on public.post_comments;
create policy "post_comments_select_authenticated"
on public.post_comments for select
to authenticated
using (true);

drop policy if exists "post_comments_insert_own" on public.post_comments;
create policy "post_comments_insert_own"
on public.post_comments for insert
to authenticated
with check (author_id = auth.uid());

drop policy if exists "post_comments_update_own" on public.post_comments;
create policy "post_comments_update_own"
on public.post_comments for update
to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

drop policy if exists "post_comments_delete_own" on public.post_comments;
create policy "post_comments_delete_own"
on public.post_comments for delete
to authenticated
using (author_id = auth.uid());

-- Saved articles (strictly private) -----------------------------------------
drop policy if exists "saved_articles_select_own" on public.saved_articles;
create policy "saved_articles_select_own"
on public.saved_articles for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "saved_articles_insert_own" on public.saved_articles;
create policy "saved_articles_insert_own"
on public.saved_articles for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "saved_articles_update_own" on public.saved_articles;
create policy "saved_articles_update_own"
on public.saved_articles for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "saved_articles_delete_own" on public.saved_articles;
create policy "saved_articles_delete_own"
on public.saved_articles for delete
to authenticated
using (user_id = auth.uid());

-- Gallery (strictly private) ------------------------------------------------
drop policy if exists "gallery_items_select_own" on public.gallery_items;
create policy "gallery_items_select_own"
on public.gallery_items for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "gallery_items_insert_own" on public.gallery_items;
create policy "gallery_items_insert_own"
on public.gallery_items for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "gallery_items_update_own" on public.gallery_items;
create policy "gallery_items_update_own"
on public.gallery_items for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "gallery_items_delete_own" on public.gallery_items;
create policy "gallery_items_delete_own"
on public.gallery_items for delete
to authenticated
using (user_id = auth.uid());

-- Promos --------------------------------------------------------------------
drop policy if exists "promos_select_active_or_own" on public.promos;
create policy "promos_select_active_or_own"
on public.promos for select
to authenticated
using (is_active = true or user_id = auth.uid());

drop policy if exists "promos_insert_own" on public.promos;
create policy "promos_insert_own"
on public.promos for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "promos_update_own" on public.promos;
create policy "promos_update_own"
on public.promos for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "promos_delete_own" on public.promos;
create policy "promos_delete_own"
on public.promos for delete
to authenticated
using (user_id = auth.uid());

-- Discussions ---------------------------------------------------------------
drop policy if exists "discussions_select_member" on public.discussions;
create policy "discussions_select_member"
on public.discussions for select
to authenticated
using (owner_id = auth.uid() or public.is_approved_member(id, auth.uid()));

drop policy if exists "discussions_insert_own" on public.discussions;
create policy "discussions_insert_own"
on public.discussions for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "discussions_update_owner" on public.discussions;
create policy "discussions_update_owner"
on public.discussions for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "discussions_delete_owner" on public.discussions;
create policy "discussions_delete_owner"
on public.discussions for delete
to authenticated
using (owner_id = auth.uid());

-- Discussion members --------------------------------------------------------
drop policy if exists "discussion_members_select_visible" on public.discussion_members;
create policy "discussion_members_select_visible"
on public.discussion_members for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_discussion_owner(discussion_id, auth.uid())
  or public.is_approved_member(discussion_id, auth.uid())
);

drop policy if exists "discussion_members_insert_owner" on public.discussion_members;
create policy "discussion_members_insert_owner"
on public.discussion_members for insert
to authenticated
with check (
  public.is_discussion_owner(discussion_id, auth.uid())
  or (user_id = auth.uid() and role = 'owner' and status = 'approved')
);

drop policy if exists "discussion_members_update_owner" on public.discussion_members;
create policy "discussion_members_update_owner"
on public.discussion_members for update
to authenticated
using (public.is_discussion_owner(discussion_id, auth.uid()))
with check (public.is_discussion_owner(discussion_id, auth.uid()));

drop policy if exists "discussion_members_delete_owner_or_self" on public.discussion_members;
create policy "discussion_members_delete_owner_or_self"
on public.discussion_members for delete
to authenticated
using (
  public.is_discussion_owner(discussion_id, auth.uid())
  or (user_id = auth.uid() and role <> 'owner')
);

-- Discussion messages -------------------------------------------------------
drop policy if exists "discussion_messages_select_member" on public.discussion_messages;
create policy "discussion_messages_select_member"
on public.discussion_messages for select
to authenticated
using (public.can_view_discussion(discussion_id, auth.uid()));

drop policy if exists "discussion_messages_insert_member" on public.discussion_messages;
create policy "discussion_messages_insert_member"
on public.discussion_messages for insert
to authenticated
with check (
  sender_id = auth.uid()
  and public.can_view_discussion(discussion_id, auth.uid())
);

drop policy if exists "discussion_messages_delete_own" on public.discussion_messages;
create policy "discussion_messages_delete_own"
on public.discussion_messages for delete
to authenticated
using (sender_id = auth.uid() or public.is_discussion_owner(discussion_id, auth.uid()));

-- Username availability check used by the registration form before the user
-- has a session. SECURITY DEFINER is required because profiles is not readable
-- by anon; the function only exposes a boolean for an exact username.
create or replace function public.is_username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.profiles
    where username = lower(trim(p_username))
  );
$$;

revoke all on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to anon, authenticated;

-- ============================================================================
-- 8. GRANTS
-- RLS still applies; anon gets no table access. Content pages are read from
-- WordPress and do not need anonymous database access. The username check
-- RPC above is the only anonymous database entry point.
-- ============================================================================

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

-- ============================================================================
-- 9. STORAGE BUCKETS & POLICIES
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'avatars', 'avatars', true, 2097152,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'feed-media', 'feed-media', true, 5242880,
    array[
      'image/jpeg', 'image/png', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip', 'application/x-zip-compressed'
    ]
  ),
  (
    'promo-media', 'promo-media', true, 2097152,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public_read_creatorchat_media" on storage.objects;
create policy "public_read_creatorchat_media"
on storage.objects for select
to public
using (bucket_id in ('avatars', 'feed-media', 'promo-media'));

drop policy if exists "authenticated_upload_creatorchat_media" on storage.objects;
create policy "authenticated_upload_creatorchat_media"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('avatars', 'feed-media', 'promo-media')
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "owner_update_creatorchat_media" on storage.objects;
create policy "owner_update_creatorchat_media"
on storage.objects for update
to authenticated
using (
  bucket_id in ('avatars', 'feed-media', 'promo-media')
  and owner_id = (select auth.uid()::text)
)
with check (
  bucket_id in ('avatars', 'feed-media', 'promo-media')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "owner_delete_creatorchat_media" on storage.objects;
create policy "owner_delete_creatorchat_media"
on storage.objects for delete
to authenticated
using (
  bucket_id in ('avatars', 'feed-media', 'promo-media')
  and owner_id = (select auth.uid()::text)
);

-- ============================================================================
-- 10. REALTIME
-- ============================================================================

do $$
begin
  alter publication supabase_realtime add table public.posts;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.post_likes;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.post_comments;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.discussion_messages;
exception when duplicate_object then null;
end $$;

-- Include old row data for DELETE events so clients can remove items.
alter table public.posts replica identity full;
alter table public.post_likes replica identity full;
alter table public.post_comments replica identity full;
alter table public.discussion_messages replica identity full;

-- ============================================================================
-- 11. LAST-SEEN HEARTBEAT
-- A lightweight presence fallback for server-rendered online lists.
-- ============================================================================

create or replace function public.touch_last_seen()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
  set last_seen_at = now()
  where id = auth.uid();
$$;

grant execute on function public.touch_last_seen() to authenticated;
