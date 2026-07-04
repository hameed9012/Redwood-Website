# Redwood Peak — Phase 3: Public Sections + The Dive — Design Spec

**Date:** 2026-07-04
**Status:** Draft — pending approval before planning.
**Scope:** Phase 3 of 7. Builds on the Phase 1 surface hero and the Phase 2 puzzle. Includes the
submerged view + scroll-dive **deferred from Phase 1 R2** (spec §11–§12 forward references). Phases
4–7 out of scope except seams.

---

## 1. Context & Goals

Below the hero, the public site begins — but it must NOT read like scrolling a normal website. The
standing art direction: **scrolling down is descending into the water.** The camera dives from the
top-down surface into the side-on submerged deep, and the public sections (history, services, media,
contact) are revealed as you sink past them — paperwork drifting down through a flooded facility.

**Standing design filter:** does this section's reveal make the descent feel more alive? A generic
fade/slide that could belong to any website gets pushed toward sinking-deeper instead.

### Success criteria
- Scrolling past the hero performs a coherent **dive**: camera descends and pitches from top-down to
  side-on; the deep is genuinely deep and wide (fog recession, peripheral content).
- The submerged view contains **fish**, **rare bottles** (a fraction of surface density), and — subtle,
  non-focal — **a few coffins on the bottom**, plus the looming logo near the bed.
- **History** types itself out (typewriter) the first time it scrolls into view.
- **Services** (Pharmaceutical Supply / Logistics / Camping Equipment) scale-expand from compact cards
  on scroll; each footed with an italic "Wholesale and contract inquiries only."
- **Media carousel** auto-advances, pauses fully while hovered anywhere on the slide; 2 slides carry a
  thin black **redaction bar** over part of a sentence (legible if you look closely).
