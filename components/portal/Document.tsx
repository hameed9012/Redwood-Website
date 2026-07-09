import { type ReactNode } from 'react';

/**
 * Redaction: a solid black bar with the text left faintly legible beneath it.
 * Inline styles (Tailwind var/opacity utilities no-op on the CSS-var colours) so
 * it renders reliably; flows inline and wraps via box-decoration-break.
 * Shared across Media (public) and the portal documents.
 */
export function Redacted({ children }: { children: ReactNode }) {
  return (
    <span
      className="rounded-[1px] px-1 [-webkit-box-decoration-break:clone] [box-decoration-break:clone]"
      style={{ backgroundColor: '#000', color: 'rgba(240,240,238,0.26)' }}
    >
      {children}
    </span>
  );
}

interface DocumentProps {
  reference: string;
  title: string;
  classification?: string;
  meta?: { label: string; value: string }[];
  children: ReactNode;
}

/**
 * The shared "internal document" frame (Phase 7): a classification stripe, a
 * reference number, monospace metadata, and a body. Used by Witness Dossiers and
 * Command so the top-clearance material reads as one consistent record system.
 */
export function Document({ reference, title, classification, meta, children }: DocumentProps) {
  return (
    <article className="overflow-hidden rounded-lg border border-rw-charcoal bg-rw-charcoal/25">
      {classification && (
        <div className="flex items-center justify-between bg-rw-red/15 px-5 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-rw-red">
          <span>{classification}</span>
          <span className="text-rw-red/60">Redwood Peak</span>
        </div>
      )}
      <div className="p-5">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-lg font-bold text-rw-bone">{title}</h3>
          <span className="shrink-0 font-mono text-xs text-rw-bone/40">{reference}</span>
        </div>
        {meta && meta.length > 0 && (
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 border-y border-rw-charcoal py-3 sm:grid-cols-3">
            {meta.map((m) => (
              <div key={m.label} className="text-xs">
                <dt className="uppercase tracking-wider text-rw-bone/35">{m.label}</dt>
                <dd className="mt-0.5 font-mono text-rw-bone/75">{m.value}</dd>
              </div>
            ))}
          </dl>
        )}
        <div className="mt-4 text-sm leading-relaxed text-rw-bone/75">{children}</div>
      </div>
    </article>
  );
}
