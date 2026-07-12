import { db } from '../lib/supabase';
import { addLedgerEntry } from './ledger';
import type { Order, OrderStatus } from '../lib/orders';

interface Row {
  id: string; seq: number; customer_id: string; thread_id: string; status: OrderStatus;
  claimed_by: string | null; amount: number | null; summary: string; created_at: string;
}
const COLS = 'id, seq, customer_id, thread_id, status, claimed_by, amount, summary, created_at';
const toOrder = (r: Row): Order => ({
  id: r.id, seq: r.seq, customerId: r.customer_id, threadId: r.thread_id, status: r.status,
  claimedBy: r.claimed_by, amount: r.amount, summary: r.summary, createdAt: r.created_at,
});

export async function createOrder(customerId: string, threadId: string, summary: string): Promise<Order> {
  const { data, error } = await db()
    .from('orders')
    .insert({ customer_id: customerId, thread_id: threadId, summary })
    .select(COLS)
    .single();
  if (error) throw error;
  return toOrder(data as Row);
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const { data, error } = await db().from('orders').select(COLS).eq('id', orderId).maybeSingle();
  if (error) throw error;
  return data ? toOrder(data as Row) : null;
}

export async function getOrderByThread(threadId: string): Promise<Order | null> {
  const { data, error } = await db().from('orders').select(COLS).eq('thread_id', threadId).maybeSingle();
  if (error) throw error;
  return data ? toOrder(data as Row) : null;
}

export interface OrderPatch { claimedBy?: string | null; amount?: number | null; }

export async function updateOrderStatus(orderId: string, to: OrderStatus, patch: OrderPatch = {}): Promise<Order> {
  const row: Record<string, unknown> = { status: to };
  if ('claimedBy' in patch) row.claimed_by = patch.claimedBy;
  if ('amount' in patch) row.amount = patch.amount;
  if (to === 'claimed') row.claimed_at = new Date().toISOString();
  if (to === 'done') row.done_at = new Date().toISOString();
  const { data, error } = await db().from('orders').update(row).eq('id', orderId).select(COLS).single();
  if (error) throw error;
  return toOrder(data as Row);
}

/**
 * Transition fulfilled → done and post the earnings to the ledger exactly once.
 * If the ledger write fails, roll the status back to `fulfilled` so a `done`
 * order always has its money on the books. Callers must assert the transition
 * and a non-null amount first.
 */
export async function completeOrder(order: Order, actorId: string): Promise<Order> {
  if (order.amount == null) throw new Error('Order has no amount set.');
  const done = await updateOrderStatus(order.id, 'done');
  try {
    await addLedgerEntry(order.amount, 'inflow', 'white', `Order #${order.seq} — ${order.summary || 'no summary'}`, 'order', actorId);
  } catch (err) {
    await updateOrderStatus(order.id, 'fulfilled');
    throw err;
  }
  return done;
}
