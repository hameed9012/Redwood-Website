import { describe, it, expect } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { HeroBottles } from './HeroBottles';
import { PeakRegistry } from '../peak';

describe('PEAK tagging contract (spec §13)', () => {
  it('renders exactly four hero bottles, each correctly tagged and queryable as a set', async () => {
    const registry = new PeakRegistry();
    const renderer = await ReactThreeTestRenderer.create(<HeroBottles registry={registry} />);

    // Registry resolves all four with correct letter+drug pairings.
    const all = registry.all();
    expect(all).toHaveLength(4);
    expect(registry.isComplete()).toBe(true);
    expect(all.map((e) => e.letter).sort()).toEqual(['A', 'E', 'K', 'P']);
    expect(registry.get('P')?.drug).toBe('Propofol');
    expect(registry.get('E')?.drug).toBe('Etomidate');
    expect(registry.get('A')?.drug).toBe('Atropine');
    expect(registry.get('K')?.drug).toBe('Ketamine');

    // Each registered Object3D carries the tagging on userData.
    for (const entry of all) {
      expect(entry.object.userData.isPeakBottle).toBe(true);
      expect(entry.object.userData.peakLetter).toBe(entry.letter);
      expect(entry.object.userData.drug).toBe(entry.drug);
    }

    await renderer.unmount();
  });
});
