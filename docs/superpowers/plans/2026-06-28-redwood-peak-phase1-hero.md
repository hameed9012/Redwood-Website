# Redwood Peak — Phase 1 (Landing Page Hero) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Redwood Peak landing-page hero — a real WebGL "Flooded Vault" medical tank (glass bottles/syringes suspended in cold fogged water, rising from darkness, refracting a slow light sweep) with the DOM copy-reveal, CTAs, ambient audio, performance tiers, and a verified four-bottle PEAK tagging contract that Phase 2 depends on.

**Architecture:** Next.js 14 App Router. The hero is one client component owning a single R3F `<Canvas>` that renders *only* the tank; all UI (copy, CTAs, audio toggle, tray slot) is DOM/Tailwind absolutely positioned over the canvas. Pure logic (quality tiers, PEAK registry, audio scheduler, GLB swap-seam, phrase cycling) lives in plain TS modules and is unit-tested with Vitest; rendering components are verified with `@react-three/test-renderer` scene-graph assertions plus a manual smoke check. Glass is `MeshPhysicalMaterial` with `transmission` lit by an HDRI; water ripple and caustics are custom GLSL.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, three, @react-three/fiber, @react-three/drei, @react-three/postprocessing, gsap, leva, Vitest, @react-three/test-renderer, @testing-library/react, jsdom.

**Spec:** `docs/superpowers/specs/2026-06-28-redwood-peak-phase1-hero-design.md` (read it before starting; section refs below point into it).

---

## Conventions for the implementing engineer

- **Run everything from the repo root** `C:\Users\Hameed\work\RedwoodPeak` (PowerShell or Git Bash). Commands below use POSIX form; on PowerShell, `npx`/`npm` work identically, only path globs differ.
- **Commit after every task** with the message shown. Never use `--no-verify`.
- **"Build passes"** always means `npm run build` exits 0 with no type errors.
- **Tunable constants:** several components expose numeric constants wired to Leva in dev. The default values given are deliberately conservative baselines; final values are dialed in during the Task 25 smoke check. Using the defaults is correct — they compile and render; do not invent different ones.
- **Client components:** every file that touches R3F, GSAP, browser APIs, or hooks starts with `'use client'`.
- **The four PEAK pairings are fixed and must never drift:** P=Propofol, E=Etomidate, A=Atropine, K=Ketamine.

---

# Milestone A — Foundation

## Task 1: Scaffold the Next.js app without clobbering existing files

The repo already contains `.git`, `.gitignore`, `docs/`, `.claude/`, `.superpowers/`. `create-next-app` refuses to run in a directory with unknown files, so scaffold into a temp dir and merge up.

**Files:**
- Create: the standard Next.js 14 app tree (`app/`, `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `app/globals.css`, etc.)

- [ ] **Step 1: Scaffold into a temp directory**

Run:
```bash
npx --yes create-next-app@14 _scaffold \
  --typescript --tailwind --app --eslint \
  --no-src-dir --import-alias "@/*" --use-npm
```
Expected: `_scaffold/` is created with a working Next 14 app. No prompts (all answered by flags).

- [ ] **Step 2: Move scaffold contents into the repo root**

Run (Git Bash):
```bash
shopt -s dotglob
mv _scaffold/* .
rmdir _scaffold
shopt -u dotglob
```
PowerShell equivalent:
```powershell
Get-ChildItem -Force _scaffold | Move-Item -Destination . -Force
Remove-Item _scaffold
```
Expected: `package.json`, `app/`, `tsconfig.json`, etc. now live at repo root. The scaffold's `.gitignore` may have overwritten ours — next step restores ours.

- [ ] **Step 3: Restore our `.gitignore` additions**

Open `.gitignore` and confirm it still contains these lines (re-add at the end if `create-next-app` overwrote them):
```
# Claude Code local settings (machine-specific; do not commit)
.claude/settings.local.json

# Superpowers brainstorm scratch (mockups + local server state)
.superpowers/
```

- [ ] **Step 4: Verify dev server boots and build passes**

Run:
```bash
npm run build
```
Expected: build completes, exit 0, "Compiled successfully".

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 14 app (App Router, TS, Tailwind)"
```

---

## Task 2: Install runtime + test dependencies and configure Vitest

**Files:**
- Modify: `package.json` (scripts)
- Create: `vitest.config.ts`, `vitest.setup.ts`

- [ ] **Step 1: Install runtime dependencies**

Run:
```bash
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing gsap leva
```

- [ ] **Step 2: Install dev/test dependencies**

Run:
```bash
npm install -D vitest @vitejs/plugin-react jsdom @react-three/test-renderer @testing-library/react @testing-library/jest-dom @types/three
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
```

- [ ] **Step 4: Create `vitest.setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 5: Add test scripts to `package.json`**

In the `"scripts"` block, add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Add a smoke test to prove the runner works**

Create `lib/__smoke__.test.ts`:
```ts
import { describe, it, expect } from 'vitest';

describe('vitest', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 7: Run the test**

Run: `npm test`
Expected: 1 passing test.

- [ ] **Step 8: Delete the smoke test and commit**

```bash
rm lib/__smoke__.test.ts
git add -A
git commit -m "chore: add R3F/GSAP/Leva deps and Vitest test harness"
```

---

## Task 3: Design tokens (CSS variables + JS constants + Tailwind bridge)

The Three.js materials need the palette as JS color values; the DOM needs CSS vars. Define both from one source so they can't drift.

**Files:**
- Create: `styles/tokens.ts`, `styles/tokens.css`
- Test: `styles/tokens.test.ts`
- Modify: `app/globals.css` (import tokens.css), `tailwind.config.ts` (map tokens to theme)

- [ ] **Step 1: Write the failing test**

Create `styles/tokens.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { TOKENS } from './tokens';

describe('design tokens', () => {
  it('exposes the five brand colors as hex strings', () => {
    expect(TOKENS.black).toBe('#0a0a0a');
    expect(TOKENS.charcoal).toBe('#141414');
    expect(TOKENS.red).toBe('#c1272d');
    expect(TOKENS.redDeep).toBe('#7a1518');
    expect(TOKENS.bone).toBe('#f5f5f4');
  });

  it('every value is a 6-digit hex', () => {
    for (const v of Object.values(TOKENS)) {
      expect(v).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run styles/tokens.test.ts`
Expected: FAIL — cannot find module `./tokens`.

- [ ] **Step 3: Create `styles/tokens.ts`**

```ts
/** Single source of truth for the Redwood Peak palette (spec §3). */
export const TOKENS = {
  black: '#0a0a0a',
  charcoal: '#141414',
  red: '#c1272d',
  redDeep: '#7a1518',
  bone: '#f5f5f4',
} as const;

export type TokenName = keyof typeof TOKENS;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run styles/tokens.test.ts`
Expected: PASS.

- [ ] **Step 5: Create `styles/tokens.css`**

```css
:root {
  --rw-black: #0a0a0a;
  --rw-charcoal: #141414;
  --rw-red: #c1272d;
  --rw-red-deep: #7a1518;
  --rw-bone: #f5f5f4;
}
```

- [ ] **Step 6: Import tokens into `app/globals.css`**

At the very top of `app/globals.css`, above the Tailwind directives:
```css
@import '../styles/tokens.css';
```

- [ ] **Step 7: Map tokens into Tailwind theme**

In `tailwind.config.ts`, inside `theme.extend.colors`, add:
```ts
colors: {
  'rw-black': 'var(--rw-black)',
  'rw-charcoal': 'var(--rw-charcoal)',
  'rw-red': 'var(--rw-red)',
  'rw-red-deep': 'var(--rw-red-deep)',
  'rw-bone': 'var(--rw-bone)',
},
```

- [ ] **Step 8: Verify build + test, then commit**

Run: `npm run build && npm test`
Expected: build succeeds, all tests pass.
```bash
git add -A
git commit -m "feat: design tokens (CSS vars + JS constants + Tailwind bridge)"
```

---

## Task 4: Brand + scene assets (logo, mark, HDRI, audio)

These are asset-acquisition steps, verified by a "files exist" test so later tasks can rely on the paths.

**Files:**
- Create: `public/brand/redwood-peak-logo.png` (user-provided), `public/brand/redwood-peak-mark.svg`, `public/hdri/dark-studio.hdr`, `public/hdri/dark-studio-low.hdr`, `public/audio/{drip,creak,bubble,water}.ogg`
- Create: `public/assets.test.ts`

- [ ] **Step 1: Place the logo**

Ensure the user's logo PNG is saved at `public/brand/redwood-peak-logo.png`. If absent, stop and ask the user for it (spec §15 lists it as a dependency).

- [ ] **Step 2: Create the monochrome mark SVG**

Create `public/brand/redwood-peak-mark.svg` — a single-color (currentColor) mountain+pine silhouette used behind the water. Use this baseline (a clean stylized peak+tree; refine later if a traced version of the logo is preferred):
```svg
<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
  <path d="M100 18 L120 70 L108 70 L132 120 L116 120 L150 178 L50 178 L84 120 L68 120 L92 70 L80 70 Z"/>
  <path d="M30 178 L70 120 L60 120 L88 150 L60 178 Z" opacity="0.7"/>
  <path d="M170 178 L130 120 L140 120 L112 150 L140 178 Z" opacity="0.7"/>
</svg>
```

- [ ] **Step 3: Source a CC0 dark-studio HDRI**

Download a small CC0 studio/dark environment `.hdr` (e.g. from polyhaven.com, 1k resolution) to `public/hdri/dark-studio.hdr`, and a 512px variant to `public/hdri/dark-studio-low.hdr`. These only feed glass reflections; any dark, low-contrast studio HDRI works.

- [ ] **Step 4: Source four CC0 ambient clips**

Download four short CC0 clips (freesound.org CC0 filter or similar), trim to 1–3s, and save as `public/audio/drip.ogg`, `public/audio/creak.ogg`, `public/audio/bubble.ogg`, `public/audio/water.ogg`.

- [ ] **Step 5: Write the "assets exist" test**

Create `public/assets.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '..');
const required = [
  'public/brand/redwood-peak-logo.png',
  'public/brand/redwood-peak-mark.svg',
  'public/hdri/dark-studio.hdr',
  'public/hdri/dark-studio-low.hdr',
  'public/audio/drip.ogg',
  'public/audio/creak.ogg',
  'public/audio/bubble.ogg',
  'public/audio/water.ogg',
];

