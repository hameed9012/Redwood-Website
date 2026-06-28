import { MeshPhysicalMaterial, Color } from 'three';

export interface GlassOptions {
  color?: string;
}

/** Single glass recipe used by every bottle/syringe (spec §6.2). */
export function createGlassMaterial(opts: GlassOptions = {}): MeshPhysicalMaterial {
  return new MeshPhysicalMaterial({
    color: new Color(opts.color ?? '#dfeede'),
    transmission: 1,
    transparent: true,
    opacity: 1,
    roughness: 0.12,
    metalness: 0,
    ior: 1.45,
    thickness: 0.6,
    attenuationColor: new Color('#2c4a4d'),
    attenuationDistance: 2.5,
    clearcoat: 0.4,
    clearcoatRoughness: 0.2,
    envMapIntensity: 1.0,
  });
}
