import type { PeakLetter } from '../peak';

export const PEAK_ORDER: PeakLetter[] = ['P', 'E', 'A', 'K'];

/** slots: the letter in each of the 4 tray slots (null = empty). */
export function nearMissCount(slots: (PeakLetter | null)[]): number {
  return PEAK_ORDER.reduce((n, want, i) => (slots[i] === want ? n + 1 : n), 0);
}

export function isSolved(slots: (PeakLetter | null)[]): boolean {
  return slots.length === 4 && slots.every((s, i) => s === PEAK_ORDER[i]);
}
