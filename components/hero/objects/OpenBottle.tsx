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
const PILL_RADIUS = 2.4; // how far loose pills wander from the mouth before turning back
const OPEN_BOUNDS = { x: 11, z: 11 };

interface Pill {
  x: number; z: number; y: number;
  vx: number; vz: number; phase: number;
}

export function OpenBottle({ seed = 1, position = [0, 0, 0], pushFrom }: OpenBottleProps) {
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

  // Loose contents — each pill has its own little current and wanders freely
  // (bouncing back when it strays too far), so they disperse, not orbit.
  const { pills, state } = useMemo(() => {
    const state: Pill[] = Array.from({ length: PILL_COUNT }, () => ({
      x: (Math.random() - 0.5) * 1.2,
      z: (Math.random() - 0.5) * 1.2,
      y: Math.random() * 0.6,
      vx: (Math.random() - 0.5) * 0.6,
      vz: (Math.random() - 0.5) * 0.6,
      phase: Math.random() * 6.2831853,
    }));
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(new Float32Array(PILL_COUNT * 3), 3));
    const m = new PointsMaterial({ size: 0.09, color: '#e7dcc6', transparent: true, opacity: 0.85 });
    return { pills: new Points(g, m), state };
  }, []);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    const raw = pushFrom?.current;
    const cut: Cut | null = raw && raw.t > 0 ? raw : null;
    const tr = stepFloater(floater, t, delta, cut, OPEN_BOUNDS);
    if (groupRef.current) groupRef.current.position.set(tr.x, tr.y, tr.z);
    if (bottleRef.current) {
      bottleRef.current.rotation.set(Math.PI * 0.15 + tr.tiltX, floater.spinPhase + t * 0.1, 0.4 + tr.tiltZ);
    }

    const attr = pills.geometry.getAttribute('position') as Float32BufferAttribute;
    for (let i = 0; i < PILL_COUNT; i++) {
      const p = state[i];
      p.x += p.vx * delta;
      p.z += p.vz * delta;
      const d = Math.hypot(p.x, p.z);
      if (d > PILL_RADIUS) {
        // steer gently back toward the spill so they don't drift away forever
        p.vx -= (p.x / d) * 0.4 * delta * 3;
        p.vz -= (p.z / d) * 0.4 * delta * 3;
      }
      p.y = 0.1 + Math.sin(t * 0.8 + p.phase) * 0.25;
      attr.setXYZ(i, p.x, p.y, p.z);
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
