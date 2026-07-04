import { describe, it, expect } from 'vitest';
import { diveProgressFromScroll } from './useScrollDive';

describe('diveProgressFromScroll', () => {
  const maxScroll = 3000; // documentHeight - viewportH

  it('is 0 at the top (surface)', () => {
    expect(diveProgressFromScroll(0, maxScroll)).toBe(0);
  });

  it('reaches 1 exactly at the page bottom (deep) and clamps beyond', () => {
    expect(diveProgressFromScroll(maxScroll, maxScroll)).toBe(1);
    expect(diveProgressFromScroll(maxScroll * 3, maxScroll)).toBe(1);
  });

  it('is proportional through the descent', () => {
    expect(diveProgressFromScroll(maxScroll * 0.5, maxScroll)).toBeCloseTo(0.5, 6);
    expect(diveProgressFromScroll(maxScroll * 0.25, maxScroll)).toBeCloseTo(0.25, 6);
  });

  it('increases monotonically from top to bottom', () => {
    let prev = -1;
    for (let s = 0; s <= maxScroll; s += 50) {
      const p = diveProgressFromScroll(s, maxScroll);
      expect(p).toBeGreaterThanOrEqual(prev);
      prev = p;
    }
  });

  it('guards a zero / negative scrollable height (page shorter than viewport)', () => {
    expect(diveProgressFromScroll(500, 0)).toBe(0);
    expect(diveProgressFromScroll(500, -100)).toBe(0);
  });
});
