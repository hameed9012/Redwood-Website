'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { DirectionalLight } from 'three';
import { FieldObjects } from './objects/FieldObjects';
import { HeroBottles } from './objects/HeroBottles';
import { Bubbles } from './Bubbles';
import { CausticsPlane } from './CausticsPlane';
import { BackgroundLogo } from './BackgroundLogo';
import { useCameraBreathing } from './useCameraBreathing';
import type { PeakRegistry } from './peak';
import type { QualityProfile } from './quality';

interface TankSceneProps {
  registry: PeakRegistry;
  quality: QualityProfile;
}

export function TankScene({ registry, quality }: TankSceneProps) {
  const sweep = useRef<DirectionalLight>(null);
  useCameraBreathing();

  // Slow cold light sweep on a 20–30s cycle (spec §6.5).
  useFrame(({ clock }) => {
    if (sweep.current) {
      const t = clock.elapsedTime / 25; // ~25s period
      sweep.current.position.x = Math.sin(t * Math.PI * 2) * 8;
      sweep.current.position.z = 4;
    }
  });

  return (
    <>
      <color attach="background" args={['#050a0c']} />
      {/* Depth fog scoped to the tank (spec §6.4). */}
      <fogExp2 attach="fog" args={['#0a1518', 0.085]} />

      <ambientLight intensity={0.15} color="#9bbdb9" />
      <directionalLight ref={sweep} intensity={1.4} color="#bfe0dd" />

      {quality.caustics && <CausticsPlane intensity={0.45} />}
      <BackgroundLogo />
      <FieldObjects count={quality.bottleCount} />
      <HeroBottles registry={registry} />
      <Bubbles count={quality.bubbleCount} />
    </>
  );
}
