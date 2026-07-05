'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { resolveTier } from '@/lib/auth/secretNames';
import { useAuth } from '@/components/auth/AuthProvider';

/**
 * Live "secret name" gate (Phase 4). A recognized name signs you in at its tier
 * and routes to /portal; an unrecognized one is refused calmly, without saying
 * which part was wrong. Already-signed-in visitors get a shortcut in.
 */
export function LoginForm() {
  const router = useRouter();
  const { session, signIn } = useAuth();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || checking) return;
    setChecking(true);
    setError(null);
    const tier = await resolveTier(name);
    if (tier) {
      signIn(tier, name.trim());
      router.push('/portal');
      return;
    }
    setError('That name is not on any list we keep.');
    setChecking(false);
  };

  return (
    <div className="w-full max-w-sm rounded-lg border border-rw-charcoal bg-rw-charcoal/60 p-8 shadow-lg">
      <h1 className="text-center text-xl font-semibold tracking-wide text-rw-bone">Employee Access</h1>

      {session ? (
        <div className="mt-6 text-center">
          <p className="text-sm text-rw-bone/70">You are already known to us.</p>
          <Link
            href="/portal"
            className="mt-4 inline-block rounded-md bg-rw-red px-5 py-2 text-sm font-semibold text-rw-bone transition hover:brightness-110"
          >
            Enter the portal →
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6">
          <label htmlFor="secret-name" className="mb-2 block text-sm text-rw-bone/80">
            Secret name
          </label>
          <input
            id="secret-name"
            name="secret-name"
            type="password"
            autoComplete="off"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            placeholder="••••••••"
            className="w-full rounded-md border border-rw-charcoal bg-rw-black px-3 py-2 text-rw-bone placeholder:text-rw-bone/30 outline-none focus:border-rw-red/60"
          />

          <button
            type="submit"
            disabled={!name.trim() || checking}
            className="mt-4 w-full rounded-md bg-rw-red px-3 py-2 text-sm font-semibold text-rw-bone transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {checking ? 'Checking…' : 'Enter'}
          </button>

          {error && <p className="mt-3 text-center text-xs text-rw-red">{error}</p>}
        </form>
      )}

      <p className="mt-4 text-center text-xs text-rw-red/80">Credentials are issued out-of-band.</p>
      <p className="mt-2 text-center text-xs italic text-rw-bone/40">
        If you don&apos;t know yours, you were not meant to.
      </p>
    </div>
  );
}
