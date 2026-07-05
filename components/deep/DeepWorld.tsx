'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh } from 'three';
import { fieldBottleGeometry } from '../hero/objects/proceduralBottleGeo';
import { createGlassMaterial } from '../hero/objects/glassMaterial';
import { useFreeze } from '../hero/puzzle/useFreeze';
import { useDiveProgress } from '../dive/useScrollDive';
import { Fish } from './Fish';
import { Coffins } from './Coffins';

/** Below this dive progress the deep is far below the (still near-surface) camera
 *  and tiny — we don't render it at all (perf + no surface clutter). The thick
 *  deep fog masks the appearance. */
const DEEP_APPEAR = 0.12;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface RareBottleDef {
  key: number;
  cx: number;
  cy: number;
  cz: number;
  scale: number;
  driftAmp: number;
  driftFreq: number;
  phase: number;
  yaw: number;
}

/**
 * The submerged population (spec §3): a loose school of fish, a scatter of rare
 * bottles drifting at depth (~15% of the surface field), and a few coffins on
 * the bed by the sunken logo. The whole group only renders once the dive is
 * underway, so it never clutters the top-down surface view.
 */
export function DeepWorld({ surfaceBottleCount }: { surfaceBottleCount: number }) {
  const frozen = useFreeze();
  const progress = useDiveProgress();
  const groupRef = useRef<Group>(null);

  const bottleGeo = useMemo(() => fieldBottleGeometry(), []);
  const material = useMemo(() => createGlassMaterial({ cheap: true }), []);

  const rareCount = Math.max(3, Math.round(surfaceBottleCount * 0.15));
  const rareRef = useRef<Group>(null);
  const bottles = useMemo<RareBottleDef[]>(() => {
    const rand = mulberry32(97);
    return Array.from({ length: rareCount }, (_, i) => ({
      key: i,
      cx: (rand() - 0.5) * 24,
      cy: -6.5 - rand() * 3.5,
      cz: -4 - rand() * 12,
      scale: 0.4 + rand() * 0.5,
      driftAmp: 0.4 + rand() * 0.8,
      driftFreq: 0.1 + rand() * 0.2,
      phase: rand() * 6.2831853,
      yaw: rand() * 6.2831853,
    }));
  }, [rareCount]);

  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (!g) return;
    // Render the deep only while diving.
    g.visible = progress.current > DEEP_APPEAR;
    if (frozen.current || !g.visible) return;
    const t = clock.elapsedTime;
    const rg = rareRef.current;
    if (rg) {
      for (let i = 0; i < rg.children.length; i++) {
        const b = bottles[i];
        const child = rg.children[i] as Mesh;
        child.position.set(
          b.cx + Math.sin(t * b.driftFreq + b.phase) * b.driftAmp,
          b.cy + Math.cos(t * b.driftFreq * 0.8 + b.phase) * b.driftAmp * 0.5,
          b.cz + Math.cos(t * b.driftFreq + b.phase) * b.driftAmp,
        );
        child.rotation.set(t * 0.06 + b.phase, b.yaw + t * 0.08, Math.sin(t * 0.1 + b.phase) * 0.3);
      }
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <Fish />
      <Coffins />
      <group ref={rareRef}>
        {bottles.map((b) => (
          <mesh key={b.key} geometry={bottleGeo} material={material} scale={b.scale} position={[b.cx, b.cy, b.cz]} />
        ))}
      </group>
    </group>
  );
}
