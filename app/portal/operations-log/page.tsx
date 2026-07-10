'use client';

import { useMemo, useState } from 'react';
import { PortalShell } from '@/components/portal/PortalShell';
import { EmptyState } from '@/components/portal/EmptyState';
import {
  OPS_RUNS,
  RUN_STATUS_LABEL,
  selectRuns,
  type SortDir,
  type StatusFilter,
} from '@/lib/portal/opsLog';

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'in-transit', label: 'In transit' },
  { value: 'held', label: 'Held' },
  { value: 'redacted', label: 'Sealed' },
];

const STATUS_STYLE: Record<string, string> = {
  delivered: 'text-rw-bone/60',
  'in-transit': 'text-rw-bone/80',
  held: 'text-amber-400/80',
  redacted: 'text-rw-red',
};

export default function OperationsLogPage() {
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortDir>('desc');
  const rows = useMemo(() => selectRuns(OPS_RUNS, status, sort), [status, sort]);

  if (OPS_RUNS.length === 0) {
    return (
      <PortalShell required="employee" title="Operations Log">
        <EmptyState note="No runs logged." />
      </PortalShell>
    );
  }

  return (
    <PortalShell required="employee" title="Operations Log">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatus(f.value)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              status === f.value
                ? 'border-rw-red/60 bg-rw-red/10 text-rw-bone'
                : 'border-rw-charcoal text-rw-bone/55 hover:border-rw-bone/30'
            }`}
          >
            {f.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setSort((s) => (s === 'desc' ? 'asc' : 'desc'))}
          className="ml-auto rounded-full border border-rw-charcoal px-3 py-1 text-xs text-rw-bone/55 transition hover:border-rw-bone/30"
        >
          Date {sort === 'desc' ? '↓' : '↑'}
        </button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-rw-charcoal">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-rw-charcoal bg-rw-charcoal/40 text-xs uppercase tracking-wider text-rw-bone/45">
            <tr>
              <th className="px-4 py-3 font-medium">Run</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Route</th>
              <th className="px-4 py-3 font-medium">Tanker</th>
              <th className="px-4 py-3 font-medium">Tonnage</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-rw-charcoal/60 last:border-0" title={r.note}>
                <td className="px-4 py-3 font-mono text-rw-bone/50">{r.id}</td>
                <td className="px-4 py-3 text-rw-bone/70">{r.date}</td>
                <td className="px-4 py-3 text-rw-bone/85">{r.route}</td>
                <td className="px-4 py-3 text-rw-bone/60">{r.tanker}</td>
                <td className="px-4 py-3 text-rw-bone/70">{r.status === 'redacted' ? '—' : `${r.tonnage.toFixed(1)} t`}</td>
                <td className={`px-4 py-3 ${STATUS_STYLE[r.status]}`}>{RUN_STATUS_LABEL[r.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-rw-bone/35">
        {rows.length} run{rows.length === 1 ? '' : 's'}. Sealed manifests are not to be re-opened.
      </p>
    </PortalShell>
  );
}
