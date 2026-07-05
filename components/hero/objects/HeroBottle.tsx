'use client';

import { useRef, useEffect, useMemo, Suspense, Component, type ReactNode, type RefObject } from 'react';
import type { Object3D, Group } from 'three';
import { CanvasTexture, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { heroBottleGeometry } from './proceduralBottleGeo';
import { createGlassMaterial } from './glassMaterial';
import { useAssetPresence, shouldRenderGlb } from './useOptionalGLTF';
import { useHoverToRead, RESTING_TILT } from '../useHoverToRead';
import { stepFloater, type Floater } from '../surface/waterField';
import { drugFor, type PeakLetter } from '../peak';
import { useFreeze } from '../puzzle/useFreeze';
import { usePuzzleMaybe } from '../puzzle/PuzzleProvider';

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
    c.width = 512; c.height = 128;
    const ctx = c.getContext('2d');
    if (!ctx) return null; // jsdom / no 2d context → no label (test-safe)
    ctx.clearRect(0, 0, 512, 128);
    ctx.fillStyle = '#f5f5f4';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 64);
    const t = new CanvasTexture(c);
    t.needsUpdate = true;
    return t;
  }, [text]);
  if (!texture) return null;
  return (
    <mesh position={[0, 0, 0.34]}>
      <planeGeometry args={[0.95, 0.24]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}

/** Shared hover wiring: tilt-to-read + the DOM name chip, suppressed while this bottle is being carried. */
function useBottleHover(letter: PeakLetter, ref: RefObject<Group>) {
  const { onPointerOver, onPointerOut } = useHoverToRead();
  const puzzle = usePuzzleMaybe();
  const isGrabbed = () => puzzle?.drag.current.grabbed === letter;
  return {
    over: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      if (ref.current) onPointerOver(ref.current);
      puzzle?.setHoveredLetter(letter);
    },
    out: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      // While carried, the pointer constantly enters/leaves the moving bottle —
      // don't yank the tilt or the name chip mid-drag.
      if (isGrabbed()) return;
      if (ref.current) onPointerOut(ref.current);
      puzzle?.setHoveredLetter(null);
    },
  };
}

function ProceduralBottle({ letter, onReady }: { letter: PeakLetter; onReady: HeroBottleProps['onReady'] }) {
  const ref = useRef<Group>(null);
  const geometry = useMemo(() => heroBottleGeometry(), []);
  const material = useMemo(() => createGlassMaterial(), []);
  const drug = useMemo(() => drugFor(letter), [letter]);
  const hover = useBottleHover(letter, ref);
  useEffect(() => { if (ref.current) onReady(letter, ref.current); }, [letter, onReady]);
  return (
    <group ref={ref} rotation={[RESTING_TILT, 0, 0]} onPointerOver={hover.over} onPointerOut={hover.out}>
      <mesh geometry={geometry} material={material} />
      <BottleLabel text={drug} />
    </group>
  );
}

function GlbBottle({ letter, path, onReady }: { letter: PeakLetter; path: string; onReady: HeroBottleProps['onReady'] }) {
  const { scene } = useGLTF(path) as unknown as { scene: Group };
  const ref = useRef<Group>(null);
  const hover = useBottleHover(letter, ref);
  useEffect(() => { if (ref.current) onReady(letter, ref.current); }, [letter, onReady]);
  return (
    <group ref={ref} rotation={[RESTING_TILT, 0, 0]} onPointerOver={hover.over} onPointerOut={hover.out}>
      <primitive object={scene} />
    </group>
  );
}

// PEAK bottles float more centrally than the field so they stay findable.
const PEAK_BOUNDS = { x: 9, z: 9 };

export function HeroBottle({ letter, position, onReady }: HeroBottleProps) {
  const status = useAssetPresence(GLB_PATH[letter]);
  const groupRef = useRef<Group>(null);
  const frozen = useFreeze();
  const puzzle = usePuzzleMaybe();
  const phase = useMemo(() => ({ P: 0.12, E: 0.41, A: 0.68, K: 0.91 }[letter]), [letter]);
  // Scratch vector reused every frame (no per-frame allocation in the lerp path).
  const lerpTarget = useMemo(() => new Vector3(), []);

  // Free-floats like everything else, but starts at its seeded position and never
  // spins on Y — so the hover tilt reliably brings its label up to the camera.
  const floater = useMemo<Floater>(
    () => ({
      x: position[0],
      z: position[2],
      vx: (phase - 0.5) * 0.3,
      vz: (0.5 - phase) * 0.3,
      depth: 0,
      enterY: 0,
      spinPhase: phase * 6.2831853,
      lastCut: 0,
    }),
    // position/phase are stable per letter
    [letter], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Smooths the hand-off between carried and floating: on release the bottle
  // eases back down to the water instead of teleporting (the "bugs down" snap).
  const wasSuspended = useRef(false);
  const dropOffset = useRef(0);

  useFrame(({ clock }, delta) => {
    if (frozen.current) return;
    const g = groupRef.current;
    if (!g) return;

    const suspend = puzzle?.suspendedRef.current[letter];
    if (suspend) {
      wasSuspended.current = true;
      const point = suspend === 'grabbed' ? puzzle!.drag.current.target : suspend;
      g.position.lerp(lerpTarget.set(point.x, point.y, point.z), Math.min(1, delta * 8));
      // Ease the drift roll out instead of snapping upright in one frame.
      g.rotation.z += (0 - g.rotation.z) * Math.min(1, delta * 6);
      g.rotation.y += (0 - g.rotation.y) * Math.min(1, delta * 6);
      // Keep the floater in sync so, on release, it resumes drifting from here.
      floater.x = g.position.x;
      floater.z = g.position.z;
      return;
    }

    const tr = stepFloater(floater, clock.elapsedTime, delta, PEAK_BOUNDS);

    if (wasSuspended.current) {
      // Just released: carry the height difference as a decaying offset so the
      // bottle settles onto the water instead of jumping to it.
      wasSuspended.current = false;
      dropOffset.current = g.position.y - tr.y;
    }
    if (Math.abs(dropOffset.current) > 0.001) {
      dropOffset.current *= Math.max(0, 1 - delta * 4);
    } else {
      dropOffset.current = 0;
    }

    g.position.set(tr.x, tr.y + dropOffset.current, tr.z);
    // Gentle roll on Z only; X + yaw stay 0 so the hover tilt (inner group) reads cleanly.
    g.rotation.set(0, 0, tr.tiltZ * 0.6);
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
