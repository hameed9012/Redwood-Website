import type { Object3D } from 'three';

export type PeakLetter = 'P' | 'E' | 'A' | 'K';

export interface PeakBottleDef {
  letter: PeakLetter;
  drug: string;
}

/** Fixed pairings — must never drift (spec §8). */
export const PEAK_BOTTLES: readonly PeakBottleDef[] = [
  { letter: 'P', drug: 'Propofol' },
  { letter: 'E', drug: 'Etomidate' },
  { letter: 'A', drug: 'Atropine' },
  { letter: 'K', drug: 'Ketamine' },
] as const;

export function drugFor(letter: PeakLetter): string {
  const def = PEAK_BOTTLES.find((b) => b.letter === letter);
  if (!def) throw new Error(`Unknown PEAK letter: ${letter}`);
  return def.drug;
}

export interface PeakEntry {
  letter: PeakLetter;
  drug: string;
  object: Object3D;
}

/**
 * Holds the four tagged hero bottles so they are queryable as a set from
 * outside the objects themselves. Phase 2's drag/order/solve keys off this.
 */
export class PeakRegistry {
  private entries = new Map<PeakLetter, PeakEntry>();

  tagObject(object: Object3D, letter: PeakLetter): void {
    const drug = drugFor(letter);
    object.userData.isPeakBottle = true;
    object.userData.peakLetter = letter;
    object.userData.drug = drug;
  }

  register(letter: PeakLetter, object: Object3D): void {
    this.tagObject(object, letter);
    this.entries.set(letter, { letter, drug: drugFor(letter), object });
  }

  get(letter: PeakLetter): PeakEntry | undefined {
    return this.entries.get(letter);
  }

  all(): PeakEntry[] {
    return Array.from(this.entries.values());
  }

  isComplete(): boolean {
    return (['P', 'E', 'A', 'K'] as PeakLetter[]).every((l) => this.entries.has(l));
  }

  clear(): void {
    this.entries.clear();
  }
}
