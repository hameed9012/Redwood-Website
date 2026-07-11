import type { OpsRow } from '@/lib/portal/operationsLog';
import { Redacted } from '@/components/portal/Document';

export function OperationsLogView({ rows }: { rows: OpsRow[] }) {
  return (
    <div>
      <p className="text-sm text-rw-bone/55">Nightly runs and shipment manifests.</p>
      {rows.length === 0 ? (
        <p className="mt-8 text-sm text-rw-bone/35">No shifts on record.</p>
      ) : (
        <div className="mt-8 space-y-6">
          {rows.map((r) => (
            <article key={r.id} className="rounded-lg border border-rw-charcoal bg-rw-charcoal/25 p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-bold text-rw-bone">{r.employeeName}</h2>
                <span className="font-mono text-xs text-rw-bone/40">{r.date} · {r.duration}</span>
              </div>
              {r.movementAccount && (
                <p className="mt-2 text-xs text-rw-bone/50">
                  Movements: <Redacted>{r.movementAccount}</Redacted>
                </p>
              )}
              {r.incidents.length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-rw-charcoal pt-3 text-sm text-rw-bone/75">
                  {r.incidents.map((i, idx) => (
                    <li key={idx}><span className="text-rw-bone">{i.summary}</span> <span className="text-rw-bone/45">— {i.location}</span></li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
