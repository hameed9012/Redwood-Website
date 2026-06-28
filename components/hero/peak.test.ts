import { describe, it, expect, beforeEach } from 'vitest';
import { PEAK_BOTTLES, PeakRegistry, type PeakLetter } from './peak';

describe('PEAK definitions', () => {
  it('has exactly four bottles spelling P-E-A-K with fixed drug pairings', () => {
    expect(PEAK_BOTTLES.map((b) => b.letter)).toEqual(['P', 'E', 'A', 'K']);
    const byLetter = Object.fromEntries(PEAK_BOTTLES.map((b) => [b.letter, b.drug]));
    expect(byLetter).toEqual({ P: 'Propofol', E: 'Etomidate', A: 'Atropine', K: 'Ketamine' });
  });

  it('letters are unique', () => {
    const letters = PEAK_BOTTLES.map((b) => b.letter);
    expect(new Set(letters).size).toBe(4);
  });
});

describe('PeakRegistry', () => {
  let reg: PeakRegistry;
  beforeEach(() => { reg = new PeakRegistry(); });

  it('registers and queries the four as a set', () => {
    const fakeObj = (l: PeakLetter) => ({ userData: {} } as any);
    PEAK_BOTTLES.forEach((b) => reg.register(b.letter, fakeObj(b.letter)));
    const all = reg.all();
    expect(all).toHaveLength(4);
    expect(all.map((e) => e.letter).sort()).toEqual(['A', 'E', 'K', 'P']);
    expect(reg.get('K')?.drug).toBe('Ketamine');
  });

  it('isComplete() is false until all four are present', () => {
    expect(reg.isComplete()).toBe(false);
    PEAK_BOTTLES.forEach((b) => reg.register(b.letter, { userData: {} } as any));
    expect(reg.isComplete()).toBe(true);
  });

  it('tagObject writes isPeakBottle/letter/drug onto userData', () => {
    const obj = { userData: {} } as any;
    reg.tagObject(obj, 'A');
    expect(obj.userData.isPeakBottle).toBe(true);
    expect(obj.userData.peakLetter).toBe('A');
    expect(obj.userData.drug).toBe('Atropine');
  });
});
