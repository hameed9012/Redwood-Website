import { describe, it, expect } from 'vitest';
import { renderRoster } from './rosterTree';
import type { Member } from './member';

const m = (over: Partial<Member>): Member => ({
  discordId: '1', employeeName: 'X', rank: 'employee', divisions: [], positions: [],
  status: 'active', joinedAt: '', updatedAt: '', ...over,
});

describe('renderRoster', () => {
  it('groups active members by rank, high-command first', () => {
    const out = renderRoster([
      m({ employeeName: 'Marla Vane', rank: 'high-command', divisions: ['security', 'intelligence'], positions: ['internal-affairs'] }),
      m({ employeeName: 'S. Okafor', rank: 'employee', divisions: ['security'] }),
      m({ employeeName: 'D. Rourke', rank: 'supervisor', divisions: ['research'], positions: ['trainee-instructor'] }),
    ]);
    // Match the header lines specifically (newline-wrapped) so "Trainee Instructor"
    // in a member line doesn't get mistaken for the Trainee rank header.
    const hc = out.indexOf('\nHigh Command\n');
    const sup = out.indexOf('\nSupervisor\n');
    const emp = out.indexOf('\nEmployee\n');
    const tra = out.indexOf('\nTrainee\n');
    expect(hc).toBeGreaterThan(-1);
    expect(hc).toBeLessThan(sup);
    expect(sup).toBeLessThan(emp);
    expect(emp).toBeLessThan(tra);
    expect(out).toContain('Marla Vane — Security Division, Intelligence Division  [Internal Affairs]');
    expect(out).toContain('D. Rourke — Research Division  [Trainee Instructor]');
    expect(out).toContain('S. Okafor — Security Division');
  });

  it('shows (none) for an empty rank and omits dismissed members', () => {
    const out = renderRoster([m({ employeeName: 'Ghost', status: 'dismissed', rank: 'employee' })]);
    expect(out).toContain('Trainee\n └─ (none)');
    expect(out).not.toContain('Ghost');
  });

  it('renders a member with no divisions/positions as just the name', () => {
    const out = renderRoster([m({ employeeName: 'Plain', rank: 'trainee' })]);
    expect(out).toContain('└─ Plain');
    expect(out).not.toContain('Plain —');
  });
});
