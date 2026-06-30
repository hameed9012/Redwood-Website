'use client';

import { useCallback } from 'react';
import type { MutableRefObject } from 'react';
import type { Object3D } from 'three';
import { HeroBottle } from './HeroBottle';
import { PEAK_BOTTLES, type PeakLetter, type PeakRegistry } from '../peak';

interface HeroBottlesProps {
  registry: PeakRegistry;
  pushFrom?: MutableRefObject<{ x: number; z: number; strength: number; t: number }>;
}

/** Fixed resting positions for the four PEAK bottles in the foreground. */
const POSITIONS: Record<PeakLetter, [number, number, number]> = {
  P: [-6.5, 0.1, -4.0],
  E: [5.5, 0.0, -6.5],
  A: [-4.0, 0.05, 5.5],
  K: [6.0, 0.1, 3.5],
};

export function HeroBottles({ registry, pushFrom }: HeroBottlesProps) {
  const handleReady = useCallback(
    (letter: PeakLetter, object: Object3D) => {
      registry.register(letter, object);
    },
    [registry],
  );

  return (
    <group>
      {PEAK_BOTTLES.map((b) => (
        <HeroBottle
          key={b.letter}
          letter={b.letter}
          position={POSITIONS[b.letter]}
          onReady={handleReady}
          pushFrom={pushFrom}
        />
      ))}
    </group>
  );
}
