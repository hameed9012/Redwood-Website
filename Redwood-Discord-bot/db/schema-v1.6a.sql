-- Redwood Peak bot v1.6a — run once in Supabase.
create table if not exists public.ledger_entries (
  id         uuid primary key default gen_random_uuid(),
  amount     int not null check (amount > 0),
  direction  text not null check (direction in ('inflow','outflow')),
  book       text not null check (book in ('white','black')),
  reason     text not null,
  source     text not null default 'manual',
  created_by text not null,
  created_at timestamptz not null default now()
);

alter table public.ledger_entries enable row level security;
