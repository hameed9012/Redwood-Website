'use client';

import { useState } from 'react';
import { EmptyState } from '@/components/portal/EmptyState';
import type { Directive } from '@/lib/portal/highCommand';
import type { LedgerRow } from '@/lib/portal/command';

const fmt = (n: number) => `$${n.toLocaleString('en-US')}`;

function BookTag({ book }: { book: LedgerRow['book'] }) {
  const filled = book === 'black';
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-rw-bone/70">
      <span
        aria-hidden
        className={`inline-block h-2 w-2 rounded-full border ${
          filled ? 'border-rw-bone/50 bg-rw-bone/70' : 'border-rw-bone/40 bg-transparent'
        }`}
      />
      {book}
    </span>
  );
}

export function CommandView({ directives, ledger }: { directives: Directive[]; ledger: LedgerRow[] }) {
  const [reconsidering, setReconsidering] = useState(false);

  if (directives.length === 0 && ledger.length === 0) {
    return <EmptyState note="No directives or ledger entries yet." />;
  }

  return (
    <>
      {directives.length > 0 && (
        <section className="mt-2">
          <h2 className="text-xs uppercase tracking-[0.3em] text-rw-red/80">Standing directives</h2>
          <ol className="mt-4 space-y-2">
            {directives.map((d) => (
              <li key={d.n} className="flex gap-3 border-l-2 border-rw-red/40 pl-4 text-sm text-rw-bone/85">
                <span className="font-mono text-rw-bone/40">{String(d.n).padStart(2, '0')}</span>
                <span>{d.text}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-xs uppercase tracking-[0.3em] text-rw-red/80">The deep ledger</h2>
        {ledger.length === 0 ? (
          <p className="mt-4 text-sm text-rw-bone/35">No ledger entries yet.</p>
        ) : (
          <>
            <div className="mt-4 overflow-x-auto rounded-lg border border-rw-charcoal">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-rw-charcoal bg-rw-charcoal/40 text-xs uppercase tracking-wider text-rw-bone/45">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Book</th>
                    <th className="px-4 py-3 font-medium">Reason</th>
                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((e) => (
                    <tr key={e.id} className="border-b border-rw-charcoal/60 last:border-0">
                      <td className="px-4 py-3 font-mono text-rw-bone/50">{e.date}</td>
                      <td className="px-4 py-3">
                        <BookTag book={e.book} />
                      </td>
                      <td className="px-4 py-3 text-rw-bone/80">{e.reason}</td>
                      <td
                        className={`px-4 py-3 text-right font-mono ${
                          e.direction === 'in' ? 'text-emerald-400/80' : 'text-rw-red/90'
                        }`}
                      >
                        {e.direction === 'in' ? '+' : '−'}{fmt(e.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-rw-bone/35">The totals do not reconcile. This is by design.</p>
          </>
        )}
      </section>

      <section className="mt-10 rounded-lg border border-rw-red/30 bg-rw-red/[0.04] p-5">
        <h2 className="text-sm font-semibold text-rw-red">Purge</h2>
        <p className="mt-1 text-sm text-rw-bone/60">
          Erase the ledger, the dossiers, and the manifests. This cannot be undone. This is never actually undone.
        </p>
        {reconsidering ? (
          <p className="mt-3 text-sm italic text-rw-bone/70">
            Reconsider. There is always someone who remembers what was here. There always is.
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setReconsidering(true)}
            className="mt-3 rounded-md border border-rw-red/60 px-4 py-2 text-sm font-semibold text-rw-red transition hover:bg-rw-red/10"
          >
            Purge everything
          </button>
        )}
      </section>
    </>
  );
}
