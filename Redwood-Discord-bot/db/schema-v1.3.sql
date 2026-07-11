-- Redwood Peak bot v1.3 — run once in Supabase (after schema-v1.1.sql).
create table if not exists public.firearms (
  id          uuid primary key default gen_random_uuid(),
  serial      text not null unique,
  kind        text not null,
  identity_id uuid references public.identities(id),
  discord_id  text not null references public.members(discord_id),
  status      text not null default 'clean' check (status in ('clean','flagged')),
  flag_note   text,
  issued_at   timestamptz not null default now()
);

create table if not exists public.vehicles (
  id          uuid primary key default gen_random_uuid(),
  plate       text not null unique,
  description text not null,
  identity_id uuid references public.identities(id),
  discord_id  text not null references public.members(discord_id),
  status      text not null default 'clean' check (status in ('clean','flagged')),
  flag_note   text,
  issued_at   timestamptz not null default now()
);

alter table public.firearms enable row level security;
alter table public.vehicles enable row level security;
