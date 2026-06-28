'use client';

import { useRef, useEffect, useMemo, Suspense, Component, type ReactNode } from 'react';
import type { Mesh, Object3D, Group } from 'three';
import { useGLTF } from '@react-three/drei';
import { heroBottleGeometry } from './proceduralBottleGeo';
import { createGlassMaterial } from './glassMaterial';
import { useAssetPresence, shouldRenderGlb } from './useOptionalGLTF';
import type { PeakLetter } from '../peak';

interface HeroBottleProps {
  letter: PeakLetter;
  position: [number, number, number];
  /**
   * Called with the rendered root Object3D so a registry can tag + track it.
   * MUST be referentially stable (e.g. wrapped in useCallback) — it's an effect
   * dependency, so an inline arrow would re-register on every parent re-render.
   */
  onReady: (letter: PeakLetter, object: Object3D) => void;
}

const GLB_PATH: Record<PeakLetter, string> = {
  P: '/models/hero-bottle-p.glb',
  E: '/models/hero-bottle-e.glb',
  A: '/models/hero-bottle-a.glb',
  K: '/models/hero-bottle-k.glb',
};

/** If a committed .glb fails to load/parse, fall back to procedural. */
class GlbErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function ProceduralBottle({ letter, onReady }: { letter: PeakLetter; onReady: HeroBottleProps['onReady'] }) {
  const ref = useRef<Mesh>(null);
  // Memoized so hover-driven re-renders (Task 20) don't rebuild GPU resources each frame.
  const geometry = useMemo(() => heroBottleGeometry(), []);
  const material = useMemo(() => createGlassMaterial(), []);
  useEffect(() => {
    if (ref.current) onReady(letter, ref.current);
  }, [letter, onReady]);
  return <mesh ref={ref} geometry={geometry} material={material} />;
}

function GlbBottle({ letter, path, onReady }: { letter: PeakLetter; path: string; onReady: HeroBottleProps['onReady'] }) {
  const { scene } = useGLTF(path) as unknown as { scene: Group };
  const ref = useRef<Group>(null);
  useEffect(() => {
    if (ref.current) onReady(letter, ref.current);
  }, [letter, onReady]);
  // Drop-in: a committed .glb at GLB_PATH renders here with zero edits elsewhere.
  return <primitive ref={ref} object={scene} />;
}

export function HeroBottle({ letter, position, onReady }: HeroBottleProps) {
  const status = useAssetPresence(GLB_PATH[letter]);
  // Procedural renders immediately for pending/absent, so tagging fires at t0
  // and the scene never suspends on a missing model file.
  const procedural = <ProceduralBottle letter={letter} onReady={onReady} />;

  return (
    <group position={position}>
      {shouldRenderGlb(status) ? (
        <GlbErrorBoundary fallback={procedural}>
          <Suspense fallback={procedural}>
            <GlbBottle letter={letter} path={GLB_PATH[letter]} onReady={onReady} />
          </Suspense>
        </GlbErrorBoundary>
      ) : (
        procedural
      )}
    </group>
  );
}
