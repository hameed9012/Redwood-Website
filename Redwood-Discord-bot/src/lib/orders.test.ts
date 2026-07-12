import { describe, it, expect } from 'vitest';
import { canTransition, assertTransition, TRANSITIONS, requiresAmount, parseAmount, type OrderStatus } from './orders';

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
