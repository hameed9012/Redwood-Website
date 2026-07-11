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

import { helpEmbed, helpComponents } from './embeds';

describe('help', () => {
  it('lists the command categories', () => {
    const names = (helpEmbed().toJSON().fields ?? []).map((f) => f.name);
    expect(names.some((n) => n.includes('Identity'))).toBe(true);
    expect(names.some((n) => n.includes('Shifts'))).toBe(true);
    expect(names.some((n) => n.includes('Security'))).toBe(true);
  });

  it('has a single link button to the handbook', () => {
    const row = helpComponents().toJSON();
    expect(row.components).toHaveLength(1);
    expect((row.components[0] as { style: number }).style).toBe(5); // ButtonStyle.Link
    expect((row.components[0] as { url?: string }).url).toContain('docs.google.com');
  });
});

import { lookupEmbed } from './embeds';
import type { LookupResult } from './lookup';

describe('lookupEmbed', () => {
  it('member file: HC cover shows, redaction marker when cover is null', () => {
    const hc: LookupResult = { kind: 'member-file', employeeName: 'Adam Marcuz', rank: 'employee', dismissed: false, cover: { legalName: 'David Whitaker', dob: '1994-03-12', ssn: '462-88-1174', idNumber: 'D48120394', bloodType: 'A-', nextOfKin: 'Karen Lopez — spouse' }, pastIdentities: [], incidents: [], registeredGear: [], standing: { commendations: 0, writeups: 0, recent: [] } };
    expect(JSON.stringify(lookupEmbed(hc).toJSON())).toContain('462-88-1174');
    const nonHc: LookupResult = { ...hc, cover: null, pastIdentities: null };
    expect(JSON.stringify(lookupEmbed(nonHc).toJSON())).toContain('▓');
  });

  it('outsider, disambiguation, and not-found each render a title', () => {
    expect(lookupEmbed({ kind: 'outsider-dossier', label: '4471', role: 'officer', incidents: [], alsoSeen: [], notOnFile: false }).toJSON().title).toContain('4471');
    expect(lookupEmbed({ kind: 'disambiguation', matches: [{ label: 'A', kind: 'member' }, { label: 'B', kind: 'outsider' }] }).toJSON().title).toBeTruthy();
    expect(lookupEmbed({ kind: 'not-found' }).toJSON().title).toBeTruthy();
  });
});

import { registrationEmbed } from './embeds';

describe('registry embeds', () => {
  it('lookup registration: flagged is warning tone and shows owner for HC', () => {
    const j = lookupEmbed({ kind: 'registration', itemType: 'firearm', label: 'RW-482910', detail: 'Pistol', status: 'flagged', flagNote: 'recovered', issued: '2026-07-11', owner: 'David Whitaker (Adam Marcuz)' }).toJSON();
    expect(j.color).toBe(TONE_COLOR.warning);
    expect(JSON.stringify(j)).toContain('Adam Marcuz');
  });

  it('registrationEmbed renders the issued serial', () => {
    const j = registrationEmbed('firearm', 'RW-482910', 'Pistol', 'David Whitaker').toJSON();
    expect(j.title).toContain('RW-482910');
  });
});

describe('standing in cards', () => {
  it('whoisEmbed renders standing when provided', () => {
    const m = { discordId: '1', employeeName: 'Adam Marcuz', rank: 'employee' as const, divisions: [], positions: [], status: 'active' as const, joinedAt: '2026-07-11T00:00:00Z', updatedAt: '2026-07-11T00:00:00Z' };
    const j = whoisEmbed(m, { commendations: 2, writeups: 1, recent: ['✔ good'] }).toJSON();
    expect(JSON.stringify(j)).toContain('2 commendation');
  });

  it('lookup member file shows standing', () => {
    const r = { kind: 'member-file' as const, employeeName: 'Adam Marcuz', rank: 'employee' as const, dismissed: false, cover: null, pastIdentities: null, incidents: [], registeredGear: null, standing: { commendations: 3, writeups: 0, recent: [] } };
    expect(JSON.stringify(lookupEmbed(r).toJSON())).toContain('3 commendation');
  });
});

import { carouselListEmbed } from './embeds';

describe('carouselListEmbed', () => {
  it('lists titles, or says empty', () => {
    expect(JSON.stringify(carouselListEmbed([{ id: '1', title: 'Cleanup', body: 'x', imageUrl: 'u', sortOrder: 1 }]).toJSON())).toContain('Cleanup');
    expect(carouselListEmbed([]).toJSON().description).toContain('No slides');
  });
});
