'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface SectionProps {
  id?: string;
  children: ReactNode;
  /** Extra classes for the inner panel. */
  className?: string;
  /** 'left' offsets a narrower panel to the left, leaving the water/scene on the
   *  right visible (used by Media to showcase the shore + tanker). */
  align?: 'center' | 'left';
}

/**
 * Shared shell for the public sections (spec §4). A dark-glass panel floating
 * over the fixed dive canvas, revealed with a "surfacing from below" motion —
 * it rises + un-blurs the first time it scrolls into view (not a generic fade).
 * Reveal is once and irreversible so scrolling back up doesn't re-hide content.
 */
export function Section({ id, children, className = '', align = 'center' }: SectionProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (revealed) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setRevealed(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setRevealed(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [revealed]);

  return (
    <section
      id={id}
      className={`relative flex min-h-[100svh] items-center px-6 py-24 md:px-12 ${
        align === 'left' ? 'justify-start' : 'justify-center'
      }`}
    >
      <div
        ref={ref}
        className={`w-full rounded-2xl border border-rw-bone/10 bg-rw-black/55 p-8 backdrop-blur-md transition-all duration-[900ms] ease-out md:p-12 ${
          align === 'left' ? 'max-w-2xl' : 'max-w-4xl'
        } ${revealed ? 'translate-y-0 opacity-100 blur-0' : 'translate-y-16 opacity-0 blur-md'} ${className}`}
      >
        {children}
      </div>
    </section>
  );
}
