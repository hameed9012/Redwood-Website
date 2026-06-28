import { describe, it, expect } from 'vitest';
import { faceCameraRotationY, RESTING_LABEL_AWAY } from './useHoverToRead';

describe('hover-to-read orientation', () => {
  it('resting orientation turns the label away from the viewer', () => {
    expect(RESTING_LABEL_AWAY).toBeCloseTo(Math.PI, 5);
  });

  it('hover target rotates the label to face the camera (y → 0 mod 2π)', () => {
    const target = faceCameraRotationY(Math.PI);
    expect(Math.abs(Math.sin(target))).toBeLessThan(1e-6); // facing front
  });
});
