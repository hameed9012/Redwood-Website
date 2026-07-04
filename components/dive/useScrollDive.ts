'use client';

import { createContext, useContext, useRef, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { divePose } from './divePath';
import { breathingOffset } from '../hero/useCameraBreathing';
import { useFreeze } from '../hero/puzzle/useFreeze';

/**
 * Pure scroll→dive-progress mapping (tested): the descent spans the ENTIRE
 * document scroll — 0 at the very top (surface), 1 at the very bottom (deep) —
 * so each public section, wherever it sits in the flow, gets a natural depth and
 * "reveals as the camera sinks past it" (spec §2). Robust to content height: add
 * or resize a section and the mapping still spans exactly the whole page.
 */
export function diveProgressFromScroll(scrollY: number, maxScroll: number): number {
  if (maxScroll <= 0) return 0;
  return Math.min(1, Math.max(0, scrollY / maxScroll));
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
    const doc = typeof document !== 'undefined' ? document.documentElement : null;
    const maxScroll = doc ? doc.scrollHeight - window.innerHeight : 0;
    const sy = typeof window !== 'undefined' ? window.scrollY : 0;
    const p = diveProgressFromScroll(sy, maxScroll);
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
