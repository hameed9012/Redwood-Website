import { db } from '../lib/supabase';
import type { LedgerEntry, Direction, Book } from '../lib/ledger';

interface Row { amount: number; direction: Direction; book: Book; reason: string; source: string; created_at: string; }
const toEntry = (r: Row): LedgerEntry => ({ amount: r.amount, direction: r.direction, book: r.book, reason: r.reason, source: r.source, createdAt: r.created_at });

export async function addLedgerEntry(amount: number, direction: Direction, book: Book, reason: string, source: string, createdBy: string): Promise<void> {
  const { error } = await db().from('ledger_entries').insert({ amount, direction, book, reason, source, created_by: createdBy });
  if (error) throw error;
}

export async function listEntries(limit = 500): Promise<LedgerEntry[]> {
  const { data, error } = await db().from('ledger_entries').select('amount, direction, book, reason, source, created_at').order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return ((data ?? []) as Row[]).map(toEntry);
}
