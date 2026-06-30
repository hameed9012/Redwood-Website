'use client';

import { useEffect, useRef, useState } from 'react';

export type RevealMode = 'full' | 'phrases-only' | 'idle';

export function decideRevealMode(s: { hasPlayedOnce: boolean; scrolledToTop: boolean }): RevealMode {
  if (!s.hasPlayedOnce) return 'full';
  if (s.scrolledToTop) return 'phrases-only';
  return 'idle';
}

/** Emits 'full' once on mount, then 'phrases-only' each time the user returns to the very top. */
export function useRevealSequence(): RevealMode {
  const [mode, setMode] = useState<RevealMode>('full');
  const playedOnce = useRef(false);

  useEffect(() => {
    playedOnce.current = true;
    const onScroll = () => {
      const atTop = window.scrollY <= 2;
      if (atTop && playedOnce.current) {
        setMode(decideRevealMode({ hasPlayedOnce: true, scrolledToTop: true }));
      } else {
        setMode('idle');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return mode;
}
