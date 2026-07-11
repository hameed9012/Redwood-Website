import { describe, it, expect } from 'vitest';
import { generateIdentity, guessGender } from './identityGen';

const FEMALE = ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Nancy', 'Lisa', 'Betty', 'Margaret', 'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle', 'Carol', 'Amanda', 'Dorothy', 'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Sharon', 'Laura', 'Cynthia', 'Kathleen', 'Amy', 'Angela', 'Anna', 'Brenda', 'Pamela', 'Emma', 'Nicole', 'Helen', 'Samantha', 'Katherine', 'Christine', 'Rachel', 'Carolyn', 'Janet', 'Maria', 'Olivia', 'Heather', 'Diane', 'Julie'];
const MALE = ['James', 'Robert', 'John', 'Michael', 'David', 'William', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Andrew', 'Paul', 'Joshua', 'Kenneth', 'Kevin', 'Brian', 'George', 'Timothy', 'Ronald', 'Jason', 'Edward', 'Jeffrey', 'Ryan', 'Jacob', 'Nicholas', 'Eric', 'Jonathan', 'Stephen', 'Justin', 'Scott', 'Brandon', 'Frank', 'Benjamin', 'Samuel', 'Raymond', 'Patrick', 'Alexander', 'Jack', 'Dennis', 'Tyler', 'Aaron', 'Adam', 'Nathan', 'Henry'];

describe('identityGen', () => {
  it('legal name is two capitalised words', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateIdentity().legalName).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
    }
  });

  it('guessGender reads the first name (case-insensitive), unknown when not listed', () => {
    expect(guessGender('Adam Marcuz')).toBe('male');
    expect(guessGender('barbara martinez')).toBe('female');
    expect(guessGender('Sarah')).toBe('female');
    expect(guessGender('Zyx Qqq')).toBe('unknown');
    expect(guessGender('')).toBe('unknown');
  });

  it('the cover legal name matches the requested gender', () => {
    for (let i = 0; i < 50; i++) {
      const female = generateIdentity('female').legalName.split(' ')[0];
      expect(FEMALE).toContain(female);
      const male = generateIdentity('male').legalName.split(' ')[0];
      expect(MALE).toContain(male);
    }
  });

  it('ssn is XXX-XX-XXXX with valid-looking ranges', () => {
    for (let i = 0; i < 200; i++) {
      const { ssn } = generateIdentity();
      expect(ssn).toMatch(/^\d{3}-\d{2}-\d{4}$/);
      const area = Number(ssn.slice(0, 3));
      expect(area).toBeGreaterThanOrEqual(1);
      expect(area).not.toBe(666);
      expect(area).toBeLessThan(900);
    }
  });

  it('id number is one letter + 8 digits', () => {
    expect(generateIdentity().idNumber).toMatch(/^[A-Z]\d{8}$/);
  });

  it('dob yields an age between 21 and 55', () => {
    const now = new Date();
    for (let i = 0; i < 50; i++) {
      const dob = new Date(generateIdentity().dob);
      const age = (now.getTime() - dob.getTime()) / (365.25 * 24 * 3600 * 1000);
      expect(age).toBeGreaterThanOrEqual(21);
      expect(age).toBeLessThanOrEqual(55);
    }
  });

  it('blood type is one of the eight, next of kin is "Name — relation"', () => {
    const { bloodType, nextOfKin } = generateIdentity();
    expect(['O+','O-','A+','A-','B+','B-','AB+','AB-']).toContain(bloodType);
    expect(nextOfKin).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+ — [a-z]+$/);
  });
});
