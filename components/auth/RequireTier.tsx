'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { hasAtLeast, type Tier } from '@/lib/auth/tiers';
import { useAuth } from './AuthProvider';

/**
 * Client route guard (Phase 4). Renders children only if the current session
 * meets `required`; otherwise redirects to /login. While the session is still
 * hydrating (undefined) it shows a quiet holding state rather than flashing
 * content or a premature redirect.
 */
export function RequireTier({ required, children }: { required: Tier; children: ReactNode }) {
  const { session } = useAuth();
  const router = useRouter();

  const authorized = hasAtLeast(session?.tier, required);

  useEffect(() => {
    if (session === undefined) return; // still hydrating
    if (!authorized) router.replace('/login');
  }, [session, authorized, router]);

  if (session === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-rw-black">
        <p className="text-sm tracking-wide text-rw-bone/40">Verifying clearance…</p>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-rw-black">
        <p className="text-sm tracking-wide text-rw-red">Access denied. Returning to the door…</p>
      </div>
    );
  }

  return <>{children}</>;
}
