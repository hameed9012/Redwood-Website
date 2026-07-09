import { PortalShell } from '@/components/portal/PortalShell';
import { EmptyState } from '@/components/portal/EmptyState';
import { ORG, type Person } from '@/lib/portal/content';

function PersonRow({ person, head }: { person: Person; head?: boolean }) {
  return (
    <div
      className={`rounded-md border px-4 py-2.5 ${
        head ? 'border-rw-red/30 bg-rw-red/[0.04]' : 'border-rw-charcoal bg-rw-charcoal/30'
      }`}
      title={person.note}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-semibold text-rw-bone">{person.name}</span>
        <span className="text-xs uppercase tracking-wider text-rw-bone/45">{person.role}</span>
      </div>
      {person.note && <p className="mt-1 text-xs italic text-rw-bone/40">{person.note}</p>}
    </div>
  );
}

export default function PersonnelPage() {
  return (
    <PortalShell required="employee" title="Personnel">
      {ORG.length === 0 && <EmptyState note="No personnel listed." />}

      <div className="space-y-8">
        {ORG.map((dept) => (
          <section key={dept.name}>
            <h2 className="font-mono text-sm uppercase tracking-[0.2em] text-rw-red/70">{dept.name}</h2>
            <div className="mt-3 space-y-2">
              <PersonRow person={dept.head} head />
              {dept.members.length > 0 && (
                <div className="ml-6 space-y-2 border-l border-rw-charcoal pl-4">
                  {dept.members.map((m) => (
                    <PersonRow key={m.name} person={m} />
                  ))}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </PortalShell>
  );
}
