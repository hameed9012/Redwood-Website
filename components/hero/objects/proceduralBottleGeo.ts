import { LatheGeometry, CylinderGeometry, BufferGeometry, Vector2 } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** A pill-bottle silhouette as lathe points (x = radius, y = height). */
function bottleProfile(): Vector2[] {
  return [
    new Vector2(0.0, 0.0),
    new Vector2(0.32, 0.0),
    new Vector2(0.32, 0.9),
    new Vector2(0.30, 1.05),
    new Vector2(0.20, 1.12),
    new Vector2(0.20, 1.30), // neck
    new Vector2(0.26, 1.34), // cap lip
    new Vector2(0.26, 1.46), // cap
    new Vector2(0.0, 1.46),
  ];
}

export function fieldBottleGeometry(): BufferGeometry {
  const g = new LatheGeometry(bottleProfile(), 16);
  g.center();
  return g;
}

export function heroBottleGeometry(): BufferGeometry {
  // Higher segment count + a distinct cap ring for a richer read up close.
  const body = new LatheGeometry(bottleProfile(), 48);
  const capRing = new CylinderGeometry(0.27, 0.27, 0.06, 48);
  capRing.translate(0, 1.4, 0);
  const merged = mergeGeometries([body, capRing], false);
  merged.center();
  return merged;
}

export function syringeGeometry(): BufferGeometry {
  const barrel = new CylinderGeometry(0.12, 0.12, 1.1, 24);
  const needle = new CylinderGeometry(0.015, 0.015, 0.5, 12);
  needle.translate(0, 0.8, 0);
  const plunger = new CylinderGeometry(0.13, 0.13, 0.08, 24);
  plunger.translate(0, -0.6, 0);
  const merged = mergeGeometries([barrel, needle, plunger], false);
  merged.center();
  return merged;
}
