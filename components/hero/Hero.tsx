'use client';

import dynamic from 'next/dynamic';
import { HeroOverlay } from './HeroOverlay';
import { FreezeProvider } from './puzzle/useFreeze';
import { PuzzleProvider } from './puzzle/PuzzleProvider';

// WebGL must not run during SSR.
const HeroTank = dynamic(() => import('./HeroTank').then((m) => m.HeroTank), { ssr: false });

export function Hero() {
  return (
    <section className="relative w-full h-[100svh] overflow-hidden bg-rw-black">
      <FreezeProvider>
        <PuzzleProvider>
          <HeroTank />
          <HeroOverlay />
        </PuzzleProvider>
      </FreezeProvider>
    </section>
  );
}
