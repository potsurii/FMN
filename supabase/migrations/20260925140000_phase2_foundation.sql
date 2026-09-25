-- Phase 2 Foundation — profiles, ownership, visibility, travel_status,
-- invariant triggers, RLS, private storage.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  bio text,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- trips: ownership, visibility, travel_status
-- ---------------------------------------------------------------------------

alter table public.trips
  add column user_id uuid references auth.users (id) on delete cascade,
  add column visibility text not null default 'private'
    constraint trips_visibility_check check (visibility in ('private', 'public')),
  add column travel_status text not null default 'upcoming'
    constraint trips_travel_status_check check (travel_status in ('upcoming', 'active', 'ended'));

-- Local reset runs migrations before seed; table is empty so NOT NULL is safe.
alter table public.trips
  alter column user_id set not null;

create index trips_user_id_idx on public.trips (user_id);
create index trips_user_id_visibility_idx on public.trips (user_id, visibility);
create index trips_visibility_idx on public.trips (visibility);

-- ---------------------------------------------------------------------------
-- items: visibility only (ownership via trip_id)
-- ---------------------------------------------------------------------------

alter table public.items
  add column visibility text not null default 'private'
    constraint items_visibility_check check (visibility in ('private', 'public'));

create index items_trip_id_visibility_idx on public.items (trip_id, visibility);

-- ---------------------------------------------------------------------------
-- Invariant triggers (do NOT auto-mutate items)
-- ---------------------------------------------------------------------------

create or replace function public.prevent_public_item_on_private_trip()
returns trigger
language plpgsql
as $$
declare
  trip_visibility text;
begin
  if new.visibility = 'public' then
    select t.visibility into trip_visibility
    from public.trips t
    where t.id = new.trip_id;

    if trip_visibility is null then
      raise exception 'Item references missing trip';
    end if;

    if trip_visibility = 'private' then
      raise exception 'Cannot set item public while trip is private';
    end if;
  end if;

  return new;
end;
$$;

create trigger items_visibility_trip_guard
  before insert or update of visibility, trip_id
  on public.items
  for each row
  execute function public.prevent_public_item_on_private_trip();

create or replace function public.prevent_private_trip_with_public_items()
returns trigger
language plpgsql
as $$
begin
  if new.visibility = 'private'
     and (tg_op = 'INSERT' or old.visibility is distinct from 'private') then
    if exists (
      select 1
      from public.items i
      where i.trip_id = new.id
        and i.visibility = 'public'
    ) then
      raise exception 'Cannot set trip private while public items exist';
    end if;
  end if;

  return new;
end;
$$;

create trigger trips_private_visibility_guard
  before update of visibility
  on public.trips
  for each row
  execute function public.prevent_private_trip_with_public_items();

-- ---------------------------------------------------------------------------
-- RLS: profiles
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- RLS: trips
-- ---------------------------------------------------------------------------

alter table public.trips enable row level security;

create policy "trips_select_own"
  on public.trips for select
  to authenticated
  using (user_id = auth.uid());

create policy "trips_select_public"
  on public.trips for select
  to anon, authenticated
  using (visibility = 'public');

create policy "trips_insert_own"
  on public.trips for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "trips_update_own"
  on public.trips for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "trips_delete_own"
  on public.trips for delete
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- RLS: items (owner via trips.user_id)
-- ---------------------------------------------------------------------------

alter table public.items enable row level security;

create policy "items_select_own"
  on public.items for select
  to authenticated
  using (
    exists (
      select 1
      from public.trips t
      where t.id = items.trip_id
        and t.user_id = auth.uid()
    )
  );

create policy "items_select_public"
  on public.items for select
  to anon, authenticated
  using (
    visibility = 'public'
    and exists (
      select 1
      from public.trips t
      where t.id = items.trip_id
        and t.visibility = 'public'
    )
  );

create policy "items_insert_own"
  on public.items for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.trips t
      where t.id = items.trip_id
        and t.user_id = auth.uid()
    )
  );

create policy "items_update_own"
  on public.items for update
  to authenticated
  using (
    exists (
      select 1
      from public.trips t
      where t.id = items.trip_id
        and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.trips t
      where t.id = items.trip_id
        and t.user_id = auth.uid()
    )
  );

create policy "items_delete_own"
  on public.items for delete
  to authenticated
  using (
    exists (
      select 1
      from public.trips t
      where t.id = items.trip_id
        and t.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Storage: private buckets + owner path policies
-- ---------------------------------------------------------------------------

update storage.buckets
set public = false
where id in ('trip-images', 'item-images');

drop policy if exists "Local trip-images public read" on storage.objects;
drop policy if exists "Local trip-images public insert" on storage.objects;
drop policy if exists "Local trip-images public update" on storage.objects;
drop policy if exists "Local trip-images public delete" on storage.objects;
drop policy if exists "Local item-images public read" on storage.objects;
drop policy if exists "Local item-images public insert" on storage.objects;
drop policy if exists "Local item-images public update" on storage.objects;
drop policy if exists "Local item-images public delete" on storage.objects;

create policy "trip_images_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'trip-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "trip_images_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'trip-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "trip_images_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'trip-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'trip-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "trip_images_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'trip-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "item_images_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'item-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "item_images_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'item-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "item_images_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'item-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'item-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "item_images_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'item-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
