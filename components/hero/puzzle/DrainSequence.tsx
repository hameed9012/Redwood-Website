'use client';

import { useEffect, useRef, type MutableRefObject } from 'react';
import { useThree } from '@react-three/fiber';
import type { Group, Mesh, MeshBasicMaterial } from 'three';
import gsap from 'gsap';
import { usePuzzleMaybe } from './PuzzleProvider';
import { useFreeze } from './useFreeze';
import { stopActiveAudio } from '@/lib/audio/AmbientScheduler';

interface DrainSequenceProps {
  /** The group wrapping the tank's moving contents (water, objects, logo, tanker). */
  sceneShift: MutableRefObject<Group | null>;
  /** Fires once the drain finishes; the loading sequence takes over from here. */
  onDrained?: () => void;
}

const SILENCE_HOLD_S = 0.7;
const LOGO_SWALLOW_S = 0.8;
const DRAIN_S = 2.2;

/**
 * The "found something you weren't meant to" exit (spec §6). Watches for the
 * puzzle phase turning 'solved', then: freeze everything → cut audio → hold in
 * silence → swallow the logo into darkness → drain the water downward with the
 * camera falling alongside → signal onDrained. Renders nothing.
 */
export function DrainSequence({ sceneShift, onDrained }: DrainSequenceProps) {
  const puzzle = usePuzzleMaybe();
  const frozen = useFreeze();
  const { camera, scene } = useThree();
  const started = useRef(false);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const onDrainedRef = useRef(onDrained);
  onDrainedRef.current = onDrained;

  const phase = puzzle?.phase;

  useEffect(() => {
    if (phase !== 'solved' || started.current) return;
    started.current = true;

    // 1. Everything stops dead.
    frozen.current = true;
    // 2. Cut any ambient audio immediately.
    stopActiveAudio();

    // The logo's material (fade to black = fade out the faint red mark).
    const logo = scene.getObjectByName('background-logo');
    let logoMat: MeshBasicMaterial | null = null;
    logo?.traverse((o) => {
      const mesh = o as Mesh;
      if (mesh.isMesh && !logoMat) logoMat = mesh.material as MeshBasicMaterial;
    });

    const timeline = gsap.timeline({
      onComplete: () => onDrainedRef.current?.(),
    });

    // 3. Hold ~0.7s of stillness/silence.
    timeline.to({}, { duration: SILENCE_HOLD_S });

    // 4. The mountain is swallowed by darkness.
    if (logoMat) {
      timeline.to(logoMat, { opacity: 0, duration: LOGO_SWALLOW_S, ease: 'sine.in' });
    }

    // 5. The tank empties out from underneath: contents sink, camera falls with them.
    if (sceneShift.current) {
      timeline.to(sceneShift.current.position, { y: -6, duration: DRAIN_S, ease: 'power2.in' }, '>');
    }
    timeline.to(camera.position, { y: camera.position.y - 10, duration: DRAIN_S, ease: 'power2.in' }, '<');

    tl.current = timeline;
  }, [phase, frozen, camera, scene, sceneShift]);

  useEffect(
    () => () => {
      tl.current?.kill();
    },
    [],
  );

  return null;
}
