import { describe, it, expect } from 'vitest';
import { line, HANDBOOK } from './voice';

describe('voice', () => {
  it('formats a company line with the prefix', () => {
    expect(line('ok', 'It is done.')).toBe('✔ It is done.');
    expect(line('deny', 'Above your clearance.')).toBe('⛔ Above your clearance.');
    expect(line('err', 'Something failed.')).toBe('⚠ Something failed.');
  });

  it('ships a non-empty handbook', () => {
    expect(HANDBOOK.length).toBeGreaterThan(50);
    expect(HANDBOOK).toContain('Redwood Peak');
  });
});
