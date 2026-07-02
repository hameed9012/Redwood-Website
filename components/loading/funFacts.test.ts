import { describe, it, expect } from 'vitest';
import { FACTS, buildFactSequence, POISON_FACT } from './funFacts';

describe('fun facts', () => {
  it('has 15–20 facts and none is the poison line', () => {
    expect(FACTS.length).toBeGreaterThanOrEqual(15);
    expect(FACTS.length).toBeLessThanOrEqual(20);
    expect(FACTS).not.toContain(POISON_FACT);
  });
  it('includes the poison line when the 1-in-12 roll hits', () => {
    const seq = buildFactSequence(8, () => 0); // rng()=0 → roll hits (0 < 1/12)
    expect(seq).toContain(POISON_FACT);
  });
  it('omits the poison line when the roll misses', () => {
    const seq = buildFactSequence(8, () => 0.99); // misses
    expect(seq).not.toContain(POISON_FACT);
  });
});
