import { describe, it, expect } from 'vitest';
import { aggregateParties, type PartyLite } from './witnessDossiers';

const parties: PartyLite[] = [
  { role: 'officer', name: null, coverName: null, plate: null, badge: '4471', unit: 'K-9', summary: 'Stop', location: 'Route 7' },
  { role: 'officer', name: null, coverName: null, plate: null, badge: '4471', unit: 'K-9', summary: 'Checkpoint', location: 'Bridge' },
  { role: 'civilian', name: 'John Doe', coverName: null, plate: 'ABC123', badge: null, unit: null, summary: 'Delivery', location: 'Docks' },
];

describe('aggregateParties', () => {
  it('groups appearances by identity key and counts them', () => {
    const dossiers = aggregateParties(parties);
    const badge = dossiers.find((d) => d.key === 'badge:4471');
    expect(badge?.appearances).toHaveLength(2);
    expect(dossiers.find((d) => d.key === 'plate:ABC123')?.label).toContain('ABC123');
  });
});
