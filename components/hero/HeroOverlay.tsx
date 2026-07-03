'use client';

import { CopyReveal } from './CopyReveal';
import { CtaButtons } from './CtaButtons';
import { AudioToggle } from './AudioToggle';
import { Tray } from './puzzle/Tray';
import { usePuzzleMaybe } from './puzzle/PuzzleProvider';
import { drugFor } from './peak';

export function HeroOverlay() {
  const puzzle = usePuzzleMaybe();
  const hovered = puzzle?.hoveredLetter ?? null;
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

      {/* Readable name chip for the hovered/carried bottle — the 3D label is
          tiny at this camera distance; this is what makes the puzzle testable. */}
      {hovered && (
        <div className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2 rounded border border-rw-red/40 bg-rw-black/80 px-3 py-1 text-sm font-semibold tracking-wide text-rw-bone">
          {drugFor(hovered)}
        </div>
      )}

      {/* Phase 2: four-slot drop tray overlay (spec §11), driven by PuzzleProvider. */}
      <Tray
        slots={puzzle?.slots ?? [null, null, null, null]}
        highlightIndex={puzzle?.highlightIndex ?? -1}
        onSlotRects={(r) => {
          if (puzzle) puzzle.slotRectsRef.current = r;
        }}
      />
    </div>
  );
}
