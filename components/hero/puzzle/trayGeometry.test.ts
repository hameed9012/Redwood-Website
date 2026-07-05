import { describe, it, expect } from 'vitest';
import { slotWorldPosition, SLOT_COUNT, screenSlotIndex } from './trayGeometry';

describe('tray geometry', () => {
  it('has 4 slots spread left→right at the same height', () => {
    expect(SLOT_COUNT).toBe(4);
    const p0 = slotWorldPosition(0);
    const p3 = slotWorldPosition(3);
    expect(p0[0]).toBeLessThan(p3[0]);
    expect(p0[1]).toBeCloseTo(p3[1], 5);
    expect(p0[2]).toBeCloseTo(p3[2], 5);
  });
  it('screenSlotIndex finds the slot under the pointer, else -1', () => {
    const rects = [0, 1, 2, 3].map((i) => ({ left: i * 100, right: i * 100 + 80, top: 500, bottom: 560 } as DOMRect));
    expect(screenSlotIndex(40, 530, rects)).toBe(0);
    expect(screenSlotIndex(250, 530, rects)).toBe(2);
    expect(screenSlotIndex(40, 100, rects)).toBe(-1);
    expect(screenSlotIndex(90, 530, rects)).toBe(-1); // gap between slots
  });
});
