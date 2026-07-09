'use client';

import { useState } from 'react';
import { PortalShell } from '@/components/portal/PortalShell';
import { ASSIGNMENTS, TASK_STATUS_LABEL, advanceStatus, type TaskStatus } from '@/lib/portal/content';

const STATUS_STYLE: Record<TaskStatus, string> = {
  open: 'border-rw-charcoal text-rw-bone/50',
  'in-progress': 'border-amber-500/50 text-amber-400/90',
  done: 'border-rw-red/50 text-rw-red',
};

export default function AssignmentsPage() {
  const [statuses, setStatuses] = useState<Record<string, TaskStatus>>(
    () => Object.fromEntries(ASSIGNMENTS.map((t) => [t.id, 'open' as TaskStatus])),
  );

  return (
    <PortalShell required="employee" title="Assignments">
      <p className="text-sm text-rw-bone/55">
        Your current tasks. Tap the status to advance it. Nothing here is saved — but do them anyway.
      </p>

      <ul className="mt-8 space-y-3">
        {ASSIGNMENTS.map((t) => {
          const status = statuses[t.id];
          return (
            <li
              key={t.id}
              className={`flex items-start justify-between gap-4 rounded-lg border p-5 ${
                t.heavy ? 'border-rw-red/20 bg-rw-red/[0.03]' : 'border-rw-charcoal bg-rw-charcoal/30'
              }`}
            >
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-xs text-rw-bone/35">{t.id}</span>
                  <h2 className={`font-semibold ${status === 'done' ? 'text-rw-bone/40 line-through' : 'text-rw-bone'}`}>
                    {t.title}
                  </h2>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-rw-bone/60">{t.detail}</p>
              </div>
              <button
                type="button"
                onClick={() => setStatuses((s) => ({ ...s, [t.id]: advanceStatus(s[t.id]) }))}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs uppercase tracking-wider transition hover:brightness-125 ${STATUS_STYLE[status]}`}
              >
                {TASK_STATUS_LABEL[status]}
              </button>
            </li>
          );
        })}
      </ul>
    </PortalShell>
  );
}
