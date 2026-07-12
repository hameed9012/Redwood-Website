import { serverDb } from './serverClient';

export type Book = 'white' | 'black';

export interface LedgerRowRaw {
  id: string;
  amount: number;
  direction: 'inflow' | 'outflow';
  book: Book;
  reason: string;
  created_at: string;
}

export interface LedgerRow {
  id: string;
  date: string;
  book: Book;
  direction: 'in' | 'out';
  amount: number;
  reason: string;
}

/** Map bot-written ledger_entries rows to the shape the Command page renders. Pure. */
export function shapeLedger(rows: LedgerRowRaw[]): LedgerRow[] {
  return rows.map((r) => ({
    id: r.id,
    date: r.created_at.slice(0, 10),
    book: r.book,
    direction: r.direction === 'inflow' ? 'in' : 'out',
    amount: r.amount,
    reason: r.reason,
  }));
}

export async function loadLedger(): Promise<LedgerRow[]> {
  const db = serverDb();
  if (!db) return [];
  const { data, error } = await db
    .from('ledger_entries')
    .select('id, amount, direction, book, reason, created_at')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return shapeLedger((data ?? []) as LedgerRowRaw[]);
}
