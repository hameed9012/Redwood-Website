import { describe, it, expect } from 'vitest';
import { groupByRank, type PersonnelRow } from './personnel';

const rows: PersonnelRow[] = [
  { employeeName: 'A B', rank: 'employee', divisions: ['security'], positions: [] },
  { employeeName: 'C D', rank: 'high-command', divisions: [], positions: ['internal-affairs'] },
  { employeeName: 'E F', rank: 'employee', divisions: [], positions: [] },
];

describe('groupByRank', () => {
  it('orders high-command first, trainee last, and groups members', () => {
    const groups = groupByRank(rows);
    expect(groups.map((g) => g.rank)).toEqual(['high-command', 'supervisor', 'employee', 'trainee']);
    expect(groups[0].members).toHaveLength(1);
    expect(groups[2].members.map((m) => m.employeeName)).toEqual(['A B', 'E F']);
  });
});
