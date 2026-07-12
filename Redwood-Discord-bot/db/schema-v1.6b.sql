-- Redwood Peak bot v1.6b — run once in Supabase.
create sequence if not exists public.order_seq;

create table if not exists public.orders (
  id          uuid primary key default gen_random_uuid(),
  seq         bigint not null default nextval('public.order_seq'),
  customer_id text not null,
  thread_id   text not null,
  status      text not null default 'open'
              check (status in ('open','claimed','fulfilled','done','cancelled')),
  claimed_by  text,
  amount      integer check (amount is null or amount > 0),
  summary     text not null default '',
  created_at  timestamptz not null default now(),
  claimed_at  timestamptz,
  done_at     timestamptz
);

alter table public.orders enable row level security;  -- service key only, like the rest
