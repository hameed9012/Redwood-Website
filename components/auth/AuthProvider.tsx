'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Tier } from '@/lib/auth/tiers';
import { readSession, writeSession, clearSession, type AuthSession } from '@/lib/auth/session';

interface AuthContextValue {
  /** Current session, or null. `undefined` until hydrated from storage (SSR/first paint). */
  session: AuthSession | null | undefined;
  signIn: (tier: Tier, name: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * App-wide auth context (Phase 4). Hydrates the persisted session from
 * localStorage on mount (session is `undefined` until then, so guards can wait
 * rather than flash). Sign-in/out update both state and storage.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null | undefined>(undefined);

  useEffect(() => {
    setSession(readSession());
  }, []);

  const signIn = useCallback((tier: Tier, name: string) => {
    const next: AuthSession = { tier, name, at: Date.now() };
    writeSession(next);
    setSession(next);
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  return <AuthContext.Provider value={{ session, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
