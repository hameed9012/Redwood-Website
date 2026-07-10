-- Redwood Peak bot v1 — run once in the Supabase SQL editor.
create extension if not exists "pgcrypto";

create table if not exists public.members (
  discord_id    text primary key,
  employee_name text not null,
  rank          text not null check (rank in ('trainee','employee','supervisor','high-command')),
  divisions     text[] not null default '{}',
  positions     text[] not null default '{}',
  status        text not null default 'active' check (status in ('active','dismissed')),
  joined_at     timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.roster_events (
  id                uuid primary key default gen_random_uuid(),
  actor_discord_id  text not null,
  target_discord_id text not null,
  action            text not null,
  detail            text,
  at                timestamptz not null default now()
);

create table if not exists public.roster_config (
  guild_id   text primary key,
  channel_id text,
  message_id text
);

create table if not exists public.security_config (
  guild_id             text primary key,
  lockdown             boolean not null default false,
  deadman_deadline     timestamptz,
  raid_join_threshold  int not null default 5,
  raid_window_seconds  int not null default 10,
  spam_msg_threshold   int not null default 6,
  spam_window_seconds  int not null default 5,
  min_account_age_days int not null default 7
);

-- Bot uses the SERVICE ROLE key (bypasses RLS). Enable RLS with NO anon policies
-- so the public/browser key can never read or write these tables.
alter table public.members         enable row level security;
alter table public.roster_events   enable row level security;
alter table public.roster_config   enable row level security;
alter table public.security_config enable row level security;
