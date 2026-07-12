import { describe, it, expect } from 'vitest';
import { shapeLedger, type LedgerRowRaw } from './command';

const raw: LedgerRowRaw[] = [
  { id: 'a1', amount: 50000, direction: 'outflow', book: 'black', reason: 'Cleanup — dock 4', created_at: '2026-07-12T14:00:00Z' },
  { id: 'b2', amount: 12000, direction: 'inflow', book: 'white', reason: 'Consulting retainer', created_at: '2026-07-11T09:30:00Z' },
];

describe('shapeLedger', () => {
  it('maps direction and date and preserves book/reason/amount', () => {
    const rows = shapeLedger(raw);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ id: 'a1', date: '2026-07-12', book: 'black', direction: 'out', amount: 50000, reason: 'Cleanup — dock 4' });
    expect(rows[1].direction).toBe('in');
    expect(rows[1].book).toBe('white');
  });
});
