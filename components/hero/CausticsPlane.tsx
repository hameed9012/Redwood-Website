'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { ShaderMaterial, Color, AdditiveBlending } from 'three';
import { causticsVertex, causticsFragment } from './shaders/caustics.glsl';

interface CausticsPlaneProps {
  intensity: number;
}

export function CausticsPlane({ intensity }: CausticsPlaneProps) {
  const matRef = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: intensity },
      uColor: { value: new Color('#3a6f6a') },
    }),
    [intensity],
  );

  useFrame((_, delta) => {
    if (matRef.current) {
      (matRef.current.uniforms.uTime.value as number) += delta;
      matRef.current.uniforms.uIntensity.value = intensity;
    }
  });

  return (
    <mesh position={[0, 0, -13]}>
      <planeGeometry args={[40, 30]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={causticsVertex}
        fragmentShader={causticsFragment}
        uniforms={uniforms}
        transparent
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}
