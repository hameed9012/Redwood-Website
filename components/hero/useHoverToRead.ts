'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import type { Object3D } from 'three';

/**
 * Top-down camera reads the label only if the bottle TILTS its labelled side up
 * toward the camera. Bottle stands upright along local Y with its label on local +Z.
 * At rest it's upright (label edge-on to a camera looking straight down → hidden).
 * On hover it tips ~90° about X so the +Z label face lifts to point up (+Y) at the camera.
 */
export const RESTING_TILT = 0;
export const READ_TILT = -Math.PI / 2;

/** Y-component (world up) of the label normal (local +Z) after rotating tiltX about X. 0=hidden, 1=facing camera. */
export function labelUpComponent(tiltX: number): number {
  return -Math.sin(tiltX);
}

export function useHoverToRead(restingTilt: number = RESTING_TILT) {
  const tween = useRef<gsap.core.Tween | null>(null);
  const onPointerOver = (obj: Object3D) => {
    tween.current?.kill();
    tween.current = gsap.to(obj.rotation, { x: READ_TILT, duration: 0.5, ease: 'back.out(1.4)' });
  };
  const onPointerOut = (obj: Object3D) => {
    tween.current?.kill();
    tween.current = gsap.to(obj.rotation, { x: restingTilt, duration: 1.1, ease: 'back.out(1.1)' });
  };
  return { onPointerOver, onPointerOut };
}
