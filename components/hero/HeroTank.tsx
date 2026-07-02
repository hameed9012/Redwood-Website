'use client';

import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { TankScene } from './TankScene';
import { detectTierFromBrowser, qualityFor, type QualityProfile } from './quality';
import { useFreeze, FreezeBridge } from './puzzle/useFreeze';
import { usePuzzle, PuzzleBridge } from './puzzle/PuzzleProvider';

export function HeroTank() {
  const puzzle = usePuzzle();
  const registry = puzzle.registry;
  const [quality, setQuality] = useState<QualityProfile>(() => qualityFor('mid'));
  const frozen = useFreeze();

  useEffect(() => {
    setQuality(qualityFor(detectTierFromBrowser()));
  }, []);

  // Leva is dev-only. The NODE_ENV check is inlined directly around the dynamic
  // import so webpack statically evaluates it to `if (false)` in a production
  // build and drops the import() entirely — no leva chunk ships (spec §10).
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      void import('leva');
    }
  }, []);

  return (
    <Canvas
      className="absolute inset-0"
      dpr={[1, quality.maxDpr]}
      camera={{ position: [0, 16, 0.001], fov: 50, near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: false }}
    >
      <FreezeBridge freezeRef={frozen}>
        <PuzzleBridge value={puzzle}>
          <Environment files={quality.hdriPath} environmentIntensity={1.8} />
          <TankScene registry={registry} quality={quality} />
          {/* Lean postprocessing — DepthOfField + ChromaticAberration dropped: profiling
              (R2-11) showed the scene is fill-rate bound at 1920px and DoF was the
              dominant full-screen pass (~16→50 FPS when viewport shrank). Bloom +
              vignette are the cheap, high-value passes. */}
          {quality.postprocessing && (
            <EffectComposer>
              <Bloom intensity={0.6} luminanceThreshold={0.6} mipmapBlur />
              <Vignette eskil={false} offset={0.3} darkness={0.7} />
            </EffectComposer>
          )}
        </PuzzleBridge>
      </FreezeBridge>
    </Canvas>
  );
}
