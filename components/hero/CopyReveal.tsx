'use client';

import { useEffect, useState } from 'react';
import { HERO_PHRASES, nextPhraseIndex } from './phrases';
import { useRevealSequence } from './useRevealSequence';

const PHRASE_HOLD_MS = 3000;

export function CopyReveal() {
  const [index, setIndex] = useState(0);
  const mode = useRevealSequence();
  const showIntro = mode === 'full';

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => nextPhraseIndex(i, HERO_PHRASES.length)),
      PHRASE_HOLD_MS,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="select-none">
      {showIntro && (
        <>
          <p className="text-rw-bone text-lg">Hello,</p>
          <h1 className="text-rw-bone text-5xl md:text-7xl font-extrabold tracking-tight leading-none">
            We are The Redwood Co.
          </h1>
        </>
      )}
      <p className="text-rw-bone text-lg mt-3">
        We are a{' '}
        <span className="relative inline-block align-baseline">
          {HERO_PHRASES.map((phrase, i) => (
            <span
              key={phrase}
              className="text-rw-red font-semibold transition-all duration-700"
              style={{
                position: i === index ? 'relative' : 'absolute',
                left: 0,
                opacity: i === index ? 1 : 0,
                transform: i === index ? 'translateY(0)' : 'translateY(8px)',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
              }}
              aria-hidden={i !== index}
            >
              {phrase}
            </span>
          ))}
        </span>
      </p>
    </div>
  );
}
