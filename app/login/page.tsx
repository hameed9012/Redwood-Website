import type { Metadata } from 'next';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
  title: 'Employee Access — Redwood Peak',
};

/**
 * Employee Access (Phase 4). The secret-name gate: a recognized name signs you
 * in at its tier and routes to /portal (see LoginForm). Reached from the PEAK
 * puzzle drain (Phase 2).
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-rw-black px-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/redwood-peak-logo.png" alt="Redwood Peak" className="h-16 w-16" />
      <LoginForm />
    </div>
  );
}
