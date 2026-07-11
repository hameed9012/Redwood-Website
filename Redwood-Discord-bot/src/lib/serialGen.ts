export function generateSerial(rng: () => number = Math.random): string {
  const digits = Array.from({ length: 6 }, () => Math.floor(rng() * 10)).join('');
  return `RW-${digits}`;
}
