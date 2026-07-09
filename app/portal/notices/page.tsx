'use client';

import { useState } from 'react';
import { PortalShell } from '@/components/portal/PortalShell';
import { NOTICES } from '@/lib/portal/content';

export default function NoticesPage() {
  const [read, setRead] = useState<Record<string, boolean>>({});

  return (
    <PortalShell required="recruit" title="Notices">
      <p className="text-sm text-rw-bone/55">Company-wide. Most of it is nothing. Read it anyway.</p>

      <ul className="mt-8 space-y-3">
        {NOTICES.map((n) => {
          const isRead = !!read[n.id];
          return (
            <li
              key={n.id}
              className={`rounded-lg border p-5 transition ${
                n.tone === 'odd' ? 'border-rw-red/20' : 'border-rw-charcoal'
              } ${isRead ? 'bg-rw-charcoal/20 opacity-60' : 'bg-rw-charcoal/40'}`}
            >
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-semibold text-rw-bone">{n.title}</h2>
                <span className="shrink-0 font-mono text-xs text-rw-bone/35">
                  {n.id} · {n.date}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-rw-bone/70">{n.body}</p>
              <button
                type="button"
                onClick={() => setRead((r) => ({ ...r, [n.id]: !r[n.id] }))}
                className="mt-3 text-xs uppercase tracking-wider text-rw-bone/40 transition hover:text-rw-red"
              >
                {isRead ? '✓ read' : 'mark read'}
              </button>
            </li>
          );
        })}
      </ul>
    </PortalShell>
  );
}
