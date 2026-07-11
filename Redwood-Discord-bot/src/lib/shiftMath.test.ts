import { describe, it, expect } from 'vitest';
import { shiftDurationMinutes, formatDuration, validateParty } from './shiftMath';

describe('shiftMath', () => {
  it('computes whole-minute duration', () => {
    expect(shiftDurationMinutes('2026-07-11T00:00:00Z', '2026-07-11T01:30:00Z')).toBe(90);
  });

  it('never returns negative', () => {
    expect(shiftDurationMinutes('2026-07-11T02:00:00Z', '2026-07-11T01:00:00Z')).toBe(0);
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(0)).toBe('0m');
    expect(formatDuration(45)).toBe('45m');
    expect(formatDuration(90)).toBe('1h 30m');
    expect(formatDuration(120)).toBe('2h 0m');
  });

  it('party needs at least one identifying field', () => {
    expect(validateParty({ role: 'civilian' })).toMatch(/at least one/i);
    expect(validateParty({ role: 'officer', badge: '4471' })).toBeNull();
    expect(validateParty({ role: 'civilian', name: 'John Doe' })).toBeNull();
  });
});
