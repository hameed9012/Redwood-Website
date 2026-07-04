'use client';

import { type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, FogExp2, type Group } from 'three';
import { useFreeze } from '../hero/puzzle/useFreeze';
import { useDiveProgress } from '../dive/useScrollDive';

// Surface → deep endpoints. Fog thickens and the water darkens as you descend,
// swallowing the surface debris (spec §3 "surface population thins with depth").
const FOG_SURFACE = 0.05;
const FOG_DEEP = 0.16;
const COL_SURFACE = new Color('#0a1518');
const COL_DEEP = new Color('#02080c');
const BG_SURFACE = new Color('#050a0c');
const BG_DEEP = new Color('#010407');
/** Past this progress the surface decor (loose bottles, tanker) is fully hidden. */
const DECOR_GONE = 0.7;

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Drives the scene atmosphere from dive progress: fog density + fog/background
 * colour lerp from the surface tank to the murky deep, and the surface-only
 * decor group fades then hides so it doesn't float, wrongly, in the deep.
 * Yields while frozen so the drain sequence's own look is untouched.
 */
export function DeepAtmosphere({ surfaceDecor }: { surfaceDecor: MutableRefObject<Group | null> }) {
  const { scene } = useThree();
  const frozen = useFreeze();
  const progress = useDiveProgress();

  useFrame(() => {
    if (frozen.current) return;
    const p = smoothstep(0, 1, progress.current);

    if (scene.fog instanceof FogExp2) {
      scene.fog.density = FOG_SURFACE + (FOG_DEEP - FOG_SURFACE) * p;
      scene.fog.color.copy(COL_SURFACE).lerp(COL_DEEP, p);
    }
    if (scene.background instanceof Color) {
      scene.background.copy(BG_SURFACE).lerp(BG_DEEP, p);
    }

    const decor = surfaceDecor.current;
    if (decor) {
      const vis = 1 - smoothstep(0.2, DECOR_GONE, progress.current);
      decor.visible = vis > 0.01;
    }
  });

  return null;
}
