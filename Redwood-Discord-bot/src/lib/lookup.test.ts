import { describe, it, expect } from 'vitest';
import { classifyQuery, buildLookupResult, type LookupData } from './lookup';

const member = { discordId: 'm1', employeeName: 'Adam Marcuz', rank: 'employee' as const, status: 'active' as const };
const identity = {
  discordId: 'm1', legalName: 'David Whitaker', dob: '1994-03-12', ssn: '462-88-1174',
  idNumber: 'D48120394', bloodType: 'A-', nextOfKin: 'Karen Lopez — spouse', status: 'active' as const, issuedAt: '2026-07-11T00:00:00Z',
};
const incident = { id: 'inc1', loggedBy: 'Adam Marcuz', summary: 'Traffic stop', location: 'Route 7', createdAt: '2026-07-11T02:00:00Z' };

describe('classifyQuery', () => {
  it('reads a mention or raw snowflake as a member query', () => {
    expect(classifyQuery('<@123456789012345678>')).toEqual({ kind: 'member', discordId: '123456789012345678' });
    expect(classifyQuery('<@!123456789012345678>')).toEqual({ kind: 'member', discordId: '123456789012345678' });
    expect(classifyQuery('123456789012345678')).toEqual({ kind: 'member', discordId: '123456789012345678' });
  });

  it('reads anything else as trimmed text', () => {
    expect(classifyQuery('  ABC123 ')).toEqual({ kind: 'text', text: 'ABC123' });
    expect(classifyQuery('Adam Marcuz')).toEqual({ kind: 'text', text: 'Adam Marcuz' });
  });
});

describe('buildLookupResult — member file', () => {
  const data: LookupData = { members: [member], identities: [identity], parties: [], incidents: [incident], firearms: [], vehicles: [], reputation: [] };

  it('member query builds a file; HC sees the cover + SSN', () => {
    const r = buildLookupResult({ kind: 'member', discordId: 'm1' }, data, true);
    expect(r.kind).toBe('member-file');
    if (r.kind !== 'member-file') return;
    expect(r.employeeName).toBe('Adam Marcuz');
    expect(r.cover!.ssn).toBe('462-88-1174');
    expect(r.incidents).toHaveLength(1);
  });

  it('non-HC gets the member file but the cover is redacted', () => {
    const r = buildLookupResult({ kind: 'member', discordId: 'm1' }, data, false);
    expect(r.kind).toBe('member-file');
    if (r.kind !== 'member-file') return;
    expect(r.cover).toBeNull();
    expect(r.pastIdentities).toBeNull();
  });
});

describe('buildLookupResult — cover unmasking rule', () => {
  const data: LookupData = { members: [member], identities: [identity], parties: [], incidents: [], firearms: [], vehicles: [], reputation: [] };

  it('HC looking up a cover legal name resolves to the employee', () => {
    const r = buildLookupResult({ kind: 'text', text: 'David Whitaker' }, data, true);
    expect(r.kind).toBe('member-file');
    if (r.kind !== 'member-file') return;
    expect(r.employeeName).toBe('Adam Marcuz');
  });

  it('non-HC looking up a cover legal name does NOT reveal the employee', () => {
    const r = buildLookupResult({ kind: 'text', text: 'David Whitaker' }, data, false);
    expect(r.kind).toBe('not-found');
  });
});

describe('buildLookupResult — outsider + disambiguation + not-found', () => {
  const parties = [
    { role: 'officer' as const, name: null, coverName: null, plate: null, badge: '4471', unit: 'K-9', incidentId: 'inc1' },
    { role: 'civilian' as const, name: 'Reed Vance', coverName: null, plate: 'XY-2210', badge: null, unit: null, incidentId: 'inc1' },
  ];
  const data: LookupData = { members: [], identities: [], parties, incidents: [incident], firearms: [], vehicles: [], reputation: [] };

  it('a badge with no internal owner is an outsider dossier with co-occurring identifiers', () => {
    const r = buildLookupResult({ kind: 'text', text: '4471' }, data, false);
    expect(r.kind).toBe('outsider-dossier');
    if (r.kind !== 'outsider-dossier') return;
    expect(r.label).toBe('4471');
    expect(r.role).toBe('officer');
    expect(r.incidents).toHaveLength(1);
    expect(r.alsoSeen).toContain('XY-2210');
  });

  it('a text matching several subjects returns a disambiguation list', () => {
    const many: LookupData = {
      members: [member, { ...member, discordId: 'm2', employeeName: 'Adam Sokolov' }],
      identities: [], parties: [], incidents: [], firearms: [], vehicles: [], reputation: [],
    };
    const r = buildLookupResult({ kind: 'text', text: 'Adam' }, many, false);
    expect(r.kind).toBe('disambiguation');
    if (r.kind !== 'disambiguation') return;
    expect(r.matches.length).toBe(2);
  });

  it('nothing matches → not-found', () => {
    expect(buildLookupResult({ kind: 'text', text: 'nobody' }, { members: [], identities: [], parties: [], incidents: [], firearms: [], vehicles: [], reputation: [] }, true).kind).toBe('not-found');
  });
});

