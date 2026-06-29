# Redwood Peak — Phase 1 Revision 2 (Top-Down Surface Rework) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Rework the already-built side-on "aquarium" hero into the corrected **top-down bird's-eye view of a living water surface** — small, evenly-spread, drifting bottles; real wave surface; cursor that cuts the water; open bottles leaking contents; a distant tanker pouring in — and fix three R1 bugs (PEAK bottles don't drift; hero copy; lag). The submerged view + scroll-dive are Phase 3, out of scope.

**Architecture:** This is a **rework of the existing R1 codebase on `staging`**, not a greenfield build. The engine layer is unchanged and reused: glass material, procedural geometry, PEAK tagging/registry + its automated contract test, GSAP, audio scheduler, quality tiers, design tokens. Changes are concentrated in the scene/camera/surface/choreography layer. The R3F `<Canvas>` is reoriented so the camera looks straight down (−Y) at a wave-displaced water plane on the XZ plane; objects float near y≈0 spread across X/Z; fog = downward depth. Water waves + cursor displacement are **hand-written GLSL** (no new deps).

**Tech Stack:** existing — Next 14, React 18, R3F v8, drei v9, @react-three/postprocessing v2, three 0.185, gsap, Vitest, @react-three/test-renderer.

**Spec:** `docs/superpowers/specs/2026-06-28-redwood-peak-phase1-hero-design.md` (Revision 2). Section refs below point into it.

---

## Conventions for the implementing engineer

- **Branch:** all work on `staging`. Commit after every task. **NEVER `git push`** (any branch) — the user pushes.
- **Builds:** run **one at a time, foreground, with a hard timeout**: `timeout 200 npm run build 2>&1 | tail -25`. NEVER background a build or start a second while one runs (concurrent `next build` deadlocks on this Windows machine). Same caution for `npm run dev`/`npm start` — stop the dev server before building.
- **Tests:** `npx vitest run <path>` for one file; `npx vitest run` for all.
- **Don't regress the PEAK contract:** `components/hero/objects/HeroBottles.test.tsx` must stay green after every task that touches bottles. Never weaken it.
- **Tunable constants:** camera height, wave amplitude/speed, counts, drift magnitude, scale — the given values are working baselines; final values are dialed in live during the Task 11 smoke check (via dev server + screenshots, as in R1). Use the given values; don't invent different ones.
- **Filename note (intentional deviation from spec §5):** to minimize churn and broken imports, existing files keep their names — `TankScene.tsx` stays (it now models the top-down water world); we do **not** rename it to `WaterWorld.scene.tsx`. New files use the spec's names.

---

# Milestone A — Bug fixes (independent, cheap)

## Task 1: Hero copy fix — "We are The Redwood Co."

R1 line 2 reads "The Redwood Co." which scans as greeting an entity. It must read as self-introduction. (Both "We are" lines are intended per the user.)

**Files:** Modify `components/hero/CopyReveal.tsx`, `components/hero/CopyReveal.test.tsx`.

- [ ] **Step 1: Update the test first (TDD on the copy contract)**

In `components/hero/CopyReveal.test.tsx`, change the assertion for the display line:
```tsx
expect(screen.getByText('We are The Redwood Co.')).toBeInTheDocument();
```
(Replace the prior `expect(screen.getByText('The Redwood Co.'))` line. Keep the other assertions.)

- [ ] **Step 2: Run it, watch it fail**

Run: `npx vitest run components/hero/CopyReveal.test.tsx`
Expected: FAIL — "We are The Redwood Co." not found.

- [ ] **Step 3: Update the copy**

In `components/hero/CopyReveal.tsx`, change the `<h1>` text from `The Redwood Co.` to:
```tsx
<h1 className="text-rw-bone text-5xl md:text-7xl font-extrabold tracking-tight leading-none">
  We are The Redwood Co.
</h1>
```

- [ ] **Step 4: Run it, watch it pass**

Run: `npx vitest run components/hero/CopyReveal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix: hero line 2 reads 'We are The Redwood Co.'"
```

---

## Task 2: PEAK bottles must drift (shared ambient-drift model)

R1 bug: the four PEAK bottles were given fixed positions + hover only — **static, stuck to the camera**. Introduce a shared ambient-drift model and apply it to BOTH the field objects and the PEAK bottles, composed with the GSAP intro rise so they never fight. Hover-to-read layers on top.

**Design:** each object's transform each frame is `rest + (0, enter, 0) + drift(t, phase)`, where `rest` is its resting position, `enter` is a number GSAP animates from −depth→0 for the intro rise (animating a plain JS number, never the mesh transform directly, so GSAP and the per-frame drift don't conflict), and `drift` is small bounded layered sines.

**Files:** Create `components/hero/objects/useAmbientDrift.ts`, `components/hero/objects/useAmbientDrift.test.ts`. Modify `components/hero/objects/FieldObjects.tsx`, `components/hero/objects/HeroBottle.tsx`.

- [ ] **Step 1: Write the failing test — `useAmbientDrift.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { driftOffset } from './useAmbientDrift';

describe('driftOffset', () => {
  it('returns small bounded position + rotation offsets', () => {
    for (let t = 0; t < 40; t += 0.5) {
      const o = driftOffset(t, 0.37);
      expect(Math.abs(o.x)).toBeLessThan(0.4);
      expect(Math.abs(o.y)).toBeLessThan(0.4);
      expect(Math.abs(o.z)).toBeLessThan(0.4);
      expect(Math.abs(o.rotY)).toBeLessThan(0.3);
    }
  });

  it('different phases give different offsets at the same time (objects desync)', () => {
    const a = driftOffset(2.0, 0.1);
    const b = driftOffset(2.0, 0.8);
    expect(Math.abs(a.x - b.x) + Math.abs(a.y - b.y)).toBeGreaterThan(1e-3);
  });
});
```

- [ ] **Step 2: Run it, watch it fail**

Run: `npx vitest run components/hero/objects/useAmbientDrift.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement `components/hero/objects/useAmbientDrift.ts`**

```ts
'use client';

export interface DriftOffset {
  x: number;
  y: number;
  z: number;
  rotX: number;
  rotY: number;
  rotZ: number;
}

/**
 * Gentle floating motion. `phase` (0..1, per-object) desyncs objects so they
 * don't bob in unison. Bounded and slow — felt, not watched. Pure + testable.
 */
