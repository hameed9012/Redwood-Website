'use client';

import { createContext, useContext, useEffect, useRef, type MutableRefObject } from 'react';
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
  // Cache the scrollable height. Reading scrollHeight forces a synchronous
  // layout — doing it every frame thrashes the page (jank). Recompute only on
  // resize plus a couple of post-layout settles.
  const maxScroll = useRef(1);
  const { camera } = useThree();
  const frozen = useFreeze();

  useEffect(() => {
    const recompute = () => {
      maxScroll.current = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    };
    recompute();
    const t1 = setTimeout(recompute, 300);
    const t2 = setTimeout(recompute, 1200);
    window.addEventListener('resize', recompute);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', recompute);
    };
  }, []);

  useFrame(({ clock }) => {
    if (frozen.current) return;
    const sy = typeof window !== 'undefined' ? window.scrollY : 0; // cheap: no layout
    const p = diveProgressFromScroll(sy, maxScroll.current);
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
