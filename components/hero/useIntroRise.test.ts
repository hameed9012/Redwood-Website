import { describe, it, expect } from 'vitest';
import { buildRiseSchedule } from './useIntroRise';

describe('buildRiseSchedule', () => {
  it('staggers start times so objects never all rise at once', () => {
    const s = buildRiseSchedule(8, 12345);
    const starts = s.map((x) => x.startDelay);
    expect(new Set(starts).size).toBeGreaterThan(1);
    expect(Math.max(...starts)).toBeGreaterThan(Math.min(...starts));
  });

  it('marks a minority as long far-back rises (~30s)', () => {
    const s = buildRiseSchedule(20, 999);
    const longOnes = s.filter((x) => x.duration >= 25);
    expect(longOnes.length).toBeGreaterThan(0);
    expect(longOnes.length).toBeLessThan(s.length / 2);
  });

  it('varies behavior (some rotate, some pause)', () => {
    const s = buildRiseSchedule(20, 7);
    expect(s.some((x) => x.rotateWhileRising)).toBe(true);
    expect(s.some((x) => x.pauseMidway)).toBe(true);
  });
});
