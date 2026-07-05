import { describe, it, expect } from 'vitest';
import { hasSolvedThisSession, markSolved } from './session';

function fakeStore() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) } as Storage;
}

describe('session flag', () => {
  it('is false until marked, true after', () => {
    const s = fakeStore();
    expect(hasSolvedThisSession(s)).toBe(false);
    markSolved(s);
    expect(hasSolvedThisSession(s)).toBe(true);
  });
});
