'use client';

export interface DriftOffset {
  x: number; y: number; z: number; rotX: number; rotY: number; rotZ: number;
}

/** Gentle floating motion. `phase` (0..1, per-object) desyncs objects. Bounded, slow. Pure + testable. */
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
