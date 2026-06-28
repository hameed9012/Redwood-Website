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
    roughness: 0.08,
    metalness: 0,
    ior: 1.45,
    thickness: 0.35,
    attenuationColor: new Color('#3f6f6a'),
    attenuationDistance: 6.0,
    clearcoat: 0.5,
    clearcoatRoughness: 0.15,
    envMapIntensity: 2.2,
  });
}
