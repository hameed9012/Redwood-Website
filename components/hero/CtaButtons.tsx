'use client';

import { useState } from 'react';
import { DISCORD_INVITE_URL, APPLY_FORM_URL } from '@/lib/config';

function useStamp() {
  const [pressed, setPressed] = useState(false);
  const handlers = {
    onPointerDown: () => setPressed(true),
    onPointerUp: () => setPressed(false),
    onPointerLeave: () => setPressed(false),
  };
  // Compress + ink-ripple, not a hover-lift (spec §11).
  const className = pressed ? 'scale-[0.96] brightness-90' : 'scale-100';
  return { handlers, className };
}

export function CtaButtons() {
  const join = useStamp();
  return (
    <div className="pointer-events-auto flex gap-3 mt-6">
      <a
        href={DISCORD_INVITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        {...join.handlers}
        className={`px-5 py-2.5 rounded bg-rw-red text-rw-bone font-semibold transition-transform duration-150 ${join.className}`}
      >
        Join Us
      </a>
      <button
        type="button"
        disabled={APPLY_FORM_URL === null}
        className="px-5 py-2.5 rounded border border-rw-bone/30 text-rw-bone/60 font-semibold cursor-not-allowed"
        title="Applications opening soon"
      >
        Applications opening soon
      </button>
    </div>
  );
}
