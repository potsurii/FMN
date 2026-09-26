-- P6 Search discovery: minimal profile read + storage SELECT only for
-- images that belong to public trips / public items.
-- Does NOT open storage to all authenticated users.
-- Does NOT expose emails (profiles has no email column).

-- ---------------------------------------------------------------------------
-- profiles: authenticated may read discoverable profiles only
-- (owners of at least one public trip). Own profile still readable via
-- profiles_select_own.
-- ---------------------------------------------------------------------------

create policy "profiles_select_discoverable"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1
      from public.trips t
      where t.user_id = profiles.id
        and t.visibility = 'public'
    )
  );

-- ---------------------------------------------------------------------------
-- storage: SELECT only when object path is referenced by public content
-- ---------------------------------------------------------------------------

create policy "trip_images_select_public_content"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'trip-images'
    and exists (
      select 1
      from public.trips t
      where t.main_image = storage.objects.name
        and t.visibility = 'public'
    )
  );

create policy "item_images_select_public_content"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'item-images'
    and exists (
      select 1
      from public.items i
      join public.trips t on t.id = i.trip_id
      where i.image = storage.objects.name
        and i.visibility = 'public'
        and t.visibility = 'public'
    )
  );
