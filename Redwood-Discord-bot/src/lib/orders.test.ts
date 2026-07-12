import { describe, it, expect } from 'vitest';
import { canTransition, assertTransition, TRANSITIONS, type OrderStatus } from './orders';

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
