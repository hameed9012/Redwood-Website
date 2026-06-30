'use client';

import { HERO_PHRASES } from './phrases';
import { useRevealSequence } from './useRevealSequence';
import { useTypewriter } from './useTypewriter';

export function CopyReveal() {
  const mode = useRevealSequence();
  const showIntro = mode === 'full';
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
