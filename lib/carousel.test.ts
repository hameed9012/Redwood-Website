import { describe, it, expect } from 'vitest';
import { pickSlides } from './carousel';

describe('pickSlides', () => {
  it('returns DB slides when there are any', () => {
    expect(pickSlides([1, 2], [9])).toEqual([1, 2]);
  });
  it('falls back when DB is empty', () => {
    expect(pickSlides([], [9])).toEqual([9]);
  });
});
