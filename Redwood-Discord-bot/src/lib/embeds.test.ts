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
