'use client';

import { useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, Float32BufferAttribute, PointsMaterial, Points, type Group } from 'three';
import { fieldBottleGeometry } from './proceduralBottleGeo';
import { createGlassMaterial } from './glassMaterial';
import { stepFloater, type Floater, type Cut } from '../surface/waterField';

interface OpenBottleProps {
  seed?: number;
  position?: [number, number, number];
  pushFrom?: MutableRefObject<{ x: number; z: number; strength: number; t: number }>;
}

const PILL_COUNT = 7;
const OPEN_BOUNDS = { x: 11, z: 11 };

export function OpenBottle({ seed = 1, position = [0, 0, 0], pushFrom }: OpenBottleProps) {
  const bottleGeo = useMemo(() => fieldBottleGeometry(), []);
  const material = useMemo(() => createGlassMaterial({ cheap: true }), []);
  const groupRef = useRef<Group>(null); // whole unit floats on the current
  const bottleRef = useRef<Group>(null); // the tipped bottle (pills do NOT inherit this tilt)

  const floater = useMemo<Floater>(
    () => ({
      x: position[0],
      z: position[2],
      vx: ((seed * 0.137) % 1 - 0.5) * 0.4,
      vz: ((seed * 0.271) % 1 - 0.5) * 0.4,
      enterY: 0,
      spinPhase: ((seed % 100) / 100) * 6.2831853,
      lastCut: 0,
    }),
    [seed], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Loose contents: base scatter + a per-pill phase so each floats on its own.
  const { pills, basePos, pillPhase } = useMemo(() => {
    const basePos = new Float32Array(PILL_COUNT * 3);
    const pillPhase = new Float32Array(PILL_COUNT);
    for (let i = 0; i < PILL_COUNT; i++) {
      basePos[i * 3] = (Math.random() - 0.5) * 1.4;
      basePos[i * 3 + 1] = Math.random() * 0.5;
      basePos[i * 3 + 2] = (Math.random() - 0.5) * 1.4;
      pillPhase[i] = Math.random() * 6.2831853;
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(basePos.slice(), 3));
    const m = new PointsMaterial({ size: 0.09, color: '#e7dcc6', transparent: true, opacity: 0.85 });
    return { pills: new Points(g, m), basePos, pillPhase };
  }, []);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    const raw = pushFrom?.current;
    const cut: Cut | null = raw && raw.t > 0 ? raw : null;
    const tr = stepFloater(floater, t, delta, cut, OPEN_BOUNDS);
    if (groupRef.current) groupRef.current.position.set(tr.x, tr.y, tr.z);
    // Only the bottle tips/leans (riding the wave slope); its tilt is NOT shared with the pills.
    if (bottleRef.current) {
      bottleRef.current.rotation.set(Math.PI * 0.15 + tr.tiltX, floater.spinPhase + t * 0.1, 0.4 + tr.tiltZ);
    }
    // Each pill floats loosely around the mouth on its own little current.
    const attr = pills.geometry.getAttribute('position') as Float32BufferAttribute;
    for (let i = 0; i < PILL_COUNT; i++) {
      const ph = pillPhase[i];
      attr.setXYZ(
        i,
        basePos[i * 3] + Math.sin(t * 0.6 + ph) * 0.3,
        basePos[i * 3 + 1] + Math.sin(t * 0.5 + ph * 1.3) * 0.2 + 0.1,
        basePos[i * 3 + 2] + Math.cos(t * 0.55 + ph) * 0.3,
      );
    }
    attr.needsUpdate = true;
  });

  return (
    <group ref={groupRef} position={position} scale={0.32}>
      <group ref={bottleRef}>
        <mesh geometry={bottleGeo} material={material} />
      </group>
      <primitive object={pills} />
    </group>
  );
}
