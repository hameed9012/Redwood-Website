'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, Float32BufferAttribute, PointsMaterial, Points, type Group } from 'three';
import { fieldBottleGeometry } from './proceduralBottleGeo';
import { createGlassMaterial } from './glassMaterial';
import { makeFloater, stepFloater, type Floater } from '../surface/waterField';

interface OpenBottleProps {
  seed?: number;
  position?: [number, number, number];
}

const PILL_COUNT = 6;
const OPEN_BOUNDS = { x: 11, z: 11 };

export function OpenBottle({ seed = 1, position = [0, 0, 0] }: OpenBottleProps) {
  const bottleGeo = useMemo(() => fieldBottleGeometry(), []);
  const material = useMemo(() => createGlassMaterial({ cheap: true }), []);
  const groupRef = useRef<Group>(null);
  const bottleRef = useRef<Group>(null);

  const floater = useMemo<Floater>(
    () => ({
      x: position[0],
      z: position[2],
      vx: ((seed * 0.137) % 1 - 0.5) * 0.3,
      vz: ((seed * 0.271) % 1 - 0.5) * 0.3,
      depth: 0,
      enterY: 0,
      spinPhase: ((seed % 100) / 100) * 6.2831853,
      lastCut: 0,
    }),
    [seed], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Loose contents are their OWN floaters in world space — they start at the
  // bottle, then drift off freely with the current and respond to the cursor,
  // separate entities rather than tethered to the bottle's frame.
  const pillFloaters = useMemo<Floater[]>(() => {
    const rand = () => Math.random();
    return Array.from({ length: PILL_COUNT }, () => {
      const f = makeFloater(rand, OPEN_BOUNDS);
      f.x = position[0] + (rand() - 0.5) * 1.6;
      f.z = position[2] + (rand() - 0.5) * 1.6;
      f.depth = 0;
      f.enterY = 0;
      f.vx *= 0.6;
      f.vz *= 0.6;
      return f;
    });
  }, [seed]); // eslint-disable-line react-hooks/exhaustive-deps

  const pills = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(new Float32Array(PILL_COUNT * 3), 3));
    const m = new PointsMaterial({ size: 0.09, color: '#e7dcc6', transparent: true, opacity: 0.85 });
    return new Points(g, m);
  }, []);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;

    const tr = stepFloater(floater, t, delta, OPEN_BOUNDS);
    if (groupRef.current) groupRef.current.position.set(tr.x, tr.y, tr.z);
    if (bottleRef.current) {
      bottleRef.current.rotation.set(Math.PI * 0.15 + tr.tiltX, floater.spinPhase + t * 0.1, 0.4 + tr.tiltZ);
    }

    const attr = pills.geometry.getAttribute('position') as Float32BufferAttribute;
    for (let i = 0; i < PILL_COUNT; i++) {
      const ptr = stepFloater(pillFloaters[i], t, delta, OPEN_BOUNDS);
      attr.setXYZ(i, ptr.x, ptr.y + 0.05, ptr.z);
    }
    attr.needsUpdate = true;
  });

  return (
    <>
      {/* The bottle drifts on the current. */}
      <group ref={groupRef} position={position} scale={0.32}>
        <group ref={bottleRef}>
          <mesh geometry={bottleGeo} material={material} />
        </group>
      </group>
      {/* Pills live in world space — separate floating entities. */}
      <primitive object={pills} />
    </>
  );
}
