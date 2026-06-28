import { describe, it, expect } from 'vitest';
import { detectTier, qualityFor, type Tier } from './quality';

describe('detectTier', () => {
  it('returns "low" for few cores / low memory / coarse pointer', () => {
    const t = detectTier({ cores: 2, memoryGb: 2, coarsePointer: true });
    expect(t).toBe('low');
  });

  it('returns "high" for many cores / ample memory / fine pointer', () => {
    const t = detectTier({ cores: 12, memoryGb: 16, coarsePointer: false });
    expect(t).toBe('high');
  });

  it('returns "mid" in between', () => {
    const t = detectTier({ cores: 6, memoryGb: 8, coarsePointer: false });
    expect(t).toBe('mid');
  });
});

describe('qualityFor', () => {
  it('low tier drops postprocessing and caustics and caps dpr at 1', () => {
    const q = qualityFor('low');
    expect(q.postprocessing).toBe(false);
    expect(q.caustics).toBe(false);
    expect(q.maxDpr).toBe(1);
    expect(q.bottleCount).toBeLessThan(qualityFor('high').bottleCount);
  });

  it('high tier enables postprocessing and caustics', () => {
    const q = qualityFor('high');
    expect(q.postprocessing).toBe(true);
    expect(q.caustics).toBe(true);
    expect(q.maxDpr).toBeGreaterThanOrEqual(1.5);
  });

  it('every tier keeps the 4 PEAK bottles present', () => {
    (['low', 'mid', 'high'] as Tier[]).forEach((t) => {
      expect(qualityFor(t).heroBottlesPresent).toBe(true);
    });
  });
});
