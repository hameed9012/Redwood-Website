import { describe, it, expect } from 'vitest';
import { MeshPhysicalMaterial } from 'three';
import { createGlassMaterial } from './glassMaterial';

describe('createGlassMaterial', () => {
  it('returns a MeshPhysicalMaterial with transmission enabled', () => {
    const m = createGlassMaterial();
    expect(m).toBeInstanceOf(MeshPhysicalMaterial);
    expect(m.transmission).toBeGreaterThan(0.5);
    expect(m.roughness).toBeLessThan(0.5);
    expect(m.ior).toBeGreaterThan(1);
  });

  it('accepts a tint override', () => {
    const m = createGlassMaterial({ color: '#7a1518' });
    expect(m.color.getHexString()).toBe('7a1518');
  });
});
