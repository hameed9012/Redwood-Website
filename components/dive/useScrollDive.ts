'use client';

import { createContext, useContext, useEffect, useRef, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { divePose } from './divePath';
import { breathingOffset } from '../hero/useCameraBreathing';
import { useFreeze } from '../hero/puzzle/useFreeze';

/**
 * Pure scroll→dive-progress mapping (tested). The descent is 0 up to `startPx`
 * (the SURFACE zone — hero + History stay at the top-down surface, tanker in
 * view), then ramps to 1 by `endPx` (the deep). Anchoring to real section
 * offsets keeps History at the surface and lets Services/Media/Contact sink,
 * instead of the whole page mapping linearly (which dropped History underwater).
 */
export function diveProgressFromScroll(scrollY: number, startPx: number, endPx: number): number {
  const span = endPx - startPx;
  if (span <= 0) return scrollY >= endPx ? 1 : 0;
  return Math.min(1, Math.max(0, (scrollY - startPx) / span));
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
  // Cache the descent's scroll anchors. Reading offsetTop/scrollHeight forces a
  // synchronous layout — doing it every frame thrashes the page (jank). Recompute
  // only on resize plus a couple of post-layout settles. Defaults keep progress
  // at 0 (surface) until the first measurement.
  const startPx = useRef(Number.POSITIVE_INFINITY);
  const endPx = useRef(Number.POSITIVE_INFINITY);
  const { camera } = useThree();
  const frozen = useFreeze();

  useEffect(() => {
    const recompute = () => {
      const vh = window.innerHeight;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
      const services = document.getElementById('services');
      const contact = document.getElementById('contact');
      // Surface holds through the hero and History; the dive begins as Services
      // is halfway into view and completes when Contact (the deepest) is reached.
      startPx.current = services ? Math.max(0, services.offsetTop - vh * 0.5) : maxScroll;
      endPx.current = contact ? contact.offsetTop : maxScroll;
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

  useFrame(({ clock }, delta) => {
    if (frozen.current) return;
    const sy = typeof window !== 'undefined' ? window.scrollY : 0; // cheap: no layout
    const target = diveProgressFromScroll(sy, startPx.current, endPx.current);
    // Ease progress toward the scroll target instead of snapping 1:1 — the
    // camera glides through the surface→level→deep reorientation so it reads as
    // an animation rather than a raw scroll scrub. Frame-rate independent.
    const k = 1 - Math.exp(-6 * Math.min(delta, 0.05));
    progress.current += (target - progress.current) * k;
    const p = progress.current;

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
