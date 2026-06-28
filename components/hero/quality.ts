'use client';

export type Tier = 'low' | 'mid' | 'high';

export interface DeviceSignals {
  cores: number;
  memoryGb: number;
  coarsePointer: boolean;
}

export interface QualityProfile {
  maxDpr: number;
  bottleCount: number;
  bubbleCount: number;
  postprocessing: boolean;
  caustics: boolean;
  hdriPath: string;
  heroBottlesPresent: boolean;
}

export function detectTier(s: DeviceSignals): Tier {
  let score = 0;
  if (s.cores >= 8) score += 2;
  else if (s.cores >= 4) score += 1;
  if (s.memoryGb >= 8) score += 2;
  else if (s.memoryGb >= 4) score += 1;
  if (!s.coarsePointer) score += 1;

  if (score <= 2) return 'low';
  if (score <= 4) return 'mid';
  return 'high';
}

export function qualityFor(tier: Tier): QualityProfile {
  const base = { heroBottlesPresent: true };
  switch (tier) {
    case 'low':
      return { ...base, maxDpr: 1, bottleCount: 10, bubbleCount: 20, postprocessing: false, caustics: false, hdriPath: '/hdri/dark-studio-low.hdr' };
    case 'mid':
      return { ...base, maxDpr: 1.5, bottleCount: 22, bubbleCount: 50, postprocessing: true, caustics: true, hdriPath: '/hdri/dark-studio-low.hdr' };
    case 'high':
      return { ...base, maxDpr: 2, bottleCount: 38, bubbleCount: 90, postprocessing: true, caustics: true, hdriPath: '/hdri/dark-studio.hdr' };
  }
}

/** Reads real browser signals; falls back to "mid" during SSR. */
export function detectTierFromBrowser(): Tier {
  if (typeof navigator === 'undefined') return 'mid';
  const cores = navigator.hardwareConcurrency ?? 4;
  // deviceMemory is non-standard; default to a middling 4GB when absent.
  const memoryGb = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const coarsePointer = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
  return detectTier({ cores, memoryGb, coarsePointer });
}
