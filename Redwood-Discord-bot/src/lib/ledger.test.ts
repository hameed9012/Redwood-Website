import { describe, it, expect } from 'vitest';
import { computeBalances, formatMoney, type LedgerEntry } from './ledger';

const entries: Pick<LedgerEntry, 'amount' | 'direction' | 'book'>[] = [
  { amount: 1000, direction: 'inflow', book: 'white' },
  { amount: 250, direction: 'outflow', book: 'white' },
  { amount: 500, direction: 'inflow', book: 'black' },
];

describe('ledger math', () => {
  it('computes per-book balances', () => {
    const b = computeBalances(entries);
    expect(b.white).toEqual({ inflow: 1000, outflow: 250, balance: 750 });
    expect(b.black).toEqual({ inflow: 500, outflow: 0, balance: 500 });
  });

  it('empty is all zeros', () => {
    expect(computeBalances([])).toEqual({ white: { inflow: 0, outflow: 0, balance: 0 }, black: { inflow: 0, outflow: 0, balance: 0 } });
  });

  it('formats money with separators', () => {
    expect(formatMoney(1250)).toBe('$1,250');
    expect(formatMoney(0)).toBe('$0');
  });
});
