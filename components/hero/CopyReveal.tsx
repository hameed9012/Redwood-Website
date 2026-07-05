'use client';

import { HERO_PHRASES } from './phrases';
import { useTypewriter } from './useTypewriter';

export function CopyReveal() {
  // The headline is always rendered — it lives inside the hero <section> and
  // scrolls away naturally as you descend, then scrolls back when you return to
  // the top. (It used to be hidden on any scroll > 2px via the reveal sequence,
  // which made it flicker out on the smallest scroll and pop back at the top.)
  const typed = useTypewriter(HERO_PHRASES, true);

  return (
    <div className="select-none">
      <p className="text-rw-bone text-lg">Hello,</p>
      <h1 className="text-rw-bone text-5xl md:text-7xl font-extrabold tracking-tight leading-none">
        We are The Redwood Co.
      </h1>
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
