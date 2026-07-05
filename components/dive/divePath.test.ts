import { describe, it, expect } from 'vitest';
import { divePose, SURFACE_POSE, HORIZON_POSE, DEEP_POSE } from './divePath';

const len = (v: [number, number, number]) => Math.hypot(v[0], v[1], v[2]);

describe('divePose', () => {
  it('returns the exact surface pose at t=0', () => {
    const p = divePose(0);
    expect(p.position).toEqual(SURFACE_POSE.position);
    expect(p.up).toEqual(SURFACE_POSE.up);
  });

  it('returns the exact deep pose at t=1', () => {
    const p = divePose(1);
    expect(p.position).toEqual(DEEP_POSE.position);
    expect(p.up).toEqual(DEEP_POSE.up);
  });

  it('passes through the horizon keyframe at t=0.6', () => {
    const p = divePose(0.6);
    expect(p.position[0]).toBeCloseTo(HORIZON_POSE.position[0], 5);
    expect(p.position[1]).toBeCloseTo(HORIZON_POSE.position[1], 5);
    expect(p.target[1]).toBeCloseTo(HORIZON_POSE.target[1], 5);
  });

  it('clamps out-of-range progress to the endpoints', () => {
    expect(divePose(-2).position).toEqual(SURFACE_POSE.position);
    expect(divePose(5).position).toEqual(DEEP_POSE.position);
  });

  it('lowers the camera monotonically — it only ever sinks as t grows', () => {
    let prevY = Infinity;
    for (let t = 0.02; t <= 1; t += 0.02) {
      const y = divePose(t).position[1];
      expect(y).toBeLessThan(prevY + 1e-9);
      prevY = y;
    }
  });

  it('tilts the aim up to the horizon, then down into the deep', () => {
    // target rises from the surface (y=0) toward the horizon (y>0)...
    expect(divePose(0.3).target[1]).toBeGreaterThan(SURFACE_POSE.target[1]);
    // ...then sinks below the surface by the deep.
    expect(divePose(1).target[1]).toBeLessThan(0);
  });

  it('keeps the up vector unit-length throughout', () => {
    for (let t = 0; t <= 1; t += 0.1) {
      expect(len(divePose(t).up)).toBeCloseTo(1, 6);
    }
  });
});
