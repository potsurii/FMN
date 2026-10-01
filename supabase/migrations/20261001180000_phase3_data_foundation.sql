-- Phase 3 Batch 1 — Data Foundation
-- Quantity (items + shopping_todos), receipts model, receipt storage stubs.
-- Legacy Todo boundary UTC timestamp is NOT written here (Product Owner / deployment input required).
-- ID-B: receipt_items.receipt_id ON DELETE CASCADE (join rows only; never deletes items).

-- ---------------------------------------------------------------------------
-- items.quantity
-- ---------------------------------------------------------------------------

alter table public.items
  add column if not exists quantity integer not null default 1;

alter table public.items
  drop constraint if exists items_quantity_positive;

alter table public.items
  add constraint items_quantity_positive check (quantity >= 1);

-- ---------------------------------------------------------------------------
-- shopping_todos.quantity
-- ---------------------------------------------------------------------------

alter table public.shopping_todos
  add column if not exists quantity integer not null default 1;

alter table public.shopping_todos
  drop constraint if exists shopping_todos_quantity_positive;

alter table public.shopping_todos
  add constraint shopping_todos_quantity_positive check (quantity >= 1);

-- ---------------------------------------------------------------------------
-- receipts + receipt_items
-- ---------------------------------------------------------------------------

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  image_path text not null,
  receipt_date date,
  created_at timestamptz not null default now()
);

create index if not exists receipts_user_id_idx on public.receipts (user_id);

create table if not exists public.receipt_items (
  receipt_id uuid not null references public.receipts (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  primary key (receipt_id, item_id),
  constraint receipt_items_item_id_unique unique (item_id)
);

create index if not exists receipt_items_receipt_id_idx
  on public.receipt_items (receipt_id);

alter table public.receipts enable row level security;
alter table public.receipt_items enable row level security;

drop policy if exists "receipts_select_own" on public.receipts;
create policy "receipts_select_own"
  on public.receipts for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "receipts_insert_own" on public.receipts;
create policy "receipts_insert_own"
  on public.receipts for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "receipts_update_own" on public.receipts;
create policy "receipts_update_own"
  on public.receipts for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "receipts_delete_own" on public.receipts;
create policy "receipts_delete_own"
  on public.receipts for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "receipt_items_select_own" on public.receipt_items;
create policy "receipt_items_select_own"
  on public.receipt_items for select
  to authenticated
  using (
    exists (
      select 1 from public.receipts r
      where r.id = receipt_items.receipt_id
        and r.user_id = auth.uid()
    )
  );

drop policy if exists "receipt_items_insert_own" on public.receipt_items;
create policy "receipt_items_insert_own"
  on public.receipt_items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.receipts r
      where r.id = receipt_items.receipt_id
        and r.user_id = auth.uid()
    )
    and exists (
      select 1
      from public.items i
      join public.trips t on t.id = i.trip_id
      where i.id = receipt_items.item_id
        and t.user_id = auth.uid()
    )
  );

drop policy if exists "receipt_items_delete_own" on public.receipt_items;
create policy "receipt_items_delete_own"
  on public.receipt_items for delete
  to authenticated
  using (
    exists (
      select 1 from public.receipts r
      where r.id = receipt_items.receipt_id
        and r.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Storage: temporary vs formal receipt buckets (I-02 stubs)
-- Path prefix: {user_id}/...
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'receipt-images-temp',
    'receipt-images-temp',
    false,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'receipt-images',
    'receipt-images',
    false,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Temporary receipt assets
drop policy if exists "receipt_temp_select_own" on storage.objects;
create policy "receipt_temp_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'receipt-images-temp'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "receipt_temp_insert_own" on storage.objects;
create policy "receipt_temp_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'receipt-images-temp'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "receipt_temp_update_own" on storage.objects;
create policy "receipt_temp_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'receipt-images-temp'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'receipt-images-temp'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "receipt_temp_delete_own" on storage.objects;
create policy "receipt_temp_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'receipt-images-temp'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Formal receipt assets
drop policy if exists "receipt_formal_select_own" on storage.objects;
create policy "receipt_formal_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'receipt-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "receipt_formal_insert_own" on storage.objects;
create policy "receipt_formal_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'receipt-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "receipt_formal_update_own" on storage.objects;
create policy "receipt_formal_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'receipt-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'receipt-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "receipt_formal_delete_own" on storage.objects;
create policy "receipt_formal_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'receipt-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
