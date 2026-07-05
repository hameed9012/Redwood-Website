'use client';

const KEY = 'rw_solved';

function store(s?: Storage): Storage | null {
  if (s) return s;
  if (typeof window === 'undefined') return null;
  try { return window.sessionStorage; } catch { return null; }
}

export function hasSolvedThisSession(s?: Storage): boolean {
  return store(s)?.getItem(KEY) === '1';
}

export function markSolved(s?: Storage): void {
  store(s)?.setItem(KEY, '1');
}
