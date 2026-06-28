'use client';

import { useMemo, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { EffectComposer, Bloom, DepthOfField, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { Vector2 } from 'three';
import { TankScene } from './TankScene';
import { PeakRegistry } from './peak';
import { detectTierFromBrowser, qualityFor, type QualityProfile } from './quality';

export function HeroTank() {
  const registry = useMemo(() => new PeakRegistry(), []);
  const [quality, setQuality] = useState<QualityProfile>(() => qualityFor('mid'));

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

  // ChromaticAberration's `offset` prop requires a THREE.Vector2, not a plain array.
  const chromaticOffset = useMemo(() => new Vector2(0.0006, 0.0006), []);

  return (
    <Canvas
      className="absolute inset-0"
      dpr={[1, quality.maxDpr]}
      camera={{ position: [0, 0, 6], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
    >
      <Environment files={quality.hdriPath} environmentIntensity={1.8} />
      <TankScene registry={registry} quality={quality} />
      {quality.postprocessing && (
        <EffectComposer>
          <Bloom intensity={0.6} luminanceThreshold={0.6} mipmapBlur />
          <DepthOfField focusDistance={0.02} focalLength={0.05} bokehScale={2} />
          <Vignette eskil={false} offset={0.3} darkness={0.7} />
          <ChromaticAberration offset={chromaticOffset} radialModulation={false} modulationOffset={0} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
