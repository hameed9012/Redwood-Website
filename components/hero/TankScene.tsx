'use client';

import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { DirectionalLight } from 'three';
import { FieldObjects } from './objects/FieldObjects';
import { HeroBottles } from './objects/HeroBottles';
import { OpenBottle } from './objects/OpenBottle';
import { Bubbles } from './Bubbles';
import { CausticsPlane } from './CausticsPlane';
import { BackgroundLogo } from './BackgroundLogo';
import { Tanker } from './scenery/Tanker';
import { WaterSurface } from './surface/WaterSurface';
import type { WaterSurfaceHandle } from './surface/WaterSurface';
import { useSurfaceCursor } from './surface/useSurfaceCursor';
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

  const [surface, setSurface] = useState<WaterSurfaceHandle | null>(null);
  const cut = useRef<{ x: number; z: number; strength: number; t: number }>({ x: 0, z: 0, strength: 0, t: 0 });
  useSurfaceCursor(surface, (x, z, strength) => { cut.current = { x, z, strength, t: performance.now() }; });

  const { camera } = useThree();
  useEffect(() => {
    camera.up.set(0, 0, -1);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  // Slow cold light sweep on a 20–30s cycle (spec §6.5).
  // Orbits above the XZ surface and aims straight down at the center for the top-down camera.
  useFrame(({ clock }) => {
    if (sweep.current) {
      const t = clock.elapsedTime / 25; // ~25s period
      sweep.current.position.set(Math.sin(t * Math.PI * 2) * 10, 8, Math.cos(t * Math.PI * 2) * 10);
      sweep.current.target.position.set(0, 0, 0);
      sweep.current.target.updateMatrixWorld();
    }
  });

  return (
    <>
      <color attach="background" args={['#050a0c']} />
      {/* Depth fog scoped to the tank (spec §6.4). */}
      <fogExp2 attach="fog" args={['#0a1518', 0.05]} />

      <ambientLight intensity={0.45} color="#9bbdb9" />
      {/* Bright cold key that sweeps — gives the glass highlights + refraction flare. */}
      <directionalLight ref={sweep} intensity={3.2} color="#dff3ef" />
      {/* Static cool fill so bottles read as glass even between sweeps. */}
      <directionalLight position={[-4, 2, 5]} intensity={1.1} color="#8fbfc7" />

      {quality.caustics && <CausticsPlane intensity={0.45} />}
      <WaterSurface onReady={setSurface} />
      <BackgroundLogo />
      <FieldObjects count={quality.bottleCount} pushFrom={cut} />
      <HeroBottles registry={registry} pushFrom={cut} />
      <Bubbles count={quality.bubbleCount} />
      {Array.from({ length: quality.openBottleCount }).map((_, i) => (
        <OpenBottle key={i} seed={i + 1} position={[(i - 1.5) * 6, 0, (i % 2 ? 4 : -4)]} pushFrom={cut} />
      ))}
      <Tanker />
    </>
  );
}