export function driftOffset(t: number, phase: number): DriftOffset {
  const p = phase * 6.2831853;
  return {
    x: Math.sin(t * 0.31 + p) * 0.12 + Math.sin(t * 0.13 + p * 1.7) * 0.06,
    y: Math.sin(t * 0.27 + p * 1.3) * 0.14 + Math.cos(t * 0.11 + p) * 0.05,
    z: Math.cos(t * 0.29 + p * 0.9) * 0.12 + Math.sin(t * 0.17 + p) * 0.05,
    rotX: Math.sin(t * 0.19 + p) * 0.08,
    rotY: Math.cos(t * 0.23 + p * 1.1) * 0.12,
    rotZ: Math.sin(t * 0.15 + p * 0.7) * 0.06,
  };
}
```

- [ ] **Step 4: Run it, watch it pass**

Run: `npx vitest run components/hero/objects/useAmbientDrift.test.ts`
Expected: PASS.

- [ ] **Step 5: Refactor `FieldObjects.tsx` to the rest+enter+drift model**

Replace the file body with this (keeps the deterministic layout + the same render-smoke contract; the GSAP rise now animates a per-object `enter` number, and a `useFrame` composes rest+enter+drift):
```tsx
'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh } from 'three';
import gsap from 'gsap';
import { fieldBottleGeometry, syringeGeometry } from './proceduralBottleGeo';
import { createGlassMaterial } from './glassMaterial';
import { buildRiseSchedule } from '../useIntroRise';
import { driftOffset } from './useAmbientDrift';

interface FieldObjectsProps {
  count: number;
  seed?: number;
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function FieldObjects({ count, seed = 1337 }: FieldObjectsProps) {
  const bottleGeo = useMemo(() => fieldBottleGeometry(), []);
  const syringeGeo = useMemo(() => syringeGeometry(), []);
  const material = useMemo(() => createGlassMaterial(), []);

  const items = useMemo(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: count }, (_, i) => ({
      key: i,
      isSyringe: rand() > 0.7,
      rest: [(rand() - 0.5) * 8, (rand() - 0.5) * 6, -1 - rand() * 12] as [number, number, number],
      baseRot: [rand() * Math.PI, rand() * Math.PI, rand() * Math.PI] as [number, number, number],
      scale: 0.6 + rand() * 0.8,
      phase: rand(),
    }));
  }, [count, seed]);

  const groupRef = useRef<Group>(null);
  // Per-object intro-rise offset (number GSAP animates; -depth → 0). Composed in useFrame.
  const enter = useRef<number[]>([]);

  useEffect(() => {
    enter.current = items.map(() => -10);
    const schedule = buildRiseSchedule(items.length, seed);
    const tweens = schedule.map((cfg, i) => {
      const o = { v: -10 };
      const tl = gsap.timeline({ delay: cfg.startDelay });
      if (cfg.pauseMidway) {
        tl.to(o, { v: -4, duration: cfg.duration * 0.4, ease: 'sine.out', onUpdate: () => (enter.current[i] = o.v) })
          .to(o, { v: 0, duration: cfg.duration * 0.6, ease: 'sine.inOut', delay: 0.6, onUpdate: () => (enter.current[i] = o.v) });
      } else {
        tl.to(o, { v: 0, duration: cfg.duration, ease: 'sine.inOut', onUpdate: () => (enter.current[i] = o.v) });
      }
      return tl;
    });
    return () => tweens.forEach((t) => t.kill());
  }, [items, seed]);

  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (!g) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < g.children.length; i++) {
      const child = g.children[i] as Mesh;
      const it = items[i];
      const d = driftOffset(t, it.phase);
      const e = enter.current[i] ?? 0;
      child.position.set(it.rest[0] + d.x, it.rest[1] + e + d.y, it.rest[2] + d.z);
      child.rotation.set(it.baseRot[0] + d.rotX, it.baseRot[1] + d.rotY, it.baseRot[2] + d.rotZ);
    }
  });

  return (
    <group ref={groupRef}>
      {items.map((it) => (
        <mesh
          key={it.key}
          geometry={it.isSyringe ? syringeGeo : bottleGeo}
          material={material}
          position={it.rest}
          rotation={it.baseRot}
          scale={it.scale}
        />
      ))}
    </group>
  );
}
```

- [ ] **Step 6: Add drift to the PEAK bottles in `HeroBottle.tsx`**

The PEAK bottles render via `ProceduralBottle`/`GlbBottle` inside a positioned `<group>`. Add drift to that wrapping group so each bottle floats around its rest position, while hover-rotation continues to act on the inner mesh.

In `HeroBottle.tsx`, add imports:
```tsx
import { useFrame } from '@react-three/fiber';
import { driftOffset } from './useAmbientDrift';
```
Change the `HeroBottle` component so the outer group drifts. Replace the `HeroBottle` function with:
```tsx
export function HeroBottle({ letter, position, onReady }: HeroBottleProps) {
  const status = useAssetPresence(GLB_PATH[letter]);
  const groupRef = useRef<Group>(null);
  // Stable per-letter phase so each PEAK bottle desyncs from the others.
  const phase = useMemo(() => ({ P: 0.12, E: 0.41, A: 0.68, K: 0.91 }[letter]), [letter]);

  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (!g) return;
    const d = driftOffset(clock.elapsedTime, phase);
    g.position.set(position[0] + d.x, position[1] + d.y, position[2] + d.z);
    g.rotation.set(d.rotX, d.rotY * 0.5, d.rotZ);
  });

  const procedural = <ProceduralBottle letter={letter} onReady={onReady} />;

  return (
    <group ref={groupRef} position={position}>
      {shouldRenderGlb(status) ? (
        <GlbErrorBoundary fallback={procedural}>
          <Suspense fallback={procedural}>
            <GlbBottle letter={letter} path={GLB_PATH[letter]} onReady={onReady} />
          </Suspense>
        </GlbErrorBoundary>
      ) : (
        procedural
      )}
    </group>
  );
}
```
Ensure `useMemo`, `useRef`, and `Group` are imported (add `Group` to the `three` type import; `useMemo` to the react import). The hover-rotation on the inner mesh (the `rotation={[0, RESTING_LABEL_AWAY, 0]}` + pointer handlers from Task 20) stays as-is — it rotates the inner mesh while the outer group drifts.

- [ ] **Step 7: Verify tests + build**

Run: `npx vitest run components/hero/objects/useAmbientDrift.test.ts components/hero/objects/FieldObjects.test.tsx components/hero/objects/HeroBottles.test.tsx`
Expected: all PASS (drift unit test, field render-smoke, **PEAK contract still green**).
Run: `timeout 200 npm run build 2>&1 | tail -8`
Expected: zero errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "fix: PEAK bottles drift like the field; unify rise+drift model"
```

