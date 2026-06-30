import { describe, it, expect } from 'vitest';
import { rippleStrengthForSpeed } from './useSurfaceCursor';

describe('rippleStrengthForSpeed', () => {
  it('faster cursor motion makes a stronger cut, clamped to 1', () => {
    expect(rippleStrengthForSpeed(0)).toBeCloseTo(0, 5);
    expect(rippleStrengthForSpeed(1000)).toBe(1);
    expect(rippleStrengthForSpeed(50)).toBeGreaterThan(0);
    expect(rippleStrengthForSpeed(50)).toBeLessThan(1);
  });
});
