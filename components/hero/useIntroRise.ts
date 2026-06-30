'use client';

export interface RiseConfig {
  startDelay: number;       // seconds after the empty-tank beat
  duration: number;         // seconds to rise
  rotateWhileRising: boolean;
  pauseMidway: boolean;
  behindLogo: boolean;
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

const EMPTY_BEAT = 0.8; // seconds the tank holds empty (spec §7.1)

export function buildRiseSchedule(count: number, seed: number): RiseConfig[] {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, () => {
    const isLong = rand() > 0.8; // minority are long far-back rises
    return {
      startDelay: EMPTY_BEAT + rand() * 6,
      duration: isLong ? 26 + rand() * 6 : 3 + rand() * 4,
      rotateWhileRising: rand() > 0.5,
      pauseMidway: rand() > 0.6,
      behindLogo: rand() > 0.7,
    };
  });
}
