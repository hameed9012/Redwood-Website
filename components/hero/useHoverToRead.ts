'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import type { Object3D } from 'three';

/** Label points away from camera at rest (spec §6.10, §9.2). */
export const RESTING_LABEL_AWAY = Math.PI;

/** Rotation that turns the label to face the camera. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function faceCameraRotationY(_resting: number): number {
  return 0;
}

export function useHoverToRead(restingY: number = RESTING_LABEL_AWAY) {
  const tween = useRef<gsap.core.Tween | null>(null);

  const onPointerOver = (obj: Object3D) => {
    tween.current?.kill();
    // Rotate toward camera over ~0.5s with a soft, slightly-overshooting ease.
    tween.current = gsap.to(obj.rotation, {
      y: faceCameraRotationY(restingY),
      duration: 0.5,
      ease: 'back.out(1.4)',
    });
  };

  const onPointerOut = (obj: Object3D) => {
    tween.current?.kill();
    // Lazily drift back — does not snap (spec §9.2).
    tween.current = gsap.to(obj.rotation, {
      y: restingY,
      duration: 1.1,
      ease: 'back.out(1.1)',
    });
  };

  return { onPointerOver, onPointerOut };
}
