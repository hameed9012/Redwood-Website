'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { useFreeze } from '../hero/puzzle/useFreeze';

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface FishDef {
  key: number;
  scale: number;
  cx: number;
  cy: number;
  cz: number;
  rangeX: number;
  speed: number;
  phase: number;
  vertAmp: number;
  vertFreq: number;
  dir: 1 | -1;
  lastX: number;
  lastZ: number;
}

/**
 * A loose school of procedural fish drifting through the deep (spec §3). Dark
 * silhouettes — a flattened ellipsoid body + a swept-back tail fin — wandering
 * horizontally with a gentle vertical meander. They avoid nothing; they drift.
 * Each fish yaws to face its own travel direction (finite-difference velocity).
 */
export function Fish({ count = 8, seed = 4242 }: { count?: number; seed?: number }) {
  const frozen = useFreeze();
  const groupRef = useRef<Group>(null);

  const fish = useMemo<FishDef[]>(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: count }, (_, i) => {
      const cx = (rand() - 0.5) * 22;
      const cz = -2 - rand() * 14;
      return {
        key: i,
        scale: 0.5 + rand() * 0.7,
        cx,
        cy: -6 - rand() * 4, // mid-depth to just above the bed
        cz,
        rangeX: 6 + rand() * 8,
        speed: 0.15 + rand() * 0.25,
        phase: rand() * 6.2831853,
        vertAmp: 0.4 + rand() * 0.9,
        vertFreq: 0.2 + rand() * 0.3,
        dir: rand() > 0.5 ? 1 : -1,
        lastX: cx,
        lastZ: cz,
      };
    });
  }, [count, seed]);

  useFrame(({ clock }) => {
    if (frozen.current) return;
    const g = groupRef.current;
    if (!g) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < g.children.length; i++) {
      const f = fish[i];
      const child = g.children[i] as Group;
      const x = f.cx + Math.sin(t * f.speed + f.phase) * f.rangeX * f.dir;
      const y = f.cy + Math.sin(t * f.vertFreq + f.phase) * f.vertAmp;
      const z = f.cz + Math.cos(t * f.speed * 0.7 + f.phase) * 3;
      child.position.set(x, y, z);
      // Face travel direction. Body is modelled nose-along +X, so for a heading
      // (vx,vz) the yaw about Y is atan2(-vz, vx). Finite-difference velocity.
      const vx = x - f.lastX;
      const vz = z - f.lastZ;
      if (vx * vx + vz * vz > 1e-9) child.rotation.y = Math.atan2(-vz, vx);
      // Subtle tail-swish read as a roll wobble (cheap; no skinning).
      child.rotation.z = Math.sin(t * 3 + f.phase) * 0.08;
      f.lastX = x;
      f.lastZ = z;
    }
  });

  return (
    <group ref={groupRef}>
      {fish.map((f) => (
        <group key={f.key} scale={f.scale}>
          {/* body: flattened ellipsoid — mid teal-grey so it reads against the
              deep water (a near-black silhouette vanished into the fog). */}
          <mesh scale={[1, 0.5, 0.32]}>
            <sphereGeometry args={[0.5, 12, 10]} />
            <meshStandardMaterial color="#3a6169" roughness={0.85} metalness={0} />
          </mesh>
          {/* tail fin: swept back along -X, flattened vertically */}
          <mesh position={[-0.55, 0, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.4]}>
            <coneGeometry args={[0.22, 0.4, 8]} />
            <meshStandardMaterial color="#31555c" roughness={0.85} metalness={0} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
