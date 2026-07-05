# Redwood Peak — Phase 2: The PEAK Puzzle — Design Spec

**Date:** 2026-07-01
**Status:** Draft — pending approval before planning.
**Scope:** Phase 2 of 7. Builds on the Phase 1 hero (top-down water tank). Phases 3–7 are out of scope
except where Phase 2 must leave seams (notably: it routes to the Phase 4 login, which does not exist yet).

---

## 1. Context & Goals

Four of the floating bottles are secretly the **PEAK** bottles. A visitor who hovers them reads their
labels (Propofol / Etomidate / Atropine / Ketamine), realizes they spell **P-E-A-K**, and drags them into a
tray in the correct order. Getting it right doesn't feel like "you solved a puzzle" — it feels like the
visitor **found something they weren't meant to**: everything freezes, the tank drains out from under them,
and the screen falls into a loading sequence that routes them to the employee login.

**Fixed pairings (from Phase 1, unchanged):** P=Propofol, E=Etomidate, A=Atropine, K=Ketamine. The four are
already tagged + queryable via the `PeakRegistry` (Phase 1 §8) — Phase 2 consumes that, it does not re-tag.

**Discovery, not signposting:** the four PEAK bottles are **not** visually marked as special. They drift in
the field like everything else; the only tell is the hover-to-read label (Phase 1). The visitor discovers
the mechanic by reading labels and trying.

### Success criteria
- The four PEAK bottles are individually **draggable** (raycast pointer drag in the R3F scene) into a tray.
- Correct P-E-A-K order → the **drain sequence**, then the **loading sequence**, then a route to `/login`.
- Wrong order → after a few seconds the misplaced bottles **drift back** into the field, **no error text**.
- Near-miss (exactly 3 of 4 correct) → a **faint, brief flicker** in the background logo.
- A **session flag** means a reload in the same session skips straight past the puzzle; a brand-new session
  gets the full experience.
- `npm run build` passes with zero errors; the PEAK tagging contract test still passes; a `v0.2.0` changelog
  entry is produced in Redwood's deadpan voice.

---

## 2. Decisions to confirm (the genuinely open ones)

