'use client';

import { useEffect, useRef, useState } from 'react';

export type TypeMode = 'typing' | 'deleting';
export interface TypeState {
  phrase: number;
  text: string;
  mode: TypeMode;
}

/** One discrete typewriter step (pure). Types to full, then deletes, then advances. */
export function nextTypeState(s: TypeState, phrases: readonly string[]): TypeState {
  const full = phrases[s.phrase];
  if (s.mode === 'typing') {
    if (s.text.length < full.length) return { ...s, text: full.slice(0, s.text.length + 1) };
    return { ...s, mode: 'deleting' };
  }
  if (s.text.length > 0) return { ...s, text: s.text.slice(0, -1) };
  return { phrase: (s.phrase + 1) % phrases.length, text: '', mode: 'typing' };
}

/** Drives nextTypeState on an interval. Type/delete/hold speeds tunable. */
export function useTypewriter(phrases: readonly string[], active: boolean): TypeState {
  const [state, setState] = useState<TypeState>({ phrase: 0, text: '', mode: 'typing' });
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!active) return;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const cur = stateRef.current;
      const next = nextTypeState(cur, phrases);
      setState(next);
      const justCompleted = cur.mode === 'typing' && next.mode === 'deleting';
      const delay = justCompleted ? 1400 : next.mode === 'deleting' ? 45 : 85;
      timer = setTimeout(tick, delay);
    };
    timer = setTimeout(tick, 85);
    return () => clearTimeout(timer);
  }, [phrases, active]);

  return state;
}
