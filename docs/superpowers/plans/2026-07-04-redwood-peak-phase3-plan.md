# Redwood Peak — Phase 3 Implementation Plan

**Spec:** [2026-07-04-redwood-peak-phase3-sections-design.md](../specs/2026-07-04-redwood-peak-phase3-sections-design.md) (Approved)
**Branch:** `staging` (never push; never touch `main`).
**Build rule:** `next build` one at a time, foreground, `timeout 300`. PEAK contract test stays green.
**Method:** subagent-driven, fresh subagent per task; TDD for pure logic; review gates at ★.

Order is dependency-sorted. Each task is independently committable on `staging`.

---

### Foundations (pure, tested — no canvas)
- **P3-1 — `divePath.ts` (pure + tested).** `divePose(t: number): { position:[x,y,z]; target:[x,y,z] }`
  interpolating surface pose `(0,16,0)→look-down` to submerged pose `(0,-8,14)→look-into-deep` along an
  eased curve (pitch eased separately so the horizon rolls in). Tests: t=0/0.5/1 poses, monotonic
  descent (y strictly decreasing), target continuity. No R3F import.
- **P3-2 — fake reference generator (pure + tested).** `makeInquiryRef(): string` → `RW-` + 5 uppercase
  alphanumerics. Tests: shape `/^RW-[A-Z0-9]{5}$/`, uniqueness across N calls (statistical).
- **P3-3 — `useTypeOnView` hook + tested step reuse.** IntersectionObserver-once gate wrapping the
  existing typewriter step logic (extract the pure step fn if not already pure; test it directly).

### The dive (canvas becomes page background)
- **P3-4 — canvas → fixed full-page background.** Lift `<TankScene>` canvas to `position:fixed inset-0
  -z-10`; page gains scroll height (hero 100svh + ~2.2vh dive region + sections spacer). Hero overlay
  and sections scroll OVER it. Verify puzzle still works at scroll-top; tray/overlay unchanged.
- **P3-5 — `useScrollDive` + `divePath` wired to camera.** GSAP ScrollTrigger scrub over the dive
  region → `divePose(progress)` drives camera; expose `diveProgressRef`. Respect the freeze flag
  (drain owns the camera — dive yields while frozen). ★ review (camera math + freeze interaction).
- **P3-6 — surface world thins with depth.** Floaters / open bottles / tanker fade opacity and stop
  updating below a depth threshold driven by `diveProgressRef`; bubbles persist. Water surface
  material double-sided w/ darker underside tint for the pass-through.
- **P3-7 — `DeepWorld` group: fish.** `Fish.tsx` procedural (flattened capsule + tail fin, dark
  silhouette), ~6–10 instances wandering horizontally w/ vertical meander; fade in with depth.
- **P3-8 — `DeepWorld`: rare bottles + coffins + sunken logo.** ~15% surface-density drifting bottles;
  3–4 dim tilted coffins settled on the bed near the logo (never centered, no dedicated light);
  re-parent/echo the background logo near the bed. ★ review (deep-scene composition + perf under prod).

### Public sections (DOM over canvas)
- **P3-9 — section shell + reveal style.** Shared `Section` wrapper: dark-glass panel, "surfacing from
  below" reveal (translateY + un-blur timed to scroll-in, not a generic fade). Page composition slots.
- **P3-10 — History (typewriter-on-first-view).** Verbatim spec §4.1 prose; types once via
  `useTypeOnView`; static after. Faster cadence than hero.
- **P3-11 — Services (3 expanding tiles).** Pharma Supply / Logistics / Camping Equipment; compact→full
  scale-expand on scroll-in; icon placeholder; italic footer *"Wholesale and contract inquiries only."*
- **P3-12 — Media carousel.** 4 slides, auto-advance ~6s, **pause while hovered anywhere on the slide**;
  redaction bars (thin black CSS overlay, legible up close) on the cleanup + tanker slides. Placeholder
  brand-toned images.
- **P3-13 — `lib/supabase.ts` shim + `supabase/schema.sql`.** Lazy browser client; no-env → visual-only
  (skip write). Schema: `contact_inquiries(id, discord_username not null, message, reference not null,
  created_at)`, RLS on, anon INSERT-only policy. Document the `.env.local` wire-up in README.
- **P3-14 — Contact section.** Discord username (required) + message (optional); submit →
  `makeInquiryRef()` → insert (or skip) → show "Inquiry #RW-XXXXX logged". Errors degrade gracefully
  (ref still shown). ★ review (graceful-degradation + no PII in URLs).

### Gate
- **P3-15 — full verification gate.** `npm run build` zero errors; full suite + PEAK contract green;
  Leva stripped; browser smoke of the whole spec §6 checklist (dive, all sections, contact ref, scroll
  back up → puzzle→drain→login intact).
- **P3-16 — changelog v0.3.0** in the deadpan voice + no-push handoff.

---

**Open seams for later phases (not built now):** real media assets (placeholder swap like GLBs);
auth/tiers/portal behind `/login`; contact-handling/notification logic.
