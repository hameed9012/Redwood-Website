import { describe, it, expect } from 'vitest';
import { identityEmbed, TONE_COLOR } from './embeds';
import type { Member } from './member';
import type { Identity } from './identity';

const member: Member = {
  discordId: '1', employeeName: 'Adam Marcuz', rank: 'employee',
  divisions: ['security'], positions: [], status: 'active',
  joinedAt: '2026-07-11T00:00:00Z', updatedAt: '2026-07-11T00:00:00Z',
};
const identity: Identity = {
  id: 'i1', discordId: '1', legalName: 'David Whitaker', dob: '1994-03-12',
  ssn: '462-88-1174', idNumber: 'D48120394', bloodType: 'A-',
  nextOfKin: 'Karen Lopez — spouse', issuedAt: '2026-07-11T06:26:00Z',
  status: 'active', retiredAt: null,
};

describe('identityEmbed', () => {
  it('renders the cover fields with the info color and Personnel footer', () => {
    const j = identityEmbed(member, identity, 'Identity packet').toJSON();
    expect(j.color).toBe(TONE_COLOR.info);
    expect(j.title).toBe('Identity packet');
    expect(j.description).toContain('Adam Marcuz');
    const names = (j.fields ?? []).map((f) => f.name);
    expect(names).toEqual(expect.arrayContaining(['Employee', 'Legal name (cover)', 'SSN', 'ID number', 'Issued']));
    expect((j.fields ?? []).find((f) => f.name === 'SSN')!.value).toContain('462-88-1174');
    expect(j.footer!.text).toBe('Redwood Peak · Personnel');
  });

  it('accepts a tone override (success for create/rotate)', () => {
    expect(identityEmbed(member, identity, 'Identity issued', 'success').toJSON().color).toBe(TONE_COLOR.success);
  });
});

import { whoisEmbed, rosterEmbed } from './embeds';

describe('whoisEmbed', () => {
  it('active member is info, has rank/divisions/positions fields', () => {
    const j = whoisEmbed(member).toJSON();
    expect(j.color).toBe(TONE_COLOR.info);
    expect(j.title).toBe('Adam Marcuz');
    const names = (j.fields ?? []).map((f) => f.name);
    expect(names).toEqual(expect.arrayContaining(['Rank', 'Divisions', 'Positions', 'Hired', 'Status']));
  });

  it('dismissed member is denied tone and marked', () => {
    const j = whoisEmbed({ ...member, status: 'dismissed' }).toJSON();
    expect(j.color).toBe(TONE_COLOR.denied);
    expect(j.title).toContain('dismissed');
  });
});

describe('rosterEmbed', () => {
  it('one field per rank, high-command first, empty ranks show a dash', () => {
    const hc: Member = { ...member, employeeName: 'Cara Vance', rank: 'high-command' };
    const j = rosterEmbed([member, hc]).toJSON();
    const names = (j.fields ?? []).map((f) => f.name);
    expect(names[0]).toBe('High Command');
    expect(names).toEqual(['High Command', 'Supervisor', 'Employee', 'Trainee']);
    expect((j.fields ?? []).find((f) => f.name === 'Supervisor')!.value).toBe('—');
    expect((j.fields ?? []).find((f) => f.name === 'Employee')!.value).toContain('Adam Marcuz');
  });
});

import { shiftSummaryEmbed, shiftStatusEmbed, lockdownEmbed } from './embeds';

describe('shift + lockdown cards', () => {
  it('shift summary is success with duration/incidents/movements', () => {
    const j = shiftSummaryEmbed('1h 30m', 2, 'Docks, Overpass').toJSON();
    expect(j.color).toBe(TONE_COLOR.success);
    const names = (j.fields ?? []).map((f) => f.name);
    expect(names).toEqual(expect.arrayContaining(['Duration', 'Incidents filed', 'Movements']));
    expect((j.fields ?? []).find((f) => f.name === 'Duration')!.value).toBe('1h 30m');
  });

  it('shift status reflects on/off duty', () => {
    expect(shiftStatusEmbed(false).toJSON().title).toBe('Off duty');
    expect(shiftStatusEmbed(true, '20m', 1).toJSON().title).toBe('On duty');
  });

  it('lockdown on is warning, off is info', () => {
    expect(lockdownEmbed(true).toJSON().color).toBe(TONE_COLOR.warning);
    expect(lockdownEmbed(true).toJSON().description).toContain('sealed');
    expect(lockdownEmbed(false).toJSON().color).toBe(TONE_COLOR.info);
  });
});
