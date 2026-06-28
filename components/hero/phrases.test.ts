import { describe, it, expect } from 'vitest';
import { HERO_PHRASES, nextPhraseIndex } from './phrases';

describe('hero phrases', () => {
  it('is the exact spec list in order', () => {
    expect(HERO_PHRASES).toEqual([
      'A Pharmaceutical company',
      'A Technological company',
      'Creators for the better good of America',
      'Outdoor camping equipment sellers',
      'A logistics company',
    ]);
  });

  it('cycles continuously and wraps', () => {
    expect(nextPhraseIndex(0, HERO_PHRASES.length)).toBe(1);
    expect(nextPhraseIndex(4, HERO_PHRASES.length)).toBe(0);
  });
});
