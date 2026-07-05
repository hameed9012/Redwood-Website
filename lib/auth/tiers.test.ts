import { describe, it, expect } from 'vitest';
import { TIERS, TIER_RANK, TIER_LABEL, hasAtLeast } from './tiers';

describe('tiers', () => {
  it('ranks recruit < employee < high-command', () => {
    expect(TIER_RANK.recruit).toBeLessThan(TIER_RANK.employee);
    expect(TIER_RANK.employee).toBeLessThan(TIER_RANK['high-command']);
  });

  it('has a human label for every tier', () => {
    for (const t of TIERS) expect(TIER_LABEL[t]).toBeTruthy();
    expect(TIER_LABEL['high-command']).toBe('High Command');
  });

  it('hasAtLeast: a tier satisfies itself and everything below it', () => {
    expect(hasAtLeast('employee', 'employee')).toBe(true);
    expect(hasAtLeast('employee', 'recruit')).toBe(true);
    expect(hasAtLeast('high-command', 'employee')).toBe(true);
  });

  it('hasAtLeast: a lower tier does not satisfy a higher requirement', () => {
    expect(hasAtLeast('recruit', 'employee')).toBe(false);
    expect(hasAtLeast('employee', 'high-command')).toBe(false);
  });

  it('hasAtLeast: a null/absent session never satisfies any requirement', () => {
    expect(hasAtLeast(null, 'recruit')).toBe(false);
    expect(hasAtLeast(undefined, 'recruit')).toBe(false);
  });
});
