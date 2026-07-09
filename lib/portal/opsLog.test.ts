import { describe, it, expect } from 'vitest';
import { selectRuns, OPS_RUNS, type Run } from './opsLog';

const sample: Run[] = [
  { id: 'a', date: '2026-06-25', route: 'x', tanker: 't', cargo: 'c', tonnage: 1, status: 'delivered' },
  { id: 'b', date: '2026-06-28', route: 'x', tanker: 't', cargo: 'c', tonnage: 2, status: 'held' },
  { id: 'c', date: '2026-06-27', route: 'x', tanker: 't', cargo: 'c', tonnage: 3, status: 'delivered' },
];

describe('selectRuns', () => {
  it('sorts by date descending by default order (newest first)', () => {
    const out = selectRuns(sample, 'all', 'desc');
    expect(out.map((r) => r.id)).toEqual(['b', 'c', 'a']);
  });

  it('sorts ascending when asked', () => {
    const out = selectRuns(sample, 'all', 'asc');
    expect(out.map((r) => r.id)).toEqual(['a', 'c', 'b']);
  });

  it('filters by status', () => {
    const out = selectRuns(sample, 'delivered', 'desc');
    expect(out.map((r) => r.id)).toEqual(['c', 'a']);
  });

  it('"all" returns every row', () => {
    expect(selectRuns(sample, 'all', 'desc')).toHaveLength(3);
  });

  it('never mutates the input', () => {
    const before = sample.map((r) => r.id);
    selectRuns(sample, 'held', 'asc');
    expect(sample.map((r) => r.id)).toEqual(before);
  });

  it('the shipped log is non-empty and every row is well-formed', () => {
    expect(OPS_RUNS.length).toBeGreaterThan(5);
    for (const r of OPS_RUNS) {
      expect(r.id).toMatch(/^RUN-\d+$/);
      expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof r.tonnage).toBe('number');
    }
  });
});
