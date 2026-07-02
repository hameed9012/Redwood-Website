import { describe, it, expect } from 'vitest';
import { isSolved, nearMissCount, PEAK_ORDER } from './order';

describe('PEAK order', () => {
  it('PEAK_ORDER is P,E,A,K', () => {
    expect(PEAK_ORDER).toEqual(['P', 'E', 'A', 'K']);
  });
  it('isSolved only when all four are in order', () => {
    expect(isSolved(['P', 'E', 'A', 'K'])).toBe(true);
    expect(isSolved(['P', 'E', 'K', 'A'])).toBe(false);
    expect(isSolved(['P', 'E', 'A', null])).toBe(false);
  });
  it('nearMissCount counts correctly-placed letters', () => {
    expect(nearMissCount(['P', 'E', 'A', 'K'])).toBe(4);
    expect(nearMissCount(['P', 'E', 'K', 'A'])).toBe(2);
    expect(nearMissCount(['P', 'E', 'A', 'P'])).toBe(3);
    expect(nearMissCount([null, null, null, null])).toBe(0);
  });
});
