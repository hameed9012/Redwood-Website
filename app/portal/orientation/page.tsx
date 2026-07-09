import { PortalShell } from '@/components/portal/PortalShell';
import { ORIENTATION_CHECKLIST, CORE_VALUES, CODE_OF_CONDUCT } from '@/lib/portal/content';

export default function OrientationPage() {
  return (
    <PortalShell required="recruit" title="Orientation">
      <p className="max-w-2xl text-sm leading-relaxed text-rw-bone/60">
        Welcome to Redwood Peak. This page is your first day. Read it once, slowly, and then read the
        Code of Conduct all the way to the end. People skip the end. Do not skip the end.
      </p>

      <section className="mt-10">
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

      <section className="mt-10">
        <h2 className="text-xs uppercase tracking-[0.3em] text-rw-red/80">Core values</h2>
        <ul className="mt-4 space-y-2">
          {CORE_VALUES.map((v) => (
            <li key={v} className="border-l-2 border-rw-charcoal pl-4 text-sm text-rw-bone/80">{v}</li>
          ))}
        </ul>
      </section>

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
    </PortalShell>
  );
}
