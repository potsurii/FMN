-- Phase 1 — trips, items, and storage buckets
-- Development schema for Forget Me Not MVP (local Supabase).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date not null,
  main_image text,
  created_at timestamptz not null default now(),
  constraint trips_date_range_check check (end_date >= start_date)
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  name text not null,
  price numeric(12, 2) not null,
  currency char(3) not null,
  location text not null,
  purchase_date date not null,
  category text not null,
  image text,
  note text,
  created_at timestamptz not null default now(),
  constraint items_price_non_negative check (price >= 0),
  constraint items_category_check check (
    category in (
      'beauty',
      'food',
      'fashion',
      'jewelry',
      'daily',
      'electronics',
      'other'
    )
  ),
  constraint items_currency_format check (currency ~ '^[A-Z]{3}$')
);

create index items_trip_id_idx on public.items (trip_id);

-- ---------------------------------------------------------------------------
-- Storage buckets (public read for local UI testing)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'trip-images',
    'trip-images',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
  ),
  (
    'item-images',
    'item-images',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
  );

-- Local development policies: allow read/write for anon and authenticated.
-- Tighten these when authentication and production roles are introduced.

create policy "Local trip-images public read"
  on storage.objects for select
  using (bucket_id = 'trip-images');

create policy "Local trip-images public insert"
  on storage.objects for insert
  with check (bucket_id = 'trip-images');

create policy "Local trip-images public update"
  on storage.objects for update
  using (bucket_id = 'trip-images')
  with check (bucket_id = 'trip-images');

create policy "Local trip-images public delete"
  on storage.objects for delete
  using (bucket_id = 'trip-images');

create policy "Local item-images public read"
  on storage.objects for select
  using (bucket_id = 'item-images');

create policy "Local item-images public insert"
  on storage.objects for insert
  with check (bucket_id = 'item-images');

create policy "Local item-images public update"
  on storage.objects for update
  using (bucket_id = 'item-images')
  with check (bucket_id = 'item-images');

create policy "Local item-images public delete"
  on storage.objects for delete
  using (bucket_id = 'item-images');
