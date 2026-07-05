export function randomLoadingMs(rng: () => number = Math.random): number {
  return Math.round(2500 + rng() * 2000);
}
