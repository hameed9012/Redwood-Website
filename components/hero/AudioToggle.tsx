'use client';

import { useEffect, useMemo, useState } from 'react';
import { AmbientScheduler, registerActiveScheduler } from '@/lib/audio/AmbientScheduler';

const CLIPS = ['/audio/drip.ogg', '/audio/creak.ogg', '/audio/bubble.ogg', '/audio/water.ogg'];

export function AudioToggle() {
  const [on, setOn] = useState(false);
  const scheduler = useMemo(
    () =>
      new AmbientScheduler({
        clips: CLIPS,
        minDelayMs: 4000,
        maxDelayMs: 14000,
        minVolume: 0.05,
        maxVolume: 0.35,
      }),
    [],
  );

  useEffect(() => {
    registerActiveScheduler(scheduler);
    return () => {
      registerActiveScheduler(null);
      scheduler.disable();
    };
  }, [scheduler]);

  const toggle = () => {
    setOn((prev) => {
      const next = !prev;
      if (next) scheduler.enable();
      else scheduler.disable();
      return next;
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? 'Sound on' : 'Sound off'}
      className="absolute top-4 right-4 w-9 h-9 rounded-full border border-rw-bone/30 text-rw-bone/70 flex items-center justify-center hover:text-rw-bone transition-colors"
    >
      {on ? '🔊' : '🔈'}
    </button>
  );
}
