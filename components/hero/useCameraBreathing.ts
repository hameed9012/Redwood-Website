'use client';

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

export function useCameraBreathing() {
  const { camera } = useThree();
  const base = { x: camera.position.x, y: camera.position.y };
  useFrame(({ clock }) => {
    const o = breathingOffset(clock.elapsedTime);
    camera.position.x = base.x + o.x;
    camera.position.y = base.y + o.y;
    camera.rotation.x = o.rotX;
    camera.rotation.y = o.rotY;
  });
}
