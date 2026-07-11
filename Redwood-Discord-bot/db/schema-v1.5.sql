-- Redwood Peak bot v1.5 — run once in Supabase.
-- ALSO create a PUBLIC Storage bucket named "carousel" in the Supabase console.
create table if not exists public.carousel_slides (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text not null,
  image_url  text not null,
  sort_order int not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.carousel_slides enable row level security;

-- Public marketing content: anyone may read active slides (the bot still writes via the service key).
drop policy if exists carousel_public_read on public.carousel_slides;
create policy carousel_public_read on public.carousel_slides
  for select to anon, authenticated using (active = true);