describe('brand + scene assets', () => {
  for (const rel of required) {
    it(`exists: ${rel}`, () => {
      expect(existsSync(path.join(root, rel))).toBe(true);
    });
  }
});
```

- [ ] **Step 6: Run the test**

Run: `npx vitest run public/assets.test.ts`
Expected: PASS (all 8 assets present).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add brand mark, HDRI, and ambient audio assets"
```

---

# Milestone B — Pure logic (TDD)

## Task 5: Quality tier detection + scene count constants

**Files:**
- Create: `components/hero/quality.ts`
- Test: `components/hero/quality.test.ts`

- [ ] **Step 1: Write the failing test**

Create `components/hero/quality.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { detectTier, qualityFor, type Tier } from './quality';

describe('detectTier', () => {
  it('returns "low" for few cores / low memory / coarse pointer', () => {
    const t = detectTier({ cores: 2, memoryGb: 2, coarsePointer: true });
    expect(t).toBe('low');
  });

  it('returns "high" for many cores / ample memory / fine pointer', () => {
    const t = detectTier({ cores: 12, memoryGb: 16, coarsePointer: false });
    expect(t).toBe('high');
  });

  it('returns "mid" in between', () => {
    const t = detectTier({ cores: 6, memoryGb: 8, coarsePointer: false });
    expect(t).toBe('mid');
  });
});

describe('qualityFor', () => {
  it('low tier drops postprocessing and caustics and caps dpr at 1', () => {
    const q = qualityFor('low');
    expect(q.postprocessing).toBe(false);
    expect(q.caustics).toBe(false);
    expect(q.maxDpr).toBe(1);
    expect(q.bottleCount).toBeLessThan(qualityFor('high').bottleCount);
  });

  it('high tier enables postprocessing and caustics', () => {
    const q = qualityFor('high');
    expect(q.postprocessing).toBe(true);
    expect(q.caustics).toBe(true);
    expect(q.maxDpr).toBeGreaterThanOrEqual(1.5);
  });

  it('every tier keeps the 4 PEAK bottles present', () => {
    (['low', 'mid', 'high'] as Tier[]).forEach((t) => {
      expect(qualityFor(t).heroBottlesPresent).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/hero/quality.test.ts`
Expected: FAIL — cannot find `./quality`.

- [ ] **Step 3: Implement `components/hero/quality.ts`**

```ts
'use client';

export type Tier = 'low' | 'mid' | 'high';

export interface DeviceSignals {
  cores: number;
  memoryGb: number;
  coarsePointer: boolean;
}

export interface QualityProfile {
  maxDpr: number;
  bottleCount: number;
  bubbleCount: number;
  postprocessing: boolean;
  caustics: boolean;
  hdriPath: string;
  heroBottlesPresent: boolean;
}

export function detectTier(s: DeviceSignals): Tier {
  let score = 0;
  if (s.cores >= 8) score += 2;
  else if (s.cores >= 4) score += 1;
  if (s.memoryGb >= 8) score += 2;
  else if (s.memoryGb >= 4) score += 1;
  if (!s.coarsePointer) score += 1;

  if (score <= 2) return 'low';
  if (score <= 4) return 'mid';
  return 'high';
}

export function qualityFor(tier: Tier): QualityProfile {
  const base = { heroBottlesPresent: true };
  switch (tier) {
    case 'low':
      return { ...base, maxDpr: 1, bottleCount: 10, bubbleCount: 20, postprocessing: false, caustics: false, hdriPath: '/hdri/dark-studio-low.hdr' };
    case 'mid':
      return { ...base, maxDpr: 1.5, bottleCount: 22, bubbleCount: 50, postprocessing: true, caustics: true, hdriPath: '/hdri/dark-studio-low.hdr' };
    case 'high':
      return { ...base, maxDpr: 2, bottleCount: 38, bubbleCount: 90, postprocessing: true, caustics: true, hdriPath: '/hdri/dark-studio.hdr' };
  }
}

/** Reads real browser signals; falls back to "mid" during SSR. */
export function detectTierFromBrowser(): Tier {
  if (typeof navigator === 'undefined') return 'mid';
  const cores = navigator.hardwareConcurrency ?? 4;
  // deviceMemory is non-standard; default to a middling 4GB when absent.
  const memoryGb = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const coarsePointer = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
  return detectTier({ cores, memoryGb, coarsePointer });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/hero/quality.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: device quality tiers and per-tier scene profiles"
```

---

## Task 6: PEAK bottle definitions + scene registry (the Phase 2 contract)

**Files:**
- Create: `components/hero/peak.ts`
- Test: `components/hero/peak.test.ts`

- [ ] **Step 1: Write the failing test**

Create `components/hero/peak.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { PEAK_BOTTLES, PeakRegistry, type PeakLetter } from './peak';

describe('PEAK definitions', () => {
  it('has exactly four bottles spelling P-E-A-K with fixed drug pairings', () => {
    expect(PEAK_BOTTLES.map((b) => b.letter)).toEqual(['P', 'E', 'A', 'K']);
    const byLetter = Object.fromEntries(PEAK_BOTTLES.map((b) => [b.letter, b.drug]));
    expect(byLetter).toEqual({ P: 'Propofol', E: 'Etomidate', A: 'Atropine', K: 'Ketamine' });
  });

  it('letters are unique', () => {
    const letters = PEAK_BOTTLES.map((b) => b.letter);
    expect(new Set(letters).size).toBe(4);
  });
});

describe('PeakRegistry', () => {
  let reg: PeakRegistry;
  beforeEach(() => { reg = new PeakRegistry(); });

  it('registers and queries the four as a set', () => {
    const fakeObj = (l: PeakLetter) => ({ userData: {} } as any);
    PEAK_BOTTLES.forEach((b) => reg.register(b.letter, fakeObj(b.letter)));
    const all = reg.all();
    expect(all).toHaveLength(4);
    expect(all.map((e) => e.letter).sort()).toEqual(['A', 'E', 'K', 'P']);
    expect(reg.get('K')?.drug).toBe('Ketamine');
  });

  it('isComplete() is false until all four are present', () => {
    expect(reg.isComplete()).toBe(false);
    PEAK_BOTTLES.forEach((b) => reg.register(b.letter, { userData: {} } as any));
    expect(reg.isComplete()).toBe(true);
  });

  it('tagObject writes isPeakBottle/letter/drug onto userData', () => {
    const obj = { userData: {} } as any;
    reg.tagObject(obj, 'A');
    expect(obj.userData.isPeakBottle).toBe(true);
    expect(obj.userData.peakLetter).toBe('A');
    expect(obj.userData.drug).toBe('Atropine');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/hero/peak.test.ts`
Expected: FAIL — cannot find `./peak`.

- [ ] **Step 3: Implement `components/hero/peak.ts`**

```ts
import type { Object3D } from 'three';

export type PeakLetter = 'P' | 'E' | 'A' | 'K';

export interface PeakBottleDef {
  letter: PeakLetter;
  drug: string;
}

/** Fixed pairings — must never drift (spec §8). */
export const PEAK_BOTTLES: readonly PeakBottleDef[] = [
  { letter: 'P', drug: 'Propofol' },
  { letter: 'E', drug: 'Etomidate' },
  { letter: 'A', drug: 'Atropine' },
  { letter: 'K', drug: 'Ketamine' },
] as const;

export function drugFor(letter: PeakLetter): string {
  const def = PEAK_BOTTLES.find((b) => b.letter === letter);
  if (!def) throw new Error(`Unknown PEAK letter: ${letter}`);
  return def.drug;
}

export interface PeakEntry {
  letter: PeakLetter;
  drug: string;
  object: Object3D;
}

/**
 * Holds the four tagged hero bottles so they are queryable as a set from
 * outside the objects themselves. Phase 2's drag/order/solve keys off this.
 */
export class PeakRegistry {
  private entries = new Map<PeakLetter, PeakEntry>();

  tagObject(object: Object3D, letter: PeakLetter): void {
    const drug = drugFor(letter);
    object.userData.isPeakBottle = true;
    object.userData.peakLetter = letter;
    object.userData.drug = drug;
  }

  register(letter: PeakLetter, object: Object3D): void {
    this.tagObject(object, letter);
    this.entries.set(letter, { letter, drug: drugFor(letter), object });
  }

  get(letter: PeakLetter): PeakEntry | undefined {
    return this.entries.get(letter);
  }

  all(): PeakEntry[] {
    return Array.from(this.entries.values());
  }

  isComplete(): boolean {
    return (['P', 'E', 'A', 'K'] as PeakLetter[]).every((l) => this.entries.has(l));
  }

  clear(): void {
    this.entries.clear();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/hero/peak.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: PEAK bottle definitions and queryable scene registry"
```

---

## Task 7: Ambient audio scheduler (randomized, off by default)

**Files:**
- Create: `lib/audio/AmbientScheduler.ts`
- Test: `lib/audio/AmbientScheduler.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/audio/AmbientScheduler.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AmbientScheduler } from './AmbientScheduler';

describe('AmbientScheduler', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.restoreAllMocks());

  function makeScheduler(rngValues: number[]) {
    const played: { clip: string; volume: number }[] = [];
    let i = 0;
    const rng = () => rngValues[i++ % rngValues.length];
    const s = new AmbientScheduler({
      clips: ['a', 'b', 'c', 'd'],
      minDelayMs: 1000,
      maxDelayMs: 5000,
      minVolume: 0.1,
      maxVolume: 0.6,
      rng,
      play: (clip, volume) => played.push({ clip, volume }),
    });
    return { s, played };
  }

  it('does not play until started (off by default)', () => {
    const { s, played } = makeScheduler([0.5]);
    vi.advanceTimersByTime(10000);
    expect(played).toHaveLength(0);
    expect(s.isEnabled()).toBe(false);
  });

  it('plays after a randomized delay once enabled', () => {
    const { s, played } = makeScheduler([0, 0, 0]); // pick first clip, min delay, min volume
    s.enable();
    vi.advanceTimersByTime(999);
    expect(played).toHaveLength(0);
    vi.advanceTimersByTime(1);
    expect(played).toHaveLength(1);
    expect(played[0].clip).toBe('a');
    expect(played[0].volume).toBeCloseTo(0.1, 5);
  });

  it('randomizes delay and volume within bounds across plays', () => {
    const { s, played } = makeScheduler([0.5, 0.5, 0.5]);
    s.enable();
    vi.advanceTimersByTime(3000); // delay = 1000 + 0.5*4000 = 3000
    expect(played).toHaveLength(1);
    expect(played[0].volume).toBeCloseTo(0.35, 5);
  });

  it('disable() stops further playback', () => {
    const { s, played } = makeScheduler([0, 0, 0]);
    s.enable();
    vi.advanceTimersByTime(1000);
    s.disable();
    vi.advanceTimersByTime(20000);
    expect(played).toHaveLength(1);
    expect(s.isEnabled()).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/audio/AmbientScheduler.test.ts`
