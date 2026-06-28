import { describe, it, expect } from 'vitest';
import { BufferGeometry } from 'three';
import { fieldBottleGeometry, heroBottleGeometry, syringeGeometry } from './proceduralBottleGeo';

describe('procedural geometry builders', () => {
  it('field bottle returns a BufferGeometry with positions', () => {
    const g = fieldBottleGeometry();
    expect(g).toBeInstanceOf(BufferGeometry);
    expect(g.getAttribute('position').count).toBeGreaterThan(0);
  });

  it('hero bottle is higher-resolution than the field bottle', () => {
    const field = fieldBottleGeometry();
    const hero = heroBottleGeometry();
    expect(hero.getAttribute('position').count).toBeGreaterThan(field.getAttribute('position').count);
  });

  it('syringe returns a BufferGeometry with positions', () => {
    const g = syringeGeometry();
    expect(g.getAttribute('position').count).toBeGreaterThan(0);
  });
});
