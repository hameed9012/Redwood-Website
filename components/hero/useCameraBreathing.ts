'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

export interface BreathOffset {
  x: number;
  y: number;
  rotX: number;
  rotY: number;
}

/** Layered incommensurate sines → never a clean repeating loop (spec §6.1). */
export function breathingOffset(t: number): BreathOffset {
  return {
    x: Math.sin(t * 0.21) * 0.08 + Math.sin(t * 0.07) * 0.05,
    y: Math.cos(t * 0.17) * 0.06 + Math.sin(t * 0.043) * 0.04,
    rotX: Math.sin(t * 0.13) * 0.012,
    rotY: Math.cos(t * 0.11) * 0.012,
  };
}

/**
 * Gentle suspended-in-liquid drift for the TOP-DOWN camera. Applies small
 * POSITION offsets around the camera's mount position and re-aims at `target`
 * every frame (keeping the straight-down look + stable screen-up). It must NOT
 * write camera.rotation directly — that would clobber the look-down orientation
 * and point the camera at the horizon (scene goes black).
 */
export function useCameraBreathing(target: [number, number, number] = [0, 0, 0]) {
  const { camera } = useThree();
  const base = useRef({ x: camera.position.x, y: camera.position.y, z: camera.position.z });
  useFrame(({ clock }) => {
    const o = breathingOffset(clock.elapsedTime);
    camera.position.x = base.current.x + o.x;
    camera.position.z = base.current.z + o.y * 0.5;
    camera.position.y = base.current.y + o.rotX * 3; // tiny height bob
    camera.up.set(0, 0, -1);
    camera.lookAt(target[0], target[1], target[2]);
  });
}
