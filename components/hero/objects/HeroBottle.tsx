'use client';

import { useRef, useEffect, useMemo, Suspense, Component, type ReactNode } from 'react';
import type { Object3D, Group } from 'three';
import { CanvasTexture } from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { heroBottleGeometry } from './proceduralBottleGeo';
import { createGlassMaterial } from './glassMaterial';
import { useAssetPresence, shouldRenderGlb } from './useOptionalGLTF';
import { useHoverToRead, RESTING_TILT } from '../useHoverToRead';
import { driftOffset } from './useAmbientDrift';
import { drugFor, type PeakLetter } from '../peak';

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

function BottleLabel({ text }: { text: string }) {
  const texture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = 256; c.height = 64;
    const ctx = c.getContext('2d');
    if (!ctx) return null; // jsdom / no 2d context → no label (test-safe)
    ctx.clearRect(0, 0, 256, 64);
    ctx.fillStyle = '#f5f5f4';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);
    const t = new CanvasTexture(c);
    t.needsUpdate = true;
    return t;
  }, [text]);
  if (!texture) return null;
  return (
    <mesh position={[0, 0, 0.34]}>
      <planeGeometry args={[0.5, 0.16]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}

function ProceduralBottle({ letter, onReady }: { letter: PeakLetter; onReady: HeroBottleProps['onReady'] }) {
  const ref = useRef<Group>(null);
  const geometry = useMemo(() => heroBottleGeometry(), []);
  const material = useMemo(() => createGlassMaterial(), []);
  const drug = useMemo(() => drugFor(letter), [letter]);
  const { onPointerOver, onPointerOut } = useHoverToRead();
  useEffect(() => { if (ref.current) onReady(letter, ref.current); }, [letter, onReady]);
  return (
    <group ref={ref} rotation={[RESTING_TILT, 0, 0]}
      onPointerOver={(e) => { e.stopPropagation(); if (ref.current) onPointerOver(ref.current); }}
      onPointerOut={(e) => { e.stopPropagation(); if (ref.current) onPointerOut(ref.current); }}>
      <mesh geometry={geometry} material={material} />
      <BottleLabel text={drug} />
    </group>
  );
}

function GlbBottle({ letter, path, onReady }: { letter: PeakLetter; path: string; onReady: HeroBottleProps['onReady'] }) {
  const { scene } = useGLTF(path) as unknown as { scene: Group };
  const ref = useRef<Group>(null);
  const { onPointerOver, onPointerOut } = useHoverToRead();
  useEffect(() => { if (ref.current) onReady(letter, ref.current); }, [letter, onReady]);
  return (
    <group ref={ref} rotation={[RESTING_TILT, 0, 0]}
      onPointerOver={(e) => { e.stopPropagation(); if (ref.current) onPointerOver(ref.current); }}
      onPointerOut={(e) => { e.stopPropagation(); if (ref.current) onPointerOut(ref.current); }}>
      <primitive object={scene} />
    </group>
  );
}

export function HeroBottle({ letter, position, onReady }: HeroBottleProps) {
  const status = useAssetPresence(GLB_PATH[letter]);
  const groupRef = useRef<Group>(null);
  const phase = useMemo(() => ({ P: 0.12, E: 0.41, A: 0.68, K: 0.91 }[letter]), [letter]);

  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (!g) return;
    const d = driftOffset(clock.elapsedTime, phase);
    g.position.set(position[0] + d.x, position[1] + d.y, position[2] + d.z);
    g.rotation.set(0, d.rotY * 0.5, d.rotZ); // X left at 0 so drift never fights the hover tilt
  });

  const procedural = <ProceduralBottle letter={letter} onReady={onReady} />;
  return (
    <group ref={groupRef} position={position} scale={0.5}>
      {shouldRenderGlb(status) ? (
        <GlbErrorBoundary fallback={procedural}>
          <Suspense fallback={procedural}><GlbBottle letter={letter} path={GLB_PATH[letter]} onReady={onReady} /></Suspense>
        </GlbErrorBoundary>
      ) : (procedural)}
    </group>
  );
}
