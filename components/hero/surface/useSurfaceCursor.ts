'use client';

import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { Raycaster, Plane, Vector3, Vector2 } from 'three';
import type { WaterSurfaceHandle } from './WaterSurface';

/** Map cursor speed (px/s) to a ripple strength in 0..1. */
export function rippleStrengthForSpeed(speedPxPerSec: number): number {
  return Math.min(1, speedPxPerSec / 600);
}

/**
 * Raycasts the pointer onto the water plane (y=0) and feeds an expanding ripple
 * to the WaterSurface; reports the world point + strength via `onCut` so the
 * scene can push nearby bottles away.
 */
export function useSurfaceCursor(
  handle: WaterSurfaceHandle | null,
  onCut?: (x: number, z: number, strength: number) => void,
) {
  const { gl, camera } = useThree();
  const last = useRef({ x: 0, y: 0, t: 0 });
  const lastHit = useRef<{ x: number; z: number } | null>(null);

  useEffect(() => {
    const el = gl.domElement;
    const ray = new Raycaster();
    const plane = new Plane(new Vector3(0, 1, 0), 0);
    const ndc = new Vector2();
    const hit = new Vector3();

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const now = performance.now();
      const dt = Math.max(1, now - last.current.t);
      const speed = (Math.hypot(e.clientX - last.current.x, e.clientY - last.current.y) / dt) * 1000;
      last.current = { x: e.clientX, y: e.clientY, t: now };

      ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      if (ray.ray.intersectPlane(plane, hit)) {
        // World-space drag direction (current hit minus the previous hit).
        const prev = lastHit.current;
        let dirX = prev ? hit.x - prev.x : 1;
        let dirZ = prev ? hit.z - prev.z : 0;
        if (dirX === 0 && dirZ === 0) { dirX = 1; dirZ = 0; }
        lastHit.current = { x: hit.x, z: hit.z };
        // Floor so even a slow drag visibly cuts (faster → deeper, up to 1).
        const strength = Math.max(0.45, rippleStrengthForSpeed(speed));
        handle?.move(hit.x, hit.z, dirX, dirZ, strength);
        onCut?.(hit.x, hit.z, strength);
      }
    };

    el.addEventListener('pointermove', onMove);
    return () => el.removeEventListener('pointermove', onMove);
  }, [gl, camera, handle, onCut]);
}
