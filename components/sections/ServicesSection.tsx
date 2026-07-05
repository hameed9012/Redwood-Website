'use client';

import { useEffect, useRef, useState } from 'react';
import { Section } from './Section';

interface Service {
  name: string;
  blurb: string;
  glyph: string;
}

const SERVICES: Service[] = [
  {
    name: 'Pharmaceutical Supply',
    blurb: 'Sedatives, anaesthetics, and controlled compounds delivered into pharmacy and partner supply chains at volume.',
    glyph: '⬡',
  },
  {
    name: 'Logistics',
    blurb: 'Bulk liquid transport via our own tanker fleet — discreet routing, temperature-held, no shipment too large.',
    glyph: '◈',
  },
  {
    name: 'Camping Equipment',
    blurb: 'Our retail storefront on Valley Drive. Tents, coolers, rope, and quiet-water gear for the serious outdoorsman.',
    glyph: '△',
  },
];

/**
 * The three service tiles (spec §4.2). Compact cards that scale-expand to full
 * size the first time they enter view, each footed with the same italic B2B
 * disclaimer. Reveal is once (irreversible).
 */
export function ServicesSection() {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (shown) return;
    const el = gridRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);

  return (
    <Section id="services">
      <p className="text-xs uppercase tracking-[0.3em] text-rw-red/80">What we do</p>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-rw-bone md:text-4xl">Services</h2>

      <div ref={gridRef} className="mt-8 grid gap-5 md:grid-cols-3">
        {SERVICES.map((s, i) => (
          <div
            key={s.name}
            style={{ transitionDelay: `${i * 120}ms` }}
            className={`flex flex-col rounded-xl border border-rw-bone/10 bg-rw-charcoal/40 p-6 transition-all duration-700 ease-out ${
              shown ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
            }`}
          >
            <span aria-hidden className="text-2xl text-rw-red/70">{s.glyph}</span>
            <h3 className="mt-3 text-lg font-bold text-rw-bone">{s.name}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-rw-bone/70">{s.blurb}</p>
            <p className="mt-4 text-xs italic text-rw-bone/45">Wholesale and contract inquiries only.</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
