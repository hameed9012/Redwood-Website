-- Redwood Peak — contact inquiries (Phase 3).
-- Run this once in the Supabase SQL editor after creating your project, then put
--   NEXT_PUBLIC_SUPABASE_URL=...
--   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
-- into .env.local (gitignored). Until then the form runs in visual-only mode.

create extension if not exists "pgcrypto";

create table if not exists public.contact_inquiries (
  id               uuid primary key default gen_random_uuid(),
  discord_username text not null,
  message          text,
  reference        text not null,
  created_at       timestamptz not null default now()
);

-- RLS on, and the anon (public) key may ONLY insert — no read/update/delete.
-- Submissions can be written by the site but never listed back by the browser.
alter table public.contact_inquiries enable row level security;

drop policy if exists "anon can insert inquiries" on public.contact_inquiries;
create policy "anon can insert inquiries"
  on public.contact_inquiries
  for insert
  to anon
  with check (true);
