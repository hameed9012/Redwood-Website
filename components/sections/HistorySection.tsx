'use client';

import { Section } from './Section';
import { useTypeOnView } from './useTypeOnView';

const HISTORY = `Redwood Peak is a skilled and well-known multi-million dollar medical company, originally founded October 5, 2024, and has since expanded into multiple fields — including an official camping equipment store located on Valley Drive. We also operate several shell companies specializing in other industries. Our core belief is that we should be present in every medical supply chain, supporting pharmacies and partner companies so our products reach the people who need them. We give back where we can, regularly collaborating with a cleaning company and local law enforcement on neighborhood cleanup efforts and community food truck initiatives. We deal exclusively with established companies, in large volume, and are open to negotiation on pricing for bulk contracts.`;

/**
 * Company history (spec §4.1). Types itself out the first time it scrolls into
 * view, then stays static — the deadpan corporate boilerplate, revealed slowly.
 */
export function HistorySection() {
  const { ref, text, done } = useTypeOnView(HISTORY, 14);

  return (
    <Section id="history">
      <p className="text-xs uppercase tracking-[0.3em] text-rw-red/80">Who we are</p>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-rw-bone md:text-4xl">Our history</h2>
      <p ref={ref} className="mt-6 text-base leading-relaxed text-rw-bone/85 md:text-lg">
        {text}
        {!done && <span className="ml-0.5 inline-block animate-pulse text-rw-red">▮</span>}
      </p>
    </Section>
  );
}