1. **Login route target.** Phase 4 (the real login) isn't built. On success the loading sequence routes to
   **`/login`** — Phase 2 ships a **minimal placeholder** `/login` page (a styled "Employee Access" stub
   reading e.g. "Secret name —" with a disabled field and an "issued out-of-band" note) so the flow lands
   somewhere intentional. Phase 4 replaces it. *(Recommended; flag if you'd rather route elsewhere.)*
2. **Tray = ordered slots.** The tray has **four ordered slots** left→right. A bottle dragged onto a slot
   occupies it; order is the slot order. Correct = slot1 Propofol, slot2 Etomidate, slot3 Atropine, slot4
   Ketamine. Any non-PEAK bottle can't be grabbed (only the 4 registered PEAK bottles are draggable).
   *(Recommended over "drop anywhere + parse spelling" — clearer + matches "in the correct order".)*

Everything below assumes these two. If you change them, the spec adjusts.

---

## 3. Architecture overview

Phase 2 adds an **imperative puzzle controller** (refs + a small event surface, not heavy React state — drag
updates every pointermove and must not thrash React renders), plus a DOM **tray overlay**, a **drain**
controller in the scene, and a **loading** route-transition. New pieces:

```
components/hero/puzzle/
  PuzzleProvider.tsx      → context: puzzle phase state machine + the grab/drop API (refs)
  usePuzzleState.ts       → 'idle' | 'dragging' | 'checking' | 'near-miss' | 'solved'
  useBottleDrag.ts        → raycast grab on the 4 PEAK bottles; follow cursor on the water plane; drop
  Tray.tsx                → DOM overlay: 4 slot targets bottom-centre; highlights on hover-while-dragging
  trayGeometry.ts         → maps the 4 DOM slot rects ↔ world XZ drop points (screen↔scene)
  order.ts                → pure: given the 4 slotted letters, is it solved? is it a 3/4 near-miss?
  DrainSequence.tsx       → freezes the scene, swallows the logo, drains the water down + camera descends
  useFreeze.ts            → a scene-wide "frozen" flag the floaters/waves/bubbles honour
components/loading/
  LoadingScreen.tsx       → full-screen spinner + rotating fun-facts; randomized duration; routes on done
  funFacts.ts             → 15–20 chemistry/physics facts + the seeded "Poisoning the river." (1-in-12)
lib/session.ts            → sessionStorage flag: hasSolvedThisSession()
app/login/page.tsx        → Phase-2 placeholder login stub (Phase 4 replaces)
```

The PEAK bottles' free-floating (Phase 1) is **paused per-bottle while grabbed** and **scene-wide while
draining**. The `PeakRegistry` already exposes the four `Object3D`s; the drag hook raycasts those.

---

## 4. The drag mechanic — `useBottleDrag.ts` / `Tray.tsx`

- **Grab:** on `pointerdown`, raycast the four PEAK bottle objects (from the registry). If one is hit, it's
  **grabbed**: its floater is suspended (it stops drifting) and it now follows the cursor.
- **Move:** on `pointermove`, raycast the **water plane** (reuse the Phase-1 plane-raycast math) to get the
  world XZ under the cursor; the grabbed bottle eases toward that point (kept in the 3D scene, near the
  surface), so it reads as lifting a bottle through the water toward the tray. A faint **drip** (a few
  falling points) trails the grabbed bottle as it's lifted clear — the "fishing" cue from Phase 1 §7.3.
- **Drop:** on `pointerup`, if the cursor is over a tray slot, the bottle **snaps into that slot** (a fixed
  world position mapped from the slot's DOM rect) and the slot records its letter. Otherwise the bottle is
  **released** back into the floating field (resumes drifting from where it was let go).
- Only the 4 PEAK bottles are grabbable; field/open bottles ignore the drag entirely.
- Touch parity: pointer events cover touch, so the same drag works on mobile (Phase 7 confirms feel).

## 5. The tray + order check — `Tray.tsx` / `order.ts`

- DOM tray, bottom-centre, **four labelled-by-position slots** (no letters shown — discovery). While
  dragging, the slot under the cursor highlights.
- Each filled slot holds one letter. `order.ts` (pure, unit-tested):
  - `isSolved(slots)` → all four present **and** in P-E-A-K order.
  - `nearMissCount(slots)` → how many slots hold the correct letter for their position (3 ⇒ near-miss).
- **All four slots filled** triggers a check:
  - **Solved** → §6 drain.
  - **3/4 correct** → §5.1 near-miss flicker, then the wrong one(s) drift back after a beat.
  - **Otherwise** → after ~2–3 s the misplaced bottles drift back into the field, slots clear, **no error
    text**. The visitor figures it out.

### 5.1 Near-miss feedback
Exactly 3 of 4 slots correct (regardless of which is wrong) → a **very faint, brief flicker** driven through
the **addressable background-logo layer** (Phase 1 §6.10 left it named/addressable for exactly this). No
text, no sound — just a flicker an attentive visitor senses.

## 6. The drain sequence — `DrainSequence.tsx` / `useFreeze.ts`

On solve, **before** any loading UI:
1. **Everything freezes** — floaters, waves, bubbles, caustics, the light sweep — all stop dead via a
   scene-wide `frozen` flag honoured in their `useFrame`s.
2. **~0.7 s of silence** — if ambient audio was on, cut it immediately.
3. The **mountain/logo is swallowed by darkness** (the background-logo layer fades to black).
4. The **water drains downward** — the surface + frozen objects descend, and the **camera falls with it**
   (descends, so it reads as the tank emptying out from underneath the visitor), GSAP-choreographed.
5. Only when the drain finishes does the screen **fade to black** → the loading sequence (§7).

Intent: "you found something you weren't meant to," not a tidy "puzzle solved" confirmation.

## 7. The loading sequence — `components/loading/LoadingScreen.tsx` / `funFacts.ts`

- Full-screen: the **Redwood Peak logo spinning** + a pool of **15–20 short chemistry/physics fun facts**
  beneath it, changing **every 1–2 s**.
- Seed **"Poisoning the river."** into the pool at **~1-in-12** per loading run (not guaranteed, not rare).
- **Randomized total duration 2.5–4.5 s** per run.
- On completion → route to **`/login`** (§2).

## 8. Session flag — `lib/session.ts`

- On solve, set a `sessionStorage` flag (`rw_solved`). On load, if set, the hero **skips the puzzle gate**
  (the bottles still float, but solving/draining isn't re-triggered into the loading flow — or, simpler: the
  hero just doesn't force the sequence again; the visitor can still re-solve if they want, but a reload
  doesn't replay the drain/loading automatically). A **new tab/session** (no flag) gets the full experience.
- `sessionStorage` (not `localStorage`) so a brand-new session resets it, per the brief.

## 9. Placeholder login — `app/login/page.tsx`

A minimal, on-brand stub so the success flow lands somewhere: a dark "Employee Access" panel, a **"Secret
name"** field (disabled / "credentials issued out-of-band"), the brand mark, and a quiet line of flavor.
**No auth, no tiers, no DB** — that's Phase 4. This page exists only so the route resolves.

## 10. Explicitly NOT in Phase 2

- Real authentication, account tiers, the rejection messages, the High-Command flash — all **Phase 4**.
- Any employee-portal content — **Phase 5**.
- Supabase is **not** touched in Phase 2 (the puzzle is client-only; the session flag is `sessionStorage`).

## 11. Verification

- `npm run build` zero errors; full test suite green; **PEAK tagging contract still passes**.
- Unit tests (pure logic): `order.ts` (`isSolved`, `nearMissCount`), the fun-fact pool + the ~1-in-12
  seeding (injected RNG), the session flag, loading-duration randomization (injected RNG).
- Real-browser smoke check: hover reveals labels → drag the 4 PEAK bottles into slots → wrong order drifts
  back with no error → 3/4 flickers the logo → correct order freezes + drains + descends → loading with
  rotating facts (and "Poisoning the river." appears across enough reloads) → routes to `/login` →
  reload-in-session skips the forced sequence.

## 12. Deliverable: changelog

`v0.2.0 — The Vault Drains` (or similar) in Redwood's deadpan faux-corporate/sinister voice — same
structural pattern as v0.1.x.

## 13. Open items / dependencies

- **Phase 4 login** replaces the §9 stub later.
- Real GLB bottle models (still in development) drop into the existing swap-seam; the drag raycasts the
  registered objects regardless of procedural-vs-GLB, so the puzzle is model-agnostic.
- Drain/loading timings are baselines tuned during the smoke check.
```
