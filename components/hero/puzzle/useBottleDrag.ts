'use client';

import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { Raycaster, Vector2, Plane, Vector3, type Object3D } from 'three';
import { usePuzzleMaybe } from './PuzzleProvider';
import { screenSlotIndex } from './trayGeometry';
import type { PeakLetter } from '../peak';

const GROUND_PLANE = new Plane(new Vector3(0, 1, 0), 0);
const GRAB_HEIGHT = 1.1;
/** Forgiving slot hitboxes — the dragged bottle visually trails the cursor. */
const SLOT_HIT_MARGIN_PX = 32;

/** Walk up from a raycast hit to find which registered top-level object it belongs to. */
function resolveLetter(hit: Object3D, entries: { letter: PeakLetter; object: Object3D }[]): PeakLetter | null {
  for (const entry of entries) {
    let node: Object3D | null = hit;
    while (node) {
      if (node === entry.object) return entry.letter;
      node = node.parent;
    }
  }
  return null;
}

/**
 * Pointer-driven raycast bottle drag. No-op when rendered without a
 * PuzzleProvider (usePuzzleMaybe() === null) — safe to call unconditionally
 * from TankScene.
 */
export function useBottleDrag(): void {
  const puzzle = usePuzzleMaybe();
  const { gl, camera } = useThree();

  const lastHighlightRef = useRef(-1);
  const raycasterRef = useRef(new Raycaster());

  useEffect(() => {
    if (!puzzle) return;
    const el = gl.domElement;

    const ndcFromEvent = (e: PointerEvent): Vector2 => {
      const rect = el.getBoundingClientRect();
      return new Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
    };

    const worldXZFromEvent = (e: PointerEvent): Vector3 | null => {
      const ndc = ndcFromEvent(e);
      raycasterRef.current.setFromCamera(ndc, camera);
      const hit = new Vector3();
      const hasHit = raycasterRef.current.ray.intersectPlane(GROUND_PLANE, hit);
      return hasHit ? hit : null;
    };

    /** Screen (client px) position of the grabbed bottle — the fallback drop test. */
    const bottleClientXY = (letter: PeakLetter): { x: number; y: number } | null => {
      const entry = puzzle.registry.get(letter);
      if (!entry) return null;
      const v = new Vector3();
      entry.object.getWorldPosition(v);
      v.project(camera);
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left + ((v.x + 1) / 2) * rect.width,
        y: rect.top + ((1 - v.y) / 2) * rect.height,
      };
    };

    const onPointerDown = (e: PointerEvent) => {
      if (puzzle.phase !== 'idle') return;
      if (puzzle.drag.current.grabbed) return;

      const ndc = ndcFromEvent(e);
      raycasterRef.current.setFromCamera(ndc, camera);
      const entries = puzzle.registry.all();
      const objects = entries.map((entry) => entry.object);
      const intersections = raycasterRef.current.intersectObjects(objects, true);
      if (intersections.length === 0) return;

      const letter = resolveLetter(intersections[0].object, entries);
      if (!letter) return;
      if (puzzle.slots.includes(letter)) return; // already slotted

      puzzle.drag.current.grabbed = letter;
      puzzle.suspendedRef.current[letter] = 'grabbed';
      puzzle.setHoveredLetter(letter); // keep the name chip up while carrying
      el.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      const grabbed = puzzle.drag.current.grabbed;
      if (!grabbed) return;

      const hit = worldXZFromEvent(e);
      if (hit) {
        puzzle.drag.current.target = { x: hit.x, y: GRAB_HEIGHT, z: hit.z };
      }

      const idx = screenSlotIndex(e.clientX, e.clientY, puzzle.slotRectsRef.current, SLOT_HIT_MARGIN_PX);
      if (idx !== lastHighlightRef.current) {
        lastHighlightRef.current = idx;
        puzzle.setHighlightIndex(idx);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const grabbed = puzzle.drag.current.grabbed;
      if (!grabbed) return;

      // Drop test: the cursor first, then the bottle's own screen position —
      // users aim with the bottle, which visually trails the cursor.
      const rects = puzzle.slotRectsRef.current;
      let idx = screenSlotIndex(e.clientX, e.clientY, rects, SLOT_HIT_MARGIN_PX);
      if (idx < 0 || puzzle.slots[idx] !== null) {
        const b = bottleClientXY(grabbed);
        if (b) {
          const byBottle = screenSlotIndex(b.x, b.y, rects, SLOT_HIT_MARGIN_PX);
          if (byBottle >= 0 && puzzle.slots[byBottle] === null) idx = byBottle;
        }
      }

      if (idx >= 0 && puzzle.slots[idx] === null) {
        puzzle.placeInSlot(grabbed, idx);
      } else {
        puzzle.release(grabbed);
      }

      puzzle.drag.current.grabbed = null;
      lastHighlightRef.current = -1;
      puzzle.setHighlightIndex(-1);
      puzzle.setHoveredLetter(null);
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
    };
    // puzzle is a stable object identity from context (bridged), gl/camera stable from useThree.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle, gl, camera]);
}
