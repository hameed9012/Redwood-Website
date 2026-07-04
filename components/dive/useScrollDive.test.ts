import { describe, it, expect } from 'vitest';
import { diveProgressFromScroll } from './useScrollDive';

describe('diveProgressFromScroll', () => {
  const vh = 800;

  it('is 0 through the hero (before the dive region)', () => {
    expect(diveProgressFromScroll(0, vh)).toBe(0);
    expect(diveProgressFromScroll(vh * 0.5, vh)).toBe(0);
    expect(diveProgressFromScroll(vh, vh)).toBe(0); // exactly at hero bottom
  });

  it('reaches 1 at the end of the ~2.2vh dive region and clamps beyond', () => {
    expect(diveProgressFromScroll(vh + 2.2 * vh, vh)).toBeCloseTo(1, 6);
    expect(diveProgressFromScroll(vh + 10 * vh, vh)).toBe(1);
  });

  it('is ~0.5 halfway through the dive region', () => {
    expect(diveProgressFromScroll(vh + 1.1 * vh, vh)).toBeCloseTo(0.5, 6);
  });

  it('increases monotonically across the dive region', () => {
    let prev = -1;
    for (let s = vh; s <= vh + 2.2 * vh; s += 40) {
      const p = diveProgressFromScroll(s, vh);
      expect(p).toBeGreaterThanOrEqual(prev);
      prev = p;
    }
  });

  it('guards a zero viewport height', () => {
    expect(diveProgressFromScroll(500, 0)).toBe(0);
  });
});
