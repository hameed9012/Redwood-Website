'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ShaderMaterial, Color, Vector2 } from 'three';
import { waterVertex, waterFragment } from './shaders/waterSurface.glsl';

export interface WaterSurfaceHandle {
  /** Set the cursor's world-XZ position on the surface + how hard it's cutting (0..1). */
  move: (x: number, z: number, strength?: number) => void;
}

export function WaterSurface({ onReady }: { onReady?: (h: WaterSurfaceHandle) => void } = {}) {
  const matRef = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new Vector2(0, 0) },
      uMouseStrength: { value: 0 },
      uDeep: { value: new Color('#06141a') },
      uShallow: { value: new Color('#2f6f6a') },
    }),
    [],
  );

  useFrame((_, delta) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value += delta;
    // The cut fades when the cursor stops moving, so the trough trails the finger.
    const s = matRef.current.uniforms.uMouseStrength.value as number;
    matRef.current.uniforms.uMouseStrength.value = Math.max(0, s - delta * 1.6);
  });

  const handle = useMemo<WaterSurfaceHandle>(
    () => ({
      move: (x, z, strength = 1) => {
        if (!matRef.current) return;
        matRef.current.uniforms.uMouse.value.set(x, z);
        // Keep the strongest recent cut; useFrame decays it.
        const cur = matRef.current.uniforms.uMouseStrength.value as number;
        matRef.current.uniforms.uMouseStrength.value = Math.max(cur, strength);
      },
    }),
    [],
  );

  const reported = useRef(false);
  useFrame(() => {
    if (!reported.current && onReady) {
      reported.current = true;
      onReady(handle);
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[60, 60, 160, 160]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={waterVertex}
        fragmentShader={waterFragment}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
}
