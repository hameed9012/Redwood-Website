import { describe, it, expect } from 'vitest';
import { decideRevealMode } from './useRevealSequence';

describe('decideRevealMode', () => {
  it('plays the full reveal on first load', () => {
    expect(decideRevealMode({ hasPlayedOnce: false, scrolledToTop: false })).toBe('full');
  });

  it('replays phrases-only when returning to the very top after first play', () => {
    expect(decideRevealMode({ hasPlayedOnce: true, scrolledToTop: true })).toBe('phrases-only');
  });

  it('stays idle when already played and not at top', () => {
    expect(decideRevealMode({ hasPlayedOnce: true, scrolledToTop: false })).toBe('idle');
  });
});
