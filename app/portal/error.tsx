'use client';

/**
 * Portal error boundary. Data loaders (operations log, witness dossiers, the deep
 * ledger) throw on any Supabase failure. Without this, a transient upstream
 * outage would render Next.js's raw crash page. Here it degrades to a calm,
 * retryable notice instead.
 */
export default function PortalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-rw-black px-6 text-rw-bone">
      <div className="max-w-md text-center">
        <h1 className="text-xs uppercase tracking-[0.3em] text-rw-red/80">Record temporarily sealed</h1>
        <p className="mt-4 text-sm text-rw-bone/60">
          This record could not be retrieved. The archive may be briefly unavailable. Try again in a moment.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-md border border-rw-red/60 px-4 py-2 text-sm font-semibold text-rw-red transition hover:bg-rw-red/10"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
