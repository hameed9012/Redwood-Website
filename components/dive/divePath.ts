/**
 * Pure camera path for the scroll-dive (Phase 3): given progress t ∈ [0,1],
 * interpolate the camera from the top-down SURFACE pose into the side-on
 * submerged DEEP pose. No three.js / R3F import so it stays unit-testable;
 * the hook (useScrollDive) applies the returned pose to the real camera.
 */
export type Vec3 = [number, number, number];

export interface DivePose {
  position: Vec3;
  target: Vec3;
  /** Camera up — rolls from the top-down look-down basis to world-up. */
  up: Vec3;
}

/** Matches the initial Canvas camera in HeroTank (top-down, up = -Z). */
export const SURFACE_POSE: DivePose = {
  position: [0, 16, 0.001],
  target: [0, 0, 0],
  up: [0, 0, -1],
};

/** Side-on, below the surface, aimed down into the fogged deep. Within far=60. */
export const DEEP_POSE: DivePose = {
  position: [0, -5, 16],
  target: [0, -11, -6],
  up: [0, 1, 0],
};

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
  // Endpoints exact (avoids float drift so the surface/deep poses are pristine).
  if (c === 0) return SURFACE_POSE;
  if (c === 1) return DEEP_POSE;
  const e = easeInOutCubic(c);
  return {
    position: lerp3(SURFACE_POSE.position, DEEP_POSE.position, e),
    target: lerp3(SURFACE_POSE.target, DEEP_POSE.target, e),
    up: normalize3(lerp3(SURFACE_POSE.up, DEEP_POSE.up, e)),
  };
}
