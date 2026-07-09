'use client';

import { useEffect, useRef, useState } from 'react';

/** One one-shot type step (pure): grow the shown count by one, never past total. */
export function typeAdvance(shown: number, total: number): number {
  return Math.min(shown + 1, total);
}

export interface TypeOnView {
  /** Attach to the element whose entry triggers typing. */
  ref: (el: HTMLElement | null) => void;
  /** The progressively revealed prefix of `full`. */
  text: string;
  /** True once the whole string has been typed. */
  done: boolean;
}

/**
 * Types `full` out character-by-character the FIRST time the ref'd element
 * scrolls into view, then stays static. Reuses the pure `typeAdvance` step.
 * `speed` is ms per character. SSR/no-IntersectionObserver falls back to the
 * full string immediately (never leaves content invisible).
 */
export function useTypeOnView(full: string, speed = 18): TypeOnView {
  const [shown, setShown] = useState(0);
  const [started, setStarted] = useState(false);
  const nodeRef = useRef<HTMLElement | null>(null);
  const shownRef = useRef(0);
  shownRef.current = shown;

  const ref = (el: HTMLElement | null) => {
    nodeRef.current = el;
  };

  // Gate: begin only when the element first enters the viewport.
  useEffect(() => {
    if (started) return;
    const el = nodeRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setStarted(true); // no IO (SSR/jsdom) → reveal immediately
      setShown(full.length);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [started, full.length]);

  // Drive the type-out once started.
  useEffect(() => {
    if (!started) return;
    if (shownRef.current >= full.length) return;
    // Respect reduced-motion: reveal the whole text at once instead of typing.
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setShown(full.length);
      return;
    }
    const timer = setInterval(() => {
      const next = typeAdvance(shownRef.current, full.length);
      setShown(next);
      if (next >= full.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [started, full.length, speed]);

  return { ref, text: full.slice(0, shown), done: shown >= full.length };
}
