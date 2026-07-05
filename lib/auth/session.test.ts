import { describe, it, expect, beforeEach } from 'vitest';
import { readSession, writeSession, clearSession, type AuthSession } from './session';

describe('auth session store', () => {
  beforeEach(() => window.localStorage.clear());

  it('round-trips a written session', () => {
    const s: AuthSession = { tier: 'employee', name: 'tidewater', at: 123 };
    writeSession(s);
    expect(readSession()).toEqual(s);
  });

  it('returns null when nothing is stored', () => {
    expect(readSession()).toBeNull();
  });

  it('returns null for corrupt JSON', () => {
    window.localStorage.setItem('rw.session', '{not json');
    expect(readSession()).toBeNull();
  });

  it('rejects a payload with an invalid tier', () => {
    window.localStorage.setItem('rw.session', JSON.stringify({ tier: 'ceo', name: 'x', at: 1 }));
    expect(readSession()).toBeNull();
  });

  it('clearSession removes it', () => {
    writeSession({ tier: 'recruit', name: 'minnow', at: 1 });
    clearSession();
    expect(readSession()).toBeNull();
  });
});
