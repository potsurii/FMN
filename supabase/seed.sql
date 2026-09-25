-- =============================================================================
-- Forget Me Not — Phase 2 Foundation Seed
-- Local UI / RLS / ownership testing only.
-- Accounts (email confirmations disabled locally):
--   User A: usera@fmn.local / password123
--   User B: userb@fmn.local / password123
-- Reload with: npx supabase db reset
-- =============================================================================

create extension if not exists pgcrypto;

-- Stable auth user ids
--   aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa  User A
--   bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb  User B

truncate table public.items restart identity cascade;
truncate table public.trips restart identity cascade;

delete from auth.identities
where user_id in (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
);

delete from auth.users
where id in (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
);

-- ---------------------------------------------------------------------------
-- Auth users (trigger creates profiles)
-- ---------------------------------------------------------------------------

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) values
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'authenticated',
    'authenticated',
    'usera@fmn.local',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"User A"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'authenticated',
    'authenticated',
    'userb@fmn.local',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"User B"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    format('{"sub":"%s","email":"%s"}', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'usera@fmn.local')::jsonb,
    'email',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    now(),
    now(),
    now()
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    format('{"sub":"%s","email":"%s"}', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'userb@fmn.local')::jsonb,
    'email',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    now(),
    now(),
    now()
  );

update public.profiles
set
  display_name = 'User A',
  bio = 'Seed traveler A — Bangkok & Tokyo notes.',
  updated_at = now()
where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

update public.profiles
set
  display_name = 'User B',
  bio = 'Seed traveler B — Seoul weekend.',
  updated_at = now()
where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

-- ---------------------------------------------------------------------------
-- Trips
-- A1 private upcoming | A2 public active | A3 private ended
-- B1 private active | B2 public ended
-- ---------------------------------------------------------------------------

insert into public.trips (
  id, user_id, name, start_date, end_date, main_image,
  visibility, travel_status, created_at
) values
  (
    '11111111-1111-4111-8111-111111111101',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Bangkok Planning (Private)',
    '2026-11-02',
    '2026-11-09',
    null,
    'private',
    'upcoming',
    '2026-09-01 08:00:00+00'
  ),
  (
    '11111111-1111-4111-8111-111111111102',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Tokyo Public Shopping Record',
    '2025-01-10',
    '2025-01-18',
    null,
    'public',
    'active',
    '2025-01-19 09:30:00+00'
  ),
  (
    '11111111-1111-4111-8111-111111111103',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Osaka Ended Archive',
    '2024-06-01',
    '2024-06-05',
    null,
    'private',
    'ended',
    '2024-06-06 11:00:00+00'
  ),
  (
    '11111111-1111-4111-8111-111111111201',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Seoul Private Trip',
    '2025-03-14',
    '2025-03-17',
    null,
    'private',
    'active',
    '2025-03-18 11:00:00+00'
  ),
  (
    '11111111-1111-4111-8111-111111111202',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Busan Public Trip',
    '2024-09-01',
    '2024-09-04',
    null,
    'public',
    'ended',
    '2024-09-05 10:00:00+00'
  );

-- ---------------------------------------------------------------------------
-- Items (never private trip + public item)
-- ---------------------------------------------------------------------------

insert into public.items (
  id, trip_id, name, price, currency, location, purchase_date,
  category, image, note, visibility, created_at
) values
  -- A private upcoming: private items only
  (
    '22222222-2222-4222-8222-222222222201',
    '11111111-1111-4111-8111-111111111101',
    'Wishlist Sunscreen Note',
    0.00,
    'THB',
    'TBD Siam',
    '2026-11-03',
    'beauty',
    null,
    'Private planning item.',
    'private',
    '2026-09-01 09:00:00+00'
  ),
  -- A public active: public + private items
  (
    '22222222-2222-4222-8222-222222222202',
    '11111111-1111-4111-8111-111111111102',
    'Shiseido Elixir',
    5500.00,
    'JPY',
    'Isetan Shinjuku',
    '2025-01-12',
    'beauty',
    null,
    'Public purchase record.',
    'public',
    '2025-01-12 10:00:00+00'
  ),
  (
    '22222222-2222-4222-8222-222222222203',
    '11111111-1111-4111-8111-111111111102',
    'Private Gift Snack',
    800.00,
    'JPY',
    'Tokyo Station',
    '2025-01-14',
    'food',
    null,
    'Private item on public trip.',
    'private',
    '2025-01-14 11:00:00+00'
  ),
  -- A private ended
  (
    '22222222-2222-4222-8222-222222222204',
    '11111111-1111-4111-8111-111111111103',
    'Osaka Takoyaki',
    600.00,
    'JPY',
    'Dotonbori',
    '2024-06-02',
    'food',
    null,
    null,
    'private',
    '2024-06-02 12:00:00+00'
  ),
  -- B private
  (
    '22222222-2222-4222-8222-222222222301',
    '11111111-1111-4111-8111-111111111201',
    'Private Seoul Cream',
    28000.00,
    'KRW',
    'Myungdong',
    '2025-03-15',
    'beauty',
    null,
    null,
    'private',
    '2025-03-15 10:00:00+00'
  ),
  -- B public
  (
    '22222222-2222-4222-8222-222222222302',
    '11111111-1111-4111-8111-111111111202',
    'Busan Fish Cake',
    4000.00,
    'KRW',
    'Jagalchi Market',
    '2024-09-02',
    'food',
    null,
    'Public Busan snack.',
    'public',
    '2024-09-02 13:00:00+00'
  );
