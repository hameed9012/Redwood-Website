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

export function OpenBottle({ seed = 1, position = [0, 0, 0] }: OpenBottleProps) {
  const bottleGeo = useMemo(() => fieldBottleGeometry(), []);
  const material = useMemo(() => createGlassMaterial({ cheap: true }), []);
  const ref = useRef<Group>(null);
  const phase = useMemo(() => (seed % 100) / 100, [seed]);

  const pills = useMemo(() => {
    const n = 7;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 1.2;
      pos[i * 3 + 1] = Math.random() * 0.8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(pos, 3));
    const m = new PointsMaterial({ size: 0.09, color: '#e7dcc6', transparent: true, opacity: 0.8 });
    return new Points(g, m);
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const d = driftOffset(clock.elapsedTime, phase);
    ref.current.position.set(position[0] + d.x, position[1] + d.y, position[2] + d.z);
    ref.current.rotation.set(Math.PI * 0.15 + d.rotX, d.rotY, 0.4 + d.rotZ); // tipped, "open"
  });

  return (
    <group ref={ref} position={position} scale={0.32}>
      <mesh geometry={bottleGeo} material={material} />
      <primitive object={pills} />
    </group>
  );
}
