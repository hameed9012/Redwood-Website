'use client';

import { CopyReveal } from './CopyReveal';
import { CtaButtons } from './CtaButtons';
import { AudioToggle } from './AudioToggle';
import { Tray } from './puzzle/Tray';

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

      {/* Phase 2: four-slot drop tray overlay (spec §11). Provider wires real state later. */}
      <Tray slots={[null, null, null, null]} />
    </div>
  );
}
