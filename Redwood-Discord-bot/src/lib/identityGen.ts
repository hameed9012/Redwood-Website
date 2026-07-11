import type { GeneratedIdentity } from './identity';

export type Gender = 'male' | 'female';

const MALE_FIRST = [
  'James', 'Robert', 'John', 'Michael', 'David', 'William', 'Richard', 'Joseph',
  'Thomas', 'Charles', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven',
  'Andrew', 'Paul', 'Joshua', 'Kenneth', 'Kevin', 'Brian', 'George', 'Timothy',
  'Ronald', 'Jason', 'Edward', 'Jeffrey', 'Ryan', 'Jacob', 'Nicholas', 'Eric',
  'Jonathan', 'Stephen', 'Justin', 'Scott', 'Brandon', 'Frank', 'Benjamin', 'Samuel',
  'Raymond', 'Patrick', 'Alexander', 'Jack', 'Dennis', 'Tyler', 'Aaron', 'Adam', 'Nathan', 'Henry',
];
const FEMALE_FIRST = [
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica',
  'Sarah', 'Karen', 'Nancy', 'Lisa', 'Betty', 'Margaret', 'Sandra', 'Ashley',
  'Kimberly', 'Emily', 'Donna', 'Michelle', 'Carol', 'Amanda', 'Dorothy', 'Melissa',
  'Deborah', 'Stephanie', 'Rebecca', 'Sharon', 'Laura', 'Cynthia', 'Kathleen', 'Amy',
  'Angela', 'Anna', 'Brenda', 'Pamela', 'Emma', 'Nicole', 'Helen', 'Samantha',
  'Katherine', 'Christine', 'Rachel', 'Carolyn', 'Janet', 'Maria', 'Olivia', 'Heather', 'Diane', 'Julie',
];
const LAST = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
];
const BLOOD = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const RELATIONS = ['spouse', 'mother', 'father', 'sibling', 'cousin', 'guardian'];

const MALE_SET = new Set(MALE_FIRST.map((n) => n.toLowerCase()));
const FEMALE_SET = new Set(FEMALE_FIRST.map((n) => n.toLowerCase()));

const pick = <T,>(arr: T[], rng: () => number): T => arr[Math.floor(rng() * arr.length)];
const digits = (n: number, rng: () => number): string =>
  Array.from({ length: n }, () => Math.floor(rng() * 10)).join('');

/** Guess a person's gender from the first token of their name. Unknown if not in the lists. */
export function guessGender(fullName: string): Gender | 'unknown' {
  const first = fullName.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
  if (FEMALE_SET.has(first)) return 'female';
  if (MALE_SET.has(first)) return 'male';
  return 'unknown';
}

/** A random full name of the given gender. */
function nameOfGender(gender: Gender, rng: () => number): string {
  const pool = gender === 'female' ? FEMALE_FIRST : MALE_FIRST;
  return `${pick(pool, rng)} ${pick(LAST, rng)}`;
}

/**
 * Disposable civilian cover — real formats, random values, fictional person.
 * The generated legal name matches `gender`; pass the real member's guessed
 * gender so the cover is consistent (a man gets a man's cover name). Unknown or
 * omitted → a random gender is chosen.
 */
export function generateIdentity(gender: Gender | 'unknown' = 'unknown', rng: () => number = Math.random): GeneratedIdentity {
  const g: Gender = gender === 'unknown' ? (rng() < 0.5 ? 'male' : 'female') : gender;

  // SSN area: 001–899 excluding 666.
  let area = 1 + Math.floor(rng() * 899);
  if (area === 666) area = 665;
  const ssn = `${String(area).padStart(3, '0')}-${digits(2, rng)}-${digits(4, rng)}`;

  const idNumber = `${String.fromCharCode(65 + Math.floor(rng() * 26))}${digits(8, rng)}`;

  // Base age 21–54, then push the birthday back 0–364 days so age lands in
  // [ageYears, ageYears+1) — guaranteeing 21 ≤ age < 55 whatever today's date is.
  const ageYears = 21 + Math.floor(rng() * 34); // 21–54
  const dobDate = new Date();
  dobDate.setFullYear(dobDate.getFullYear() - ageYears);
  dobDate.setDate(dobDate.getDate() - Math.floor(rng() * 365));
  const dob = dobDate.toISOString().slice(0, 10);

  return {
    legalName: nameOfGender(g, rng),
    dob,
    ssn,
    idNumber,
    bloodType: pick(BLOOD, rng),
    // Next of kin can be anyone — random gender.
    nextOfKin: `${nameOfGender(rng() < 0.5 ? 'male' : 'female', rng)} — ${pick(RELATIONS, rng)}`,
  };
}
