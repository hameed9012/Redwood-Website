import { describe, it, expect } from 'vitest';
import { advanceStatus, ASSIGNMENTS, ORG, NOTICES } from './content';

describe('advanceStatus', () => {
  it('cycles open → in-progress → done → open', () => {
    expect(advanceStatus('open')).toBe('in-progress');
    expect(advanceStatus('in-progress')).toBe('done');
    expect(advanceStatus('done')).toBe('open');
  });
});

describe('portal content data', () => {
  it('exposes the content arrays (start empty — populated by the user)', () => {
    expect(Array.isArray(ASSIGNMENTS)).toBe(true);
    expect(Array.isArray(NOTICES)).toBe(true);
    expect(Array.isArray(ORG)).toBe(true);
  });
});
