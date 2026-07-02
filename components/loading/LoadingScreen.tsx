'use client';

import { useEffect, useMemo, useState } from 'react';
import { buildFactSequence } from './funFacts';
import { randomLoadingMs } from './loadingDuration';

const FACT_INTERVAL_MS = 1400;

interface LoadingScreenProps {
  onComplete: () => void;
  /** Injectable for tests; defaults to Math.random. */
  rng?: () => number;
}

/**
 * Full-screen loading state after the drain (spec §7): the Redwood mark
 * spinning over rotating chemistry/physics facts, for a randomized 2.5–4.5s,
 * then onComplete (the caller routes to /login).
 */
export function LoadingScreen({ onComplete, rng = Math.random }: LoadingScreenProps) {
  const durationMs = useMemo(() => randomLoadingMs(rng), [rng]);
  const facts = useMemo(() => buildFactSequence(12, rng), [rng]);
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    const rotate = setInterval(() => setFactIndex((i) => (i + 1) % facts.length), FACT_INTERVAL_MS);
    const done = setTimeout(onComplete, durationMs);
    return () => {
      clearInterval(rotate);
      clearTimeout(done);
    };
  }, [facts.length, durationMs, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-rw-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/redwood-peak-logo.png"
        alt="Redwood Peak"
        className="h-24 w-24 animate-spin rounded-full"
        style={{ animationDuration: '2.4s' }}
      />
      <p data-testid="loading-fact" className="max-w-md px-6 text-center text-sm text-rw-bone/70">
        {facts[factIndex]}
      </p>
    </div>
  );
}
