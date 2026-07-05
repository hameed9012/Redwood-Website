/**
 * Fake inquiry reference for the contact form (Phase 3): "RW-" + 5 uppercase
 * alphanumerics. Pure theatre — it looks like a ticket number, logs nothing.
 * `rand` is injectable so tests are deterministic.
 */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function makeInquiryRef(rand: () => number = Math.random): string {
  let s = '';
  for (let i = 0; i < 5; i++) {
    const idx = Math.min(ALPHABET.length - 1, Math.floor(rand() * ALPHABET.length));
    s += ALPHABET[idx];
  }
  return `RW-${s}`;
}
