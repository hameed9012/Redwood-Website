'use client';

import { useState } from 'react';
import { PortalShell } from '@/components/portal/PortalShell';
import { EmptyState } from '@/components/portal/EmptyState';
import { Document } from '@/components/portal/Document';
import { DOSSIERS, DOSSIER_STATUS_LABEL, type DossierStatus } from '@/lib/portal/highCommand';

const STATUS_STYLE: Record<DossierStatus, string> = {
  watched: 'text-amber-400/90',
  relocated: 'text-rw-bone/55',
  resolved: 'text-rw-red',
};

export default function WitnessDossiersPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = DOSSIERS.find((d) => d.id === openId) ?? null;

  return (
    <PortalShell required="high-command" title="Witness Dossiers">
      {DOSSIERS.length === 0 && <EmptyState note="No dossiers on file." />}

      <div className="grid gap-4 md:grid-cols-2">
        {DOSSIERS.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setOpenId(d.id)}
            className="rounded-lg border border-rw-charcoal bg-rw-charcoal/30 p-5 text-left transition hover:border-rw-red/40"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-bold tracking-wide text-rw-bone">{d.codename}</h2>
              <span className={`text-xs uppercase tracking-wider ${STATUS_STYLE[d.status]}`}>
                {DOSSIER_STATUS_LABEL[d.status]}
              </span>
            </div>
            <p className="mt-1 text-xs uppercase tracking-wider text-rw-bone/40">{d.role}</p>
            <p className="mt-3 text-sm leading-relaxed text-rw-bone/65">{d.summary}</p>
            <p className="mt-3 font-mono text-xs text-rw-bone/30">{d.id} · last seen {d.lastSeen}</p>
          </button>
        ))}
      </div>

      {open && (
        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-rw-bone/40">Open dossier</span>
            <button
              type="button"
              onClick={() => setOpenId(null)}
              className="text-xs uppercase tracking-wider text-rw-bone/45 transition hover:text-rw-red"
            >
              ✕ close
            </button>
          </div>
          <Document
            reference={open.id}
            title={open.codename}
            classification="High Command only"
            meta={[
              { label: 'Status', value: DOSSIER_STATUS_LABEL[open.status] },
              { label: 'Role', value: open.role },
              { label: 'Last seen', value: open.lastSeen },
            ]}
          >
            <div className="space-y-3">
              {open.full.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </Document>
        </div>
      )}
    </PortalShell>
  );
}
