'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh } from 'three';
import gsap from 'gsap';
import { fieldBottleGeometry, syringeGeometry } from './proceduralBottleGeo';
import { createGlassMaterial } from './glassMaterial';
import { buildRiseSchedule } from '../useIntroRise';
import { driftOffset } from './useAmbientDrift';

interface FieldObjectsProps {
  count: number;
  /** Deterministic seed so SSR/CSR agree; defaults to a fixed value. */
  seed?: number;
  pushFrom?: MutableRefObject<{ x: number; z: number; strength: number; t: number }>;
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function FieldObjects({ count, seed = 1337, pushFrom }: FieldObjectsProps) {
  const bottleGeo = useMemo(() => fieldBottleGeometry(), []);
  const syringeGeo = useMemo(() => syringeGeometry(), []);
  const material = useMemo(() => createGlassMaterial({ cheap: true }), []);

  const items = useMemo(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: count }, (_, i) => ({
      key: i,
      isSyringe: rand() > 0.7,
      rest: [(rand() - 0.5) * 22, -rand() * 3, (rand() - 0.5) * 22] as [number, number, number],
      baseRot: [rand() * Math.PI, rand() * Math.PI, rand() * Math.PI] as [number, number, number],
      scale: 0.28 + rand() * 0.34,
      phase: rand(),
    }));
  }, [count, seed]);

  const groupRef = useRef<Group>(null);
  const enter = useRef<number[]>([]);

  useEffect(() => {
    enter.current = items.map(() => -10);
    const schedule = buildRiseSchedule(items.length, seed);
    const tweens = schedule.map((cfg, i) => {
      const o = { v: -10 };
      const tl = gsap.timeline({ delay: cfg.startDelay });
      if (cfg.pauseMidway) {
        tl.to(o, { v: -4, duration: cfg.duration * 0.4, ease: 'sine.out', onUpdate: () => (enter.current[i] = o.v) })
          .to(o, { v: 0, duration: cfg.duration * 0.6, ease: 'sine.inOut', delay: 0.6, onUpdate: () => (enter.current[i] = o.v) });
      } else {
        tl.to(o, { v: 0, duration: cfg.duration, ease: 'sine.inOut', onUpdate: () => (enter.current[i] = o.v) });
      }
      return tl;
    });
    return () => tweens.forEach((t) => t.kill());
  }, [items, seed]);

  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (!g) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < g.children.length; i++) {
      const child = g.children[i] as Mesh;
      const it = items[i];
      const d = driftOffset(t, it.phase);
      const e = enter.current[i] ?? 0;
      child.position.set(it.rest[0] + d.x, it.rest[1] + e + d.y, it.rest[2] + d.z);
      child.rotation.set(it.baseRot[0] + d.rotX, it.baseRot[1] + d.rotY, it.baseRot[2] + d.rotZ);
      const c = pushFrom?.current;
      if (c) {
        const age = (performance.now() - c.t) / 1000;
        if (age < 1.2) {
          const dx = child.position.x - c.x, dz = child.position.z - c.z;
          const dist = Math.hypot(dx, dz);
          if (dist < 6) {
            const push = (1 - dist / 6) * c.strength * (1 - age / 1.2) * 1.5;
            child.position.x += (dx / (dist || 1)) * push;
            child.position.z += (dz / (dist || 1)) * push;
          }
        }
      }
    }
  });

  return (
    <group ref={groupRef}>
      {items.map((it) => (
        <mesh key={it.key} geometry={it.isSyringe ? syringeGeo : bottleGeo} material={material}
          position={it.rest} rotation={it.baseRot} scale={it.scale} />
      ))}
    </group>
  );
}
