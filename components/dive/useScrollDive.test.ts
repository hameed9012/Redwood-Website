import { describe, it, expect } from 'vitest';
import { diveProgressFromScroll } from './useScrollDive';

describe('diveProgressFromScroll', () => {
  const vh = 800;

  it('is 0 at the top (surface)', () => {
    expect(diveProgressFromScroll(0, vh)).toBe(0);
  });

  it('reaches 1 exactly at the page bottom (2.2 viewports of scroll) and clamps beyond', () => {
    expect(diveProgressFromScroll(2.2 * vh, vh)).toBeCloseTo(1, 6);
    expect(diveProgressFromScroll(10 * vh, vh)).toBe(1);
  });

  it('is ~0.5 halfway down the dive', () => {
    expect(diveProgressFromScroll(1.1 * vh, vh)).toBeCloseTo(0.5, 6);
  });

  it('increases monotonically from top to bottom', () => {
    let prev = -1;
    for (let s = 0; s <= 2.2 * vh; s += 40) {
      const p = diveProgressFromScroll(s, vh);
      expect(p).toBeGreaterThanOrEqual(prev);
      prev = p;
    }
  });

  it('guards a zero viewport height', () => {
    expect(diveProgressFromScroll(500, 0)).toBe(0);
  });
});
