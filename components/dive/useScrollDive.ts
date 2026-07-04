'use client';

import { createContext, useContext, useRef, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { divePose } from './divePath';
import { breathingOffset } from '../hero/useCameraBreathing';
import { useFreeze } from '../hero/puzzle/useFreeze';

/**
 * The dive begins on the first scroll and completes at the page bottom. The
 * page's max scrollY is exactly DIVE_VH viewports (100svh hero + 220svh dive
 * spacer − one viewport), so progress reaches 1 precisely at the bottom — no
 * dead zone, no unreachable tail. Keep this in sync with Hero's spacer height.
 */
export const HERO_VH = 0;
export const DIVE_VH = 2.2;

/**
 * Pure scroll→dive-progress mapping (tested). 0 at the top (surface), ramps to
 * 1 across the dive region, clamped. Kept pure so the camera hook stays a thin
 * adapter over this and the tested `divePose`.
 */
export function diveProgressFromScroll(
  scrollY: number,
  viewportH: number,
  heroVh = HERO_VH,
  diveVh = DIVE_VH,
): number {
  const len = diveVh * viewportH;
  if (len <= 0) return 0;
  const start = heroVh * viewportH;
  return Math.min(1, Math.max(0, (scrollY - start) / len));
}

/** Descendants inside the canvas read live dive progress (0..1) from this ref. */
const DiveContext = createContext<MutableRefObject<number>>({ current: 0 });

export function useDiveProgress(): MutableRefObject<number> {
  return useContext(DiveContext);
}

export const DiveProgressProvider = DiveContext.Provider;

/**
 * Drives the camera from the page scroll: each frame it samples window.scrollY,
 * maps it to dive progress, and applies the eased `divePose` — layering the
 * surface breathing drift on top, faded out as the dive deepens. Yields entirely
 * while frozen so the drain sequence owns the camera. Returns the progress ref
 * to share with the scene (surface thinning / DeepWorld).
 */
export function useScrollDive(): MutableRefObject<number> {
  const progress = useRef(0);
  const { camera } = useThree();
  const frozen = useFreeze();

  useFrame(({ clock }) => {
    if (frozen.current) return;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 1;
    const sy = typeof window !== 'undefined' ? window.scrollY : 0;
    const p = diveProgressFromScroll(sy, vh);
    progress.current = p;

    const pose = divePose(p);
    const idle = 1 - p; // surface breathing fades as we sink
    const o = breathingOffset(clock.elapsedTime);
    camera.position.set(
      pose.position[0] + o.x * idle,
      pose.position[1] + o.rotX * 3 * idle,
      pose.position[2] + o.y * 0.5 * idle,
    );
    camera.up.set(pose.up[0], pose.up[1], pose.up[2]);
    camera.lookAt(pose.target[0], pose.target[1], pose.target[2]);
  });

  return progress;
}
