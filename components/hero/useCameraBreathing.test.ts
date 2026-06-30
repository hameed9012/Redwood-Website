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
