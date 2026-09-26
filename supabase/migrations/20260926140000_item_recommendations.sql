-- Phase 2 Recommendation — item_recommendations
-- Feedback on public purchase records only. No Like/Favorite/Trust Score.

create table public.item_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint item_recommendations_type_check
    check (type in ('recommend', 'not_recommend')),
  constraint item_recommendations_user_item_unique
    unique (user_id, item_id)
);

create index item_recommendations_item_id_type_idx
  on public.item_recommendations (item_id, type);

create index item_recommendations_user_id_idx
  on public.item_recommendations (user_id);

create or replace function public.set_item_recommendations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger item_recommendations_set_updated_at
  before update on public.item_recommendations
  for each row
  execute function public.set_item_recommendations_updated_at();

-- True when item + trip are both public.
create or replace function public.is_item_publicly_recommendable(p_item_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.items i
    join public.trips t on t.id = i.trip_id
    where i.id = p_item_id
      and i.visibility = 'public'
      and t.visibility = 'public'
  );
$$;

-- True when auth.uid() owns the trip that contains the item.
create or replace function public.is_item_owner(p_item_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.items i
    join public.trips t on t.id = i.trip_id
    where i.id = p_item_id
      and t.user_id = auth.uid()
  );
$$;

alter table public.item_recommendations enable row level security;

-- Public counts / feedback rows for publicly recommendable items.
-- Own rows always readable. Trip owners can read retained feedback on their items
-- (including after public → private) without exposing private items to others.
create policy "item_recommendations_select"
  on public.item_recommendations for select
  to anon, authenticated
  using (
    public.is_item_publicly_recommendable(item_id)
    or user_id = auth.uid()
    or public.is_item_owner(item_id)
  );

create policy "item_recommendations_insert_own"
  on public.item_recommendations for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.is_item_publicly_recommendable(item_id)
    and not public.is_item_owner(item_id)
  );

create policy "item_recommendations_update_own"
  on public.item_recommendations for update
  to authenticated
  using (
    user_id = auth.uid()
    and public.is_item_publicly_recommendable(item_id)
  )
  with check (
    user_id = auth.uid()
    and public.is_item_publicly_recommendable(item_id)
    and not public.is_item_owner(item_id)
  );

create policy "item_recommendations_delete_own"
  on public.item_recommendations for delete
  to authenticated
  using (user_id = auth.uid());
