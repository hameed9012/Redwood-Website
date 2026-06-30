'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, Float32BufferAttribute, PointsMaterial, Points, type Group } from 'three';
import { fieldBottleGeometry } from './proceduralBottleGeo';
import { createGlassMaterial } from './glassMaterial';
import { driftOffset } from './useAmbientDrift';

interface OpenBottleProps {
  seed?: number;
  position?: [number, number, number];
}

const PILL_COUNT = 7;

export function OpenBottle({ seed = 1, position = [0, 0, 0] }: OpenBottleProps) {
  const bottleGeo = useMemo(() => fieldBottleGeometry(), []);
  const material = useMemo(() => createGlassMaterial({ cheap: true }), []);
  const groupRef = useRef<Group>(null); // whole unit drifts on the current
  const bottleRef = useRef<Group>(null); // the tipped bottle (pills do NOT inherit this tilt)
  const phase = useMemo(() => (seed % 100) / 100, [seed]);

  // Loose contents: base scatter points + a per-pill phase so each floats on its own.
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

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const d = driftOffset(t, phase);
    if (groupRef.current) {
      groupRef.current.position.set(position[0] + d.x, position[1] + d.y, position[2] + d.z);
    }
    // Only the bottle tips/leans — its rotation is NOT shared with the pills.
    if (bottleRef.current) {
      bottleRef.current.rotation.set(Math.PI * 0.15 + d.rotX * 0.5, d.rotY * 0.5, 0.4);
    }
    // Each pill floats loosely around the mouth on its own little current.
    const attr = pills.geometry.getAttribute('position') as Float32BufferAttribute;
    for (let i = 0; i < PILL_COUNT; i++) {
      const ph = pillPhase[i];
      attr.setXYZ(
        i,
        basePos[i * 3] + Math.sin(t * 0.6 + ph) * 0.25,
        basePos[i * 3 + 1] + Math.sin(t * 0.5 + ph * 1.3) * 0.18 + 0.1,
        basePos[i * 3 + 2] + Math.cos(t * 0.55 + ph) * 0.25,
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
