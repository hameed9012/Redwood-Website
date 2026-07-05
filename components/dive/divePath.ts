/**
 * Pure camera path for the scroll-dive (Phase 3). Three keyframes so the descent
 * is a deliberate journey rather than a single tilt:
 *   0.0  SURFACE  — top-down over the water (hero + History live here)
 *   0.6  HORIZON  — dropped to the surface, looking level ACROSS the water toward
 *                   the far shore + tanker (Media lands here — a "flat to the
 *                   water" shot that showcases the tanker in the background)
 *   1.0  DEEP     — dipped just under the surface, looking level through the
 *                   water where the fish drift (Contact lands here)
 * No three.js/R3F import so it stays unit-testable; the hook applies the pose.
 */
export type Vec3 = [number, number, number];

export interface DivePose {
  position: Vec3;
  target: Vec3;
  up: Vec3;
}

/** Matches the initial Canvas camera in HeroTank (top-down, up = -Z). */
export const SURFACE_POSE: DivePose = {
  position: [0, 16, 0.001],
  target: [0, 0, 0],
  up: [0, 0, -1],
};

/** Level with the surface, aimed across the water at the tanker corner (-22,0,-26). */
export const HORIZON_POSE: DivePose = {
  position: [10, 3.5, 12],
  target: [-13, 1.4, -17],
  up: [0, 1, 0],
};

/** Just under the surface, level, so fish drift across frame (not black below). */
export const DEEP_POSE: DivePose = {
  position: [0, -2, 18],
  target: [0, -6, -12],
  up: [0, 1, 0],
};

interface Keyframe {
  at: number;
  pose: DivePose;
}

const KEYFRAMES: Keyframe[] = [
  { at: 0, pose: SURFACE_POSE },
  { at: 0.6, pose: HORIZON_POSE },
  { at: 1, pose: DEEP_POSE },
];

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp3(a: Vec3, b: Vec3, e: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e];
}

function normalize3(v: Vec3): Vec3 {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

export function divePose(t: number): DivePose {
  const c = Math.min(1, Math.max(0, t));
  if (c <= 0) return SURFACE_POSE;
  if (c >= 1) return DEEP_POSE;

  // Find the segment [k0, k1] containing c.
  let k0 = KEYFRAMES[0];
  let k1 = KEYFRAMES[KEYFRAMES.length - 1];
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    if (c >= KEYFRAMES[i].at && c <= KEYFRAMES[i + 1].at) {
      k0 = KEYFRAMES[i];
      k1 = KEYFRAMES[i + 1];
      break;
    }
  }
  const localT = (c - k0.at) / (k1.at - k0.at || 1);
  const e = easeInOutCubic(localT);
  return {
    position: lerp3(k0.pose.position, k1.pose.position, e),
    target: lerp3(k0.pose.target, k1.pose.target, e),
    up: normalize3(lerp3(k0.pose.up, k1.pose.up, e)),
  };
}
