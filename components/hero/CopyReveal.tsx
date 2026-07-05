'use client';

import { HERO_PHRASES } from './phrases';
import { useRevealSequence } from './useRevealSequence';
import { useTypewriter } from './useTypewriter';

export function CopyReveal() {
  const mode = useRevealSequence();
  // Show the headline whenever the hero is in view (top of page) — both on the
  // first 'full' reveal and every time the user scrolls back to the top
  // ('phrases-only'). Only hide it while scrolled away ('idle'), where the whole
  // overlay is off-screen anyway. Previously it only showed in 'full', so
  // returning to the top after a scroll left the headline gone.
  const showIntro = mode !== 'idle';
  const typed = useTypewriter(HERO_PHRASES, true);

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
        We are{' '}
        <span className="text-rw-red font-semibold whitespace-nowrap">
          {typed.text}
          <span className="inline-block w-[1px] -mb-[2px] ml-[1px] animate-pulse">▮</span>
        </span>
      </p>
    </div>
  );
}
