'use client';

import { Section } from './Section';
import { useTypeOnView } from './useTypeOnView';

const HISTORY = `Redwood Peak is a trusted and growing company founded on October 5, 2024, with operations across multiple fields. We are committed to providing reliable products, building strong partnerships, and delivering quality solutions to the organizations and communities we serve. Through collaboration, innovation, and community involvement, we continue to expand while maintaining professionalism, integrity, and a dedication to making a positive impact.`;

/**
 * Company history (spec §4.1). Types itself out the first time it scrolls into
 * view, then stays static — the deadpan corporate boilerplate, revealed slowly.
 */
export function HistorySection() {
  const { ref, text, done } = useTypeOnView(HISTORY, 14);
  // Reserve the full paragraph's layout from the start (the untyped remainder is
  // rendered transparent) so typing never reflows the text — previously each
  // word that wrapped a line jerked the whole paragraph.
  const remainder = HISTORY.slice(text.length);

  return (
    <Section id="history">
      <p className="text-xs uppercase tracking-[0.3em] text-rw-red/80">Who we are</p>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-rw-bone md:text-4xl">Our history</h2>
      <p ref={ref} className="mt-6 text-base leading-relaxed text-rw-bone/85 md:text-lg">
        <span>{text}</span>
        {!done && <span className="inline-block w-0 animate-pulse text-rw-red">▮</span>}
        <span aria-hidden className="text-transparent">{remainder}</span>
      </p>
    </Section>
  );
}
