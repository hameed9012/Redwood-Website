import { MeshPhysicalMaterial, Color } from 'three';

export interface GlassOptions {
  color?: string;
  /** Opt in to a cheaper, non-transmission variant (perf — avoids the extra
   * scene render that real `transmission` triggers per object). Used for the
   * background field, which can have dozens of objects; the foreground PEAK
   * bottles keep the full recipe. */
  cheap?: boolean;
}

/** Single glass recipe used by every bottle/syringe (spec §6.2). */
export function createGlassMaterial(opts: GlassOptions = {}): MeshPhysicalMaterial {
  if (opts.cheap) {
    // No transmission → no extra scene render per object. Still glassy via envMap reflections.
    return new MeshPhysicalMaterial({
      color: new Color(opts.color ?? '#9fc4bf'),
      transmission: 0,
      transparent: true,
      opacity: 0.72,
      roughness: 0.15,
      metalness: 0,
      ior: 1.4,
      clearcoat: 0.5,
      clearcoatRoughness: 0.2,
      envMapIntensity: 2.2,
    });
  }
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
