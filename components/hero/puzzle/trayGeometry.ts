export const SLOT_COUNT = 4;

/**
 * World position for a bottle snapped into tray slot i (0..3): a neat row across
 * the front-centre of the water, near the bottom of the top-down frame, slightly
 * raised so the slotted bottles sit clear of the waves.
 */
export function slotWorldPosition(i: number): [number, number, number] {
  return [(i - 1.5) * 2.4, 0.4, 7];
}

/** Which tray slot (or -1) the pointer is over, given the slots' DOM rects. */
export function screenSlotIndex(clientX: number, clientY: number, rects: DOMRect[]): number {
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (r && clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) return i;
  }
  return -1;
}
