'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { DirectionalLight, Group } from 'three';
import { FieldObjects } from './objects/FieldObjects';
import { HeroBottles } from './objects/HeroBottles';
import { OpenBottle } from './objects/OpenBottle';
import { Bubbles } from './Bubbles';
import { CausticsPlane } from './CausticsPlane';
import { BackgroundLogo } from './BackgroundLogo';
import { Tanker } from './scenery/Tanker';
import { WaterSurface } from './surface/WaterSurface';
import type { PeakRegistry } from './peak';
import type { QualityProfile } from './quality';
import { useFreeze } from './puzzle/useFreeze';
import { useBottleDrag } from './puzzle/useBottleDrag';
import { DrainSequence } from './puzzle/DrainSequence';
import { useScrollDive, DiveProgressProvider } from '../dive/useScrollDive';
import { DeepWorld } from '../deep/DeepWorld';
import { DeepAtmosphere } from '../deep/DeepAtmosphere';

interface TankSceneProps {
  registry: PeakRegistry;
  quality: QualityProfile;
  /** Fires when the solve-drain finishes (the loading sequence takes over). */
  onDrained?: () => void;
}

export function TankScene({ registry, quality, onDrained }: TankSceneProps) {
  const sweep = useRef<DirectionalLight>(null);
  const sceneShift = useRef<Group>(null);
  const surfaceDecor = useRef<Group>(null);
  const frozen = useFreeze();
  // The dive owns the camera now (surface pose at scroll-top → submerged at depth),
  // folding in the old top-down breathing drift. Drag gates itself to the hero.
  const diveProgress = useScrollDive();
  useBottleDrag();

  // Slow cold light sweep on a 20–30s cycle (spec §6.5).
  // Orbits above the XZ surface and aims straight down at the center for the top-down camera.
  useFrame(({ clock }) => {
    if (frozen.current) return;
    if (sweep.current) {
      const t = clock.elapsedTime / 25; // ~25s period
      sweep.current.position.set(Math.sin(t * Math.PI * 2) * 10, 8, Math.cos(t * Math.PI * 2) * 10);
      sweep.current.target.position.set(0, 0, 0);
      sweep.current.target.updateMatrixWorld();
    }
  });

  return (
    <DiveProgressProvider value={diveProgress}>
      <color attach="background" args={['#050a0c']} />
      {/* Depth fog scoped to the tank (spec §6.4). */}
      <fogExp2 attach="fog" args={['#0a1518', 0.05]} />

      <ambientLight intensity={0.45} color="#9bbdb9" />
      {/* Bright cold key that sweeps — gives the glass highlights + refraction flare. */}
      <directionalLight ref={sweep} intensity={3.2} color="#dff3ef" />
      {/* Static cool fill so bottles read as glass even between sweeps. */}
      <directionalLight position={[-4, 2, 5]} intensity={1.1} color="#8fbfc7" />

      {/* Everything that drains sits in one shiftable group (the drain tweens its y). */}
      <group ref={sceneShift}>
        {quality.caustics && <CausticsPlane intensity={0.45} />}
        <WaterSurface />
        <BackgroundLogo />
        <HeroBottles registry={registry} />
        <Bubbles count={quality.bubbleCount} />
        {/* Surface-only decor: hidden by DeepAtmosphere as the dive descends so
            loose bottles / the tanker don't float, wrongly, in the deep. */}
        <group ref={surfaceDecor}>
          <FieldObjects count={quality.bottleCount} />
          {Array.from({ length: quality.openBottleCount }).map((_, i) => (
            <OpenBottle key={i} seed={i + 1} position={[(i - 1.5) * 6, 0, (i % 2 ? 4 : -4)]} />
          ))}
          <Tanker />
        </group>
        {/* The submerged world, revealed by the dive (spec §3). */}
        <DeepWorld surfaceBottleCount={quality.bottleCount} />
      </group>
      <DeepAtmosphere surfaceDecor={surfaceDecor} />
      <DrainSequence sceneShift={sceneShift} onDrained={onDrained} />
    </DiveProgressProvider>
  );
}
