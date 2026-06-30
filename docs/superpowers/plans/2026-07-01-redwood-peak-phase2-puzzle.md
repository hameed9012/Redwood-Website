# Redwood Peak — Phase 2 (The PEAK Puzzle) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make the four PEAK bottles draggable into a four-slot tray; on the correct P-E-A-K order, freeze and drain the tank, run a loading sequence, and route to a placeholder login — with near-miss feedback, no-error wrong-order recovery, and a session flag.

**Architecture:** Builds on the Phase 1 hero. Adds an imperative puzzle layer: a `PuzzleProvider` (context holding refs + a small phase state machine), a raycast `useBottleDrag` over the registered PEAK objects, a DOM `Tray` whose slots map to world drop points, a scene-wide `freeze` flag, a GSAP `DrainSequence`, a full-screen `LoadingScreen`, and an `/login` stub. Pure logic (order check, fun-fact seeding, session flag, durations) is unit-tested; the 3D/DOM integration is verified by a real-browser smoke check. No Supabase. Model-agnostic (drag raycasts the registry's `Object3D`s, procedural or GLB).

**Tech Stack:** existing — Next 14, React 18, R3F v8, drei v9, three 0.185, gsap, Vitest. No new deps.

**Spec:** `docs/superpowers/specs/2026-07-01-redwood-peak-phase2-puzzle-design.md`. Decisions locked: `/login` stub; four ordered slots.

---

## Conventions

- All work on `staging`. Commit after every task. **NEVER `git push`** — the user pushes.
- Builds **one at a time, foreground, hard timeout**: `timeout 220 npm run build 2>&1 | tail -6`. Never background or run concurrent builds.
- Tests: `npx vitest run <path>`. **The PEAK contract test (`components/hero/objects/HeroBottles.test.tsx`) must stay green** — Phase 2 consumes the registry, it must not break tagging.
- Timings/positions are baselines tuned in the smoke check (Task 16). Use the values given.

---

# Milestone A — Pure logic (TDD)

## Task 1: Order check — `order.ts`

**Files:** Create `components/hero/puzzle/order.ts`, `components/hero/puzzle/order.test.ts`.

- [ ] **Step 1: Failing test**
```ts
import { describe, it, expect } from 'vitest';
import { isSolved, nearMissCount, PEAK_ORDER } from './order';

describe('PEAK order', () => {
  it('PEAK_ORDER is P,E,A,K', () => {
    expect(PEAK_ORDER).toEqual(['P', 'E', 'A', 'K']);
  });
  it('isSolved only when all four are in order', () => {
    expect(isSolved(['P', 'E', 'A', 'K'])).toBe(true);
    expect(isSolved(['P', 'E', 'K', 'A'])).toBe(false);
    expect(isSolved(['P', 'E', 'A', null])).toBe(false);
  });
  it('nearMissCount counts correctly-placed letters', () => {
    expect(nearMissCount(['P', 'E', 'A', 'K'])).toBe(4);
    expect(nearMissCount(['P', 'E', 'K', 'A'])).toBe(2);
    expect(nearMissCount(['P', 'E', 'A', 'P'])).toBe(3);
    expect(nearMissCount([null, null, null, null])).toBe(0);
  });
});
```
- [ ] **Step 2: Run → FAIL.** `npx vitest run components/hero/puzzle/order.test.ts`
- [ ] **Step 3: Implement `components/hero/puzzle/order.ts`**
```ts
import type { PeakLetter } from '../peak';

export const PEAK_ORDER: PeakLetter[] = ['P', 'E', 'A', 'K'];

/** slots: the letter in each of the 4 tray slots (null = empty). */
export function nearMissCount(slots: (PeakLetter | null)[]): number {
  return PEAK_ORDER.reduce((n, want, i) => (slots[i] === want ? n + 1 : n), 0);
}

export function isSolved(slots: (PeakLetter | null)[]): boolean {
  return slots.length === 4 && slots.every((s, i) => s === PEAK_ORDER[i]);
}
```
- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: PEAK order + near-miss pure logic"`

## Task 2: Session flag — `lib/session.ts`

**Files:** Create `lib/session.ts`, `lib/session.test.ts`.

- [ ] **Step 1: Failing test**
```ts
import { describe, it, expect } from 'vitest';
import { hasSolvedThisSession, markSolved } from './session';

function fakeStore() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) } as Storage;
}

describe('session flag', () => {
  it('is false until marked, true after', () => {
    const s = fakeStore();
    expect(hasSolvedThisSession(s)).toBe(false);
    markSolved(s);
    expect(hasSolvedThisSession(s)).toBe(true);
  });
});
```
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement `lib/session.ts`**
```ts
'use client';

const KEY = 'rw_solved';

function store(s?: Storage): Storage | null {
  if (s) return s;
  if (typeof window === 'undefined') return null;
  try { return window.sessionStorage; } catch { return null; }
}

export function hasSolvedThisSession(s?: Storage): boolean {
  return store(s)?.getItem(KEY) === '1';
}

export function markSolved(s?: Storage): void {
  store(s)?.setItem(KEY, '1');
}
```
- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `feat: session-scoped solved flag`

## Task 3: Fun facts + seeded "Poisoning the river." — `funFacts.ts`

**Files:** Create `components/loading/funFacts.ts`, `components/loading/funFacts.test.ts`.

- [ ] **Step 1: Failing test**
```ts
import { describe, it, expect } from 'vitest';
import { FACTS, buildFactSequence, POISON_FACT } from './funFacts';

describe('fun facts', () => {
  it('has 15–20 facts and none is the poison line', () => {
    expect(FACTS.length).toBeGreaterThanOrEqual(15);
    expect(FACTS.length).toBeLessThanOrEqual(20);
    expect(FACTS).not.toContain(POISON_FACT);
  });
  it('includes the poison line when the 1-in-12 roll hits', () => {
    const seq = buildFactSequence(8, () => 0); // rng()=0 → roll hits (0 < 1/12)
    expect(seq).toContain(POISON_FACT);
  });
  it('omits the poison line when the roll misses', () => {
    const seq = buildFactSequence(8, () => 0.99); // misses
    expect(seq).not.toContain(POISON_FACT);
  });
});
```
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement `components/loading/funFacts.ts`** — a const array of 16 short, real chemistry/physics facts (write them; keep each one sentence), plus:
```ts
export const POISON_FACT = 'Poisoning the river.';

export function buildFactSequence(count: number, rng: () => number = Math.random): string[] {
  const pool = [...FACTS];
  // ~1-in-12 chance the poison line is seeded into this run.
  const seq: string[] = [];
  const poison = rng() < 1 / 12;
  for (let i = 0; i < count; i++) seq.push(pool[Math.floor(rng() * pool.length)] ?? pool[0]);
  if (poison) seq[Math.floor(rng() * count)] = POISON_FACT;
  return seq;
}
```
(Write `FACTS` with 16 entries, e.g. "Water expands when it freezes." etc. — real, neutral facts.)
- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `feat: loading fun-fact pool with seeded easter-egg line`

## Task 4: Loading duration randomizer — `loadingDuration.ts`

**Files:** Create `components/loading/loadingDuration.ts`, `components/loading/loadingDuration.test.ts`.

- [ ] **Step 1: Failing test**
```ts
import { describe, it, expect } from 'vitest';
import { randomLoadingMs } from './loadingDuration';

describe('randomLoadingMs', () => {
  it('is within 2500–4500ms', () => {
    expect(randomLoadingMs(() => 0)).toBe(2500);
    expect(randomLoadingMs(() => 1)).toBe(4500);
    const v = randomLoadingMs(() => 0.5);
    expect(v).toBeGreaterThanOrEqual(2500);
    expect(v).toBeLessThanOrEqual(4500);
  });
});
```
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement**
```ts
export function randomLoadingMs(rng: () => number = Math.random): number {
  return Math.round(2500 + rng() * 2000);
}
```
- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `feat: randomized loading duration`

---

# Milestone B — Puzzle state, freeze, tray geometry

## Task 5: Puzzle phase reducer — `usePuzzleState.ts`

**Files:** Create `components/hero/puzzle/usePuzzleState.ts`, `components/hero/puzzle/usePuzzleState.test.ts`.

The puzzle phase: `'idle' | 'checking' | 'near-miss' | 'solved'`. A pure reducer is tested; the hook wraps it.

- [ ] **Step 1: Failing test**
```ts
import { describe, it, expect } from 'vitest';
import { puzzleReducer, type PuzzlePhase } from './usePuzzleState';

describe('puzzleReducer', () => {
  it('all-correct → solved', () => {
    expect(puzzleReducer('idle', { type: 'checked', solved: true, nearMiss: false })).toBe('solved');
  });
  it('3/4 → near-miss then back to idle on reset', () => {
    const s: PuzzlePhase = puzzleReducer('idle', { type: 'checked', solved: false, nearMiss: true });
    expect(s).toBe('near-miss');
    expect(puzzleReducer(s, { type: 'reset' })).toBe('idle');
  });
  it('solved is terminal', () => {
    expect(puzzleReducer('solved', { type: 'reset' })).toBe('solved');
  });
});
```
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement** — `PuzzlePhase`, `PuzzleAction` (`{type:'checked',solved,nearMiss}` | `{type:'reset'}`), `puzzleReducer` (solved terminal; checked→solved/near-miss/idle; reset→idle unless solved), and a thin `usePuzzleState()` hook using `useReducer`.
- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `feat: puzzle phase reducer`

## Task 6: Scene-wide freeze flag — `useFreeze.ts`

**Files:** Create `components/hero/puzzle/useFreeze.ts`. Modify the floater consumers (`FieldObjects`, `OpenBottle`, `HeroBottle`), `Bubbles`, `WaterSurface`, `CausticsPlane`, `TankScene` light sweep, `useCameraBreathing` to honour it.

- [ ] **Step 1:** Create a `FreezeContext` (a `MutableRefObject<boolean>`, default `{current:false}`) + `useFreeze()` returning the ref, and a `FreezeProvider`. Using a **ref** (not state) so flipping freeze doesn't re-render the scene.
- [ ] **Step 2:** In each animating `useFrame` (FieldObjects, OpenBottle, HeroBottle, Bubbles, WaterSurface uTime, CausticsPlane uTime, the TankScene light sweep, useCameraBreathing), early-`return` when `freeze.current === true`. (Read the ref via `useFreeze()`.) The DrainSequence drives the freeze.
- [ ] **Step 3:** Wrap `TankScene` content in the `FreezeProvider` (or provide at `HeroTank`). Confirm `npx vitest run` (render-smokes unaffected — freeze defaults false) and `timeout 220 npm run build` pass.
- [ ] **Step 4: Commit** — `feat: scene-wide freeze flag honoured by all animation`

## Task 7: Tray slot ↔ world mapping — `trayGeometry.ts`

**Files:** Create `components/hero/puzzle/trayGeometry.ts`, `components/hero/puzzle/trayGeometry.test.ts`.

- [ ] **Step 1: Failing test** (pure parts)
```ts
import { describe, it, expect } from 'vitest';
import { slotWorldPosition, SLOT_COUNT } from './trayGeometry';

describe('tray geometry', () => {
  it('has 4 slots spread left→right at the front of the water', () => {
    expect(SLOT_COUNT).toBe(4);
    const p0 = slotWorldPosition(0);
    const p3 = slotWorldPosition(3);
    expect(p0[0]).toBeLessThan(p3[0]); // slot 0 left of slot 3
    expect(p0[1]).toBeCloseTo(p3[1], 5); // same height
  });
});
```
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement** — `SLOT_COUNT = 4`; `slotWorldPosition(i)` returns a `[x,y,z]` spreading the 4 slots across the front-centre of the water (e.g. x = (i - 1.5) * 2.4, y = 0.4, z = 7) so a bottle snapped into slot i sits in a neat row near the camera-bottom. Also export `screenSlotIndex(clientX, clientY, rects)` — given the 4 slot DOM rects, which slot (or -1) the pointer is over (pure, given rects).
- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `feat: tray slot↔world geometry`

---

# Milestone C — Drag, tray, wiring

## Task 8: Tray overlay — `Tray.tsx`

**Files:** Create `components/hero/puzzle/Tray.tsx`. (Replaces the Phase-1 static "DROP TRAY" slot in `HeroOverlay`.)

- [ ] **Step 1:** Build a DOM tray, bottom-centre, with **4 slot divs** (dashed, brand styling). Expose each slot's `getBoundingClientRect` via refs (a `slotsRef` the drag hook reads). While `dragging`, the slot under the cursor gets a highlight class. Filled slots show a small filled state (a dot/letter-less marker). Accept a `slots` prop (the 4 letters/null) + a `highlightIndex`.
- [ ] **Step 2:** In `HeroOverlay`, replace the static tray markup with `<Tray .../>`. Render-smoke isn't required (DOM); confirm build + a testing-library test that 4 slots render.
- [ ] **Step 3: Commit** — `feat: four-slot drop tray overlay`

## Task 9: Bottle drag — `useBottleDrag.ts`

**Files:** Create `components/hero/puzzle/useBottleDrag.ts`. Modify `HeroBottle.tsx` (suspend the floater while grabbed) and the `PuzzleProvider` wiring (Task 10).

Blueprint (implement against this):
- A hook used inside the Canvas. Holds: `grabbed` (the PeakLetter currently held, or null), and a per-letter "suspended" flag the HeroBottle floater honours (when suspended, the bottle follows a target world position instead of free-floating).
- **pointerdown** on the canvas: raycast the 4 registered PEAK `Object3D`s (`registry.all()`); if hit and phase is `idle`, set `grabbed = letter`, suspend that bottle, start a drip.
- **pointermove**: raycast the water plane (reuse the plane-intersect math: `Raycaster` + `Plane(Vector3(0,1,0),0)`), set the grabbed bottle's target to the hit XZ at a slightly-raised y (lifting clear); also track the cursor's screen position for slot hit-testing.
- **pointerup**: compute `screenSlotIndex` from the tray slot rects; if over a free slot → place (target = `slotWorldPosition(i)`, record `slots[i] = letter`); else → release (un-suspend, bottle resumes floating). Clear `grabbed`.
- When all 4 slots are filled → call the provider's `check()` (Task 10).
- HeroBottle change: accept an optional `target?: Vector3 | null` + `suspended?: boolean` (provided via context keyed by letter); when suspended, `useFrame` eases `group.position` toward `target` instead of calling `stepFloater`.
- [ ] **Step 1:** Implement the hook + the HeroBottle suspension seam.
- [ ] **Step 2:** Build + a unit test for any extracted pure helper (e.g. the "all slots filled" predicate). Confirm the PEAK contract test still passes (tagging untouched).
- [ ] **Step 3: Commit** — `feat: raycast bottle drag (grab → lift → drop into slot/release)`

## Task 10: Puzzle provider + scene wiring — `PuzzleProvider.tsx`

**Files:** Create `components/hero/puzzle/PuzzleProvider.tsx`. Modify `HeroTank.tsx`/`TankScene.tsx`/`Hero.tsx`/`HeroOverlay.tsx` to host the provider, the tray, the drag, and the registry.

- [ ] **Step 1:** `PuzzleProvider` holds: the `PeakRegistry` (lifted from HeroTank so both the scene and the puzzle share it), `slots` (ref + a setter that also drives the Tray's rendered state), the `phase` (Task 5), the tray slot rects ref, per-letter suspend/target maps, and `check()` (reads slots → `isSolved`/`nearMissCount` → dispatch `checked`; on `solved` → start drain (Task 12); on near-miss → flicker (Task 11) + drift the wrong ones back; else → after ~2.5 s drift all back, clear slots, no error).
- [ ] **Step 2:** Wire: `Hero` wraps `HeroTank` + `HeroOverlay` in `PuzzleProvider`; `TankScene` consumes the shared registry + uses `useBottleDrag`; `HeroOverlay` renders `<Tray slots phase highlight/>`. The drip trail rides the grabbed bottle.
- [ ] **Step 3:** Confirm build + full suite (PEAK contract green). 
- [ ] **Step 4: Commit** — `feat: puzzle provider wiring (registry, slots, check)`

---

# Milestone D — Feedback, drain, loading, route

## Task 11: Near-miss logo flicker

**Files:** Modify `BackgroundLogo.tsx` (expose a flicker trigger), `PuzzleProvider.tsx` (call it on 3/4).

- [ ] **Step 1:** Give `BackgroundLogo` an imperative flicker (e.g. a ref method or a context-driven boolean) that briefly raises/drops its material opacity a couple of times over ~0.4 s, then settles. Drive it from the provider when `nearMissCount === 3`.
- [ ] **Step 2:** Build + confirm the BackgroundLogo render-smoke (named `background-logo`) still passes.
- [ ] **Step 3: Commit** — `feat: faint background-logo flicker on a 3/4 near miss`

## Task 12: Drain sequence — `DrainSequence.tsx`

**Files:** Create `components/hero/puzzle/DrainSequence.tsx`. Modify `TankScene`/`HeroTank` to host it; `AudioToggle`/scheduler to allow an immediate cut.

- [ ] **Step 1:** On `phase === 'solved'`: (a) set `freeze.current = true` (everything stops); (b) cut ambient audio immediately; (c) ~0.7 s hold; (d) GSAP-fade the background logo to black; (e) GSAP-animate the water + frozen objects + camera **downward** over ~2 s (drain/descend); (f) fade a full-screen black overlay in; (g) signal "drain complete" (a callback/`onDrained`).
- [ ] **Step 2:** The descent: animate `camera.position.y` down and the scene group / water down so it reads as emptying. (Camera breathing is frozen, so no fight.)
- [ ] **Step 3:** Build + smoke (manual in Task 16). Unit-test any pure timing helper if extracted.
- [ ] **Step 4: Commit** — `feat: drain sequence (freeze → swallow logo → drain + descend → black)`

## Task 13: Loading screen — `LoadingScreen.tsx`

**Files:** Create `components/loading/LoadingScreen.tsx`.

- [ ] **Step 1:** Full-screen black overlay: the Redwood mark spinning (CSS rotate) + a fact line beneath, swapped every ~1.4 s from `buildFactSequence` (Task 3). Total duration `randomLoadingMs` (Task 4). On done, call `onComplete`. A testing-library test: renders a fact + the mark, and `onComplete` fires after the (fake-timer) duration.
- [ ] **Step 2: Commit** — `feat: loading screen (spinning mark + rotating facts)`

## Task 14: Placeholder login — `app/login/page.tsx`

**Files:** Create `app/login/page.tsx`.

- [ ] **Step 1:** A minimal dark "Employee Access" page: the brand mark, a **disabled** "Secret name" input with a note ("Credentials are issued out-of-band."), brand tokens, no auth. A testing-library/route smoke that it renders the heading.
- [ ] **Step 2:** Build (route compiles).
- [ ] **Step 3: Commit** — `feat: placeholder /login stub (Phase 4 replaces)`

## Task 15: Wire the full flow + session flag

**Files:** Modify `Hero.tsx`/`PuzzleProvider.tsx` to sequence solved → drain (`onDrained`) → mount `LoadingScreen` → `onComplete` → `markSolved()` + `router.push('/login')`. On mount, if `hasSolvedThisSession()` → don't force the sequence (bottles still float; no auto-drain).

- [ ] **Step 1:** Implement the sequence + `useRouter().push('/login')`. Mark solved before routing.
- [ ] **Step 2:** Session skip on reload.
- [ ] **Step 3:** Build + full suite green (PEAK contract). 
- [ ] **Step 4: Commit** — `feat: full solve→drain→loading→login flow + session skip`

---

# Milestone E — Finish

## Task 16: Smoke check + verification gate

- [ ] **Step 1:** `npx vitest run` all green; **PEAK contract** explicitly green; `timeout 220 npm run build` zero errors; Leva absent from prod bundle.
- [ ] **Step 2:** Real-browser smoke (dev server, then stop before any build): hover labels → drag 4 PEAK bottles to slots → wrong order drifts back, no error → 3/4 flickers the logo → correct order freezes + drains + descends → loading with rotating facts (reload a few times to see "Poisoning the river.") → routes to `/login` → reload-in-session doesn't replay. Tune drain/loading/slot timings live.
- [ ] **Step 3:** Quick low-end check: puzzle still draggable on a coarse-pointer/mobile profile.
- [ ] **Step 4: Commit** any tuning — `test: verify Phase 2 flow + PEAK contract`

## Task 17: Changelog v0.2.0

**Files:** Modify `CHANGELOG.md` (prepend).

- [ ] **Step 1:** `v0.2.0 — The Vault Drains` (or similar) in Redwood's deadpan voice: the four bottles, the tray, the drain, the loading, the door it opens. Same structural pattern as v0.1.x.
- [ ] **Step 2: Commit** — `docs: v0.2.0 changelog`

## Task 18: No-push handoff

- [ ] **Step 1:** Confirm clean tree on `staging` (`git status`, `git log --oneline -10`). **Do NOT push.** Tell the user Phase 2 is ready to push.

---

# Self-Review (plan author)

**Spec coverage (spec § → task):** drag §4 → T9; tray/order §5 → T1,T7,T8,T10; near-miss §5.1 → T11; drain §6 → T6,T12; loading §7 → T3,T4,T13; session §8 → T2,T15; login stub §9 → T14; not-in-scope §10 honoured (no Supabase/auth/tiers); verification §11 → T16; changelog §12 → T17.

**Placeholder scan:** the `/login` stub and the procedural-bottle drag are intentional, real implementations, not TODOs. `FACTS` content is authored in Task 3 (not left blank).

**Type/name consistency:** `PeakLetter` reused from `peak.ts`; `slots: (PeakLetter|null)[]` length-4 throughout (`order.ts`, `usePuzzleState`, tray, provider); `isSolved`/`nearMissCount`/`PEAK_ORDER`; `buildFactSequence`/`POISON_FACT`/`FACTS`; `randomLoadingMs`; `hasSolvedThisSession`/`markSolved`; `slotWorldPosition`/`SLOT_COUNT`/`screenSlotIndex`; `freeze` ref via `useFreeze`. The PEAK contract test is re-verified at T6, T9, T10, T15, T16.

**Risk notes:** the heaviest integration is the drag + provider wiring (T9/T10) and the drain (T12) — these get the real-browser smoke check (T16) since motion/interaction isn't unit-testable. The freeze flag (T6) touches many `useFrame`s; keep each change a simple early-return so render-smokes stay green.
