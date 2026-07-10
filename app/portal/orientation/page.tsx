import { PortalShell } from '@/components/portal/PortalShell';
import { EmptyState } from '@/components/portal/EmptyState';
import { ORIENTATION_CHECKLIST, CORE_VALUES, CODE_OF_CONDUCT } from '@/lib/portal/content';

export default function OrientationPage() {
  const empty = !ORIENTATION_CHECKLIST.length && !CORE_VALUES.length && !CODE_OF_CONDUCT.length;

  return (
    <PortalShell required="recruit" title="Orientation">
      {empty ? (
        <EmptyState note="Orientation content hasn’t been added yet." />
      ) : (
        <>
          {ORIENTATION_CHECKLIST.length > 0 && (
            <section>
              <h2 className="text-xs uppercase tracking-[0.3em] text-rw-red/80">First-day checklist</h2>
              <ul className="mt-4 space-y-3">
                {ORIENTATION_CHECKLIST.map((item) => (
                  <li key={item.label} className="flex gap-3 text-sm text-rw-bone/85">
                    <span aria-hidden className="mt-0.5 text-rw-bone/25">☐</span>
                    <span>
                      {item.label}
                      {item.note && <span className="block text-xs italic text-rw-bone/40">{item.note}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {CORE_VALUES.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xs uppercase tracking-[0.3em] text-rw-red/80">Core values</h2>
              <ul className="mt-4 space-y-2">
                {CORE_VALUES.map((v) => (
                  <li key={v} className="border-l-2 border-rw-charcoal pl-4 text-sm text-rw-bone/80">{v}</li>
                ))}
              </ul>
            </section>
          )}

          {CODE_OF_CONDUCT.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xs uppercase tracking-[0.3em] text-rw-red/80">Code of Conduct</h2>
              <ol className="mt-4 space-y-3">
                {CODE_OF_CONDUCT.map((c) => (
                  <li
                    key={c.n}
                    className={`flex gap-3 rounded-md border px-4 py-3 text-sm ${
                      c.heavy ? 'border-rw-red/25 bg-rw-red/[0.04] text-rw-bone/85' : 'border-rw-charcoal bg-rw-charcoal/30 text-rw-bone/75'
                    }`}
                  >
                    <span className="font-mono text-rw-bone/40">{String(c.n).padStart(2, '0')}</span>
                    <span>{c.text}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </>
      )}
    </PortalShell>
  );
}
