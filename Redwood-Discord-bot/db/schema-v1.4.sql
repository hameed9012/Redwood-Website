-- Redwood Peak bot v1.4 — run once in Supabase (after schema-v1.1.sql).
alter table public.identities drop constraint if exists identities_status_check;
alter table public.identities add constraint identities_status_check check (status in ('active','retired','burned'));

create table if not exists public.reputation (
  id          uuid primary key default gen_random_uuid(),
  identity_id uuid not null references public.identities(id),
  discord_id  text not null references public.members(discord_id),
  kind        text not null check (kind in ('commendation','writeup')),
  reason      text not null,
  issued_by   text not null,
  created_at  timestamptz not null default now()
);

alter table public.reputation enable row level security;
