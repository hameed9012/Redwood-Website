'use client';

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { ShaderMaterial, Color, Vector2, Vector3 } from 'three';
import { waterVertex, waterFragment } from './shaders/waterSurface.glsl';

export interface WaterSurfaceHandle {
  /** Set the cursor's world-XZ position, drag direction, and how hard it's cutting (0..1). */
  move: (x: number, z: number, dirX: number, dirZ: number, strength?: number) => void;
}

export function WaterSurface({ onReady }: { onReady?: (h: WaterSurfaceHandle) => void } = {}) {
  const matRef = useRef<ShaderMaterial>(null);
  const { camera } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new Vector2(0, 0) },
      uMouseDir: { value: new Vector2(1, 0) },
      uMouseStrength: { value: 0 },
      uDeep: { value: new Color('#06141a') },
      uShallow: { value: new Color('#1d4f4a') },
      uSky: { value: new Color('#46666c') },
      uSpec: { value: new Color('#9fc4bf') },
      uCameraPos: { value: new Vector3(0, 16, 0) },
      uLightDir: { value: new Vector3(-0.4, 0.85, -0.3).normalize() },
    }),
    [],
  );

  useFrame((_, delta) => {
    const m = matRef.current;
    if (!m) return;
    m.uniforms.uTime.value += delta;
    (m.uniforms.uCameraPos.value as Vector3).copy(camera.position);
    // The cut fades when the cursor stops moving, so the trough trails the finger.
    const s = m.uniforms.uMouseStrength.value as number;
    m.uniforms.uMouseStrength.value = Math.max(0, s - delta * 1.6);
  });

  const handle = useMemo<WaterSurfaceHandle>(
    () => ({
      move: (x, z, dirX, dirZ, strength = 1) => {
        if (!matRef.current) return;
        matRef.current.uniforms.uMouse.value.set(x, z);
        const dl = Math.hypot(dirX, dirZ) || 1;
        matRef.current.uniforms.uMouseDir.value.set(dirX / dl, dirZ / dl);
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
      <planeGeometry args={[60, 60, 180, 180]} />
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
