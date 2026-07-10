'use client';

import { useState } from 'react';
import { PortalShell } from '@/components/portal/PortalShell';
import { EmptyState } from '@/components/portal/EmptyState';
import { Redacted } from '@/components/portal/Document';
import { DIRECTIVES, LEDGER } from '@/lib/portal/highCommand';

const fmt = (n: number) => `$${n.toLocaleString('en-US')}`;

export default function CommandPage() {
  const [reconsidering, setReconsidering] = useState(false);

  if (DIRECTIVES.length === 0 && LEDGER.length === 0) {
    return (
      <PortalShell required="high-command" title="Command">
        <EmptyState note="No directives or ledger entries yet." />
      </PortalShell>
    );
  }

  return (
    <PortalShell required="high-command" title="Command">
      <section className="mt-2">
        <h2 className="text-xs uppercase tracking-[0.3em] text-rw-red/80">Standing directives</h2>
        <ol className="mt-4 space-y-2">
          {DIRECTIVES.map((d) => (
            <li key={d.n} className="flex gap-3 border-l-2 border-rw-red/40 pl-4 text-sm text-rw-bone/85">
              <span className="font-mono text-rw-bone/40">{String(d.n).padStart(2, '0')}</span>
              <span>{d.text}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-xs uppercase tracking-[0.3em] text-rw-red/80">The deep ledger</h2>
        <div className="mt-4 overflow-x-auto rounded-lg border border-rw-charcoal">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-rw-charcoal bg-rw-charcoal/40 text-xs uppercase tracking-wider text-rw-bone/45">
              <tr>
                <th className="px-4 py-3 font-medium">Ref</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Counterparty</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {LEDGER.map((e) => (
                <tr key={e.id} className="border-b border-rw-charcoal/60 last:border-0" title={e.note}>
                  <td className="px-4 py-3 font-mono text-rw-bone/50">{e.id}</td>
                  <td className="px-4 py-3 text-rw-bone/70">{e.date}</td>
                  <td className="px-4 py-3 text-rw-bone/80">
                    {e.redacted ? <Redacted>{e.counterparty}</Redacted> : e.counterparty}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono ${
                      e.amount === 0 ? 'text-rw-bone/40' : e.direction === 'in' ? 'text-emerald-400/80' : 'text-rw-red/90'
                    }`}
                  >
                    {e.amount === 0 ? '—' : `${e.direction === 'in' ? '+' : '−'}${fmt(e.amount)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-rw-bone/35">The totals do not reconcile. This is by design.</p>
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
    </PortalShell>
  );
}
