'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ShaderMaterial, Color, Vector2 } from 'three';
import { waterVertex, waterFragment } from './shaders/waterSurface.glsl';

export interface WaterSurfaceHandle {
  ripple: (x: number, z: number, strength?: number) => void;
}

export function WaterSurface({ onReady }: { onReady?: (h: WaterSurfaceHandle) => void } = {}) {
  const matRef = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRippleOrigin: { value: new Vector2(0, 0) },
      uRippleTime: { value: 999 },
      uRippleStrength: { value: 0 },
      uDeep: { value: new Color('#06141a') },
      uShallow: { value: new Color('#2f6f6a') },
    }),
    [],
  );

  useFrame((_, delta) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value += delta;
    matRef.current.uniforms.uRippleTime.value += delta;
  });

  const handle = useMemo<WaterSurfaceHandle>(
    () => ({
      ripple: (x, z, strength = 1) => {
        if (!matRef.current) return;
        matRef.current.uniforms.uRippleOrigin.value.set(x, z);
        matRef.current.uniforms.uRippleTime.value = 0;
        matRef.current.uniforms.uRippleStrength.value = strength;
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
