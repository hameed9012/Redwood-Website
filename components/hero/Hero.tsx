'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { HeroOverlay } from './HeroOverlay';
import { FreezeProvider } from './puzzle/useFreeze';
import { PuzzleProvider } from './puzzle/PuzzleProvider';
import { LoadingScreen } from '../loading/LoadingScreen';
import { HistorySection } from '../sections/HistorySection';
import { ServicesSection } from '../sections/ServicesSection';
import { MediaCarousel } from '../sections/MediaCarousel';
import { ContactSection } from '../sections/ContactSection';
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
    <FreezeProvider>
      <PuzzleProvider>
        {/* Fixed full-viewport WebGL background. It persists through the entire
            page scroll — scrolling down drives the camera from the top-down
            surface into the submerged deep (the dive). alpha:false makes it
            opaque, so everything layered above must stay transparent to see it. */}
        <div className="fixed inset-0 -z-10 bg-rw-black">
          <HeroTank onDrained={handleDrained} />
        </div>

        {/* Hero overlay, pinned to the first viewport; scrolls away as you dive. */}
        <section className="relative w-full h-[100svh] overflow-hidden">
          <HeroOverlay />
        </section>

        {/* Public sections. Hero + History are the SURFACE zone (camera stays at
            the top-down surface, tanker in view); the dive begins at Services and
            deepens through Contact (see useScrollDive anchors). */}
        <HistorySection />
        <ServicesSection />
        <MediaCarousel />
        <ContactSection />

        {drained && <LoadingScreen onComplete={handleLoadingComplete} />}
      </PuzzleProvider>
    </FreezeProvider>
  );
}
