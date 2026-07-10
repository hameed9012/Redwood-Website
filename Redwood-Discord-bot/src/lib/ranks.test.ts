import { describe, it, expect } from 'vitest';
import {
  RANKS, RANK_LABEL, rankOrder, nextRank, prevRank,
  isRank, isDivision, isPosition,
  DIVISIONS, POSITIONS,
} from './ranks';

describe('ranks', () => {
  it('orders trainee < employee < supervisor < high-command', () => {
    expect(rankOrder('trainee')).toBeLessThan(rankOrder('employee'));
    expect(rankOrder('employee')).toBeLessThan(rankOrder('supervisor'));
    expect(rankOrder('supervisor')).toBeLessThan(rankOrder('high-command'));
  });

  it('nextRank / prevRank walk the ladder and clamp at the ends', () => {
    expect(nextRank('trainee')).toBe('employee');
    expect(nextRank('high-command')).toBeNull();
    expect(prevRank('employee')).toBe('trainee');
    expect(prevRank('trainee')).toBeNull();
  });

  it('has a label for every rank/division/position', () => {
    for (const r of RANKS) expect(RANK_LABEL[r]).toBeTruthy();
    expect(RANK_LABEL['high-command']).toBe('High Command');
    expect(DIVISIONS).toContain('research');
    expect(POSITIONS).toContain('internal-affairs');
  });

  it('type guards accept valid values and reject junk', () => {
    expect(isRank('supervisor')).toBe(true);
    expect(isRank('ceo')).toBe(false);
    expect(isDivision('security')).toBe(true);
    expect(isDivision('marketing')).toBe(false);
    expect(isPosition('media-relations')).toBe(true);
    expect(isPosition('janitor')).toBe(false);
  });
});