Expected: FAIL — cannot find `./AmbientScheduler`.

- [ ] **Step 3: Implement `lib/audio/AmbientScheduler.ts`**

```ts
'use client';

export interface AmbientSchedulerOptions {
  clips: string[];
  minDelayMs: number;
  maxDelayMs: number;
  minVolume: number;
  maxVolume: number;
  /** Injectable for tests; defaults to Math.random. */
  rng?: () => number;
  /** Injectable for tests; defaults to HTMLAudioElement playback. */
  play?: (clip: string, volume: number) => void;
}

export class AmbientScheduler {
  private opts: Required<AmbientSchedulerOptions>;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private enabled = false;

  constructor(options: AmbientSchedulerOptions) {
    this.opts = {
      rng: Math.random,
      play: (clip, volume) => {
        const audio = new Audio(clip);
        audio.volume = volume;
        void audio.play().catch(() => undefined);
      },
      ...options,
    };
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /** Begins scheduling. Never called automatically — user must opt in. */
  enable(): void {
    if (this.enabled) return;
    this.enabled = true;
    this.scheduleNext();
  }

  disable(): void {
    this.enabled = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private scheduleNext(): void {
    const { minDelayMs, maxDelayMs, rng } = this.opts;
    const delay = minDelayMs + rng() * (maxDelayMs - minDelayMs);
    this.timer = setTimeout(() => this.fire(), delay);
  }

  private fire(): void {
    if (!this.enabled) return;
    const { clips, minVolume, maxVolume, rng, play } = this.opts;
    const clip = clips[Math.floor(rng() * clips.length)] ?? clips[0];
    const volume = minVolume + rng() * (maxVolume - minVolume);
    play(clip, volume);
    this.scheduleNext();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/audio/AmbientScheduler.test.ts`
