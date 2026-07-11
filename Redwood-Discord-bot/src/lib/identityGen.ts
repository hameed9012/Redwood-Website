import type { GeneratedIdentity } from './identity';

const FIRST = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
  'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Daniel', 'Nancy', 'Matthew', 'Lisa',
  'Anthony', 'Margaret', 'Mark', 'Betty', 'Donald', 'Sandra', 'Steven', 'Ashley',
];
const LAST = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
];
const BLOOD = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const RELATIONS = ['spouse', 'mother', 'father', 'sibling', 'cousin', 'guardian'];

const pick = <T,>(arr: T[], rng: () => number): T => arr[Math.floor(rng() * arr.length)];
const digits = (n: number, rng: () => number): string =>
  Array.from({ length: n }, () => Math.floor(rng() * 10)).join('');

function twoName(rng: () => number): string {
  return `${pick(FIRST, rng)} ${pick(LAST, rng)}`;
}

/** Disposable civilian cover. Real formats, random values, fictional person. */
export function generateIdentity(rng: () => number = Math.random): GeneratedIdentity {
  // SSN area: 001–899 excluding 666.
  let area = 1 + Math.floor(rng() * 899);
  if (area === 666) area = 665;
  const ssn = `${String(area).padStart(3, '0')}-${digits(2, rng)}-${digits(4, rng)}`;

  const idNumber = `${String.fromCharCode(65 + Math.floor(rng() * 26))}${digits(8, rng)}`;

  // Base age 21–54, then push the birthday back a random 0–364 days so the
  // resulting age lands in [ageYears, ageYears+1) — guaranteeing 21 ≤ age < 55
  // regardless of where "today" falls in the calendar year.
  const ageYears = 21 + Math.floor(rng() * 34); // 21–54
  const dobDate = new Date();
  dobDate.setFullYear(dobDate.getFullYear() - ageYears);
  dobDate.setDate(dobDate.getDate() - Math.floor(rng() * 365));
  const dob = dobDate.toISOString().slice(0, 10);

  return {
    legalName: twoName(rng),
    dob,
    ssn,
    idNumber,
    bloodType: pick(BLOOD, rng),
    nextOfKin: `${twoName(rng)} — ${pick(RELATIONS, rng)}`,
  };
}
