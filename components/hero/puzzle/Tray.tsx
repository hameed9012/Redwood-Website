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

  useEffect(() => {
    const report = () => {
      if (!onSlotRects) return;
      const rects = slotRefs.current.map((el) => el?.getBoundingClientRect()).filter(Boolean) as DOMRect[];
      if (rects.length === 4) onSlotRects(rects);
    };
    report();
    window.addEventListener('resize', report);
    return () => window.removeEventListener('resize', report);
  }, [onSlotRects]);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2"
    >
      {slots.map((letter, i) => (
        <div
          key={i}
          ref={(el) => { slotRefs.current[i] = el; }}
          data-testid="tray-slot"
          data-filled={letter !== null ? 'true' : 'false'}
          data-highlight={i === highlightIndex ? 'true' : 'false'}
          className={`flex h-12 w-12 items-center justify-center rounded-md border border-dashed transition-colors duration-150 ${
            i === highlightIndex ? 'border-rw-red/80 bg-rw-red/10' : 'border-rw-bone/20'
          }`}
        >
          {letter !== null && <span className="h-2.5 w-2.5 rounded-full bg-rw-red/80" />}
        </div>
      ))}
    </div>
  );
}
