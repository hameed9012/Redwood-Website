'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Section } from './Section';
import { Redacted } from '@/components/portal/Document';
import { loadSlides, pickSlides } from '@/lib/carousel';

interface Slide {
  title: string;
  body: ReactNode;
  gradient?: string;
  imageUrl?: string;
}

const DEFAULT_SLIDES: Slide[] = [
  {
    title: 'Neighborhood cleanup',
    gradient: 'from-rw-charcoal to-rw-red-deep',
    body: (
      <>
        In partnership with a local cleaning company and law enforcement, our crews clear the riverbanks
        each season. Recovered materials are <Redacted>quietly incinerated off-site before any inspection</Redacted>,
        and the shoreline is left spotless.
      </>
    ),
  },
  {
    title: 'Community food trucks',
    gradient: 'from-rw-charcoal to-rw-black',
    body: (
      <>
        Our food-truck initiative serves free meals at town events year-round — a small way of giving back to
        the neighborhoods that have welcomed our facilities so warmly.
      </>
    ),
  },
  {
    title: 'The tanker fleet',
    gradient: 'from-rw-red-deep to-rw-black',
    body: (
      <>
        Bulk liquid moves by our own tankers on a fixed overnight schedule. Manifests list the contents as
        industrial solvent; <Redacted>the actual cargo is never logged at the weigh station</Redacted>. Delivery
        is guaranteed.
      </>
    ),
  },
  {
    title: 'Valley Drive store',
    gradient: 'from-rw-charcoal to-rw-red-deep',
    body: (
      <>
        Our camping storefront on Valley Drive is open seven days a week. Knowledgeable staff, competitive
        pricing, and everything you need for a quiet weekend on the water.
      </>
    ),
  },
];

const ADVANCE_MS = 6000;

/**
 * Media carousel: auto-advances every ~6s, pauses while hovered. Slides come
 * from Supabase (managed by the bot's /carousel command); if none are set it
 * falls back to the built-in slides so the section is never empty.
 */
export function MediaCarousel() {
  const [slides, setSlides] = useState<Slide[]>(DEFAULT_SLIDES);
  const [index, setIndex] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    let cancelled = false;
    loadSlides().then((db) => {
      if (cancelled) return;
      const mapped: Slide[] = db.map((s) => ({ title: s.title, body: s.body, imageUrl: s.imageUrl }));
      setSlides(pickSlides(mapped, DEFAULT_SLIDES));
      setIndex(0);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (paused.current) return;
      setIndex((i) => (i + 1) % slides.length);
    }, ADVANCE_MS);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[index];

  return (
    <Section id="media" align="left">
      <p className="text-xs uppercase tracking-[0.3em] text-rw-red/80">In the community</p>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-rw-bone md:text-4xl">Media</h2>

      <div
        className="mt-8 grid items-center gap-8 md:grid-cols-[1.3fr_1fr]"
        onMouseEnter={() => { paused.current = true; }}
        onMouseLeave={() => { paused.current = false; }}
      >
        <div className="aspect-[16/10] w-full overflow-hidden rounded-xl ring-1 ring-rw-bone/10">
          {slide.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={slide.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div aria-hidden className={`h-full w-full bg-gradient-to-br ${slide.gradient ?? ''} transition-[background] duration-700`} />
          )}
        </div>
        <div className="flex flex-col justify-center">
          <h3 className="text-xl font-bold text-rw-bone md:text-2xl">{slide.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-rw-bone/75 md:text-base">{slide.body}</p>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        {slides.map((s, i) => (
          <button
            key={`${s.title}-${i}`}
            type="button"
            aria-label={`Show ${s.title}`}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all ${
              i === index ? 'w-6 bg-rw-red' : 'w-2 bg-rw-bone/25 hover:bg-rw-bone/50'
            }`}
          />
        ))}
      </div>
    </Section>
  );
}
