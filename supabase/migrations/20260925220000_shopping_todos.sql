-- Phase 2 P4 — shopping_todos (private purchase plans per trip)
-- Ownership via trips.user_id. No visibility. No source fields.

create table public.shopping_todos (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  name text not null,
  image text,
  category text,
  reference_price numeric(12, 2),
  reference_currency char(3),
  reference_location text,
  note text,
  status text not null default 'active',
  purchased_item_id uuid references public.items (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shopping_todos_name_not_empty check (length(trim(name)) > 0),
  constraint shopping_todos_status_check check (status in ('active', 'converted')),
  constraint shopping_todos_lifecycle_check check (
    (status = 'active' and purchased_item_id is null)
    or (status = 'converted' and purchased_item_id is not null)
  ),
  constraint shopping_todos_category_check check (
    category is null
    or category in (
      'beauty',
      'food',
      'fashion',
      'jewelry',
      'daily',
      'electronics',
      'other'
    )
  ),
  constraint shopping_todos_reference_price_non_negative check (
    reference_price is null or reference_price >= 0
  ),
  constraint shopping_todos_reference_currency_pair check (
    (reference_price is null and reference_currency is null)
    or (
      reference_price is not null
      and reference_currency is not null
      and reference_currency ~ '^[A-Z]{3}$'
    )
  )
);

create index shopping_todos_trip_id_status_idx
  on public.shopping_todos (trip_id, status);

create unique index shopping_todos_purchased_item_id_uidx
  on public.shopping_todos (purchased_item_id)
  where purchased_item_id is not null;

create or replace function public.set_shopping_todos_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger shopping_todos_set_updated_at
  before update on public.shopping_todos
  for each row
  execute function public.set_shopping_todos_updated_at();

alter table public.shopping_todos enable row level security;

create policy "shopping_todos_select_own"
  on public.shopping_todos for select
  to authenticated
  using (
    exists (
      select 1 from public.trips t
      where t.id = shopping_todos.trip_id
        and t.user_id = auth.uid()
    )
  );

create policy "shopping_todos_insert_own"
  on public.shopping_todos for insert
  to authenticated
  with check (
    exists (
      select 1 from public.trips t
      where t.id = shopping_todos.trip_id
        and t.user_id = auth.uid()
    )
  );

create policy "shopping_todos_update_own"
  on public.shopping_todos for update
  to authenticated
  using (
    exists (
      select 1 from public.trips t
      where t.id = shopping_todos.trip_id
        and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.trips t
      where t.id = shopping_todos.trip_id
        and t.user_id = auth.uid()
    )
  );

create policy "shopping_todos_delete_own"
  on public.shopping_todos for delete
  to authenticated
  using (
    exists (
      select 1 from public.trips t
      where t.id = shopping_todos.trip_id
        and t.user_id = auth.uid()
    )
  );
