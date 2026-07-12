export type OrderStatus = 'open' | 'claimed' | 'fulfilled' | 'done' | 'cancelled';

export interface Order {
  id: string;
  seq: number;
  customerId: string;
  threadId: string;
  status: OrderStatus;
  claimedBy: string | null;
  amount: number | null;
  summary: string;
  createdAt: string;
}

export const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  open: ['claimed', 'cancelled'],
  claimed: ['fulfilled', 'cancelled'],
  fulfilled: ['done', 'cancelled'],
  done: [],
  cancelled: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(from: OrderStatus, to: OrderStatus): { ok: true } | { ok: false; error: string } {
  if (canTransition(from, to)) return { ok: true };
  if (from === to) return { ok: false, error: `This order is already ${from}.` };
  if (from === 'done' || from === 'cancelled') return { ok: false, error: `This order is ${from} and can't change.` };
  return { ok: false, error: `An order can't go from ${from} to ${to}.` };
}
