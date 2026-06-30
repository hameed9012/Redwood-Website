'use client';

import { CopyReveal } from './CopyReveal';
import { CtaButtons } from './CtaButtons';
import { AudioToggle } from './AudioToggle';

export function HeroOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Left-anchored copy (spec §1 composition). */}
      <div className="pointer-events-auto absolute left-8 md:left-16 top-1/2 -translate-y-1/2 max-w-xl">
        <CopyReveal />
        <CtaButtons />
      </div>

      {/* Audio toggle, top-right. */}
      <div className="pointer-events-auto">
        <AudioToggle />
      </div>

      {/* Phase 1: discrete drop-tray visual slot only (spec §11). */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 w-44 h-9 rounded-md border border-dashed border-rw-bone/20 flex items-center justify-center text-[9px] tracking-[0.2em] text-rw-bone/30"
      >
        DROP TRAY
      </div>
    </div>
  );
}
