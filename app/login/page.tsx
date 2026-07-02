import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Employee Access — Redwood Peak',
};

/**
 * Placeholder /login stub (spec §7, Phase 2 scope): static, no auth wired up.
 * Phase 4 replaces this with the real Supabase-backed employee login flow.
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-rw-black px-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/redwood-peak-logo.png" alt="Redwood Peak" className="h-16 w-16" />

      <div className="w-full max-w-sm rounded-lg border border-rw-charcoal bg-rw-charcoal/60 p-8 shadow-lg">
        <h1 className="text-center text-xl font-semibold tracking-wide text-rw-bone">
          Employee Access
        </h1>

        <div className="mt-6">
          <label htmlFor="secret-name" className="mb-2 block text-sm text-rw-bone/80">
            Secret name
          </label>
          <input
            id="secret-name"
            name="secret-name"
            type="text"
            disabled
            placeholder="••••••••"
            className="w-full rounded-md border border-rw-charcoal bg-rw-black px-3 py-2 text-rw-bone placeholder:text-rw-bone/30 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <p className="mt-4 text-center text-xs text-rw-red">
          Credentials are issued out-of-band.
        </p>

        <p className="mt-2 text-center text-xs italic text-rw-bone/40">
          If you don&apos;t know yours, you were not meant to.
        </p>
      </div>
    </div>
  );
}
