-- Redwood Peak bot v1.1 — run once in the Supabase SQL editor (after v1 schema.sql).
create extension if not exists "pgcrypto";

create table if not exists public.identities (
  id           uuid primary key default gen_random_uuid(),
  discord_id   text not null references public.members(discord_id),
  legal_name   text not null,
  dob          date not null,
  ssn          text not null,
  id_number    text not null,
  blood_type   text not null,
  next_of_kin  text not null,
  issued_at    timestamptz not null default now(),
  status       text not null default 'active' check (status in ('active','retired')),
  retired_at   timestamptz
);
-- At most one active identity per member.
create unique index if not exists identities_one_active
  on public.identities (discord_id) where status = 'active';

create table if not exists public.shifts (
  id               uuid primary key default gen_random_uuid(),
  discord_id       text not null references public.members(discord_id),
  identity_id      uuid references public.identities(id),
  started_at       timestamptz not null default now(),
  ended_at         timestamptz,
  status           text not null default 'open' check (status in ('open','closed')),
  movement_account text
);
-- At most one open shift per member.
create unique index if not exists shifts_one_open
  on public.shifts (discord_id) where status = 'open';

create table if not exists public.incidents (
  id          uuid primary key default gen_random_uuid(),
  shift_id    uuid not null references public.shifts(id),
  discord_id  text not null,
  summary     text not null,
  location    text not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.incident_parties (
  id           uuid primary key default gen_random_uuid(),
  incident_id  uuid not null references public.incidents(id),
  role         text not null check (role in ('civilian','officer','witness','other')),
  name         text,
  cover_name   text,
  plate        text,
  badge        text,
  unit         text
);

create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  shift_id    uuid not null references public.shifts(id),
  discord_id  text not null,
  subject     text not null,
  body        text not null,
  created_at  timestamptz not null default now()
);

-- Bot uses the SERVICE ROLE key (bypasses RLS). Website reads server-side, also
-- with the service key. Enable RLS with NO anon policies so the public key can
-- never touch these tables.
alter table public.identities       enable row level security;
alter table public.shifts           enable row level security;
alter table public.incidents        enable row level security;
alter table public.incident_parties enable row level security;
alter table public.reports          enable row level security;
