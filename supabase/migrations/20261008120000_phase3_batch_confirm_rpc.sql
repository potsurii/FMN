-- Phase 3 Batch 3 — I-01 Atomic Batch Confirm
-- Single Postgres function = sole multi-record Confirm transaction boundary.
-- SECURITY INVOKER: RLS + ownership checks apply; no elevated bypass.
-- Idempotent: create or replace + grant/revoke.

-- ---------------------------------------------------------------------------
-- confirm_batch_shopping_writes
-- p_trip_id: target trip (must be owned by auth.uid())
-- p_items: non-empty jsonb array of shopping-record payloads
-- p_receipt: optional { image_path, receipt_date } after I-02 promote
-- returns: { item_ids: uuid[], receipt_id: uuid | null }
-- ---------------------------------------------------------------------------

create or replace function public.confirm_batch_shopping_writes(
  p_trip_id uuid,
  p_items jsonb,
  p_receipt jsonb default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_trip_user_id uuid;
  v_trip_visibility text;
  v_trip_start date;
  v_trip_end date;
  v_item jsonb;
  v_idx integer;
  v_name text;
  v_price numeric(12, 2);
  v_currency text;
  v_location text;
  v_purchase_date date;
  v_category text;
  v_image text;
  v_note text;
  v_visibility text;
  v_quantity integer;
  v_item_id uuid;
  v_item_ids uuid[] := array[]::uuid[];
  v_receipt_id uuid := null;
  v_receipt_path text;
  v_receipt_date date;
begin
  if v_uid is null then
    raise exception 'not authenticated'
      using errcode = '42501';
  end if;

  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) < 1 then
    raise exception 'p_items must be a non-empty jsonb array'
      using errcode = '22023';
  end if;

  select t.user_id, t.visibility, t.start_date, t.end_date
    into v_trip_user_id, v_trip_visibility, v_trip_start, v_trip_end
  from public.trips t
  where t.id = p_trip_id;

  if v_trip_user_id is null then
    raise exception 'trip not found'
      using errcode = 'P0002';
  end if;

  if v_trip_user_id <> v_uid then
    raise exception 'trip not owned by caller'
      using errcode = '42501';
  end if;

  for v_idx in 0 .. jsonb_array_length(p_items) - 1 loop
    v_item := p_items -> v_idx;

    v_name := nullif(trim(coalesce(v_item->>'name', '')), '');
    if v_name is null then
      raise exception 'item[%].name is required', v_idx
        using errcode = '22023';
    end if;

    begin
      v_price := (v_item->>'price')::numeric(12, 2);
    exception when others then
      raise exception 'item[%].price is invalid', v_idx
        using errcode = '22023';
    end;

    if v_price is null or v_price < 0 then
      raise exception 'item[%].price must be >= 0', v_idx
        using errcode = '22023';
    end if;

    v_currency := upper(trim(coalesce(v_item->>'currency', '')));
    if v_currency !~ '^[A-Z]{3}$' then
      raise exception 'item[%].currency must be ISO 4217', v_idx
        using errcode = '22023';
    end if;

    v_location := coalesce(v_item->>'location', '');

    begin
      v_purchase_date := (v_item->>'purchase_date')::date;
    exception when others then
      raise exception 'item[%].purchase_date is invalid', v_idx
        using errcode = '22023';
    end;

    if v_purchase_date is null then
      raise exception 'item[%].purchase_date is required', v_idx
        using errcode = '22023';
    end if;

    if v_purchase_date < v_trip_start or v_purchase_date > v_trip_end then
      raise exception 'item[%].purchase_date outside trip date range', v_idx
        using errcode = '22023';
    end if;

    v_category := coalesce(nullif(trim(v_item->>'category'), ''), 'other');
    if v_category not in (
      'beauty', 'food', 'fashion', 'jewelry', 'daily', 'electronics', 'other'
    ) then
      raise exception 'item[%].category is invalid', v_idx
        using errcode = '22023';
    end if;

    v_image := nullif(trim(coalesce(v_item->>'image', '')), '');
    v_note := nullif(trim(coalesce(v_item->>'note', '')), '');

    v_visibility := lower(coalesce(v_item->>'visibility', 'private'));
    if v_trip_visibility = 'private' then
      v_visibility := 'private';
    elsif v_visibility not in ('private', 'public') then
      v_visibility := 'private';
    end if;

    begin
      v_quantity := coalesce((v_item->>'quantity')::integer, 1);
    exception when others then
      raise exception 'item[%].quantity is invalid', v_idx
        using errcode = '22023';
    end;

    if v_quantity is null or v_quantity < 1 then
      raise exception 'item[%].quantity must be >= 1', v_idx
        using errcode = '22023';
    end if;

    insert into public.items (
      trip_id,
      name,
      price,
      currency,
      location,
      purchase_date,
      category,
      image,
      note,
      visibility,
      quantity
    )
    values (
      p_trip_id,
      v_name,
      v_price,
      v_currency,
      v_location,
      v_purchase_date,
      v_category,
      v_image,
      v_note,
      v_visibility,
      v_quantity
    )
    returning id into v_item_id;

    v_item_ids := array_append(v_item_ids, v_item_id);
  end loop;

  if p_receipt is not null and p_receipt <> 'null'::jsonb then
    v_receipt_path := nullif(trim(coalesce(p_receipt->>'image_path', '')), '');
    if v_receipt_path is null then
      raise exception 'receipt.image_path is required'
        using errcode = '22023';
    end if;

    -- Path-prefix ownership: first folder must equal auth.uid()
    if split_part(v_receipt_path, '/', 1) <> v_uid::text then
      raise exception 'receipt.image_path not owned by caller'
        using errcode = '42501';
    end if;

    if p_receipt ? 'receipt_date'
       and nullif(trim(coalesce(p_receipt->>'receipt_date', '')), '') is not null then
      begin
        v_receipt_date := (p_receipt->>'receipt_date')::date;
      exception when others then
        raise exception 'receipt.receipt_date is invalid'
          using errcode = '22023';
      end;
    else
      v_receipt_date := null;
    end if;

    insert into public.receipts (user_id, image_path, receipt_date)
    values (v_uid, v_receipt_path, v_receipt_date)
    returning id into v_receipt_id;

    insert into public.receipt_items (receipt_id, item_id)
    select v_receipt_id, unnest(v_item_ids);
  end if;

  return jsonb_build_object(
    'item_ids', to_jsonb(v_item_ids),
    'receipt_id', to_jsonb(v_receipt_id)
  );
end;
$$;

comment on function public.confirm_batch_shopping_writes(uuid, jsonb, jsonb) is
  'I-01: atomic multi-record Confirm write (items + optional receipt/receipt_items). Single transaction; any failure rolls back all.';

revoke all on function public.confirm_batch_shopping_writes(uuid, jsonb, jsonb)
  from public;
grant execute on function public.confirm_batch_shopping_writes(uuid, jsonb, jsonb)
  to authenticated;