- **Contact form** (Discord username + inquiry text) shows a fake reference number ("Inquiry
  #RW-XXXXX logged") on submit and **stores the row in Supabase** — no handling logic beyond storage.
- The puzzle/drain/login flow from Phase 2 keeps working unchanged.
- `npm run build` zero errors; PEAK contract green; v0.3.0 changelog in the deadpan voice.

---

## 2. Architecture — one canvas, page-length dive

The single R3F canvas stops being hero-only and becomes the **page background**: `position: fixed`,
full viewport, behind everything (the hero overlay, then the sections). The page gains real scroll
height (hero 100svh + a dive region + the sections). A GSAP **ScrollTrigger** timeline maps scroll
progress to:

1. **Camera path** — from the top-down surface pose (0,16,~0 looking down) descending below the
   surface and pitching to a side-on submerged pose (~0,-8,14 looking into the deep, classic z-depth).
2. **World cross-fade** — surface population (floaters, open bottles, tanker) thins out as depth
   grows; the deep population (fish, rare bottles, coffins, bed + sunken logo) fades/animates in.
3. **Water surface from below** — passing through the plane, the surface is seen from underneath
  (its material is double-sided with a darker underside tint); fog shifts to the deep recession.
4. **Section reveals** — DOM sections are positioned in the scroll flow OVER the fixed canvas; each
   reveals as the camera sinks past its depth (reveal styles below).

**Puzzle compatibility:** the drag/tray/drain only exist while the hero is in view. The puzzle gate:
drag is enabled only near scroll-top (dive progress ≈ 0); the tray/overlay fade out as the dive
begins. The drain sequence (Phase 2) takes over the camera only from the surface pose — solving is a
surface activity. Scrolled-down visitors scroll back up to play.

```
components/dive/
  useScrollDive.ts        → ScrollTrigger timeline: scroll progress ↦ camera pose + world mix (0..1)
  divePath.ts             → pure: pose(t) = {position, target} camera interpolation (unit-testable)
components/deep/
  DeepWorld.tsx           → group: fish, rare deep bottles, coffins, bed, sunken logo re-parent
  Fish.tsx                → procedural fish (simple body+tail), wander/schooling drift
  Coffins.tsx             → a few box-lid silhouettes resting on the bed; dim, non-focal
components/sections/
  HistorySection.tsx      → typewriter-on-first-view company history
  useTypeOnView.ts        → IntersectionObserver + the existing typewriter step logic (reuse)
  ServicesSection.tsx     → 3 tiles, scroll-triggered scale-expand, italic B2B footer
  MediaCarousel.tsx       → auto-advancing slides, pause-on-hover, redaction bars on 2 slides
  ContactSection.tsx      → Discord username + message; fake ref number; Supabase insert
lib/supabase.ts           → browser client (anon key) — first Supabase touch in the project
app/page.tsx              → hero + dive spacer + sections composition
```

---

## 3. The dive (deferred Phase 1 §11–§12, now built)

- `divePath.ts` (pure, tested): given progress `t ∈ [0,1]`, returns camera position/target
  interpolating surface pose → submerged pose along a curve (ease the pitch so the horizon rolls in
  naturally). The camera-breathing idle layers on top at low amplitude.
- `useScrollDive` drives it with ScrollTrigger scrub (no pinning needed — the canvas is fixed; the
  scroll region provides the distance), and exposes `diveProgress` (a ref) to the scene.
- Freeze interaction: the Phase 2 freeze flag stops the dive camera too (drain owns the camera).
- The surface world thins with depth: floaters/tanker/open-bottles fade opacity + stop rendering
  below a threshold; the DeepWorld group fades in. Bubbles persist (they read as rising past you).
- **Fish:** ~6–10 simple procedural fish (flattened capsule + tail fin, dark silhouette material)
  wandering horizontally at mid-depth with gentle vertical meander; they avoid nothing, just drift.
- **Coffins:** 3–4 dark boxes, slightly settled/tilted on the bed near the sunken logo; no light
  called to them. Visible if you look. Never centered.
- **Rare deep bottles:** ~15% of surface count, drifting slowly at depth.

## 4. Sections (DOM, over the fixed canvas)

All sections sit in the normal scroll flow with transparent/dark-glass panels over the water. Reveal
styling leans on "surfacing from below": content translates up + un-blurs as it enters, timed against
scroll (not a generic fade-in). Exact copy:

### 4.1 History — typewriter on first view
The provided prose (verbatim, adapted):
> Redwood Peak is a skilled and well-known multi-million dollar medical company, originally founded
> October 5, 2024, and has since expanded into multiple fields — including an official camping
> equipment store located on Valley Drive. We also operate several shell companies specializing in
> other industries. Our core belief is that we should be present in every medical supply chain,
> supporting pharmacies and partner companies so our products reach the people who need them. We give
> back where we can, regularly collaborating with a cleaning company and local law enforcement on
> neighborhood cleanup efforts and community food truck initiatives. We deal exclusively with
> established companies, in large volume, and are open to negotiation on pricing for bulk contracts.

Typed out character-by-character the FIRST time it enters the viewport (IntersectionObserver, once),
reusing the Phase 2 typewriter step logic at a faster cadence. Static afterwards.

### 4.2 Services — three expanding tiles
Pharmaceutical Supply / Logistics ("bulk liquid transport via tanker fleet") / Camping Equipment.
Compact cards that scale-expand to full size on scroll-in (real transform, scrub or once). Each tile:
icon placeholder (Phase 7 icon language), name, 1–2 lines, italic footer: *"Wholesale and contract
inquiries only."*

### 4.3 Media carousel
Horizontal slider: image left (placeholder brand-toned images for now), text right. Auto-advance
~6s; **pause while the cursor is anywhere over the slide**. 4 slides (community cleanup, food-truck
initiative, tanker fleet, Valley Drive store). On the cleanup + tanker slides, one sentence carries a
thin black **redaction bar** (CSS overlay) partially covering it — legible at close inspection.

### 4.4 Contact — the first Supabase touch
Minimal form: **Discord username** (required) + **message** (optional, short). Submit → insert into
Supabase table `contact_inquiries` → show "Inquiry #RW-XXXXX logged" (fake ref: RW- + 5 random
alphanumerics, generated client-side, stored with the row). No processing/handling logic. Errors
degrade gracefully (still show the ref number; log the failure) so the theatre never breaks.

**Supabase setup (external dependency):**
- The user creates a Supabase project (their account) and provides `NEXT_PUBLIC_SUPABASE_URL` +
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` (gitignored).
- We ship `supabase/schema.sql`: `contact_inquiries(id uuid pk default, discord_username text not
  null, message text, reference text not null, created_at timestamptz default now())` with RLS ON,
  anon **INSERT-only** policy (no select/update/delete for anon).
- `lib/supabase.ts` creates the browser client lazily; if env vars are absent, the form still works
  visually (ref number shown, row silently skipped) so dev without creds isn't blocked.

## 5. Explicitly NOT in Phase 3
- Auth/tiers/portal (Phases 4–6). The `/login` stub stays a stub.
- Real media assets (placeholder images now; swap later like the GLBs).
- Any handling/notification logic for contact submissions (storage only).

## 6. Verification
- `npm run build` zero errors; full suite + PEAK contract green; Leva stripped.
- `divePath` unit-tested (poses at t=0/0.5/1, monotonic descent); fake-ref generator tested
  (RW-XXXXX shape); typewriter-on-view logic reuses tested step function.
- Browser smoke: scroll = dive (surface → deep, fish/coffins/rare bottles appear); sections reveal
  as specced (history types once; services expand; carousel advances + pauses on hover + redactions
  visible); contact submit shows ref number (and inserts when env present); scroll back up → puzzle
  still fully playable; solve → drain → login unaffected.
- v0.3.0 changelog in the deadpan voice.

## 7. Open questions (need your call at review)
1. **Supabase now or shim?** Do you have/want to create the Supabase project now (you'd paste the two
   env values into `.env.local`)? If not, we build against the graceful no-env shim and wire real
   creds when you have them — zero code change later.
2. **Dive length:** how long should the dive take (scroll distance between hero and first section)?
   Baseline: ~1.5 viewport-heights of scroll for the full surface→deep transition.
```
