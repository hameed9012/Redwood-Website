'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

/**
 * Looming mountain/pine mark behind the water (spec §6.8).
 * Named "background-logo" and addressable so Phase 2 can drive the
 * near-miss flicker and the swallowed-by-darkness moment.
 */
export function BackgroundLogo() {
  const ref = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    // Almost-imperceptible breathing pulse, multi-second cycle.
    const pulse = 1 + Math.sin(clock.elapsedTime * 0.25) * 0.015;
    ref.current.scale.setScalar(pulse * 8);
  });

  return (
    <group ref={ref} name="background-logo" position={[0, -10, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={8}>
      <mesh>
        <planeGeometry args={[2, 2]} />
        <meshBasicMaterial color="#7a1518" transparent opacity={0.06} />
      </mesh>
    </group>
  );
}
