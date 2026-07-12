import { describe, it, expect } from 'vitest';
import { parseDonation } from './storefront';

describe('parseDonation', () => {
  it('accepts whole positive dollars, stripping $ , and spaces', () => {
    expect(parseDonation('50000')).toEqual({ ok: true, amount: 50000 });
    expect(parseDonation('$50,000')).toEqual({ ok: true, amount: 50000 });
    expect(parseDonation('  1000 ')).toEqual({ ok: true, amount: 1000 });
  });

  it('rejects zero, negatives, decimals, and non-numeric', () => {
    for (const bad of ['0', '-5', '1.5', 'abc', '']) {
      expect(parseDonation(bad).ok).toBe(false);
    }
  });
});