---

# Milestone B — Perf diagnosis (measure before cutting)

## Task 3: Diagnose the lag under a production build

The R1 build felt laggy. Determine whether it's a dev-mode artifact (Strict Mode double-render, Leva panel, unminified three) before touching the architecture (spec §13).

**Files:** Create `docs/superpowers/notes/2026-06-29-perf-diagnosis.md` (findings only; no app code unless profiling demands a count change).

- [ ] **Step 1: Build + start production**

Run (separately, never concurrent with a build):
```bash
timeout 200 npm run build 2>&1 | tail -6
```
Then start production: `npm start` (background it via your shell's job control, or run and observe). It serves on `:3000`.

- [ ] **Step 2: Measure frame rate in a real browser**

With the production server running, open `http://localhost:3000`, let the intro settle, and sample FPS for ~10s. If you have the Playwright MCP, evaluate `performance`-based rAF sampling; otherwise use the browser devtools Performance panel and record the average FPS and the longest frame. Record numbers for: (a) full scene, (b) postprocessing toggled off (temporarily set `quality.postprocessing` false), (c) caustics off.

- [ ] **Step 3: Write the findings to the notes file**

Document: dev vs prod FPS, the cost attributable to postprocessing vs caustics vs object count, and a recommendation. Example structure:
```markdown
# Perf diagnosis — 2026-06-29
- Dev FPS: <n>   Prod FPS: <n>
- Prod, postprocessing off: <n>   caustics off: <n>
- Object counts at high tier: bottles <n>, bubbles <n>
- Conclusion: <dev-only? or specific expensive pass?>
- Action: <none | lower X count | simplify Y on mid tier>
```

- [ ] **Step 4: Apply ONLY a count/tier adjustment if profiling clearly indicts one**

If (and only if) profiling shows a specific cheap win (e.g. high-tier bottle count too high), make a minimal `quality.ts` adjustment. Do **not** remove effects blindly. If prod FPS is fine (i.e. it was a dev-mode artifact), change no code.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "docs: perf diagnosis under production build (+ minimal tier tweak if warranted)"
```

---

# Milestone C — Top-down composition

## Task 4: Reorient camera to top-down; spread + shrink objects; fog = depth

Turn the side-on view into a bird's-eye view looking straight down at the XZ water plane. Pull the camera back so bottles read small; distribute objects evenly across X/Z near the surface (y≈0); the intro rise now comes **up from deeper water** (−Y → 0); fog reads as downward depth (camera above ⇒ deeper objects are naturally farther ⇒ foggier).

**Files:** Modify `components/hero/HeroTank.tsx` (camera), `components/hero/TankScene.tsx` (fog/lights/up-vector), `components/hero/objects/FieldObjects.tsx` (rest distribution across XZ, rise along −Y), `components/hero/objects/HeroBottles.tsx` (positions across XZ near surface), `components/hero/Bubbles.tsx` (rise +Y toward surface), `components/hero/BackgroundLogo.tsx` (sink below surface).

- [ ] **Step 1: Camera looks straight down — `HeroTank.tsx`**

Change the `<Canvas camera=...>` to sit above the surface looking down:
```tsx
camera={{ position: [0, 16, 0.001], fov: 50, near: 0.1, far: 60 }}
```
(The tiny z offset avoids a degenerate straight-down look-at. Height 16 pulls back so objects read small — tunable.)

- [ ] **Step 2: Scene up-vector + fog + lights — `TankScene.tsx`**

Keep the existing structure; make these changes:
- Set the camera target/up so "screen up" is −Z. Add, inside `TankScene`, near the top:
```tsx
import { useThree } from '@react-three/fiber';
// ...
const { camera } = useThree();
useEffect(() => {
  camera.up.set(0, 0, -1);
  camera.lookAt(0, 0, 0);
}, [camera]);
```
(Add `useEffect` to the react import.)
- Fog stays `fogExp2` but represents downward depth now; keep the color, density tunable:
```tsx
<fogExp2 attach="fog" args={['#0a1518', 0.05]} />
```
- The light sweep currently moves a directional light in X/Z — that already reads as sweeping across the surface from above; leave it (Task 5 refines it). Keep the brightened lights from R1.

- [ ] **Step 3: Distribute field objects across the surface — `FieldObjects.tsx`**

Change the `rest` and `scale` in the `items` memo so objects spread across X and Z (the visible water) near the surface, smaller, with the rise coming from below (−Y):
```tsx
rest: [
  (rand() - 0.5) * 22,   // wide spread across X
  -rand() * 3,           // at/just below the surface (y ≈ 0..-3)
  (rand() - 0.5) * 22,   // wide spread across Z
] as [number, number, number],
// ...
scale: 0.28 + rand() * 0.34,   // much smaller than R1
```
The intro `enter` already offsets y downward (−10) and rises to 0 — that now reads as rising from the deep toward the surface, viewed from above. No other change needed to the rise.

- [ ] **Step 4: Spread the PEAK bottles across the surface — `HeroBottles.tsx`**

Replace `POSITIONS` so the four sit apart on the water (X/Z), near the surface, not clustered:
```tsx
const POSITIONS: Record<PeakLetter, [number, number, number]> = {
  P: [-6.5, 0.1, -4.0],
  E: [5.5, 0.0, -6.5],
  A: [-4.0, 0.05, 5.5],
  K: [6.0, 0.1, 3.5],
};
```
Also shrink them to match the field — in `HeroBottle.tsx`'s wrapping `<group>`, add `scale={0.5}` (tunable) so the PEAK bottles read at surface scale while staying a touch larger than the field for legibility on hover.

- [ ] **Step 5: Bubbles rise toward the surface — `Bubbles.tsx`**

Bubbles already increment `y` and recycle; widen their X/Z spread and keep them below the surface rising up. Change the init spread to:
```tsx
positions[i * 3] = (Math.random() - 0.5) * 22;
positions[i * 3 + 1] = -6 + Math.random() * 6;   // below surface
positions[i * 3 + 2] = (Math.random() - 0.5) * 22;
```
and in the recycle, when `y > 0.5` reset to `y = -6` (rise to the surface and recycle).

- [ ] **Step 6: Sink the background logo below the surface — `BackgroundLogo.tsx`**

Move it beneath the surface and lay it flat-ish so it looms from the deep. Change its group to:
```tsx
<group ref={ref} name="background-logo" position={[0, -10, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={8}>
```
(Rotated to face up toward the top-down camera; still named/addressable.) Keep the breathing pulse.

- [ ] **Step 7: Verify render-smoke tests + build**

Run: `npx vitest run components/hero/TankScene.test.tsx components/hero/objects/FieldObjects.test.tsx components/hero/objects/HeroBottles.test.tsx components/hero/BackgroundLogo.test.tsx components/hero/Bubbles.test.tsx`
Expected: all PASS (these assert structure, which is unchanged; PEAK contract green).
Run: `timeout 200 npm run build 2>&1 | tail -8`
Expected: zero errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: top-down camera; spread + shrink objects across the surface; fog as depth"
```

---

## Task 5: Light sweep across the surface + caustics under the surface

Reorient the two projected effects for top-down: the light sweep travels across the XZ surface; caustics project onto a plane just **below** the surface (so they read as light dancing under the water), not on a far back wall.

**Files:** Modify `components/hero/TankScene.tsx` (light sweep path), `components/hero/CausticsPlane.tsx` (orientation/position).

- [ ] **Step 1: Light sweep travels across X/Z surface — `TankScene.tsx`**

The sweep `useFrame` currently sets `position.x` and a fixed `position.z`. Make it travel a diagonal path across the surface and sit above it:
```tsx
useFrame(({ clock }) => {
  if (sweep.current) {
    const t = clock.elapsedTime / 25; // ~25s period
    sweep.current.position.set(Math.sin(t * Math.PI * 2) * 10, 8, Math.cos(t * Math.PI * 2) * 10);
    sweep.current.target.position.set(0, 0, 0);
    sweep.current.target.updateMatrixWorld();
  }
});
```
(Ensure the directional light's `target` is in the scene; drei/three auto-adds it, but call `updateMatrixWorld` as above.)

- [ ] **Step 2: Caustics plane sits just below the surface, facing up — `CausticsPlane.tsx`**

Change the mesh transform so the plane lies flat on the XZ plane a little below the surface:
```tsx
<mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
  <planeGeometry args={[44, 44]} />
  {/* ...existing shaderMaterial unchanged... */}
</mesh>
```
(Widened to cover the spread, rotated to face the top-down camera.)

- [ ] **Step 3: Verify**

Run: `npx vitest run components/hero/CausticsPlane.test.tsx components/hero/TankScene.test.tsx`
Expected: PASS.
Run: `timeout 200 npm run build 2>&1 | tail -8`
Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: reorient light sweep + caustics for the top-down surface"
```

---

## Task 6: Real wave surface (hand-written GLSL)

A subdivided water plane on XZ at y≈0 whose vertices are displaced by a summed Gerstner/sine wave field so the surface visibly tosses. Cold-tint + fresnel + caustic glint in the fragment. This is the primary surface the camera looks down at.

**Files:** Create `components/hero/surface/shaders/waterSurface.glsl.ts`, `components/hero/surface/WaterSurface.tsx`, `components/hero/surface/WaterSurface.test.tsx`. Modify `components/hero/TankScene.tsx` (mount it).

- [ ] **Step 1: Write the failing render-smoke test — `WaterSurface.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { WaterSurface } from './WaterSurface';

describe('WaterSurface', () => {
  it('mounts a mesh with a ShaderMaterial without crashing', async () => {
    const renderer = await ReactThreeTestRenderer.create(<WaterSurface />);
    const meshes = renderer.scene.findAllByType('Mesh');
    expect(meshes.length).toBe(1);
    await renderer.unmount();
  });
});
```

- [ ] **Step 2: Run it, watch it fail**

Run: `npx vitest run components/hero/surface/WaterSurface.test.tsx`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement `components/hero/surface/shaders/waterSurface.glsl.ts`**

```ts
export const waterVertex = /* glsl */ `
  uniform float uTime;
  uniform vec2 uRippleOrigin;   // XZ point where the cursor last cut the water
  uniform float uRippleTime;    // seconds since that cut (grows; ripple expands + fades)
  uniform float uRippleStrength;
  varying vec3 vWorld;
  varying float vHeight;

  // Cheap directional wave: amplitude a, wavelength via k, speed s, dir d.
  float wave(vec2 p, vec2 d, float k, float s, float a) {
    return a * sin(dot(normalize(d), p) * k + uTime * s);
  }

  void main() {
    vec3 pos = position;
    vec2 p = pos.xy; // plane is XY in local space before the -90deg X rotation -> maps to world XZ
    float h = 0.0;
    h += wave(p, vec2(1.0, 0.2), 0.55, 0.9, 0.35);
    h += wave(p, vec2(-0.4, 1.0), 0.8, 1.1, 0.22);
    h += wave(p, vec2(0.7, -0.6), 1.3, 1.6, 0.12);
    h += wave(p, vec2(0.2, 0.9), 2.1, 2.2, 0.06);

    // Cursor cut: an expanding ring radiating from the disturbance point, fading over time.
    float d = distance(p, uRippleOrigin);
    float ring = sin(d * 3.0 - uRippleTime * 6.0) * exp(-d * 0.35) * exp(-uRippleTime * 1.2);
    h += ring * uRippleStrength * 0.8;

    pos.z += h; // local z = world y after rotation
    vHeight = h;
    vec4 world = modelMatrix * vec4(pos, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const waterFragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  varying vec3 vWorld;
  varying float vHeight;

  void main() {
    // Height-tinted cold water + a moving glint band (reads as the light sweep on the surface).
    float t = clamp(vHeight * 0.6 + 0.5, 0.0, 1.0);
    vec3 col = mix(uDeep, uShallow, t);
    float glint = smoothstep(0.86, 1.0, sin(vWorld.x * 0.15 + vWorld.z * 0.1 + uTime * 0.4));
    col += glint * 0.18;
    gl_FragColor = vec4(col, 0.92);
  }
`;
```

- [ ] **Step 4: Implement `components/hero/surface/WaterSurface.tsx`**

```tsx
'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ShaderMaterial, Color, Vector2 } from 'three';
import { waterVertex, waterFragment } from './shaders/waterSurface.glsl';

export interface WaterSurfaceHandle {
  /** Inject a cursor "cut" at world XZ (x, z); starts an expanding ripple. */
  ripple: (x: number, z: number, strength?: number) => void;
}

export function WaterSurface({ onReady }: { onReady?: (h: WaterSurfaceHandle) => void } = {}) {
  const matRef = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRippleOrigin: { value: new Vector2(0, 0) },
      uRippleTime: { value: 999 },
      uRippleStrength: { value: 0 },
      uDeep: { value: new Color('#06141a') },
      uShallow: { value: new Color('#2f6f6a') },
    }),
    [],
  );

  // Expose a ripple injector (used by the cursor handler in Task 7).
  if (onReady && matRef.current) {
    // no-op placeholder; real wiring via the effect below
  }

  useFrame((_, delta) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value += delta;
    matRef.current.uniforms.uRippleTime.value += delta;
  });

  // Provide the handle once mounted.
  const handle = useMemo<WaterSurfaceHandle>(
    () => ({
      ripple: (x, z, strength = 1) => {
        if (!matRef.current) return;
        matRef.current.uniforms.uRippleOrigin.value.set(x, z);
        matRef.current.uniforms.uRippleTime.value = 0;
        matRef.current.uniforms.uRippleStrength.value = strength;
      },
    }),
    [],
  );
  // Hand the injector up exactly once.
  const reported = useRef(false);
  useFrame(() => {
    if (!reported.current && onReady) {
      reported.current = true;
      onReady(handle);
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[60, 60, 160, 160]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={waterVertex}
        fragmentShader={waterFragment}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
}
```

- [ ] **Step 5: Mount it in `TankScene.tsx`**

Add `import { WaterSurface } from './surface/WaterSurface';` and render `<WaterSurface />` in the scene (above the caustics plane, at y=0). For this task pass no `onReady` yet (Task 7 wires the cursor). Place it so objects float around it.

- [ ] **Step 6: Run it, watch it pass + build**

Run: `npx vitest run components/hero/surface/WaterSurface.test.tsx components/hero/TankScene.test.tsx`
Expected: PASS.
Run: `timeout 200 npm run build 2>&1 | tail -8`
Expected: zero errors.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: hand-written GLSL wave surface (gerstner sum + expanding ripple uniform)"
```

---

## Task 7: Cursor cuts the water (real surface displacement)

Raycast the cursor onto the water plane to get the world XZ point; trigger an expanding ripple at that point (via the WaterSurface handle from Task 6); and push nearby floating bottles away from the disturbance before they settle. Real displacement, not an overlay.

**Files:** Create `components/hero/surface/useSurfaceCursor.ts`, `components/hero/surface/useSurfaceCursor.test.ts`. Modify `components/hero/TankScene.tsx` (wire the handle + pointer move).

- [ ] **Step 1: Write the failing test — `useSurfaceCursor.test.ts`** (pure throttle/decay helper)

```ts
import { describe, it, expect } from 'vitest';
import { rippleStrengthForSpeed } from './useSurfaceCursor';

describe('rippleStrengthForSpeed', () => {
  it('faster cursor motion makes a stronger cut, clamped to 1', () => {
    expect(rippleStrengthForSpeed(0)).toBeCloseTo(0, 5);
    expect(rippleStrengthForSpeed(1000)).toBe(1);
    expect(rippleStrengthForSpeed(50)).toBeGreaterThan(0);
    expect(rippleStrengthForSpeed(50)).toBeLessThan(1);
  });
});
```

- [ ] **Step 2: Run it, watch it fail**

Run: `npx vitest run components/hero/surface/useSurfaceCursor.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement `components/hero/surface/useSurfaceCursor.ts`**

```ts
'use client';

import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { Raycaster, Plane, Vector3, Vector2 } from 'three';
import type { WaterSurfaceHandle } from './WaterSurface';

/** Map cursor speed (px/s) to a ripple strength in 0..1. */
export function rippleStrengthForSpeed(speedPxPerSec: number): number {
  return Math.min(1, speedPxPerSec / 600);
}

/**
 * Raycasts the pointer onto the water plane (y=0) and feeds an expanding ripple
 * to the WaterSurface; also reports the world point + strength so the scene can
 * push nearby bottles away. Returns nothing; side-effects via the handle/callback.
 */
export function useSurfaceCursor(
  handle: WaterSurfaceHandle | null,
  onCut?: (x: number, z: number, strength: number) => void,
) {
  const { gl, camera } = useThree();
  const last = useRef({ x: 0, y: 0, t: 0 });

  useEffect(() => {
    const el = gl.domElement;
    const ray = new Raycaster();
    const plane = new Plane(new Vector3(0, 1, 0), 0);
    const ndc = new Vector2();
    const hit = new Vector3();

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const now = performance.now();
      const dt = Math.max(1, now - last.current.t);
      const speed = (Math.hypot(e.clientX - last.current.x, e.clientY - last.current.y) / dt) * 1000;
      last.current = { x: e.clientX, y: e.clientY, t: now };

      ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      if (ray.ray.intersectPlane(plane, hit)) {
        const strength = rippleStrengthForSpeed(speed);
        handle?.ripple(hit.x, hit.z, strength);
        onCut?.(hit.x, hit.z, strength);
      }
    };

    el.addEventListener('pointermove', onMove);
    return () => el.removeEventListener('pointermove', onMove);
  }, [gl, camera, handle, onCut]);
}
```

- [ ] **Step 4: Run it, watch it pass**

Run: `npx vitest run components/hero/surface/useSurfaceCursor.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire into `TankScene.tsx`**

- Capture the WaterSurface handle: `const [surface, setSurface] = useState<WaterSurfaceHandle | null>(null);` and render `<WaterSurface onReady={setSurface} />`.
- Track the latest cut so the field can push away: keep a ref `const cut = useRef<{x:number;z:number;strength:number;t:number}>(...)`; pass `onCut` to `useSurfaceCursor` that records it with `performance.now()`.
- Call `useSurfaceCursor(surface, (x,z,s)=>{ cut.current = {x,z,strength:s,t:performance.now()} })`.
- Pass `cut` down to `FieldObjects` and `HeroBottles` (a new optional `pushFrom?: MutableRefObject<...>` prop), and in their `useFrame`, add a small repulsion: for each object, if within radius R of the recent cut (and recent in time), add an outward offset that decays. Concretely, in `FieldObjects` useFrame after computing the drift position, add:
```tsx
const c = pushFrom?.current;
if (c) {
  const age = (performance.now() - c.t) / 1000;
  if (age < 1.2) {
    const dx = child.position.x - c.x, dz = child.position.z - c.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 6) {
      const push = (1 - dist / 6) * c.strength * (1 - age / 1.2) * 1.5;
      child.position.x += (dx / (dist || 1)) * push;
      child.position.z += (dz / (dist || 1)) * push;
    }
  }
}
```
Apply the same in `HeroBottle`'s drift `useFrame` (push the group). The drift then naturally "settles" them back since drift is relative to rest.

- [ ] **Step 6: Verify + build**

Run: `npx vitest run components/hero/surface/useSurfaceCursor.test.ts components/hero/TankScene.test.tsx components/hero/objects/HeroBottles.test.tsx`
Expected: PASS (contract green).
Run: `timeout 200 npm run build 2>&1 | tail -8`
Expected: zero errors.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: cursor cuts the water — raycast ripple + bottles pushed from the disturbance"
```

---

# Milestone D — Copy + content

## Task 8: Typewriter phrase cycler (delete + retype)

Replace the crossfade phrase animation with a typewriter: backspace the current phrase letter-by-letter, then type the next, looping through all five, with a blinking caret. Keep the once-on-load / scroll-to-top replay behavior (the typewriter loop resumes).

**Files:** Create `components/hero/useTypewriter.ts`, `components/hero/useTypewriter.test.ts`. Modify `components/hero/CopyReveal.tsx`, `components/hero/CopyReveal.test.tsx`.

- [ ] **Step 1: Write the failing test — `useTypewriter.test.ts`** (pure step function)

```ts
import { describe, it, expect } from 'vitest';
import { nextTypeState } from './useTypewriter';

describe('nextTypeState', () => {
  const phrases = ['ab', 'cd'];
  it('types forward one char at a time', () => {
    const s0 = { phrase: 0, text: '', mode: 'typing' as const };
    const s1 = nextTypeState(s0, phrases);
    expect(s1.text).toBe('a');
    const s2 = nextTypeState(s1, phrases);
    expect(s2.text).toBe('ab');
  });
  it('switches to deleting after a full phrase, then advances to the next phrase', () => {
    let s = { phrase: 0, text: 'ab', mode: 'typing' as const };
    s = nextTypeState(s, phrases); // full -> begin pause/deleting
    // delete down to empty
    let guard = 0;
    while (!(s.phrase === 1 && s.text === '') && guard++ < 20) s = nextTypeState(s, phrases);
    expect(s.phrase).toBe(1);
    expect(s.text).toBe('');
  });
});
```

- [ ] **Step 2: Run it, watch it fail**

Run: `npx vitest run components/hero/useTypewriter.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement `components/hero/useTypewriter.ts`**

```ts
'use client';

import { useEffect, useRef, useState } from 'react';

export type TypeMode = 'typing' | 'deleting';
export interface TypeState {
  phrase: number;
  text: string;
  mode: TypeMode;
}

/** One discrete typewriter step (pure). Types up to the full phrase, then deletes, then advances. */
export function nextTypeState(s: TypeState, phrases: readonly string[]): TypeState {
  const full = phrases[s.phrase];
  if (s.mode === 'typing') {
    if (s.text.length < full.length) return { ...s, text: full.slice(0, s.text.length + 1) };
    return { ...s, mode: 'deleting' }; // reached full -> start deleting next tick
  }
  // deleting
  if (s.text.length > 0) return { ...s, text: s.text.slice(0, -1) };
  return { phrase: (s.phrase + 1) % phrases.length, text: '', mode: 'typing' };
}

/** Drives nextTypeState on an interval. Type speed / delete speed / hold tunable. */
export function useTypewriter(phrases: readonly string[], active: boolean): TypeState {
  const [state, setState] = useState<TypeState>({ phrase: 0, text: '', mode: 'typing' });
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!active) return;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const cur = stateRef.current;
      const next = nextTypeState(cur, phrases);
      setState(next);
      // Pause longer when a phrase is fully typed (just flipped to deleting with full text).
      const justCompleted = cur.mode === 'typing' && next.mode === 'deleting';
      const delay = justCompleted ? 1400 : next.mode === 'deleting' ? 45 : 85;
      timer = setTimeout(tick, delay);
    };
    timer = setTimeout(tick, 85);
    return () => clearTimeout(timer);
  }, [phrases, active]);

  return state;
}
```

- [ ] **Step 4: Run it, watch it pass**

Run: `npx vitest run components/hero/useTypewriter.test.ts`
Expected: PASS.

- [ ] **Step 5: Rework `CopyReveal.tsx` to use the typewriter**

Replace the phrase `<span>` block (the `.map` over HERO_PHRASES) with a single typewriter line + blinking caret, driven by `useTypewriter`. The cycler is `active` whenever the component is mounted (both `full` and `phrases-only` modes). Keep the `showIntro` gate on the Hello/h1 block. New body:
```tsx
'use client';

import { HERO_PHRASES } from './phrases';
import { useRevealSequence } from './useRevealSequence';
import { useTypewriter } from './useTypewriter';

export function CopyReveal() {
  const mode = useRevealSequence();
  const showIntro = mode === 'full';
  const typed = useTypewriter(HERO_PHRASES, true);

  return (
    <div className="select-none">
      {showIntro && (
        <>
          <p className="text-rw-bone text-lg">Hello,</p>
          <h1 className="text-rw-bone text-5xl md:text-7xl font-extrabold tracking-tight leading-none">
            We are The Redwood Co.
          </h1>
        </>
      )}
      <p className="text-rw-bone text-lg mt-3">
        We are a{' '}
        <span className="text-rw-red font-semibold whitespace-nowrap">
          {typed.text}
          <span className="inline-block w-[1px] -mb-[2px] ml-[1px] animate-pulse">▮</span>
        </span>
      </p>
    </div>
  );
}
```

- [ ] **Step 6: Update `CopyReveal.test.tsx`**

The phrases now appear one character at a time, so asserting a full phrase on first render is wrong. Update the second test to assert the typewriter is producing the start of the first phrase. Replace the "renders the first cycling phrase" test with:
```tsx
it('renders the fixed lead-in and begins typing the first phrase', async () => {
  render(<CopyReveal />);
  expect(screen.getByText(/We are a/)).toBeInTheDocument();
  // The typewriter types into the red span; the first phrase starts with "A Pharmaceutical".
  await screen.findByText((_, el) => !!el && el.classList.contains('text-rw-red') && el.textContent!.includes('A'));
});
```
Keep the first test (Hello / We are The Redwood Co. / We are a present on mount).

- [ ] **Step 7: Run tests + build**

Run: `npx vitest run components/hero/useTypewriter.test.ts components/hero/CopyReveal.test.tsx`
Expected: PASS.
Run: `timeout 200 npm run build 2>&1 | tail -8`
Expected: zero errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: typewriter delete/retype phrase cycler with blinking caret"
```

---

## Task 9: Open bottles + loose floating contents

A restrained number of bottles render "open" (cap off), with a few loose particles (pills) drifting nearby — enough to read as "things have come open in the water," never cluttered.

**Files:** Create `components/hero/objects/OpenBottle.tsx`, `components/hero/objects/OpenBottle.test.tsx`. Modify `components/hero/TankScene.tsx` (render a few), `components/hero/quality.ts` (a small `openBottleCount` per tier).

- [ ] **Step 1: Add `openBottleCount` to quality — `quality.ts`**

Add `openBottleCount` to `QualityProfile` and each tier: low `1`, mid `2`, high `4`. (Update the interface + the three returns + the existing `quality.test.ts` is unaffected since it doesn't assert this field — but add a line there asserting `qualityFor('high').openBottleCount > 0` to lock it.)

- [ ] **Step 2: Write the failing render-smoke test — `OpenBottle.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { OpenBottle } from './OpenBottle';

describe('OpenBottle', () => {
  it('mounts the bottle plus its loose contents (a points cloud) without crashing', async () => {
    const renderer = await ReactThreeTestRenderer.create(<OpenBottle seed={3} />);
    expect(renderer.scene.findAllByType('Mesh').length).toBeGreaterThanOrEqual(1);
    expect(renderer.scene.findAllByType('Points').length).toBe(1);
    await renderer.unmount();
  });
});
```

- [ ] **Step 3: Run it, watch it fail**

Run: `npx vitest run components/hero/objects/OpenBottle.test.tsx`
Expected: FAIL — cannot find module.

- [ ] **Step 4: Implement `components/hero/objects/OpenBottle.tsx`**

```tsx
'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, Float32BufferAttribute, PointsMaterial, Points, type Group } from 'three';
import { fieldBottleGeometry } from './proceduralBottleGeo';
import { createGlassMaterial } from './glassMaterial';
import { driftOffset } from './useAmbientDrift';

interface OpenBottleProps {
  seed?: number;
  position?: [number, number, number];
}

export function OpenBottle({ seed = 1, position = [0, 0, 0] }: OpenBottleProps) {
  const bottleGeo = useMemo(() => fieldBottleGeometry(), []);
  const material = useMemo(() => createGlassMaterial(), []);
  const ref = useRef<Group>(null);
  const phase = useMemo(() => (seed % 100) / 100, [seed]);

  const pills = useMemo(() => {
    const n = 7;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 1.2;
      pos[i * 3 + 1] = Math.random() * 0.8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(pos, 3));
    const m = new PointsMaterial({ size: 0.09, color: '#e7dcc6', transparent: true, opacity: 0.8 });
    return new Points(g, m);
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const d = driftOffset(clock.elapsedTime, phase);
    ref.current.position.set(position[0] + d.x, position[1] + d.y, position[2] + d.z);
    ref.current.rotation.set(Math.PI * 0.15 + d.rotX, d.rotY, 0.4 + d.rotZ); // tipped, "open"
  });

  return (
    <group ref={ref} position={position} scale={0.32}>
      <mesh geometry={bottleGeo} material={material} />
      <primitive object={pills} />
    </group>
  );
}
```

- [ ] **Step 5: Render a few in `TankScene.tsx`**

Use `quality.openBottleCount` to scatter that many `OpenBottle`s across the surface (deterministic positions). Example:
```tsx
{Array.from({ length: quality.openBottleCount }).map((_, i) => (
  <OpenBottle key={i} seed={i + 1} position={[(i - 1.5) * 6, 0, (i % 2 ? 4 : -4)]} />
))}
```

- [ ] **Step 6: Run tests + build**

Run: `npx vitest run components/hero/objects/OpenBottle.test.tsx components/hero/quality.test.ts components/hero/TankScene.test.tsx`
Expected: PASS.
Run: `timeout 200 npm run build 2>&1 | tail -8`
Expected: zero errors.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: open bottles leaking loose contents (restrained), tier-gated"
```

---

## Task 10: Distant tanker + sloped shoreline (GLB swap-seam + procedural placeholder)

In the far distance: solid sloped ground with a tanker truck pouring something into the water (the poisoning nod). Built via the existing presence-probe swap-seam — a simple procedural truck-shaped block until the user's `tanker.glb` is dropped in. **Do not model/texture a real truck.**

**Files:** Create `components/hero/scenery/Tanker.tsx`, `components/hero/scenery/Tanker.test.tsx`. Modify `components/hero/TankScene.tsx`.

- [ ] **Step 1: Write the failing render-smoke test — `Tanker.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { Tanker } from './Tanker';

describe('Tanker', () => {
  it('mounts shoreline + procedural truck block + pour stream without crashing', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Tanker />);
    expect(renderer.scene.findAllByType('Mesh').length).toBeGreaterThanOrEqual(2);
    await renderer.unmount();
  });
});
```

- [ ] **Step 2: Run it, watch it fail**

Run: `npx vitest run components/hero/scenery/Tanker.test.tsx`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement `components/hero/scenery/Tanker.tsx`**

Reuse the swap-seam (`useAssetPresence` + `shouldRenderGlb` from `../objects/useOptionalGLTF`). The truck placeholder is a couple of boxes; the shoreline is a tilted plane; the pour is a thin points stream entering the water.
```tsx
'use client';

import { useMemo, useRef, Suspense, Component, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, Float32BufferAttribute, PointsMaterial, Points, type Group } from 'three';
import { useGLTF } from '@react-three/drei';
import { useAssetPresence, shouldRenderGlb } from '../objects/useOptionalGLTF';

const GLB_PATH = '/models/tanker.glb';

class GlbBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function TruckGlb() {
  const { scene } = useGLTF(GLB_PATH) as unknown as { scene: Group };
  return <primitive object={scene} />;
}

function TruckBlock() {
  // Simple truck-shaped placeholder: cab + tank body.
  return (
    <group>
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[3.2, 1.2, 1.4]} />
        <meshStandardMaterial color="#2a2f33" roughness={0.7} />
      </mesh>
      <mesh position={[1.9, 0.7, 0]}>
        <boxGeometry args={[1.1, 1.0, 1.4]} />
        <meshStandardMaterial color="#3a0f12" roughness={0.6} />
      </mesh>
    </group>
  );
}

function PourStream() {
  const ref = useRef<Points>(null);
  const points = useMemo(() => {
    const n = 40;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i*3]= (Math.random()-0.5)*0.2; pos[i*3+1]= -Math.random()*3; pos[i*3+2]=(Math.random()-0.5)*0.2; }
    const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(pos, 3));
    const m = new PointsMaterial({ size: 0.08, color: '#3f6f6a', transparent: true, opacity: 0.7 });
    return new Points(g, m);
  }, []);
  useFrame((_, dt) => {
    const p = points.geometry.getAttribute('position') as Float32BufferAttribute;
    for (let i = 0; i < p.count; i++) { let y = p.getY(i) - dt * 2.5; if (y < -3) y = 0; p.setY(i, y); }
    p.needsUpdate = true;
  });
  return <primitive ref={ref} object={points} />;
}

/** Far-distance shoreline + tanker pouring into the water (easter egg, spec §6.11). */
export function Tanker() {
  const status = useAssetPresence(GLB_PATH);
  const truck = shouldRenderGlb(status)
    ? <GlbBoundary fallback={<TruckBlock />}><Suspense fallback={<TruckBlock />}><TruckGlb /></Suspense></GlbBoundary>
    : <TruckBlock />;

  return (
    <group position={[-22, 0, -26]} rotation={[0, 0.5, 0]}>
      {/* sloped solid ground */}
      <mesh rotation={[-Math.PI / 2 + 0.35, 0, 0]} position={[0, 1.5, -4]}>
        <planeGeometry args={[30, 20]} />
        <meshStandardMaterial color="#15110d" roughness={1} />
      </mesh>
      <group position={[0, 1.6, 1]}>{truck}</group>
      {/* pour from the back of the tank into the water */}
      <group position={[1.4, 0.2, 1]}><PourStream /></group>
    </group>
  );
}
```

- [ ] **Step 4: Render it in `TankScene.tsx`**

Add `import { Tanker } from './scenery/Tanker';` and render `<Tanker />` once. (Far back/left; visible toward the horizon of the top-down framing.)

- [ ] **Step 5: Run tests + build**

Run: `npx vitest run components/hero/scenery/Tanker.test.tsx components/hero/TankScene.test.tsx`
Expected: PASS.
Run: `timeout 200 npm run build 2>&1 | tail -8`
Expected: zero errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: distant tanker + shoreline pouring into the water (GLB seam + procedural block)"
```

---

# Milestone E — Finish

## Task 11: Smoke check, perf re-check, changelog v0.1.1, verification gate

**Files:** Modify `CHANGELOG.md`. (Any final live tuning of constants happens here.)

- [ ] **Step 1: Full suite + production build**

Run: `npx vitest run` — all pass; PEAK contract green.
Run: `timeout 200 npm run build 2>&1 | tail -10` — zero errors.
Confirm Leva still absent from prod: `grep -roE "useControls|LevaPanel|levaStore" .next/static/chunks/ | head` → empty.

- [ ] **Step 2: Real-browser smoke check (dev server, then stop it before any build)**

`npm run dev`; open `http://localhost:3000`; verify against spec §16:
- [ ] Top-down view looking down at the water; surface visibly moving (waves).
- [ ] Bottles small, evenly spread (not clustered), and **drifting** — including the four PEAK bottles (confirm they move).
- [ ] Moving the cursor cuts the water — a ripple radiates and nearby bottles push away then settle.
- [ ] Light sweep travels across the surface; caustics shimmer below.
- [ ] A few open bottles leaking pills; the distant tanker is visible pouring in.
- [ ] Copy: "Hello," / "We are The Redwood Co." / "We are a " + typewriter delete-retype cycling with caret.
- [ ] Hover a PEAK bottle → rotates to read on top of its drift; leaving → drifts back.
- [ ] Join Us → Discord; Apply Now disabled; audio toggle silent until clicked, never autoplays.
Tune constants (camera height, wave amplitude/speed, counts, drift magnitude, scale) live until it reads right; copy final values into the component defaults. Stop the dev server before building.

- [ ] **Step 3: Re-run the perf check under production (spec §13)**

`npm run build && npm start`; confirm acceptable FPS with the new (lighter, spread, smaller) scene. Note the result in the perf notes file. If still heavy, apply the profiling-driven cut identified in Task 3 — not a blind removal.

- [ ] **Step 4: Write the v0.1.1 changelog entry**

Prepend to `CHANGELOG.md` (above v0.1.0), in Redwood's deadpan voice — a "Surfacing" entry covering: the view now looks down on open water; the surface moves and answers your cursor; bottles drift and spread; some have come open; and "if you look toward the far bank, someone's emptying a truck into the water — pay it no mind." Same structural pattern as v0.1.0 (header + subtitle, first-person intro, bolded feature groups, bullet call-outs, closing note).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "docs: v0.1.1 changelog — Surfacing; final tuning + verification"
```

- [ ] **Step 6: Hand off — DO NOT PUSH**

Confirm clean tree on `staging` (`git status`, `git log --oneline -8`), then tell the user the surface rework is complete and ready for them to push. **Do not run `git push`.**

---

# Self-Review (completed by plan author)

**Spec coverage (spec § → task):** copy fix §9.2 → T1; PEAK drift §7.1 → T2; perf §13 → T3,T11; top-down camera/spread/fog §6.1/6.3/6.4 → T4; light sweep/caustics §6.5/6.6 → T5; wave surface §6.6 → T6; cursor displacement §6.7/§10.1 → T7; typewriter §9.2 → T8; open bottles §6.9 → T9; tanker §6.11/§8 → T10; verification §16 + changelog §17 → T11. Submerged/scroll-dive §11–§12 correctly **excluded** (Phase 3).

**Placeholder scan:** none. Pending external assets (tanker/PEAK GLBs, audio) ride the real swap-seam/graceful-silence; not placeholders.

**Type/name consistency:** `driftOffset`/`DriftOffset`; `WaterSurfaceHandle.ripple`; `rippleStrengthForSpeed`; `nextTypeState`/`TypeState`/`useTypewriter`; `openBottleCount` added to `QualityProfile` in T9 and consumed in T9; `useAssetPresence`/`shouldRenderGlb` reused by the tanker. The PEAK contract test is re-verified in T2, T4, T7, T11.

**Engine reuse:** glass, geometry, registry/contract, audio, tokens, quality tiers unchanged. Filename deviation (TankScene kept, not renamed to WaterWorld.scene) is noted in Conventions.
