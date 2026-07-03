export const SLOT_COUNT = 4;

/**
 * World position for a bottle snapped into tray slot i (0..3): a neat row across
 * the front-centre of the water, near the bottom of the top-down frame, slightly
 * raised so the slotted bottles sit clear of the waves.
 */
export function slotWorldPosition(i: number): [number, number, number] {
  return [(i - 1.5) * 2.4, 0.4, 7];
}

/**
 * Which tray slot (or -1) the pointer is over, given the slots' DOM rects.
 * `margin` expands each rect on all sides — a forgiving hitbox, since the
 * dragged bottle visually trails the cursor and 48px targets are unkind.
 */
export function screenSlotIndex(clientX: number, clientY: number, rects: DOMRect[], margin = 0): number {
  let best = -1;
  let bestDist = Infinity;
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (!r) continue;
    if (
      clientX >= r.left - margin &&
      clientX <= r.right + margin &&
      clientY >= r.top - margin &&
      clientY <= r.bottom + margin
    ) {
      // With margins, expanded rects can overlap — pick the nearest centre.
      const cx = (r.left + r.right) / 2;
      const cy = (r.top + r.bottom) / 2;
      const d = (clientX - cx) ** 2 + (clientY - cy) ** 2;
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
  }
  return best;
}
