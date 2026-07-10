import type { RankGroup } from '@/lib/portal/personnel';

export function PersonnelView({ groups }: { groups: RankGroup[] }) {
  return (
    <div>
      <p className="text-sm text-rw-bone/55">The org chart, and who reports to whom.</p>
      <div className="mt-8 space-y-8">
        {groups.map((g) => (
          <section key={g.rank}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-rw-red/80">{g.label}</h2>
            {g.members.length === 0 ? (
              <p className="mt-2 text-sm text-rw-bone/35">—</p>
            ) : (
              <ul className="mt-3 space-y-1.5">
                {g.members.map((m) => (
                  <li key={m.employeeName} className="flex flex-wrap items-baseline gap-x-3 text-sm">
                    <span className="font-medium text-rw-bone">{m.employeeName}</span>
                    {m.divisions.length > 0 && <span className="text-rw-bone/55">{m.divisions.join(', ')}</span>}
                    {m.positions.length > 0 && <span className="text-rw-red/70">[{m.positions.join(', ')}]</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
