import { describe, it, expect } from 'vitest';
import { labelUpComponent, RESTING_TILT, READ_TILT } from './useHoverToRead';

describe('hover-to-read orientation (top-down camera)', () => {
  it('label is edge-on (hidden) at rest', () => {
    expect(RESTING_TILT).toBe(0);
    expect(labelUpComponent(RESTING_TILT)).toBeCloseTo(0, 5);
  });
  it('hover tilts the labelled (+Z) face up to face the top-down camera (+Y)', () => {
    expect(labelUpComponent(READ_TILT)).toBeCloseTo(1, 5);
  });
});
