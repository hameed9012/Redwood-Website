import type { Dossier, ReportLite } from '@/lib/portal/witnessDossiers';
import { Document } from '@/components/portal/Document';

export function WitnessDossiersView({ dossiers, reports }: { dossiers: Dossier[]; reports: ReportLite[] }) {
  return (
    <div className="min-h-screen bg-rw-black px-6 py-12 text-rw-bone">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-extrabold tracking-tight">Witness Dossiers</h1>
        <p className="mt-2 text-sm text-rw-bone/55">Persons of ongoing interest.</p>

        {reports.length > 0 && (
          <div className="mt-10 space-y-4">
            {reports.map((r, idx) => (
              <Document key={idx} reference={r.date} title={r.subject} classification="Witness Dossier">
                {r.body}
              </Document>
            ))}
          </div>
        )}

        <h2 className="mt-12 text-xs font-semibold uppercase tracking-[0.25em] text-rw-red/80">Recurring parties</h2>
        {dossiers.length === 0 ? (
          <p className="mt-3 text-sm text-rw-bone/35">Nothing on file yet.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {dossiers.map((d) => (
              <article key={d.key} className="rounded-lg border border-rw-charcoal bg-rw-charcoal/25 p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-bold text-rw-bone">{d.label}</h3>
                  <span className="font-mono text-xs text-rw-bone/40">{d.role} · {d.appearances.length} sighting(s)</span>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-rw-bone/75">
                  {d.appearances.map((a, idx) => (
                    <li key={idx}><span className="text-rw-bone">{a.summary}</span> <span className="text-rw-bone/45">— {a.location}</span></li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
