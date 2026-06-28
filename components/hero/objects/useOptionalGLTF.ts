'use client';

import { useEffect, useState } from 'react';

export type AssetStatus = 'pending' | 'present' | 'absent';

/** Pure decision: attempt GLB rendering only when the probe confirms presence. Unit-tested. */
export function shouldRenderGlb(status: AssetStatus): boolean {
  return status === 'present';
}

/**
 * Probes (HTTP HEAD) whether a GLB exists at `path` without ever throwing.
 * Returns 'pending' until the probe resolves, then 'present' | 'absent'.
 *
 * This is the swap-seam (spec §8): `useGLTF` suspends/throws on a missing
 * file, so we must NOT call it until we know the file is there. The probe
 * lets HeroBottle render procedural immediately and only mount the
 * GLB-loading child (inside Suspense + an ErrorBoundary) once the file is
 * confirmed present — so a missing model silently falls back to procedural,
 * and dropping a real .glb in later "just works" with zero edits elsewhere.
 */
export function useAssetPresence(path: string): AssetStatus {
  const [status, setStatus] = useState<AssetStatus>('pending');

  useEffect(() => {
    let cancelled = false;
    fetch(path, { method: 'HEAD' })
      .then((res) => {
        if (!cancelled) setStatus(res.ok ? 'present' : 'absent');
      })
      .catch(() => {
        if (!cancelled) setStatus('absent');
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return status;
}
