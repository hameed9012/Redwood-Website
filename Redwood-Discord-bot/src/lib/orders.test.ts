import { describe, it, expect } from 'vitest';
import {
  canTransition,
  assertTransition,
  TRANSITIONS,
  requiresAmount,
  parseAmount,
  orderButtons,
  ORDER_ACTION_PREFIX,
  type OrderStatus,
} from './orders';

const ALL: OrderStatus[] = ['open', 'claimed', 'fulfilled', 'done', 'cancelled'];

describe('order transitions', () => {
  it('allows only the forward + cancel edges', () => {
    expect(canTransition('open', 'claimed')).toBe(true);
    expect(canTransition('claimed', 'fulfilled')).toBe(true);
    expect(canTransition('fulfilled', 'done')).toBe(true);
    for (const s of ['open', 'claimed', 'fulfilled'] as OrderStatus[]) {
      expect(canTransition(s, 'cancelled')).toBe(true);
    }
  });

  it('rejects backward, skip, and terminal moves', () => {
    expect(canTransition('open', 'done')).toBe(false);
    expect(canTransition('claimed', 'open')).toBe(false);
    expect(canTransition('done', 'cancelled')).toBe(false);
    expect(canTransition('cancelled', 'claimed')).toBe(false);
    expect(TRANSITIONS.done).toEqual([]);
    expect(TRANSITIONS.cancelled).toEqual([]);
  });

  it('assertTransition returns ok or a reason', () => {
    expect(assertTransition('claimed', 'fulfilled')).toEqual({ ok: true });
    const bad = assertTransition('open', 'done');
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error).toBeTruthy();
    const already = assertTransition('claimed', 'claimed');
    if (!already.ok) expect(already.error).toContain('already');
  });
});

describe('requiresAmount', () => {
  it('is true only for fulfilled and done', () => {
    expect(requiresAmount('fulfilled')).toBe(true);
    expect(requiresAmount('done')).toBe(true);
    for (const s of ['open', 'claimed', 'cancelled'] as OrderStatus[]) {
      expect(requiresAmount(s)).toBe(false);
    }
  });
});

describe('parseAmount', () => {
  it('accepts whole positive dollars, stripping $ , and spaces', () => {
    expect(parseAmount('25000')).toEqual({ ok: true, amount: 25000 });
    expect(parseAmount('$25,000')).toEqual({ ok: true, amount: 25000 });
    expect(parseAmount('  400 ')).toEqual({ ok: true, amount: 400 });
  });
  it('rejects zero, negatives, decimals, and non-numeric', () => {
    for (const bad of ['0', '-5', '1.5', 'abc', '']) expect(parseAmount(bad).ok).toBe(false);
  });
});

function idsOf(row: ReturnType<typeof orderButtons>): string[] {
  if (!row) return [];
  return (row.toJSON() as { components: { custom_id: string }[] }).components.map((c) => c.custom_id);
}

describe('orderButtons', () => {
  it('offers the right actions per stage, carrying the order id', () => {
    expect(idsOf(orderButtons('o1', 'open'))).toEqual(['rw_order_claim:o1', 'rw_order_cancel:o1']);
    expect(idsOf(orderButtons('o1', 'claimed'))).toEqual(['rw_order_fulfill:o1', 'rw_order_cancel:o1']);
    expect(idsOf(orderButtons('o1', 'fulfilled'))).toEqual(['rw_order_done:o1', 'rw_order_cancel:o1']);
  });
  it('offers no buttons once done or cancelled', () => {
    expect(orderButtons('o1', 'done')).toBeNull();
    expect(orderButtons('o1', 'cancelled')).toBeNull();
  });
  it('every action id starts with the routing prefix', () => {
    for (const id of idsOf(orderButtons('o1', 'open'))) expect(id.startsWith(ORDER_ACTION_PREFIX)).toBe(true);
  });
});
