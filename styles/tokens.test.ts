import { describe, it, expect } from 'vitest';
import { TOKENS } from './tokens';

describe('design tokens', () => {
  it('exposes the five brand colors as hex strings', () => {
    expect(TOKENS.black).toBe('#0a0a0a');
    expect(TOKENS.charcoal).toBe('#141414');
    expect(TOKENS.red).toBe('#c1272d');
    expect(TOKENS.redDeep).toBe('#7a1518');
    expect(TOKENS.bone).toBe('#f5f5f4');
  });

  it('every value is a 6-digit hex', () => {
    for (const v of Object.values(TOKENS)) {
      expect(v).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
