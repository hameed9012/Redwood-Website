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
  it('different phases give different offsets at the same time', () => {
    const a = driftOffset(2.0, 0.1);
    const b = driftOffset(2.0, 0.8);
    expect(Math.abs(a.x - b.x) + Math.abs(a.y - b.y)).toBeGreaterThan(1e-3);
  });
});
