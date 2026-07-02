'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { HeroOverlay } from './HeroOverlay';
import { FreezeProvider } from './puzzle/useFreeze';
import { PuzzleProvider } from './puzzle/PuzzleProvider';
import { LoadingScreen } from '../loading/LoadingScreen';
import { markSolved } from '@/lib/session';

// WebGL must not run during SSR.
const HeroTank = dynamic(() => import('./HeroTank').then((m) => m.HeroTank), { ssr: false });

export function Hero() {
  const router = useRouter();
  const [drained, setDrained] = useState(false);

  // Solve → drain (in-scene) → this fires → loading screen → mark + route.
  // The session flag means a same-session reload never replays the forced
  // drain/loading (nothing auto-triggers; solving is always user-initiated),
  // while a brand-new session gets the full experience.
  const handleDrained = useCallback(() => setDrained(true), []);
  const handleLoadingComplete = useCallback(() => {
    markSolved();
    router.push('/login');
  }, [router]);

  return (
    <section className="relative w-full h-[100svh] overflow-hidden bg-rw-black">
      <FreezeProvider>
        <PuzzleProvider>
          <HeroTank onDrained={handleDrained} />
          <HeroOverlay />
        </PuzzleProvider>
      </FreezeProvider>
      {drained && <LoadingScreen onComplete={handleLoadingComplete} />}
    </section>
  );
}
