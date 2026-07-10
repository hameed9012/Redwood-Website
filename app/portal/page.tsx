'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RequireTier } from '@/components/auth/RequireTier';
import { TierBadge } from '@/components/auth/TierBadge';
import { useAuth } from '@/components/auth/AuthProvider';
import { hasAtLeast, TIER_LABEL, type Tier } from '@/lib/auth/tiers';
import { LockIcon } from '@/components/icons';

interface NavItem {
  label: string;
  desc: string;
  tier: Tier;
  /** Route, once the section is built. Absent → renders as a placeholder card. */
  href?: string;
}

// Locked rows still render (dimmed) so a lower tier can see there is more above them.
const NAV: NavItem[] = [
  { label: 'Orientation', desc: 'Your first days at Redwood Peak.', tier: 'recruit', href: '/portal/orientation' },
  { label: 'Notices', desc: 'Company-wide bulletins and reminders.', tier: 'recruit', href: '/portal/notices' },
  { label: 'Personnel', desc: 'The org chart, and who reports to whom.', tier: 'employee', href: '/portal/personnel' },
  { label: 'Operations Log', desc: 'Nightly runs and shipment manifests.', tier: 'employee', href: '/portal/operations-log' },
  { label: 'Assignments', desc: 'Your current tasks and their status.', tier: 'employee', href: '/portal/assignments' },
  { label: 'Witness Dossiers', desc: 'Persons of ongoing interest.', tier: 'high-command', href: '/portal/witness-dossiers' },
  { label: 'Command', desc: 'Directives, and the deep ledger.', tier: 'high-command', href: '/portal/command' },
];

function PortalHome() {
  const { session, signOut } = useAuth();
  const router = useRouter();
  if (!session) return null; // guard guarantees this won't render unauthenticated

  const onSignOut = () => {
    signOut();
    router.replace('/login');
  };

  return (
    <div className="min-h-screen bg-rw-black text-rw-bone">
      <header className="flex items-center justify-between border-b border-rw-charcoal px-6 py-4">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/redwood-peak-logo.png" alt="" className="h-8 w-8" />
          <span className="text-sm font-semibold uppercase tracking-[0.25em] text-rw-bone/70">
            Redwood Peak · Internal
          </span>
        </div>
        <div className="flex items-center gap-4">
          <TierBadge tier={session.tier} />
          <button
            type="button"
            onClick={onSignOut}
            className="rounded-md border border-rw-charcoal px-3 py-1.5 text-xs text-rw-bone/70 transition hover:border-rw-red/50 hover:text-rw-red"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          Welcome, {TIER_LABEL[session.tier]}.
        </h1>
        <p className="mt-2 text-sm text-rw-bone/55">
          You are signed in as <span className="text-rw-bone/80">{session.name}</span>. Everything here
          is need-to-know.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NAV.map((item) => {
            const unlocked = hasAtLeast(session.tier, item.tier);
            const cardClass = `block rounded-xl border p-5 transition ${
              unlocked
                ? 'border-rw-bone/10 bg-rw-charcoal/40 hover:border-rw-red/40'
                : 'border-rw-charcoal/60 bg-rw-charcoal/20 opacity-55'
            }`;
            const inner = (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-rw-bone">{item.label}</h2>
                  {unlocked ? (
                    <span className="text-xs text-rw-bone/30">{item.href ? '→' : 'soon'}</span>
                  ) : (
                    <LockIcon className="h-4 w-4 text-rw-bone/40" aria-label={`${TIER_LABEL[item.tier]} clearance`} />
                  )}
                </div>
                <p className="mt-2 text-sm text-rw-bone/60">{item.desc}</p>
                {!unlocked && (
                  <p className="mt-3 text-xs uppercase tracking-wider text-rw-red/70">
                    {TIER_LABEL[item.tier]} clearance
                  </p>
                )}
              </>
            );
            return unlocked && item.href ? (
              <Link key={item.label} href={item.href} className={cardClass}>
                {inner}
              </Link>
            ) : (
              <div key={item.label} aria-disabled={!unlocked} className={cardClass}>
                {inner}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default function PortalPage() {
  return (
    <RequireTier required="recruit">
      <PortalHome />
    </RequireTier>
  );
}
