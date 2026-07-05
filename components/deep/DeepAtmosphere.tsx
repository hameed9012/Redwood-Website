'use client';

import { type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, FogExp2, type Group } from 'three';
import { useFreeze } from '../hero/puzzle/useFreeze';
import { useDiveProgress } from '../dive/useScrollDive';

// Surface → deep endpoints. The deep stays MURKY-BUT-VISIBLE (not near-black) so
// the fish read behind the Contact panel. Fog is kept light through the surface
// and horizon (so the tanker is visible across the water), thickening only into
// the deep — and only modestly.
const FOG_SURFACE = 0.035;
const FOG_DEEP = 0.055;
const COL_SURFACE = new Color('#0a1518');
const COL_DEEP = new Color('#0b1e26');
const BG_SURFACE = new Color('#050a0c');
const BG_DEEP = new Color('#08151d');
/** Fog only thickens over this progress range (keeps the horizon/tanker clear). */
const FOG_RAMP_START = 0.7;
/** The surface decor (loose bottles, tanker) stays visible for the horizon shot,
 *  then fades out only as we sink under for the deep. */
const DECOR_FADE_START = 0.78;
const DECOR_GONE = 0.95;

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
    const raw = progress.current;
    // Colour eases across the whole descent; fog only ramps up in the deep tail.
    const colMix = smoothstep(0, 1, raw);
    const fogMix = smoothstep(FOG_RAMP_START, 1, raw);

    if (scene.fog instanceof FogExp2) {
      scene.fog.density = FOG_SURFACE + (FOG_DEEP - FOG_SURFACE) * fogMix;
      scene.fog.color.copy(COL_SURFACE).lerp(COL_DEEP, colMix);
    }
    if (scene.background instanceof Color) {
      scene.background.copy(BG_SURFACE).lerp(BG_DEEP, colMix);
    }

    const decor = surfaceDecor.current;
    if (decor) {
      decor.visible = smoothstep(DECOR_FADE_START, DECOR_GONE, raw) < 0.99;
    }
  });

  return null;
}
