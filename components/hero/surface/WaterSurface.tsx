'use client';

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { ShaderMaterial, Color, Vector3 } from 'three';
import { waterVertex, waterFragment } from './shaders/waterSurface.glsl';
import { useFreeze } from '../puzzle/useFreeze';

export function WaterSurface() {
  const matRef = useRef<ShaderMaterial>(null);
  const { camera } = useThree();
  const frozen = useFreeze();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
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
    if (frozen.current) return;
    const m = matRef.current;
    if (!m) return;
    m.uniforms.uTime.value += delta;
    (m.uniforms.uCameraPos.value as Vector3).copy(camera.position);
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
