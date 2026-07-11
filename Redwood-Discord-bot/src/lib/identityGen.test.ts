import { describe, it, expect } from 'vitest';
import { generateIdentity } from './identityGen';

describe('identityGen', () => {
  it('legal name is two capitalised words', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateIdentity().legalName).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
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
