export type Book = 'white' | 'black';
export type Direction = 'inflow' | 'outflow';

export interface LedgerEntry {
  amount: number;
  direction: Direction;
  book: Book;
  reason: string;
  source: string;
  createdAt: string;
}

export interface BookBalance { inflow: number; outflow: number; balance: number; }

export function formatMoney(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

export function computeBalances(entries: Pick<LedgerEntry, 'amount' | 'direction' | 'book'>[]): { white: BookBalance; black: BookBalance } {
  const acc = { white: { inflow: 0, outflow: 0, balance: 0 }, black: { inflow: 0, outflow: 0, balance: 0 } };
  for (const e of entries) {
    const b = acc[e.book];
    if (e.direction === 'inflow') b.inflow += e.amount;
    else b.outflow += e.amount;
  }
  acc.white.balance = acc.white.inflow - acc.white.outflow;
  acc.black.balance = acc.black.inflow - acc.black.outflow;
  return acc;
}
