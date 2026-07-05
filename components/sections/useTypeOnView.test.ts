import { describe, it, expect } from 'vitest';
import { typeAdvance } from './useTypeOnView';

describe('typeAdvance', () => {
  it('grows the shown count by one each step', () => {
    expect(typeAdvance(0, 10)).toBe(1);
    expect(typeAdvance(4, 10)).toBe(5);
  });

  it('never overshoots the total (one-shot, no looping)', () => {
    expect(typeAdvance(10, 10)).toBe(10);
    expect(typeAdvance(9, 10)).toBe(10);
    expect(typeAdvance(20, 10)).toBe(10);
  });

  it('handles an empty target', () => {
    expect(typeAdvance(0, 0)).toBe(0);
  });
});
