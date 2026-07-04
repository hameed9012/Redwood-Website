import { describe, it, expect } from 'vitest';
import { divePose, SURFACE_POSE, DEEP_POSE } from './divePath';

const len = (v: [number, number, number]) => Math.hypot(v[0], v[1], v[2]);

describe('divePose', () => {
  it('returns the exact surface pose at t=0', () => {
    const p = divePose(0);
    expect(p.position).toEqual(SURFACE_POSE.position);
    expect(p.target).toEqual(SURFACE_POSE.target);
    expect(p.up).toEqual(SURFACE_POSE.up);
  });

  it('returns the exact deep pose at t=1', () => {
    const p = divePose(1);
    expect(p.position).toEqual(DEEP_POSE.position);
    expect(p.target).toEqual(DEEP_POSE.target);
    expect(p.up).toEqual(DEEP_POSE.up);
  });

  it('clamps out-of-range progress to the endpoints', () => {
    expect(divePose(-2).position).toEqual(SURFACE_POSE.position);
    expect(divePose(5).position).toEqual(DEEP_POSE.position);
  });

  it('descends monotonically — camera and aim only ever sink as t grows', () => {
    let prevPosY = Infinity;
    let prevTgtY = Infinity;
    for (let t = 0.05; t < 1; t += 0.05) {
      const p = divePose(t);
      expect(p.position[1]).toBeLessThan(prevPosY);
      expect(p.target[1]).toBeLessThan(prevTgtY);
      prevPosY = p.position[1];
      prevTgtY = p.target[1];
    }
  });

  it('keeps the up vector unit-length throughout (renormalized after lerp)', () => {
    for (let t = 0; t <= 1; t += 0.1) {
      expect(len(divePose(t).up)).toBeCloseTo(1, 6);
    }
  });

  it('rolls the up vector from look-down toward world-up across the dive', () => {
    // Surface up is (0,0,-1); deep up is (0,1,0). Midway it should be tilting.
    const mid = divePose(0.5).up;
    expect(mid[1]).toBeGreaterThan(0); // gained world-up component
    expect(mid[2]).toBeLessThan(0); // still retains some look-down component
  });
});
