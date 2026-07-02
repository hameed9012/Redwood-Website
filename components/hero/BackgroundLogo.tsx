'use client';

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import type { Group, MeshBasicMaterial } from 'three';
import { usePuzzleMaybe } from './puzzle/PuzzleProvider';
import { useFreeze } from './puzzle/useFreeze';

/** Resting opacity of the sunken logo mark — kept faint so it reads as a texture. */
const BASE_OPACITY = 0.06;

/**
 * Looming mountain/pine mark behind the water (spec §6.8).
 * Named "background-logo" and addressable so Phase 2 can drive the
 * near-miss flicker and the swallowed-by-darkness moment.
 */
export function BackgroundLogo() {
  const ref = useRef<Group>(null);
  const matRef = useRef<MeshBasicMaterial>(null);
  const flickerRef = useRef<gsap.core.Timeline | null>(null);
  const puzzle = usePuzzleMaybe();
  const frozen = useFreeze();

  useFrame(({ clock }) => {
    if (frozen.current) return;
    if (!ref.current) return;
    // Almost-imperceptible breathing pulse, multi-second cycle.
    const pulse = 1 + Math.sin(clock.elapsedTime * 0.25) * 0.015;
    ref.current.scale.setScalar(pulse * 8);
  });

  useEffect(() => {
    if (puzzle?.phase !== 'near-miss') return;
    const mat = matRef.current;
    if (!mat) return;

    flickerRef.current?.kill();
    flickerRef.current = gsap
      .timeline({
        onComplete: () => {
          mat.opacity = BASE_OPACITY;
        },
      })
      .to(mat, { opacity: 0.18, duration: 0.1, ease: 'sine.inOut' })
      .to(mat, { opacity: BASE_OPACITY, duration: 0.08, ease: 'sine.inOut' })
      .to(mat, { opacity: 0.18, duration: 0.1, ease: 'sine.inOut' })
      .to(mat, { opacity: BASE_OPACITY, duration: 0.12, ease: 'sine.inOut' });

    return () => {
      flickerRef.current?.kill();
    };
  }, [puzzle?.phase]);

  return (
    <group ref={ref} name="background-logo" position={[0, -10, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={8}>
      <mesh>
        <planeGeometry args={[2, 2]} />
        <meshBasicMaterial ref={matRef} color="#7a1518" transparent opacity={BASE_OPACITY} />
      </mesh>
    </group>
  );
}
