import { describe, it, expect } from 'vitest';
import { randomLoadingMs } from './loadingDuration';

describe('randomLoadingMs', () => {
  it('is within 2500–4500ms', () => {
    expect(randomLoadingMs(() => 0)).toBe(2500);
    expect(randomLoadingMs(() => 1)).toBe(4500);
    const v = randomLoadingMs(() => 0.5);
    expect(v).toBeGreaterThanOrEqual(2500);
    expect(v).toBeLessThanOrEqual(4500);
  });
});
