'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Section } from './Section';

/** A thin black redaction bar over part of a sentence — legible if you look
 *  closely (the text sits faintly beneath a near-opaque bar). Spec §4.3. */
function Redacted({ children }: { children: ReactNode }) {
  return (
    <span className="relative mx-0.5 inline-block align-baseline">
      <span className="text-rw-bone/70">{children}</span>
      <span aria-hidden className="pointer-events-none absolute inset-x-0 inset-y-[0.05em] rounded-[1px] bg-rw-black/90" />
    </span>
  );
}

interface Slide {
  title: string;
  gradient: string;
  body: ReactNode;
}

const SLIDES: Slide[] = [
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
 * Media carousel (spec §4.3): auto-advances every ~6s, pauses fully while the
 * cursor is anywhere over the slide, and carries redaction bars on the cleanup
 * and tanker slides. Placeholder brand-toned gradients stand in for imagery.
 */
export function MediaCarousel() {
  const [index, setIndex] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (paused.current) return;
      setIndex((i) => (i + 1) % SLIDES.length);
    }, ADVANCE_MS);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[index];

  return (
    <Section id="media">
      <p className="text-xs uppercase tracking-[0.3em] text-rw-red/80">In the community</p>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-rw-bone md:text-4xl">Media</h2>

      <div
        className="mt-8 grid items-stretch gap-6 md:grid-cols-2"
        onMouseEnter={() => { paused.current = true; }}
        onMouseLeave={() => { paused.current = false; }}
      >
        <div
          aria-hidden
          className={`min-h-[220px] rounded-xl bg-gradient-to-br ${slide.gradient} ring-1 ring-rw-bone/10 transition-[background] duration-700`}
        />
        <div className="flex flex-col justify-center">
          <h3 className="text-xl font-bold text-rw-bone">{slide.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-rw-bone/75 md:text-base">{slide.body}</p>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        {SLIDES.map((s, i) => (
          <button
            key={s.title}
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
