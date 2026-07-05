'use client';

import { useEffect, useRef } from 'react';
import type { PeakLetter } from '../peak';

interface TrayProps {
  slots: (PeakLetter | null)[];
  highlightIndex?: number;
  onSlotRects?: (rects: DOMRect[]) => void;
}

/**
 * The four-slot drop tray (visual target only — the raycast drag owns the
 * pointer). Filled slots show a dot, not the letter: discovery matters.
 */
export function Tray({ slots, highlightIndex = -1, onSlotRects }: TrayProps) {
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let raf = 0;
    const report = () => {
      if (onSlotRects) {
        const rects = slotRefs.current.map((el) => el?.getBoundingClientRect()).filter(Boolean) as DOMRect[];
        if (rects.length === 4) onSlotRects(rects);
      }
      // Fade the tray out as the hero scrolls away — the puzzle is a surface
      // activity, so the boxes shouldn't linger, half-scrolled, into the dive.
      if (containerRef.current) {
        const vh = window.innerHeight || 1;
        const fade = Math.max(0, Math.min(1, 1 - window.scrollY / (vh * 0.35)));
        containerRef.current.style.opacity = String(fade);
      }
    };
    // Rects are viewport-relative and shift as the page scrolls (the tray lives
    // in the hero section). Re-report on scroll (rAF-throttled) + resize.
    const onScrollOrResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(report);
    };
    report();
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize);
    };
  }, [onSlotRects]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-3"
    >
      {slots.map((letter, i) => (
        <div
          key={i}
          ref={(el) => { slotRefs.current[i] = el; }}
          data-testid="tray-slot"
          data-filled={letter !== null ? 'true' : 'false'}
          data-highlight={i === highlightIndex ? 'true' : 'false'}
          className={`flex h-16 w-16 items-center justify-center rounded-md border border-dashed transition-colors duration-150 ${
            i === highlightIndex ? 'border-rw-red/80 bg-rw-red/10' : 'border-rw-bone/20'
          }`}
        >
          {letter !== null && <span className="h-3 w-3 rounded-full bg-rw-red/80" />}
        </div>
      ))}
    </div>
  );
}