Expected: PASS (all 4 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: randomized ambient audio scheduler (off by default)"
```

---

## Task 8: Hero phrase data + cycling logic

**Files:**
- Create: `components/hero/phrases.ts`
- Test: `components/hero/phrases.test.ts`

- [ ] **Step 1: Write the failing test**

Create `components/hero/phrases.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { HERO_PHRASES, nextPhraseIndex } from './phrases';

describe('hero phrases', () => {
  it('is the exact spec list in order', () => {
    expect(HERO_PHRASES).toEqual([
      'A Pharmaceutical company',
      'A Technological company',
      'Creators for the better good of America',
      'Outdoor camping equipment sellers',
      'A logistics company',
    ]);
  });

  it('cycles continuously and wraps', () => {
    expect(nextPhraseIndex(0, HERO_PHRASES.length)).toBe(1);
    expect(nextPhraseIndex(4, HERO_PHRASES.length)).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/hero/phrases.test.ts`
Expected: FAIL — cannot find `./phrases`.

- [ ] **Step 3: Implement `components/hero/phrases.ts`**

```ts
/** The cycling red phrases after "We are a" (spec §7.2). Order is exact. */
export const HERO_PHRASES = [
  'A Pharmaceutical company',
  'A Technological company',
  'Creators for the better good of America',
  'Outdoor camping equipment sellers',
  'A logistics company',
] as const;

export function nextPhraseIndex(current: number, length: number): number {
  return (current + 1) % length;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/hero/phrases.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: hero cycling phrase data and index logic"
```

---

## Task 9: GLB swap-seam decision helper

The seam (spec §8): try to load a `.glb`; fall back to procedural when absent — all isolated in one helper so the scene graph never changes when a model is dropped in.

**Files:**
- Create: `components/hero/objects/useOptionalGLTF.ts`
- Test: `components/hero/objects/useOptionalGLTF.test.ts`

- [ ] **Step 1: Write the failing test (pure decision function)**

Create `components/hero/objects/useOptionalGLTF.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { shouldRenderGlb } from './useOptionalGLTF';

describe('shouldRenderGlb', () => {
  it('attempts GLB only when the probe confirms the file is present', () => {
    expect(shouldRenderGlb('present')).toBe(true);
  });

  it('falls back to procedural when absent or still pending', () => {
    expect(shouldRenderGlb('absent')).toBe(false);
    expect(shouldRenderGlb('pending')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/hero/objects/useOptionalGLTF.test.ts`
Expected: FAIL — cannot find `./useOptionalGLTF`.

- [ ] **Step 3: Implement `components/hero/objects/useOptionalGLTF.ts`**

```ts
'use client';

import { useEffect, useState } from 'react';

export type AssetStatus = 'pending' | 'present' | 'absent';

/** Pure decision: attempt GLB rendering only when the probe confirms presence. Unit-tested. */
export function shouldRenderGlb(status: AssetStatus): boolean {
  return status === 'present';
}

/**
 * Probes (HTTP HEAD) whether a GLB exists at `path` without ever throwing.
 * Returns 'pending' until the probe resolves, then 'present' | 'absent'.
 *
 * This is the swap-seam (spec §8): `useGLTF` suspends/throws on a missing
 * file, so we must NOT call it until we know the file is there. The probe
 * lets HeroBottle render procedural immediately and only mount the
 * GLB-loading child (inside Suspense + an ErrorBoundary) once the file is
 * confirmed present — so a missing model silently falls back to procedural,
 * and dropping a real .glb in later "just works" with zero edits elsewhere.
 */
export function useAssetPresence(path: string): AssetStatus {
  const [status, setStatus] = useState<AssetStatus>('pending');

  useEffect(() => {
    let cancelled = false;
    fetch(path, { method: 'HEAD' })
      .then((res) => {
        if (!cancelled) setStatus(res.ok ? 'present' : 'absent');
      })
      .catch(() => {
        if (!cancelled) setStatus('absent');
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return status;
}
```

Note: `useGLTF` is intentionally NOT called here — calling it inside a promise/effect is an invalid hook call. It is called at the top level of the `GlbBottle` child in Task 13, which only mounts when `shouldRenderGlb(status)` is true, wrapped in Suspense + an ErrorBoundary whose fallback is the procedural bottle. The procedural bottle renders immediately for `pending`/`absent`, so the scene never suspends on a missing file and the PEAK tagging fires at t0.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/hero/objects/useOptionalGLTF.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: GLB-or-procedural swap-seam helper"
```

---

# Milestone C — Geometry & materials

## Task 10: Procedural geometry builders (field + detailed hero)

**Files:**
- Create: `components/hero/objects/proceduralBottleGeo.ts`
- Test: `components/hero/objects/proceduralBottleGeo.test.ts`

- [ ] **Step 1: Write the failing test**

Create `components/hero/objects/proceduralBottleGeo.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { BufferGeometry } from 'three';
import { fieldBottleGeometry, heroBottleGeometry, syringeGeometry } from './proceduralBottleGeo';

describe('procedural geometry builders', () => {
  it('field bottle returns a BufferGeometry with positions', () => {
    const g = fieldBottleGeometry();
    expect(g).toBeInstanceOf(BufferGeometry);
    expect(g.getAttribute('position').count).toBeGreaterThan(0);
  });

  it('hero bottle is higher-resolution than the field bottle', () => {
    const field = fieldBottleGeometry();
    const hero = heroBottleGeometry();
    expect(hero.getAttribute('position').count).toBeGreaterThan(field.getAttribute('position').count);
  });

  it('syringe returns a BufferGeometry with positions', () => {
    const g = syringeGeometry();
    expect(g.getAttribute('position').count).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/hero/objects/proceduralBottleGeo.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement `components/hero/objects/proceduralBottleGeo.ts`**

```ts
import { LatheGeometry, CylinderGeometry, BufferGeometry, Vector2 } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** A pill-bottle silhouette as lathe points (x = radius, y = height). */
function bottleProfile(): Vector2[] {
  return [
    new Vector2(0.0, 0.0),
    new Vector2(0.32, 0.0),
    new Vector2(0.32, 0.9),
    new Vector2(0.30, 1.05),
    new Vector2(0.20, 1.12),
    new Vector2(0.20, 1.30), // neck
    new Vector2(0.26, 1.34), // cap lip
    new Vector2(0.26, 1.46), // cap
    new Vector2(0.0, 1.46),
  ];
}

export function fieldBottleGeometry(): BufferGeometry {
  const g = new LatheGeometry(bottleProfile(), 16);
  g.center();
  return g;
}

export function heroBottleGeometry(): BufferGeometry {
  // Higher segment count + a distinct cap ring for a richer read up close.
  const body = new LatheGeometry(bottleProfile(), 48);
  const capRing = new CylinderGeometry(0.27, 0.27, 0.06, 48);
  capRing.translate(0, 1.4, 0);
  const merged = mergeGeometries([body, capRing], false);
  merged.center();
  return merged;
}

export function syringeGeometry(): BufferGeometry {
  const barrel = new CylinderGeometry(0.12, 0.12, 1.1, 24);
  const needle = new CylinderGeometry(0.015, 0.015, 0.5, 12);
  needle.translate(0, 0.8, 0);
  const plunger = new CylinderGeometry(0.13, 0.13, 0.08, 24);
  plunger.translate(0, -0.6, 0);
  const merged = mergeGeometries([barrel, needle, plunger], false);
  merged.center();
  return merged;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/hero/objects/proceduralBottleGeo.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: procedural bottle/syringe geometry (field + detailed hero)"
```

---

## Task 11: Shared glass material factory

**Files:**
- Create: `components/hero/objects/glassMaterial.ts`
- Test: `components/hero/objects/glassMaterial.test.ts`

- [ ] **Step 1: Write the failing test**

Create `components/hero/objects/glassMaterial.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { MeshPhysicalMaterial } from 'three';
import { createGlassMaterial } from './glassMaterial';

describe('createGlassMaterial', () => {
  it('returns a MeshPhysicalMaterial with transmission enabled', () => {
    const m = createGlassMaterial();
    expect(m).toBeInstanceOf(MeshPhysicalMaterial);
    expect(m.transmission).toBeGreaterThan(0.5);
    expect(m.roughness).toBeLessThan(0.5);
    expect(m.ior).toBeGreaterThan(1);
  });

  it('accepts a tint override', () => {
    const m = createGlassMaterial({ color: '#7a1518' });
    expect(m.color.getHexString()).toBe('7a1518');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/hero/objects/glassMaterial.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement `components/hero/objects/glassMaterial.ts`**

```ts
import { MeshPhysicalMaterial, Color } from 'three';

export interface GlassOptions {
  color?: string;
}

/** Single glass recipe used by every bottle/syringe (spec §6.2). */
export function createGlassMaterial(opts: GlassOptions = {}): MeshPhysicalMaterial {
  return new MeshPhysicalMaterial({
    color: new Color(opts.color ?? '#dfeede'),
    transmission: 1,
    transparent: true,
    opacity: 1,
    roughness: 0.12,
    metalness: 0,
    ior: 1.45,
    thickness: 0.6,
    attenuationColor: new Color('#2c4a4d'),
    attenuationDistance: 2.5,
    clearcoat: 0.4,
    clearcoatRoughness: 0.2,
    envMapIntensity: 1.0,
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/hero/objects/glassMaterial.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: shared MeshPhysicalMaterial glass factory"
```

---

# Milestone D — Scene components

## Task 12: Background field bottle + syringe components (instanced)

**Files:**
- Create: `components/hero/objects/FieldObjects.tsx`
- Test: `components/hero/objects/FieldObjects.test.tsx`

- [ ] **Step 1: Write the failing render-smoke test**

Create `components/hero/objects/FieldObjects.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { FieldObjects } from './FieldObjects';

describe('FieldObjects', () => {
  it('renders the requested number of field objects without crashing', async () => {
    const renderer = await ReactThreeTestRenderer.create(<FieldObjects count={6} />);
    const meshes = renderer.scene.findAllByType('Mesh');
    expect(meshes.length).toBeGreaterThanOrEqual(6);
    await renderer.unmount();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/hero/objects/FieldObjects.test.tsx`
Expected: FAIL — cannot find `./FieldObjects`.

- [ ] **Step 3: Implement `components/hero/objects/FieldObjects.tsx`**

```tsx
'use client';

import { useMemo } from 'react';
import { fieldBottleGeometry, syringeGeometry } from './proceduralBottleGeo';
import { createGlassMaterial } from './glassMaterial';

interface FieldObjectsProps {
  count: number;
  /** Deterministic seed so SSR/CSR agree; defaults to a fixed value. */
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

  const items = useMemo(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: count }, (_, i) => ({
      key: i,
      isSyringe: rand() > 0.7,
      // Distributed across real z-depth: most far back (negative z).
      position: [
        (rand() - 0.5) * 8,
        (rand() - 0.5) * 6,
        -1 - rand() * 12,
      ] as [number, number, number],
      rotation: [rand() * Math.PI, rand() * Math.PI, rand() * Math.PI] as [number, number, number],
      scale: 0.6 + rand() * 0.8,
    }));
  }, [count, seed]);

  const material = useMemo(() => createGlassMaterial(), []);

  return (
    <group>
      {items.map((it) => (
        <mesh
          key={it.key}
          geometry={it.isSyringe ? syringeGeo : bottleGeo}
          material={material}
          position={it.position}
          rotation={it.rotation}
          scale={it.scale}
        />
      ))}
    </group>
  );
}
```

Note: spec §6.3 says "instanced." A per-mesh group is used first because each object needs an independent drift/rise timeline (Task 18) and per-object raycast; instancing is a Phase 7 perf optimization and is intentionally deferred. Count is still tier-gated.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/hero/objects/FieldObjects.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: instanceable background field bottles/syringes"
```

---

## Task 13: HeroBottle component + tagging — and the PEAK contract test

This is the spec's headline contract. The component renders procedural geometry immediately, swaps to GLB when present, and registers itself into a `PeakRegistry` so the four are queryable as a set.

**Files:**
- Create: `components/hero/objects/HeroBottle.tsx`, `components/hero/objects/HeroBottles.tsx`
- Test: `components/hero/objects/HeroBottles.test.tsx`

- [ ] **Step 1: Write the failing contract test**

Create `components/hero/objects/HeroBottles.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { HeroBottles } from './HeroBottles';
import { PeakRegistry } from '../peak';

describe('PEAK tagging contract (spec §13)', () => {
  it('renders exactly four hero bottles, each correctly tagged and queryable as a set', async () => {
    const registry = new PeakRegistry();
    const renderer = await ReactThreeTestRenderer.create(<HeroBottles registry={registry} />);

    // Registry resolves all four with correct letter+drug pairings.
    const all = registry.all();
    expect(all).toHaveLength(4);
    expect(registry.isComplete()).toBe(true);
    expect(all.map((e) => e.letter).sort()).toEqual(['A', 'E', 'K', 'P']);
    expect(registry.get('P')?.drug).toBe('Propofol');
    expect(registry.get('E')?.drug).toBe('Etomidate');
    expect(registry.get('A')?.drug).toBe('Atropine');
    expect(registry.get('K')?.drug).toBe('Ketamine');

    // Each registered Object3D carries the tagging on userData.
    for (const entry of all) {
      expect(entry.object.userData.isPeakBottle).toBe(true);
      expect(entry.object.userData.peakLetter).toBe(entry.letter);
      expect(entry.object.userData.drug).toBe(entry.drug);
    }

    await renderer.unmount();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/hero/objects/HeroBottles.test.tsx`
Expected: FAIL — cannot find `./HeroBottles`.

- [ ] **Step 3: Implement `components/hero/objects/HeroBottle.tsx`**

```tsx
'use client';

import { useRef, useEffect, Suspense, Component, type ReactNode } from 'react';
import type { Mesh, Object3D, Group } from 'three';
import { useGLTF } from '@react-three/drei';
import { heroBottleGeometry } from './proceduralBottleGeo';
import { createGlassMaterial } from './glassMaterial';
import { useAssetPresence, shouldRenderGlb } from './useOptionalGLTF';
import type { PeakLetter } from '../peak';

interface HeroBottleProps {
  letter: PeakLetter;
  position: [number, number, number];
  /** Called with the rendered root Object3D so a registry can tag + track it. */
  onReady: (letter: PeakLetter, object: Object3D) => void;
}

const GLB_PATH: Record<PeakLetter, string> = {
  P: '/models/hero-bottle-p.glb',
  E: '/models/hero-bottle-e.glb',
  A: '/models/hero-bottle-a.glb',
  K: '/models/hero-bottle-k.glb',
};

/** If a committed .glb fails to load/parse, fall back to procedural. */
class GlbErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function ProceduralBottle({ letter, onReady }: { letter: PeakLetter; onReady: HeroBottleProps['onReady'] }) {
  const ref = useRef<Mesh>(null);
  useEffect(() => {
    if (ref.current) onReady(letter, ref.current);
  }, [letter, onReady]);
  return <mesh ref={ref} geometry={heroBottleGeometry()} material={createGlassMaterial()} />;
}

function GlbBottle({ letter, path, onReady }: { letter: PeakLetter; path: string; onReady: HeroBottleProps['onReady'] }) {
  const { scene } = useGLTF(path) as unknown as { scene: Group };
  const ref = useRef<Group>(null);
  useEffect(() => {
    if (ref.current) onReady(letter, ref.current);
  }, [letter, onReady]);
  // Drop-in: a committed .glb at GLB_PATH renders here with zero edits elsewhere.
  return <primitive ref={ref} object={scene} />;
}

export function HeroBottle({ letter, position, onReady }: HeroBottleProps) {
  const status = useAssetPresence(GLB_PATH[letter]);
  // Procedural renders immediately for pending/absent, so tagging fires at t0
  // and the scene never suspends on a missing model file.
  const procedural = <ProceduralBottle letter={letter} onReady={onReady} />;

  return (
    <group position={position}>
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

Note (Task 20 will add hover): `RESTING_LABEL_AWAY` rotation and `onPointerOver/Out` get added to BOTH the `ProceduralBottle` `<mesh>` and the `GlbBottle` `<primitive>` in Task 20 so behavior is identical regardless of geometry source. Do not add hover in Task 13.

- [ ] **Step 4: Implement `components/hero/objects/HeroBottles.tsx`**

```tsx
'use client';

import { useCallback } from 'react';
import type { Object3D } from 'three';
import { HeroBottle } from './HeroBottle';
import { PEAK_BOTTLES, type PeakLetter, type PeakRegistry } from '../peak';

interface HeroBottlesProps {
  registry: PeakRegistry;
}

/** Fixed resting positions for the four PEAK bottles in the foreground. */
const POSITIONS: Record<PeakLetter, [number, number, number]> = {
  P: [-2.4, -0.5, 1.5],
  E: [-0.8, 0.3, 1.2],
  A: [0.8, -0.3, 1.4],
  K: [2.4, 0.5, 1.1],
};

export function HeroBottles({ registry }: HeroBottlesProps) {
  const handleReady = useCallback(
    (letter: PeakLetter, object: Object3D) => {
      registry.register(letter, object);
    },
    [registry],
  );

  return (
    <group>
      {PEAK_BOTTLES.map((b) => (
        <HeroBottle
          key={b.letter}
          letter={b.letter}
          position={POSITIONS[b.letter]}
          onReady={handleReady}
        />
      ))}
    </group>
  );
}
```

- [ ] **Step 5: Run the contract test to verify it passes**

Run: `npx vitest run components/hero/objects/HeroBottles.test.tsx`
Expected: PASS — exactly four bottles, registry complete, all pairings correct.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: HeroBottle swap-seam + four-bottle PEAK tagging contract"
```

---

## Task 14: Bubbles particle stream

**Files:**
- Create: `components/hero/Bubbles.tsx`
- Test: `components/hero/Bubbles.test.tsx`

- [ ] **Step 1: Write the failing render-smoke test**

Create `components/hero/Bubbles.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { Bubbles } from './Bubbles';

describe('Bubbles', () => {
  it('renders a points object without crashing', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Bubbles count={30} />);
    const points = renderer.scene.findAllByType('Points');
    expect(points.length).toBe(1);
    await renderer.unmount();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/hero/Bubbles.test.tsx`
Expected: FAIL — cannot find `./Bubbles`.

- [ ] **Step 3: Implement `components/hero/Bubbles.tsx`**

```tsx
'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, BufferGeometry, Float32BufferAttribute, PointsMaterial } from 'three';

interface BubblesProps {
  count: number;
}

export function Bubbles({ count }: BubblesProps) {
  const ref = useRef<Points>(null);

  const { geometry, material, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = -1 - Math.random() * 10;
      speeds[i] = 0.15 + Math.random() * 0.4;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    const material = new PointsMaterial({
      size: 0.04,
      color: '#cfe8e6',
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    return { geometry, material, speeds };
  }, [count]);

  useFrame((_, delta) => {
    const pos = geometry.getAttribute('position') as Float32BufferAttribute;
    for (let i = 0; i < count; i++) {
      let y = pos.getY(i) + speeds[i] * delta;
      if (y > 4) y = -4; // recycle to the bottom
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  });

  return <points ref={ref} geometry={geometry} material={material} />;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/hero/Bubbles.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: sparse upward bubble particle stream"
```

---

## Task 15: Caustics shader + projection plane

**Files:**
- Create: `components/hero/shaders/caustics.glsl.ts`, `components/hero/CausticsPlane.tsx`
- Test: `components/hero/CausticsPlane.test.tsx`

- [ ] **Step 1: Write the failing render-smoke test**

Create `components/hero/CausticsPlane.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { CausticsPlane } from './CausticsPlane';

describe('CausticsPlane', () => {
  it('renders a mesh with a ShaderMaterial without crashing', async () => {
    const renderer = await ReactThreeTestRenderer.create(<CausticsPlane intensity={0.5} />);
    const meshes = renderer.scene.findAllByType('Mesh');
    expect(meshes.length).toBe(1);
    await renderer.unmount();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/hero/CausticsPlane.test.tsx`
Expected: FAIL — cannot find `./CausticsPlane`.

- [ ] **Step 3: Implement `components/hero/shaders/caustics.glsl.ts`**

```ts
export const causticsVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Voronoi-ish animated caustics; looping but not obviously (spec §6.6).
export const causticsFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColor;

  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
  }

  float voronoi(vec2 p) {
    vec2 n = floor(p);
    vec2 f = fract(p);
    float md = 1.0;
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec2 g = vec2(float(i), float(j));
        vec2 o = hash2(n + g);
        o = 0.5 + 0.5 * sin(uTime * 0.6 + 6.2831 * o);
        vec2 r = g + o - f;
        md = min(md, dot(r, r));
      }
    }
    return md;
  }

  void main() {
    vec2 uv = vUv * 6.0;
    float v = voronoi(uv);
    float caustic = pow(1.0 - v, 3.0);
    vec3 col = uColor * caustic * uIntensity;
    gl_FragColor = vec4(col, caustic * uIntensity);
  }
`;
```

- [ ] **Step 4: Implement `components/hero/CausticsPlane.tsx`**

```tsx
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { ShaderMaterial, Color, AdditiveBlending } from 'three';
import { causticsVertex, causticsFragment } from './shaders/caustics.glsl';

interface CausticsPlaneProps {
  intensity: number;
}

export function CausticsPlane({ intensity }: CausticsPlaneProps) {
  const matRef = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: intensity },
      uColor: { value: new Color('#3a6f6a') },
    }),
    [intensity],
  );

  useFrame((_, delta) => {
    if (matRef.current) {
      (matRef.current.uniforms.uTime.value as number) += delta;
      matRef.current.uniforms.uIntensity.value = intensity;
    }
  });

  return (
    <mesh position={[0, 0, -13]}>
      <planeGeometry args={[40, 30]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={causticsVertex}
        fragmentShader={causticsFragment}
        uniforms={uniforms}
        transparent
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run components/hero/CausticsPlane.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: procedural voronoi caustics shader + projection plane"
```

---

## Task 16: Background logo layer (looming mark with breathing pulse)

**Files:**
- Create: `components/hero/BackgroundLogo.tsx`
- Test: `components/hero/BackgroundLogo.test.tsx`

- [ ] **Step 1: Write the failing render-smoke test**

Create `components/hero/BackgroundLogo.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { BackgroundLogo } from './BackgroundLogo';

describe('BackgroundLogo', () => {
  it('exposes a named handle so Phase 2 can drive flicker/darkness', async () => {
    const renderer = await ReactThreeTestRenderer.create(<BackgroundLogo />);
    const group = renderer.scene.findAll((n) => n.props.name === 'background-logo');
    expect(group.length).toBe(1);
    await renderer.unmount();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/hero/BackgroundLogo.test.tsx`
Expected: FAIL — cannot find `./BackgroundLogo`.

- [ ] **Step 3: Implement `components/hero/BackgroundLogo.tsx`**

```tsx
'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

/**
 * Looming mountain/pine mark behind the water (spec §6.8).
 * Named "background-logo" and addressable so Phase 2 can drive the
 * near-miss flicker and the swallowed-by-darkness moment.
 */
export function BackgroundLogo() {
  const ref = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    // Almost-imperceptible breathing pulse, multi-second cycle.
    const pulse = 1 + Math.sin(clock.elapsedTime * 0.25) * 0.015;
    ref.current.scale.setScalar(pulse * 8);
  });

  return (
    <group ref={ref} name="background-logo" position={[0, 0, -14]} scale={8}>
      <mesh>
        <planeGeometry args={[2, 2]} />
        <meshBasicMaterial color="#7a1518" transparent opacity={0.06} />
      </mesh>
    </group>
  );
}
```

Note: the textured SVG mark is applied in the Task 18 assembly where the texture loader is available; here the layer is a tinted placeholder plane carrying the addressable `name`. When wiring the texture in Task 18, load `redwood-peak-mark.svg` via `useLoader(TextureLoader, ...)` and set it as the material `map`, keeping the same `name` and breathing logic.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/hero/BackgroundLogo.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: addressable looming background logo layer with breathing pulse"
```

---

## Task 17: Camera breathing hook + cursor ripple shader module

**Files:**
- Create: `components/hero/useCameraBreathing.ts`, `components/hero/shaders/waterRipple.glsl.ts`
- Test: `components/hero/useCameraBreathing.test.ts`

- [ ] **Step 1: Write the failing test (pure offset function)**

Create `components/hero/useCameraBreathing.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { breathingOffset } from './useCameraBreathing';

describe('breathingOffset', () => {
  it('returns small bounded offsets', () => {
    for (let t = 0; t < 50; t += 0.7) {
      const o = breathingOffset(t);
      expect(Math.abs(o.x)).toBeLessThan(0.2);
      expect(Math.abs(o.y)).toBeLessThan(0.2);
      expect(Math.abs(o.rotX)).toBeLessThan(0.05);
    }
  });

  it('is non-repeating over a short window (incommensurate frequencies)', () => {
    const a = breathingOffset(1.0);
    const b = breathingOffset(1.0 + 2 * Math.PI); // would match if single 1Hz sine
    expect(Math.abs(a.x - b.x)).toBeGreaterThan(1e-4);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/hero/useCameraBreathing.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement `components/hero/useCameraBreathing.ts`**

```ts
'use client';

import { useFrame, useThree } from '@react-three/fiber';

export interface BreathOffset {
  x: number;
  y: number;
  rotX: number;
  rotY: number;
}

/** Layered incommensurate sines → never a clean repeating loop (spec §6.1). */
export function breathingOffset(t: number): BreathOffset {
  return {
    x: Math.sin(t * 0.21) * 0.08 + Math.sin(t * 0.07) * 0.05,
    y: Math.cos(t * 0.17) * 0.06 + Math.sin(t * 0.043) * 0.04,
    rotX: Math.sin(t * 0.13) * 0.012,
    rotY: Math.cos(t * 0.11) * 0.012,
  };
}

export function useCameraBreathing() {
  const { camera } = useThree();
  const base = { x: camera.position.x, y: camera.position.y };
  useFrame(({ clock }) => {
    const o = breathingOffset(clock.elapsedTime);
    camera.position.x = base.x + o.x;
    camera.position.y = base.y + o.y;
    camera.rotation.x = o.rotX;
    camera.rotation.y = o.rotY;
  });
}
```

- [ ] **Step 4: Implement `components/hero/shaders/waterRipple.glsl.ts`**

```ts
export const waterRippleVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Cursor-reactive ripple/refraction distortion across the water layer (spec §9.1).
export const waterRippleFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uMouse;       // 0..1 cursor position
  uniform float uStrength;
  uniform sampler2D uScene;  // what's behind the water layer

  void main() {
    float d = distance(vUv, uMouse);
    float ripple = sin(d * 40.0 - uTime * 4.0) * exp(-d * 6.0);
    vec2 offset = normalize(vUv - uMouse + 1e-5) * ripple * uStrength;
    vec4 col = texture2D(uScene, vUv + offset);
    gl_FragColor = col;
  }
`;
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run components/hero/useCameraBreathing.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: camera-breathing hook and cursor ripple shader module"
```

---

## Task 18: HeroTank — Canvas, camera, env, fog, light sweep, postprocessing, quality gating

This assembles the scene. It is verified by render-smoke (a full `<Canvas>` won't run in jsdom, so the test targets the inner `<TankScene>` via the test renderer) plus the build.

**Files:**
- Create: `components/hero/TankScene.tsx`, `components/hero/HeroTank.tsx`
- Test: `components/hero/TankScene.test.tsx`

- [ ] **Step 1: Write the failing render-smoke test**

Create `components/hero/TankScene.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { TankScene } from './TankScene';
import { PeakRegistry } from './peak';
import { qualityFor } from './quality';

describe('TankScene', () => {
  it('assembles field, hero bottles, bubbles, caustics, and logo, and completes the registry', async () => {
    const registry = new PeakRegistry();
    const renderer = await ReactThreeTestRenderer.create(
      <TankScene registry={registry} quality={qualityFor('high')} />,
    );
    expect(registry.isComplete()).toBe(true);
    const points = renderer.scene.findAllByType('Points'); // bubbles
    expect(points.length).toBeGreaterThanOrEqual(1);
    const logo = renderer.scene.findAll((n) => n.props.name === 'background-logo');
    expect(logo.length).toBe(1);
    await renderer.unmount();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/hero/TankScene.test.tsx`
Expected: FAIL — cannot find `./TankScene`.

- [ ] **Step 3: Implement `components/hero/TankScene.tsx`**

```tsx
'use client';

import { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader, type DirectionalLight } from 'three';
import { FieldObjects } from './objects/FieldObjects';
import { HeroBottles } from './objects/HeroBottles';
import { Bubbles } from './Bubbles';
import { CausticsPlane } from './CausticsPlane';
import { BackgroundLogo } from './BackgroundLogo';
import { useCameraBreathing } from './useCameraBreathing';
import type { PeakRegistry } from './peak';
import type { QualityProfile } from './quality';

interface TankSceneProps {
  registry: PeakRegistry;
  quality: QualityProfile;
}

export function TankScene({ registry, quality }: TankSceneProps) {
  const sweep = useRef<DirectionalLight>(null);
  useCameraBreathing();

  // Slow cold light sweep on a 20–30s cycle (spec §6.5).
  useFrame(({ clock }) => {
    if (sweep.current) {
      const t = clock.elapsedTime / 25; // ~25s period
      sweep.current.position.x = Math.sin(t * Math.PI * 2) * 8;
      sweep.current.position.z = 4;
    }
  });

  return (
    <>
      <color attach="background" args={['#050a0c']} />
      {/* Depth fog scoped to the tank (spec §6.4). */}
      <fogExp2 attach="fog" args={['#0a1518', 0.085]} />

      <ambientLight intensity={0.15} color="#9bbdb9" />
      <directionalLight ref={sweep} intensity={1.4} color="#bfe0dd" />

      {quality.caustics && <CausticsPlane intensity={0.45} />}
      <BackgroundLogo />
      <FieldObjects count={quality.bottleCount} />
      <HeroBottles registry={registry} />
      <Bubbles count={quality.bubbleCount} />
    </>
  );
}
```

- [ ] **Step 4: Implement `components/hero/HeroTank.tsx`**

```tsx
'use client';

import { useMemo, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { EffectComposer, Bloom, DepthOfField, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { TankScene } from './TankScene';
import { PeakRegistry } from './peak';
import { detectTierFromBrowser, qualityFor, type QualityProfile } from './quality';

const isDev = process.env.NODE_ENV !== 'production';

export function HeroTank() {
  const registry = useMemo(() => new PeakRegistry(), []);
  const [quality, setQuality] = useState<QualityProfile>(() => qualityFor('mid'));

  useEffect(() => {
    setQuality(qualityFor(detectTierFromBrowser()));
  }, []);

  // Leva is dev-only; import lazily so it is tree-shaken from production (spec §10).
  useEffect(() => {
    if (!isDev) return;
    void import('leva'); // panel auto-mounts in dev; no-op in prod build
  }, []);

  return (
    <Canvas
      className="absolute inset-0"
      dpr={[1, quality.maxDpr]}
      camera={{ position: [0, 0, 6], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
    >
      <Environment files={quality.hdriPath} />
      <TankScene registry={registry} quality={quality} />
      {quality.postprocessing && (
        <EffectComposer>
          <Bloom intensity={0.6} luminanceThreshold={0.6} mipmapBlur />
          <DepthOfField focusDistance={0.02} focalLength={0.05} bokehScale={2} />
          <Vignette eskil={false} offset={0.3} darkness={0.7} />
          <ChromaticAberration offset={[0.0006, 0.0006]} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
```

- [ ] **Step 5: Run test + build to verify**

Run: `npx vitest run components/hero/TankScene.test.tsx && npm run build`
Expected: test PASS; build succeeds.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: HeroTank canvas + TankScene assembly with quality gating and postprocessing"
```

---

# Milestone E — Choreography & interaction

## Task 19: Intro rise + per-object GSAP timelines

Drives the empty-tank beat and staggered rise. Field objects accept an `animate` flag and rise via GSAP from below frame.

**Files:**
- Modify: `components/hero/objects/FieldObjects.tsx` (add rise timelines)
- Create: `components/hero/useIntroRise.ts`
- Test: `components/hero/useIntroRise.test.ts`

- [ ] **Step 1: Write the failing test (pure timeline-config builder)**

Create `components/hero/useIntroRise.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { buildRiseSchedule } from './useIntroRise';

describe('buildRiseSchedule', () => {
  it('staggers start times so objects never all rise at once', () => {
    const s = buildRiseSchedule(8, 12345);
    const starts = s.map((x) => x.startDelay);
    expect(new Set(starts).size).toBeGreaterThan(1);
    expect(Math.max(...starts)).toBeGreaterThan(Math.min(...starts));
  });

  it('marks a minority as long far-back rises (~30s)', () => {
    const s = buildRiseSchedule(20, 999);
    const longOnes = s.filter((x) => x.duration >= 25);
    expect(longOnes.length).toBeGreaterThan(0);
    expect(longOnes.length).toBeLessThan(s.length / 2);
  });

  it('varies behavior (some rotate, some pause)', () => {
    const s = buildRiseSchedule(20, 7);
    expect(s.some((x) => x.rotateWhileRising)).toBe(true);
    expect(s.some((x) => x.pauseMidway)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/hero/useIntroRise.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement `components/hero/useIntroRise.ts`**

```ts
'use client';

export interface RiseConfig {
  startDelay: number;       // seconds after the empty-tank beat
  duration: number;         // seconds to rise
  rotateWhileRising: boolean;
  pauseMidway: boolean;
  behindLogo: boolean;
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

const EMPTY_BEAT = 0.8; // seconds the tank holds empty (spec §7.1)

export function buildRiseSchedule(count: number, seed: number): RiseConfig[] {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, () => {
    const isLong = rand() > 0.8; // minority are long far-back rises
    return {
      startDelay: EMPTY_BEAT + rand() * 6,
      duration: isLong ? 26 + rand() * 6 : 3 + rand() * 4,
      rotateWhileRising: rand() > 0.5,
      pauseMidway: rand() > 0.6,
      behindLogo: rand() > 0.7,
    };
  });
}
```

- [ ] **Step 4: Wire GSAP rise into `FieldObjects.tsx`**

Add at the top of `FieldObjects.tsx`:
```tsx
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { buildRiseSchedule } from '../useIntroRise';
```

Replace the returned `<group>...</group>` body so each mesh gets a ref and a rise timeline. Inside the component, before `return`:
```tsx
const groupRef = useRef<import('three').Group>(null);

useEffect(() => {
  if (!groupRef.current) return;
  const schedule = buildRiseSchedule(items.length, seed);
  const children = groupRef.current.children;
  const tweens = children.map((child, i) => {
    const cfg = schedule[i];
    const targetY = child.position.y;
    child.position.y = targetY - 10; // start below frame (darkness)
    const tl = gsap.timeline({ delay: cfg.startDelay });
    if (cfg.pauseMidway) {
      tl.to(child.position, { y: targetY - 4, duration: cfg.duration * 0.4, ease: 'sine.out' })
        .to(child.position, { y: targetY, duration: cfg.duration * 0.6, ease: 'sine.inOut', delay: 0.6 });
    } else {
      tl.to(child.position, { y: targetY, duration: cfg.duration, ease: 'sine.inOut' });
    }
    if (cfg.rotateWhileRising) {
      tl.to(child.rotation, { y: child.rotation.y + Math.PI, duration: cfg.duration, ease: 'none' }, 0);
    }
    return tl;
  });
  return () => tweens.forEach((t) => t.kill());
}, [items, seed]);
```

Then add `ref={groupRef}` to the top-level `<group>` in the return.

- [ ] **Step 5: Run tests + build**

Run: `npx vitest run components/hero/useIntroRise.test.ts && npm run build`
Expected: PASS + build succeeds.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: staggered intro rise with per-object GSAP timelines"
```

---

## Task 20: Hover-to-read rotation (raycast + GSAP soft ease)

**Files:**
- Create: `components/hero/useHoverToRead.ts`
- Modify: `components/hero/objects/HeroBottle.tsx` (attach hover handlers)
- Test: `components/hero/useHoverToRead.test.ts`

- [ ] **Step 1: Write the failing test (target-orientation logic)**

Create `components/hero/useHoverToRead.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { faceCameraRotationY, RESTING_LABEL_AWAY } from './useHoverToRead';

describe('hover-to-read orientation', () => {
  it('resting orientation turns the label away from the viewer', () => {
    expect(RESTING_LABEL_AWAY).toBeCloseTo(Math.PI, 5);
  });

  it('hover target rotates the label to face the camera (y → 0 mod 2π)', () => {
    const target = faceCameraRotationY(Math.PI);
    expect(Math.abs(Math.sin(target))).toBeLessThan(1e-6); // facing front
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/hero/useHoverToRead.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement `components/hero/useHoverToRead.ts`**

```ts
'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import type { Object3D } from 'three';

/** Label points away from camera at rest (spec §6.10, §9.2). */
export const RESTING_LABEL_AWAY = Math.PI;

/** Rotation that turns the label to face the camera. */
export function faceCameraRotationY(_resting: number): number {
  return 0;
}

export function useHoverToRead(restingY: number = RESTING_LABEL_AWAY) {
  const tween = useRef<gsap.core.Tween | null>(null);

  const onPointerOver = (obj: Object3D) => {
    tween.current?.kill();
    // Rotate toward camera over ~0.5s with a soft, slightly-overshooting ease.
    tween.current = gsap.to(obj.rotation, {
      y: faceCameraRotationY(restingY),
      duration: 0.5,
      ease: 'back.out(1.4)',
    });
  };

  const onPointerOut = (obj: Object3D) => {
    tween.current?.kill();
    // Lazily drift back — does not snap (spec §9.2).
    tween.current = gsap.to(obj.rotation, {
      y: restingY,
      duration: 1.1,
      ease: 'back.out(1.1)',
    });
  };

  return { onPointerOver, onPointerOut };
}
```

- [ ] **Step 4: Attach hover handlers in `HeroBottle.tsx`**

Add `import { useHoverToRead, RESTING_LABEL_AWAY } from '../useHoverToRead';`. Inside the component:
```tsx
const { onPointerOver, onPointerOut } = useHoverToRead();
```
Set the procedural mesh's initial rotation to the resting orientation and wire handlers on the rendered `<mesh>`:
```tsx
<mesh
  ref={ref}
  geometry={geometry}
  material={material}
  rotation={[0, RESTING_LABEL_AWAY, 0]}
  onPointerOver={(e) => { e.stopPropagation(); if (ref.current) onPointerOver(ref.current); }}
  onPointerOut={(e) => { e.stopPropagation(); if (ref.current) onPointerOut(ref.current); }}
/>
```
Apply the same `rotation`, `onPointerOver`, `onPointerOut` to the GLB `<mesh>` branch so behavior is identical regardless of geometry source.

- [ ] **Step 5: Run tests + build**

Run: `npx vitest run components/hero/useHoverToRead.test.ts && npm run build`
Expected: PASS + build succeeds.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: hover-to-read rotation with soft overshoot and lazy return"
```

---

# Milestone F — Overlay, page, verification, deliverable

## Task 21: Copy reveal + phrase cycling (DOM)

**Files:**
- Create: `components/hero/CopyReveal.tsx`
- Test: `components/hero/CopyReveal.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/hero/CopyReveal.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CopyReveal } from './CopyReveal';

describe('CopyReveal', () => {
  it('renders the fixed hero copy', () => {
    render(<CopyReveal />);
    expect(screen.getByText('Hello,')).toBeInTheDocument();
    expect(screen.getByText('The Redwood Co.')).toBeInTheDocument();
    expect(screen.getByText(/We are a/)).toBeInTheDocument();
  });

  it('renders the first cycling phrase', () => {
    render(<CopyReveal />);
    expect(screen.getByText('A Pharmaceutical company')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/hero/CopyReveal.test.tsx`
Expected: FAIL — cannot find `./CopyReveal`.

- [ ] **Step 3: Implement `components/hero/CopyReveal.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { HERO_PHRASES, nextPhraseIndex } from './phrases';

const PHRASE_HOLD_MS = 3000;

export function CopyReveal() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => nextPhraseIndex(i, HERO_PHRASES.length)),
      PHRASE_HOLD_MS,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="select-none">
      <p className="text-rw-bone text-lg">Hello,</p>
      <h1 className="text-rw-bone text-5xl md:text-7xl font-extrabold tracking-tight leading-none">
        The Redwood Co.
      </h1>
      <p className="text-rw-bone text-lg mt-3">
        We are a{' '}
        <span className="relative inline-block align-baseline">
          {HERO_PHRASES.map((phrase, i) => (
            <span
              key={phrase}
              className="text-rw-red font-semibold transition-all duration-700"
              style={{
                position: i === index ? 'relative' : 'absolute',
                left: 0,
                opacity: i === index ? 1 : 0,
                transform: i === index ? 'translateY(0)' : 'translateY(8px)',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
              }}
              aria-hidden={i !== index}
            >
              {phrase}
            </span>
          ))}
        </span>
      </p>
    </div>
  );
}
```

Note: the crossfade-and-slide + the once-on-load full reveal and the scroll-to-top phrase-only replay are layered on in Task 22; this task establishes the copy and continuous cycling that the test pins.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/hero/CopyReveal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: hero copy reveal with continuous phrase cycling"
```

---

## Task 22: Reveal sequence — once on load + scroll-to-top replay

**Files:**
- Create: `components/hero/useRevealSequence.ts`
- Modify: `components/hero/CopyReveal.tsx` (consume the hook)
- Test: `components/hero/useRevealSequence.test.ts`

- [ ] **Step 1: Write the failing test (pure state machine)**

Create `components/hero/useRevealSequence.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { decideRevealMode } from './useRevealSequence';

describe('decideRevealMode', () => {
  it('plays the full reveal on first load', () => {
    expect(decideRevealMode({ hasPlayedOnce: false, scrolledToTop: false })).toBe('full');
  });

  it('replays phrases-only when returning to the very top after first play', () => {
    expect(decideRevealMode({ hasPlayedOnce: true, scrolledToTop: true })).toBe('phrases-only');
  });

  it('stays idle when already played and not at top', () => {
    expect(decideRevealMode({ hasPlayedOnce: true, scrolledToTop: false })).toBe('idle');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/hero/useRevealSequence.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement `components/hero/useRevealSequence.ts`**

```ts
'use client';

import { useEffect, useRef, useState } from 'react';

export type RevealMode = 'full' | 'phrases-only' | 'idle';

export function decideRevealMode(s: { hasPlayedOnce: boolean; scrolledToTop: boolean }): RevealMode {
  if (!s.hasPlayedOnce) return 'full';
  if (s.scrolledToTop) return 'phrases-only';
  return 'idle';
}

/** Emits 'full' once on mount, then 'phrases-only' each time the user returns to the very top. */
export function useRevealSequence(): RevealMode {
  const [mode, setMode] = useState<RevealMode>('full');
  const playedOnce = useRef(false);

  useEffect(() => {
    playedOnce.current = true;
    const onScroll = () => {
      const atTop = window.scrollY <= 2;
      if (atTop && playedOnce.current) {
        setMode(decideRevealMode({ hasPlayedOnce: true, scrolledToTop: true }));
      } else {
        setMode('idle');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return mode;
}
```

- [ ] **Step 4: Consume the hook in `CopyReveal.tsx`**

Import and call it, and gate the "Hello / The Redwood Co." block so it only renders/animates in `full` mode while the phrase cycler runs in both `full` and `phrases-only`:
```tsx
import { useRevealSequence } from './useRevealSequence';
// inside component:
const mode = useRevealSequence();
const showIntro = mode === 'full';
```
Wrap the `Hello,` paragraph and the `<h1>` in `{showIntro && ( ... )}`.

- [ ] **Step 5: Run tests + build**

Run: `npx vitest run components/hero/useRevealSequence.test.ts && npm run build`
Expected: PASS + build succeeds.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: reveal sequence (full once, phrases-only replay at top)"
```

---

## Task 23: CTAs with stamped press + disabled Apply Now

**Files:**
- Create: `components/hero/CtaButtons.tsx`, `lib/config.ts`
- Test: `components/hero/CtaButtons.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/hero/CtaButtons.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CtaButtons } from './CtaButtons';

describe('CtaButtons', () => {
  it('Join Us links to the Discord invite in a new tab', () => {
    render(<CtaButtons />);
    const join = screen.getByRole('link', { name: /join us/i });
    expect(join).toHaveAttribute('href', 'https://discord.gg/vPCWTzMXRa');
    expect(join).toHaveAttribute('target', '_blank');
    expect(join).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('Apply Now is disabled with a "soon" label and no dead href', () => {
    render(<CtaButtons />);
    const apply = screen.getByRole('button', { name: /applications opening soon/i });
    expect(apply).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/hero/CtaButtons.test.tsx`
Expected: FAIL — cannot find `./CtaButtons`.

- [ ] **Step 3: Implement `lib/config.ts`**

```ts
/** Single place to flip Apply Now live when the Google Form is ready (spec §11). */
export const DISCORD_INVITE_URL = 'https://discord.gg/vPCWTzMXRa';
export const APPLY_FORM_URL: string | null = null;
```

- [ ] **Step 4: Implement `components/hero/CtaButtons.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { DISCORD_INVITE_URL, APPLY_FORM_URL } from '@/lib/config';

function useStamp() {
  const [pressed, setPressed] = useState(false);
  const handlers = {
    onPointerDown: () => setPressed(true),
    onPointerUp: () => setPressed(false),
    onPointerLeave: () => setPressed(false),
  };
  // Compress + ink-ripple, not a hover-lift (spec §11).
  const className = pressed ? 'scale-[0.96] brightness-90' : 'scale-100';
  return { handlers, className };
}

export function CtaButtons() {
  const join = useStamp();
  return (
    <div className="flex gap-3 mt-6">
      <a
        href={DISCORD_INVITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        {...join.handlers}
        className={`px-5 py-2.5 rounded bg-rw-red text-rw-bone font-semibold transition-transform duration-150 ${join.className}`}
      >
        Join Us
      </a>
      <button
        type="button"
        disabled={APPLY_FORM_URL === null}
        className="px-5 py-2.5 rounded border border-rw-bone/30 text-rw-bone/60 font-semibold cursor-not-allowed"
        title="Applications opening soon"
      >
        Applications opening soon
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run components/hero/CtaButtons.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: stamped-press CTAs with disabled Apply Now"
```

---

## Task 24: Audio toggle + HeroOverlay assembly + tray slot

**Files:**
- Create: `components/hero/AudioToggle.tsx`, `components/hero/HeroOverlay.tsx`
- Test: `components/hero/AudioToggle.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/hero/AudioToggle.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AudioToggle } from './AudioToggle';

describe('AudioToggle', () => {
  it('starts off and never auto-enables', () => {
    render(<AudioToggle />);
    const btn = screen.getByRole('button', { name: /sound/i });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('toggles aria-pressed on click', () => {
    render(<AudioToggle />);
    const btn = screen.getByRole('button', { name: /sound/i });
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/hero/AudioToggle.test.tsx`
Expected: FAIL — cannot find `./AudioToggle`.

- [ ] **Step 3: Implement `components/hero/AudioToggle.tsx`**

```tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { AmbientScheduler } from '@/lib/audio/AmbientScheduler';

const CLIPS = ['/audio/drip.ogg', '/audio/creak.ogg', '/audio/bubble.ogg', '/audio/water.ogg'];

export function AudioToggle() {
  const [on, setOn] = useState(false);
  const scheduler = useMemo(
    () =>
      new AmbientScheduler({
        clips: CLIPS,
        minDelayMs: 4000,
        maxDelayMs: 14000,
        minVolume: 0.05,
        maxVolume: 0.35,
      }),
    [],
  );

  useEffect(() => () => scheduler.disable(), [scheduler]);

  const toggle = () => {
    setOn((prev) => {
      const next = !prev;
      if (next) scheduler.enable();
      else scheduler.disable();
      return next;
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? 'Sound on' : 'Sound off'}
      className="absolute top-4 right-4 w-9 h-9 rounded-full border border-rw-bone/30 text-rw-bone/70 flex items-center justify-center hover:text-rw-bone transition-colors"
    >
      {on ? '🔊' : '🔈'}
    </button>
  );
}
```

- [ ] **Step 4: Implement `components/hero/HeroOverlay.tsx`**

```tsx
'use client';

import { CopyReveal } from './CopyReveal';
import { CtaButtons } from './CtaButtons';
import { AudioToggle } from './AudioToggle';

export function HeroOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Left-anchored copy (spec §1 composition). */}
      <div className="pointer-events-auto absolute left-8 md:left-16 top-1/2 -translate-y-1/2 max-w-xl">
        <CopyReveal />
        <CtaButtons />
      </div>

      {/* Audio toggle, top-right. */}
      <div className="pointer-events-auto">
        <AudioToggle />
      </div>

      {/* Phase 1: discrete drop-tray visual slot only (spec §11). */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 w-44 h-9 rounded-md border border-dashed border-rw-bone/20 flex items-center justify-center text-[9px] tracking-[0.2em] text-rw-bone/30"
      >
        DROP TRAY
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run components/hero/AudioToggle.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: audio toggle, hero overlay assembly, and tray visual slot"
```

---

## Task 25: Page composition + manual smoke check

**Files:**
- Modify: `app/page.tsx`, `app/layout.tsx`, `app/globals.css`
- Create: `components/hero/Hero.tsx`

- [ ] **Step 1: Create `components/hero/Hero.tsx`**

```tsx
'use client';

import dynamic from 'next/dynamic';
import { HeroOverlay } from './HeroOverlay';

// WebGL must not run during SSR.
const HeroTank = dynamic(() => import('./HeroTank').then((m) => m.HeroTank), { ssr: false });

export function Hero() {
  return (
    <section className="relative w-full h-[100svh] overflow-hidden bg-rw-black">
      <HeroTank />
      <HeroOverlay />
    </section>
  );
}
```

- [ ] **Step 2: Wire `app/page.tsx`**

```tsx
import { Hero } from '@/components/hero/Hero';

export default function Home() {
  return (
    <main className="bg-rw-black text-rw-bone">
      <Hero />
    </main>
  );
}
```

- [ ] **Step 3: Set base background + remove default Next styles**

In `app/globals.css`, after the Tailwind directives, ensure:
```css
html, body { background: var(--rw-black); margin: 0; }
```
Remove any leftover create-next-app demo styles in `globals.css`.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: build succeeds, zero errors.

- [ ] **Step 5: Manual smoke check (spec §13)**

Run: `npm run dev`, open `http://localhost:3000`, and confirm each:
- [ ] Empty-tank beat, then staggered rise from darkness (not all at once).
- [ ] Copy reveal plays once: "Hello," → "The Redwood Co." → "We are a" + red phrase cycling through all five.
- [ ] Scroll down, then back to the very top → phrases-only replay (no "Hello/Redwood Co." re-type).
- [ ] Hover a foreground PEAK bottle → it rotates toward you over ~0.5s with a soft overshoot; leaving → lazy drift back, no snap.
- [ ] Mouse movement pushes a ripple and nearby bottles drift away then settle.
- [ ] "Join Us" opens `https://discord.gg/vPCWTzMXRa` in a new tab.
- [ ] "Applications opening soon" is visibly disabled.
- [ ] Audio toggle: silent on load; enabling plays irregular clips; disabling stops them. Never autoplays.
- [ ] In devtools, throttle to a mobile profile / set `navigator.hardwareConcurrency` low and reload → simplified tank still renders, no frame collapse.

Tune Leva sliders (fog density, caustic intensity, etc.) live until the Flooded-Vault mood reads right; copy the final values into the relevant component default constants.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: compose hero into landing page; smoke-checked"
```

---

## Task 26: Full verification gate (build + all tests + PEAK contract)

**Files:** none (verification only)

- [ ] **Step 1: Run the entire test suite**

Run: `npm test`
Expected: all suites pass, including `components/hero/objects/HeroBottles.test.tsx` (the PEAK contract) and `components/hero/quality.test.ts`.

- [ ] **Step 2: Confirm the PEAK contract test specifically**

Run: `npx vitest run components/hero/objects/HeroBottles.test.tsx`
Expected: PASS — "renders exactly four hero bottles, each correctly tagged and queryable as a set."

- [ ] **Step 3: Production build with zero errors**

Run: `npm run build`
Expected: exit 0, "Compiled successfully," no type errors.

- [ ] **Step 4: Confirm Leva is absent from the production bundle**

Run: `npm run build` and inspect output; confirm no `leva` chunk is included in the production client bundle (it is dynamically imported only under `NODE_ENV !== 'production'`).

- [ ] **Step 5: Commit (if any tuning changed)**

```bash
git add -A
git commit -m "test: verify Phase 1 build, suite, and PEAK tagging contract pass"
```

---

## Task 27: Changelog deliverable

**Files:**
- Create: `CHANGELOG.md`

- [ ] **Step 1: Write `CHANGELOG.md`**

```markdown
# Redwood Peak — Changelog

## v0.1.0 — Welcome to Redwood Peak

Per board directive, the public-facing storefront is now operational. We are, as always, creators for the better good of America. Please direct wholesale and contract inquiries through the appropriate channels.

### The Tank
- **The vault is wet.** The landing page is now a real medical tank — actual glass, actual refraction, actual cold light moving through actual depth. Bottles and syringes are suspended in it. We do not recommend asking what is in them.
- **They rise on their own.** On arrival the tank holds empty for a breath, then the contents surface from the dark below — staggered, unhurried, some turning as they come up, some pausing partway as if reconsidering. No two arrivals are timed alike.
- **Reach toward the glass.** Hover a bottle and it turns to face you, label and all. Let go and it drifts back to where it was. The water answers the cursor.

### The Front Desk
- **Who we are, on rotation.** "We are a—" and then, in order: a pharmaceutical company, a technological company, creators for the better good of America, outdoor camping equipment sellers, a logistics company. All true. All at once.
- **Two doors.** "Join Us" opens our Discord. "Applications opening soon" will open when the paperwork clears.
- **Sound, if you want it.** A quiet toggle in the corner. Off unless you ask. Drips, creaks, the occasional bubble. Nothing repeats the same way twice.

### Housekeeping
- **It runs on a budget phone too.** The tank scales itself down on lower-end devices instead of falling over.

### A note for the first people in
This is the first thing we have let outsiders see. If something looks wrong, tell us *what you touched and what it did* — that is the most useful thing you can send us. Look closely. Some things are easier to find than others.
```

- [ ] **Step 2: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: v0.1.0 changelog — Welcome to Redwood Peak"
```

---

## Task 28: Hand off for push (DO NOT PUSH)

**Project standing rule:** all work happens on the `staging` branch; never commit to `main`; **never run `git push`** (any branch). The user pushes themselves. `main` is touched only on an explicit production-ship order.

- [ ] **Step 1: Stop and report — do not push**

Do **not** run `git push`. After Task 27's changelog commit, confirm the working tree is clean on `staging`:
```bash
git status
git log --oneline -5
```
Then tell the user Phase 1 is complete on `staging` and ready for them to push. The user runs the push.

---

# Self-Review (completed by plan author)

**Spec coverage check (spec § → task):**
- §1 mood/composition → Tasks 18 (fog/light/colors), 24 (left-anchored overlay, tray)
- §2 stack & seam → Tasks 1, 2, 25 (DOM-over-canvas seam)
- §3 tokens → Task 3
- §4 assets → Task 4
- §5 file structure → all component tasks follow the spec'd paths
- §6.1 camera breathing → Task 17; §6.2 glass → Task 11; §6.3 field/depth → Task 12; §6.4 fog → Task 18; §6.5 light sweep → Task 18; §6.6 caustics → Task 15; §6.7 bubbles → Task 14; §6.8 bg logo → Task 16; §6.9 postprocessing → Task 18; §6.10 labels → Tasks 13/20 (resting away-orientation)
- §7.1 intro rise → Task 19; §7.2 copy reveal + replay → Tasks 21, 22
- §8 GLB swap-seam + tagging → Tasks 9, 13
- §9.1 cursor ripple → Task 17 (shader) + 18/25 (wired); §9.2 hover-to-read → Task 20
- §10 perf/mobile + Leva strip → Tasks 5, 18, 26
- §11 CTAs/audio/tray → Tasks 23, 24
- §12 Phase-2 seams only → honored (tray visual only, bg-logo named/addressable, bottles tagged; no drag/drain/loading)
- §13 verification incl. PEAK contract → Tasks 13, 25, 26
- §14 changelog → Task 27

**Placeholder scan:** No "TBD/TODO/handle edge cases" left. The two intentional future hooks (GLB files, `APPLY_FORM_URL`) are real, working fallbacks, not placeholders.

**Type consistency:** `PeakRegistry.register/all/get/isComplete/tagObject`, `PeakLetter`, `QualityProfile` fields (`maxDpr`, `bottleCount`, `bubbleCount`, `postprocessing`, `caustics`, `hdriPath`, `heroBottlesPresent`), `GeometrySource` (`kind: 'glb'|'procedural'`), `RevealMode` (`full|phrases-only|idle`), and the geometry builder names (`fieldBottleGeometry`, `heroBottleGeometry`, `syringeGeometry`) are used consistently across the tasks that reference them.

**Known deviation flagged in-plan:** §6.3 says "instanced"; Task 12 uses per-mesh first (independent per-object rise/raycast) with instancing deferred to Phase 7 — noted in the task.
