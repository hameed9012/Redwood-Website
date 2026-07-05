export const FACTS: string[] = [
  'Water expands by about 9% when it freezes.',
  'Helium is the only element that cannot be solidified at normal pressure.',
  'Glass is an amorphous solid, not a slow-moving liquid.',
  'A bolt of lightning is roughly five times hotter than the surface of the sun.',
  'Honey never spoils if stored properly, even after thousands of years.',
  'Octopuses have three hearts and blue, copper-based blood.',
  'Diamonds and pencil graphite are both made purely of carbon atoms.',
  'Sound cannot travel through the vacuum of space.',
  'Bananas are naturally slightly radioactive due to their potassium content.',
  'The human body contains enough carbon to fill about 9,000 pencils.',
  'A single bolt of lightning contains enough energy to toast about 100,000 slices of bread.',
  'Gold is so malleable that one ounce can be stretched into a wire 50 miles long.',
  'The Eiffel Tower grows about 15 centimeters taller in summer due to thermal expansion.',
  'Sharks existed before trees appeared on Earth.',
  'Venus is the hottest planet in our solar system, hotter even than Mercury.',
  'A teaspoon of neutron star material would weigh about a billion tons.',
];

export const POISON_FACT = 'Poisoning the river.';

export function buildFactSequence(count: number, rng: () => number = Math.random): string[] {
  const pool = [...FACTS];
  // ~1-in-12 chance the poison line is seeded into this run.
  const seq: string[] = [];
  const poison = rng() < 1 / 12;
  for (let i = 0; i < count; i++) seq.push(pool[Math.floor(rng() * pool.length)] ?? pool[0]);
  if (poison) seq[Math.floor(rng() * count)] = POISON_FACT;
  return seq;
}
