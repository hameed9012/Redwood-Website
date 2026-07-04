import { describe, it, expect } from 'vitest';
import { makeInquiryRef } from './inquiry';

describe('makeInquiryRef', () => {
  it('matches the RW-XXXXX shape (5 uppercase alphanumerics)', () => {
    for (let i = 0; i < 200; i++) {
      expect(makeInquiryRef()).toMatch(/^RW-[A-Z0-9]{5}$/);
    }
  });

  it('is deterministic given a seeded rand', () => {
    const seq = [0, 0.1, 0.2, 0.3, 0.4];
    let a = 0;
    let b = 0;
    const randA = () => seq[a++];
    const randB = () => seq[b++];
    expect(makeInquiryRef(randA)).toBe(makeInquiryRef(randB));
  });

  it('maps rand=0 to the first symbol and near-1 to the last', () => {
    expect(makeInquiryRef(() => 0)).toBe('RW-AAAAA');
    expect(makeInquiryRef(() => 0.9999)).toBe('RW-99999');
  });

  it('produces varied refs across many calls (not a constant)', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) seen.add(makeInquiryRef());
    expect(seen.size).toBeGreaterThan(90); // ~36^5 space; collisions vanishingly rare
  });
});
