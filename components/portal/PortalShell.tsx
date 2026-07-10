'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ReactNode } from 'react';
import { RequireTier } from '@/components/auth/RequireTier';
import { TierBadge } from '@/components/auth/TierBadge';
import { useAuth } from '@/components/auth/AuthProvider';
import type { Tier } from '@/lib/auth/tiers';

function Chrome({ title, back, children }: { title: string; back: boolean; children: ReactNode }) {
  const { session, signOut } = useAuth();
  const router = useRouter();
  if (!session) return null; // guard guarantees an authed session here

  const onSignOut = () => {
    signOut();
    router.replace('/login');
  };

  return (
    <div className="min-h-screen bg-rw-black text-rw-bone">
      <header className="flex items-center justify-between border-b border-rw-charcoal px-6 py-4">
        <Link href="/portal" className="flex items-center gap-3 transition hover:opacity-80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/redwood-peak-logo.png" alt="" className="h-8 w-8" />
          <span className="text-sm font-semibold uppercase tracking-[0.25em] text-rw-bone/70">
            Redwood Peak · Internal
          </span>
        </Link>
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

      <main className="mx-auto max-w-5xl px-6 py-10">
        {back && (
          <Link
            href="/portal"
            className="text-xs uppercase tracking-[0.2em] text-rw-bone/45 transition hover:text-rw-red"
          >
            ← Portal
          </Link>
        )}
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}

/**
 * Guarded chrome for every portal route (Phase 5+): the internal header (logo,
 * tier badge, sign out), a back-to-portal link, and the page title — wrapped in
 * RequireTier so under-cleared visitors are bounced to /login.
 */
export function PortalShell({
  required,
  title,
  back = true,
  children,
}: {
  required: Tier;
  title: string;
  back?: boolean;
  children: ReactNode;
}) {
  return (
    <RequireTier required={required}>
      <Chrome title={title} back={back}>
        {children}
      </Chrome>
    </RequireTier>
  );
}
