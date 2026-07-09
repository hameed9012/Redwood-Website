import { describe, it, expect } from 'vitest';
import { advanceStatus, ASSIGNMENTS, ORG, NOTICES } from './content';

describe('advanceStatus', () => {
  it('cycles open → in-progress → done → open', () => {
    expect(advanceStatus('open')).toBe('in-progress');
    expect(advanceStatus('in-progress')).toBe('done');
    expect(advanceStatus('done')).toBe('open');
  });
});

describe('portal lore data', () => {
  it('ships non-empty, well-formed content', () => {
    expect(ASSIGNMENTS.length).toBeGreaterThan(0);
    expect(NOTICES.length).toBeGreaterThan(0);
    expect(ORG.length).toBeGreaterThan(0);
    for (const t of ASSIGNMENTS) expect(t.id).toMatch(/^T-\d+$/);
    for (const d of ORG) expect(d.name).toBeTruthy();
  });
});
