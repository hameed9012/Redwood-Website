import { describe, it, expect } from 'vitest';
import { diveProgressFromScroll } from './useScrollDive';

describe('diveProgressFromScroll', () => {
  // Surface holds until startPx, then ramps to 1 by endPx.
  const startPx = 1000;
  const endPx = 3000;

  it('is 0 through the surface zone (before startPx)', () => {
    expect(diveProgressFromScroll(0, startPx, endPx)).toBe(0);
    expect(diveProgressFromScroll(500, startPx, endPx)).toBe(0);
    expect(diveProgressFromScroll(startPx, startPx, endPx)).toBe(0);
  });

  it('reaches 1 at endPx (deep) and clamps beyond', () => {
    expect(diveProgressFromScroll(endPx, startPx, endPx)).toBe(1);
    expect(diveProgressFromScroll(endPx + 5000, startPx, endPx)).toBe(1);
  });

  it('is ~0.5 halfway between the anchors', () => {
    expect(diveProgressFromScroll(2000, startPx, endPx)).toBeCloseTo(0.5, 6);
  });

  it('increases monotonically across the descent', () => {
    let prev = -1;
    for (let s = startPx; s <= endPx; s += 50) {
      const p = diveProgressFromScroll(s, startPx, endPx);
      expect(p).toBeGreaterThanOrEqual(prev);
      prev = p;
    }
  });

  it('guards a degenerate span (endPx <= startPx)', () => {
    expect(diveProgressFromScroll(500, 1000, 1000)).toBe(0);
    expect(diveProgressFromScroll(1200, 1000, 1000)).toBe(1);
  });
});
