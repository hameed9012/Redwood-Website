import { describe, it, expect } from 'vitest';
import { isRaid, isSpam, isSuspiciousAccount, isDeadmanLapsed } from './heuristics';

describe('security heuristics', () => {
  it('isRaid: too many joins in the window', () => {
    const now = 10_000;
    const joins = [9800, 9850, 9900, 9950]; // 4 in the last 500ms
    expect(isRaid(joins, now, { threshold: 3, windowSeconds: 1 })).toBe(true);
    expect(isRaid([9800], now, { threshold: 3, windowSeconds: 1 })).toBe(false);
  });

  it('isRaid: ignores joins older than the window', () => {
    const now = 100_000;
    const joins = [1000, 2000, 3000, 99_900]; // only 1 recent
    expect(isRaid(joins, now, { threshold: 3, windowSeconds: 1 })).toBe(false);
  });

  it('isSpam: message rate over the window', () => {
    const now = 10_000;
    const stamps = [9700, 9800, 9900, 9950, 9990];
    expect(isSpam(stamps, now, { threshold: 5, windowSeconds: 1 })).toBe(true);
    expect(isSpam(stamps.slice(0, 3), now, { threshold: 5, windowSeconds: 1 })).toBe(false);
  });

  it('isSuspiciousAccount: newer than the minimum age', () => {
    const now = Date.now();
    const day = 86_400_000;
    expect(isSuspiciousAccount(now - 2 * day, now, 7)).toBe(true);
    expect(isSuspiciousAccount(now - 30 * day, now, 7)).toBe(false);
  });

  it('isDeadmanLapsed: deadline in the past', () => {
    expect(isDeadmanLapsed(1000, 2000)).toBe(true);
    expect(isDeadmanLapsed(3000, 2000)).toBe(false);
    expect(isDeadmanLapsed(null, 2000)).toBe(false);
  });
});
