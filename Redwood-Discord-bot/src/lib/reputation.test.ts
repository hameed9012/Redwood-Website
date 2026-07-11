import { describe, it, expect } from 'vitest';
import { summarizeReputation, type ReputationLite } from './reputation';

const rows: ReputationLite[] = [
  { discordId: 'm1', kind: 'commendation', reason: 'Clean supply run', createdAt: '2026-07-11T03:00:00Z' },
  { discordId: 'm1', kind: 'commendation', reason: 'Covered a shift', createdAt: '2026-07-11T02:00:00Z' },
  { discordId: 'm1', kind: 'writeup', reason: 'Missed muster', createdAt: '2026-07-11T04:00:00Z' },
];

describe('summarizeReputation', () => {
  it('counts by kind and lists recent newest-first', () => {
    const s = summarizeReputation(rows);
    expect(s.commendations).toBe(2);
    expect(s.writeups).toBe(1);
    expect(s.recent[0]).toContain('Missed muster');
    expect(s.recent.length).toBeLessThanOrEqual(3);
  });

  it('empty is zero/zero', () => {
    expect(summarizeReputation([])).toEqual({ commendations: 0, writeups: 0, recent: [] });
  });
});
