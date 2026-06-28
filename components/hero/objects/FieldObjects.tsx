'use client';

import { useMemo } from 'react';
import { fieldBottleGeometry, syringeGeometry } from './proceduralBottleGeo';
import { createGlassMaterial } from './glassMaterial';

interface FieldObjectsProps {
  count: number;
  /** Deterministic seed so SSR/CSR agree; defaults to a fixed value. */
  seed?: number;
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function FieldObjects({ count, seed = 1337 }: FieldObjectsProps) {
  const bottleGeo = useMemo(() => fieldBottleGeometry(), []);
  const syringeGeo = useMemo(() => syringeGeometry(), []);

  const items = useMemo(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: count }, (_, i) => ({
      key: i,
      isSyringe: rand() > 0.7,
      // Distributed across real z-depth: most far back (negative z).
      position: [
        (rand() - 0.5) * 8,
        (rand() - 0.5) * 6,
        -1 - rand() * 12,
      ] as [number, number, number],
      rotation: [rand() * Math.PI, rand() * Math.PI, rand() * Math.PI] as [number, number, number],
      scale: 0.6 + rand() * 0.8,
    }));
  }, [count, seed]);

  const material = useMemo(() => createGlassMaterial(), []);

  return (
    <group>
      {items.map((it) => (
        <mesh
          key={it.key}
          geometry={it.isSyringe ? syringeGeo : bottleGeo}
          material={material}
          position={it.position}
          rotation={it.rotation}
          scale={it.scale}
        />
      ))}
    </group>
  );
}
