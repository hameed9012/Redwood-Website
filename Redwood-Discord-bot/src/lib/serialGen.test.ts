import { describe, it, expect } from 'vitest';
import { generateSerial } from './serialGen';

describe('generateSerial', () => {
  it('is RW- plus six digits', () => {
    for (let i = 0; i < 50; i++) expect(generateSerial()).toMatch(/^RW-\d{6}$/);
  });
});
