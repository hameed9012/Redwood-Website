import { describe, it, expect } from 'vitest';
import { nextTypeState, type TypeState } from './useTypewriter';

describe('nextTypeState', () => {
  const phrases = ['ab', 'cd'];
  it('types forward one char at a time', () => {
    const s0 = { phrase: 0, text: '', mode: 'typing' as const };
    const s1 = nextTypeState(s0, phrases);
    expect(s1.text).toBe('a');
    const s2 = nextTypeState(s1, phrases);
    expect(s2.text).toBe('ab');
  });
  it('switches to deleting after a full phrase, then advances to the next phrase', () => {
    let s: TypeState = { phrase: 0, text: 'ab', mode: 'typing' };
    s = nextTypeState(s, phrases);
    let guard = 0;
    while (!(s.phrase === 1 && s.text === '') && guard++ < 20) s = nextTypeState(s, phrases);
    expect(s.phrase).toBe(1);
    expect(s.text).toBe('');
  });
});