import type { FirearmLite, VehicleLite } from './lookup';

const firearm: FirearmLite = { serial: 'RW-482910', kind: 'Pistol', discordId: 'm1', status: 'flagged', flagNote: 'recovered at scene', issuedAt: '2026-07-11T00:00:00Z', ownerCover: 'David Whitaker', ownerEmployee: 'Adam Marcuz' };
const vehicle: VehicleLite = { plate: 'XY-2210', description: 'Black sedan', discordId: 'm1', status: 'clean', flagNote: null, issuedAt: '2026-07-11T00:00:00Z', ownerCover: 'David Whitaker', ownerEmployee: 'Adam Marcuz' };

describe('buildLookupResult — registrations', () => {
  const data: LookupData = { members: [member], identities: [identity], parties: [], incidents: [], firearms: [firearm], vehicles: [vehicle], reputation: [] };

  it('exact serial → registration; HC sees owner, non-HC redacted', () => {
    const hc = buildLookupResult({ kind: 'text', text: 'RW-482910' }, data, true);
    expect(hc.kind).toBe('registration');
    if (hc.kind !== 'registration') return;
    expect(hc.status).toBe('flagged');
    expect(hc.owner).toContain('Adam Marcuz');
    const non = buildLookupResult({ kind: 'text', text: 'RW-482910' }, data, false);
    if (non.kind !== 'registration') return;
    expect(non.owner).toBeNull();
  });

  it('exact plate → vehicle registration', () => {
    const r = buildLookupResult({ kind: 'text', text: 'XY-2210' }, data, true);
    expect(r.kind).toBe('registration');
    if (r.kind !== 'registration') return;
    expect(r.itemType).toBe('vehicle');
  });

  it('HC member file lists registered gear; non-HC does not', () => {
    const hc = buildLookupResult({ kind: 'member', discordId: 'm1' }, data, true);
    if (hc.kind !== 'member-file') return;
    expect(hc.registeredGear).not.toBeNull();
    expect(hc.registeredGear!.join(' ')).toContain('RW-482910');
    const non = buildLookupResult({ kind: 'member', discordId: 'm1' }, data, false);
    if (non.kind !== 'member-file') return;
    expect(non.registeredGear).toBeNull();
  });

  it('a plate only seen in incidents is an outsider marked not on file', () => {
    const parties = [{ role: 'civilian' as const, name: null, coverName: null, plate: 'ZZ-9999', badge: null, unit: null, incidentId: 'inc1' }];
    const d: LookupData = { members: [], identities: [], parties, incidents: [incident], firearms: [], vehicles: [], reputation: [] };
    const r = buildLookupResult({ kind: 'text', text: 'ZZ-9999' }, d, false);
    expect(r.kind).toBe('outsider-dossier');
    if (r.kind !== 'outsider-dossier') return;
    expect(r.notOnFile).toBe(true);
  });
});

import type { ReputationLite } from './reputation';

describe('buildLookupResult — standing', () => {
  const rep: ReputationLite[] = [
    { discordId: 'm1', kind: 'commendation', reason: 'Clean run', createdAt: '2026-07-11T01:00:00Z' },
    { discordId: 'm1', kind: 'writeup', reason: 'Late', createdAt: '2026-07-11T02:00:00Z' },
  ];
  const data: LookupData = { members: [member], identities: [identity], parties: [], incidents: [], firearms: [], vehicles: [], reputation: rep };

  it('member file carries commendation/writeup counts', () => {
    const r = buildLookupResult({ kind: 'member', discordId: 'm1' }, data, true);
    if (r.kind !== 'member-file') return;
    expect(r.standing.commendations).toBe(1);
    expect(r.standing.writeups).toBe(1);
  });
});
