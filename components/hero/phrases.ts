/** The cycling red phrases after "We are a" (spec §7.2). Order is exact. */
export const HERO_PHRASES = [
  'A Pharmaceutical company',
  'A Technological company',
  'Creators for the better good of America',
  'Outdoor camping equipment sellers',
  'A logistics company',
] as const;

export function nextPhraseIndex(current: number, length: number): number {
  return (current + 1) % length;
}
