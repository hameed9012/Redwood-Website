'use client';

/**
 * Single source of truth for the water's wave field — shared by the GLSL surface
 * shader (so the surface you SEE) and by the floating objects (so they move on
 * the SAME water). Floating debris has no home position: it drifts, sways as
 * waves pass, and is permanently displaced by the cursor (no snap-back).
 *
 * Top-down note: the camera looks straight down −Y, so vertical bob is nearly
 * invisible. What reads as "alive" is HORIZONTAL motion — drift + wave sway +
 * cursor shove. The Y ride is kept subtle (mostly drives tilt).
 */

export interface WaveDef {
  dir: [number, number];
  k: number; // spatial frequency
  s: number; // temporal speed
  a: number; // amplitude
}

/** Bumped amplitudes (vs the first pass) so the surface + floaters visibly move. */
export const WAVES: WaveDef[] = [
  { dir: [1.0, 0.3], k: 0.22, s: 0.6, a: 0.5 },
  { dir: [-0.5, 1.0], k: 0.35, s: 0.8, a: 0.32 },
  { dir: [0.8, -0.4], k: 0.7, s: 1.1, a: 0.16 },
  { dir: [-0.2, -0.9], k: 1.4, s: 1.5, a: 0.08 },
  { dir: [0.6, 0.7], k: 2.6, s: 2.0, a: 0.04 },
];

function nrm(d: [number, number]): [number, number] {
  const l = Math.hypot(d[0], d[1]) || 1;
  return [d[0] / l, d[1] / l];
}

/** Surface height at world (x, z) and time t — matches the GLSL `waveGlsl()`. */
export function waveHeight(x: number, z: number, t: number): number {
  let h = 0;
  for (const w of WAVES) {
    const d = nrm(w.dir);
    h += w.a * Math.sin((d[0] * x + d[1] * z) * w.k + t * w.s);
  }
  return h;
}

/** Surface slope (∂h/∂x, ∂h/∂z) via finite differences — drives sway + tilt. */
export function waveSlope(x: number, z: number, t: number): { sx: number; sz: number } {
  const e = 0.35;
  return {
    sx: (waveHeight(x + e, z, t) - waveHeight(x - e, z, t)) / (2 * e),
    sz: (waveHeight(x, z + e, t) - waveHeight(x, z - e, t)) / (2 * e),
  };
}

/** GLSL that fills `float h` from `vec2 wp` (world XZ) + `uTime`. Parity with waveHeight. */
export function waveGlsl(): string {
  return WAVES.map((w) => {
    const d = nrm(w.dir);
    return `h += ${w.a.toFixed(4)} * sin((${d[0].toFixed(4)} * wp.x + ${d[1].toFixed(4)} * wp.y) * ${w.k.toFixed(4)} + uTime * ${w.s.toFixed(4)});`;
  }).join('\n    ');
}

// ---- Floating-object motion -------------------------------------------------

export interface Floater {
  x: number;
  z: number;
  vx: number;
  vz: number;
  enterY: number; // intro-rise offset, animated from below the surface up to 0
  spinPhase: number;
  lastCut: number; // timestamp of the last cursor cut already applied
}

export interface Cut {
  x: number;
  z: number;
  strength: number;
  t: number; // performance.now() of the cut
}

export interface FloatTransform {
  x: number;
  y: number;
  z: number;
  tiltX: number;
  tiltZ: number;
}

export interface Bounds {
  x: number;
  z: number;
}

export function makeFloater(rand: () => number, bounds: Bounds): Floater {
  return {
    x: (rand() - 0.5) * bounds.x * 1.8,
    z: (rand() - 0.5) * bounds.z * 1.8,
    vx: (rand() - 0.5) * 0.5,
    vz: (rand() - 0.5) * 0.5,
    enterY: -8,
    spinPhase: rand() * 6.2831853,
    lastCut: 0,
  };
}

const MAX_SPEED = 0.9;
const CUT_RADIUS = 5;
const SWAY = 0.6;

/**
 * Advance a floater one frame and return where to draw it. Drifts with its own
 * gentle current (bouncing off the basin walls), sways with the wave slope, and
 * is permanently shoved by a recent cursor cut — it never returns to a "home".
 */
export function stepFloater(f: Floater, t: number, delta: number, cut: Cut | null, bounds: Bounds): FloatTransform {
  // Gentle drift, reflecting at the basin edges so objects stay in view.
  f.x += f.vx * delta;
  f.z += f.vz * delta;
  if (f.x > bounds.x) { f.x = bounds.x; f.vx = -Math.abs(f.vx); }
  if (f.x < -bounds.x) { f.x = -bounds.x; f.vx = Math.abs(f.vx); }
  if (f.z > bounds.z) { f.z = bounds.z; f.vz = -Math.abs(f.vz); }
  if (f.z < -bounds.z) { f.z = -bounds.z; f.vz = Math.abs(f.vz); }

  // Cursor cut: permanent shove + a velocity kick so it keeps drifting away.
  if (cut && cut.t > f.lastCut) {
    f.lastCut = cut.t;
    const dx = f.x - cut.x;
    const dz = f.z - cut.z;
    const dist = Math.hypot(dx, dz);
    if (dist < CUT_RADIUS && dist > 1e-4) {
      const push = (1 - dist / CUT_RADIUS) * cut.strength;
      f.x += (dx / dist) * push * 1.2;
      f.z += (dz / dist) * push * 1.2;
      f.vx += (dx / dist) * push * 0.7;
      f.vz += (dz / dist) * push * 0.7;
    }
  }

  // Keep velocities sane after repeated kicks.
  const sp = Math.hypot(f.vx, f.vz);
  if (sp > MAX_SPEED) { f.vx *= MAX_SPEED / sp; f.vz *= MAX_SPEED / sp; }

  // Sway with the wave field (objects slide along the surface gradient as waves
  // pass) + a subtle vertical ride that mostly feeds tilt.
  const sl = waveSlope(f.x, f.z, t);
  return {
    x: f.x - sl.sx * SWAY,
    y: waveHeight(f.x, f.z, t) * 0.6 + f.enterY,
    z: f.z - sl.sz * SWAY,
    tiltX: sl.sz * 0.9,
    tiltZ: -sl.sx * 0.9,
  };
}
