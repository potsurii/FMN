-- Phase 2 Follow: follow relationships + authenticated profile read for P8/P9/P10.
-- Profiles table has no email column; only display_name / bio / avatar_path.

-- ---------------------------------------------------------------------------
-- follows
-- ---------------------------------------------------------------------------

create table public.follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  following_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self check (follower_id <> following_id)
);

create index follows_following_id_idx on public.follows (following_id);
create index follows_follower_id_idx on public.follows (follower_id);

alter table public.follows enable row level security;

-- Rows are only UUID pairs; authenticated users may read for counts / lists.
create policy "follows_select_authenticated"
  on public.follows for select
  to authenticated
  using (true);

create policy "follows_insert_own"
  on public.follows for insert
  to authenticated
  with check (
    follower_id = auth.uid()
    and follower_id <> following_id
  );

create policy "follows_delete_own"
  on public.follows for delete
  to authenticated
  using (follower_id = auth.uid());

-- ---------------------------------------------------------------------------
-- profiles: any authenticated user may read profile rows (no email stored)
-- ---------------------------------------------------------------------------

create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);
