import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '..');

/**
 * Assets required for Phase 1 runtime. The background logo layer uses the SVG
 * mark (not the PNG), and glass reflections need the HDRI — these must exist.
 */
const requiredNow = [
  'public/brand/redwood-peak-mark.svg',
  'public/hdri/dark-studio.hdr',
  'public/hdri/dark-studio-low.hdr',
];

/**
 * Pending swap-ins (spec §4/§15): the full logo PNG (loading spinner/favicon,
 * Phase 2) is user-provided, and the CC0 ambient clips are sourced/swapped in
 * later. Phase 1 degrades gracefully without them (AmbientScheduler swallows
 * missing-clip errors; the tank never references the PNG at runtime). Tracked
 * here so the gap is visible; flip to `requiredNow` once the files land.
 */
const pending = [
  'public/brand/redwood-peak-logo.png',
  'public/audio/drip.ogg',
  'public/audio/creak.ogg',
  'public/audio/bubble.ogg',
  'public/audio/water.ogg',
];

describe('brand + scene assets (required for Phase 1 runtime)', () => {
  for (const rel of requiredNow) {
    it(`exists: ${rel}`, () => {
      expect(existsSync(path.join(root, rel))).toBe(true);
    });
  }
});

describe.skip('pending swap-in assets (logo PNG + ambient audio)', () => {
  for (const rel of pending) {
    it(`exists: ${rel}`, () => {
      expect(existsSync(path.join(root, rel))).toBe(true);
    });
  }
});
