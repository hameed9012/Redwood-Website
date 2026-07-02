'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh } from 'three';
import gsap from 'gsap';
import { fieldBottleGeometry, syringeGeometry } from './proceduralBottleGeo';
import { createGlassMaterial } from './glassMaterial';
import { buildRiseSchedule } from '../useIntroRise';
import { makeFloater, stepFloater } from '../surface/waterField';
import { useFreeze } from '../puzzle/useFreeze';

interface FieldObjectsProps {
  count: number;
  /** Deterministic seed so SSR/CSR agree; defaults to a fixed value. */
  seed?: number;
}

const BOUNDS = { x: 12, z: 12 };

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function FieldObjects({ count, seed = 1337 }: FieldObjectsProps) {
  const bottleGeo = useMemo(() => fieldBottleGeometry(), []);
  const syringeGeo = useMemo(() => syringeGeometry(), []);
  const material = useMemo(() => createGlassMaterial({ cheap: true }), []);

  const items = useMemo(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: count }, (_, i) => ({
      key: i,
      isSyringe: rand() > 0.7,
      scale: 0.28 + rand() * 0.34,
      // gentle independent bob/roll on the water
      spinXAmp: 0.12 + rand() * 0.18,
      spinZAmp: 0.12 + rand() * 0.18,
      spinXFreq: 0.1 + rand() * 0.18,
      spinZFreq: 0.1 + rand() * 0.18,
      yawSpeed: (rand() - 0.5) * 0.12,
      // ~18% slowly turn over (a bottle rolling in the current)
      tumble: rand() < 0.18 ? 0.12 + rand() * 0.18 : 0,
      floater: makeFloater(rand, BOUNDS),
    }));
  }, [count, seed]);

  const groupRef = useRef<Group>(null);
  const frozen = useFreeze();

  // Staggered intro rise: each object lifts from below the surface up to it, then free-floats.
  useEffect(() => {
    const schedule = buildRiseSchedule(items.length, seed);
    const tweens = items.map((it, i) => {
      it.floater.enterY = -8;
      const cfg = schedule[i];
      return gsap.to(it.floater, { enterY: 0, duration: cfg.duration, delay: cfg.startDelay, ease: 'sine.out' });
    });
    return () => tweens.forEach((t) => t.kill());
  }, [items, seed]);

  useFrame(({ clock }, delta) => {
    if (frozen.current) return;
    const g = groupRef.current;
    if (!g) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < g.children.length; i++) {
      const child = g.children[i] as Mesh;
      const it = items[i];
      const tr = stepFloater(it.floater, t, delta, BOUNDS);
      child.position.set(tr.x, tr.y, tr.z);
      child.rotation.set(
        tr.tiltX + Math.sin(t * it.spinXFreq + it.floater.spinPhase) * it.spinXAmp + t * it.tumble,
        it.floater.spinPhase + t * it.yawSpeed,
        tr.tiltZ + Math.cos(t * it.spinZFreq + it.floater.spinPhase) * it.spinZAmp,
      );
    }
  });

  return (
    <group ref={groupRef}>
      {items.map((it) => (
        <mesh key={it.key} geometry={it.isSyringe ? syringeGeo : bottleGeo} material={material} scale={it.scale} />
      ))}
    </group>
  );
}
