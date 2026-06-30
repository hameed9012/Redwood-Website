'use client';

/**
 * Single source of truth for the water's wave field — shared by the GLSL surface
 * shader (the water you SEE) and by the floating objects (so they move on the
 * SAME water). Floating debris has no home: it drifts, sways as waves pass, and
 * is gently nudged by the cursor — never snapping back.
 *
 * Top-down note: the camera looks straight down −Y, so vertical bob is nearly
 * invisible. What reads as "alive" is HORIZONTAL motion.
 */

export interface WaveDef {
  dir: [number, number];
  k: number; // spatial frequency
  s: number; // temporal speed
  a: number; // amplitude
}

export const WAVES: WaveDef[] = [
  { dir: [1.0, 0.3], k: 0.22, s: 0.5, a: 0.5 },
  { dir: [-0.5, 1.0], k: 0.35, s: 0.7, a: 0.32 },
  { dir: [0.8, -0.4], k: 0.7, s: 0.9, a: 0.16 },
  { dir: [-0.2, -0.9], k: 1.4, s: 1.2, a: 0.08 },
  { dir: [0.6, 0.7], k: 2.6, s: 1.6, a: 0.04 },
];

function nrm(d: [number, number]): [number, number] {
  const l = Math.hypot(d[0], d[1]) || 1;
  return [d[0] / l, d[1] / l];
}

/** Surface height at world (x, z) and time t — matches the GLSL. */
export function waveHeight(x: number, z: number, t: number): number {
  let h = 0;
  for (const w of WAVES) {
    const d = nrm(w.dir);
    h += w.a * Math.sin((d[0] * x + d[1] * z) * w.k + t * w.s);
  }
  return h;
}

/** Surface slope (∂h/∂x, ∂h/∂z) — drives object sway + tilt. */
export function waveSlope(x: number, z: number, t: number): { sx: number; sz: number } {
  let sx = 0;
  let sz = 0;
  for (const w of WAVES) {
    const d = nrm(w.dir);
    const c = Math.cos((d[0] * x + d[1] * z) * w.k + t * w.s) * w.a * w.k;
    sx += c * d[0];
    sz += c * d[1];
  }
  return { sx, sz };
}

/**
 * GLSL filling `float h`, `float dhx`, `float dhz` from `vec2 wp` (world XZ) +
 * `uTime`. Parity with waveHeight/waveSlope, and provides analytic derivatives
 * so the fragment can build a real surface normal (lit waves, not a flat tint).
 */
export function waveGlslHeightNormal(): string {
  return WAVES.map((w) => {
    const d = nrm(w.dir);
    const dx = d[0].toFixed(4);
    const dy = d[1].toFixed(4);
    const k = w.k.toFixed(4);
    const s = w.s.toFixed(4);
    const a = w.a.toFixed(4);
    return [
      `{`,
      `  float ph = (${dx} * wp.x + ${dy} * wp.y) * ${k} + uTime * ${s};`,
      `  h += ${a} * sin(ph);`,
      `  float c = ${a} * ${k} * cos(ph);`,
      `  dhx += c * ${dx};`,
      `  dhz += c * ${dy};`,
      `}`,
    ].join('\n    ');
  }).join('\n    ');
}

// ---- Floating-object motion -------------------------------------------------

export interface Floater {
  x: number;
  z: number;
  vx: number;
  vz: number;
  depth: number;  // 0 = surface; negative = drifting under the water
  enterY: number; // intro-rise offset, animated from below up to 0
  spinPhase: number;
  lastCut: number;
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
  const submerged = rand() < 0.4;
  return {
    x: (rand() - 0.5) * bounds.x * 1.8,
    z: (rand() - 0.5) * bounds.z * 1.8,
    vx: (rand() - 0.5) * 0.22,
    vz: (rand() - 0.5) * 0.22,
    // Some objects are denser / water-logged and drift below the surface.
    depth: submerged ? -(0.8 + rand() * 2.8) : 0,
    enterY: -8,
    spinPhase: rand() * 6.2831853,
    lastCut: 0,
  };
}

const MAX_SPEED = 0.4;
const SWAY = 0.32;

/**
 * Advance a floater one frame. Gentle drift (bouncing off the basin edges) +
 * wave sway. Objects move on their own current; there is no cursor interaction.
 */
export function stepFloater(f: Floater, t: number, delta: number, bounds: Bounds): FloatTransform {
  f.x += f.vx * delta;
  f.z += f.vz * delta;
  if (f.x > bounds.x) { f.x = bounds.x; f.vx = -Math.abs(f.vx); }
  if (f.x < -bounds.x) { f.x = -bounds.x; f.vx = Math.abs(f.vx); }
  if (f.z > bounds.z) { f.z = bounds.z; f.vz = -Math.abs(f.vz); }
  if (f.z < -bounds.z) { f.z = -bounds.z; f.vz = Math.abs(f.vz); }

  const sp = Math.hypot(f.vx, f.vz);
  if (sp > MAX_SPEED) { f.vx *= MAX_SPEED / sp; f.vz *= MAX_SPEED / sp; }

  const sl = waveSlope(f.x, f.z, t);
  const ride = f.depth < 0 ? 0.2 : 0.6; // submerged objects ride the waves less
  return {
    x: f.x - sl.sx * SWAY,
    y: waveHeight(f.x, f.z, t) * ride + f.depth + f.enterY,
    z: f.z - sl.sz * SWAY,
    tiltX: sl.sz * 0.9,
    tiltZ: -sl.sx * 0.9,
  };
}
