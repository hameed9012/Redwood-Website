'use client';

import { useState, type FormEvent } from 'react';
import { Section } from './Section';
import { makeInquiryRef } from '@/lib/inquiry';

/**
 * Contact form (spec §4.4) — the project's first Supabase touch. Discord
 * username (required) + optional message. On submit it mints a fake reference,
 * stores the row (when creds exist; silently skipped otherwise), and always
 * shows "Inquiry #RW-XXXXX logged". A storage failure never breaks the theatre.
 */
export function ContactSection() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [reference, setReference] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!username.trim() || submitting) return;
    setSubmitting(true);
    const ref = makeInquiryRef();
    // Fire-and-degrade: we don't branch on the result — the reference shows
    // either way (spec §4.4). Supabase (~40kB) is loaded on demand here so it
    // stays out of the initial page bundle.
    try {
      const { submitInquiry } = await import('@/lib/supabase');
      await submitInquiry({
        discord_username: username.trim(),
        message: message.trim() || null,
        reference: ref,
      });
    } catch {
      // ignore — the reference still shows
    }
    setReference(ref);
    setSubmitting(false);
  };

  return (
    <Section id="contact">
      <p className="text-xs uppercase tracking-[0.3em] text-rw-red/80">Get in touch</p>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-rw-bone md:text-4xl">Contact</h2>
      <p className="mt-3 text-sm text-rw-bone/60">
        Established companies only. Reach us on Discord and an associate will follow up regarding bulk terms.
      </p>

      {reference ? (
        <div className="mt-8 rounded-xl border border-rw-red/30 bg-rw-black/60 p-6" role="status" aria-live="polite">
          <p className="text-lg font-semibold text-rw-bone">Inquiry #{reference} logged</p>
          <p className="mt-2 text-sm text-rw-bone/60">
            Thank you. Keep this reference for your records — an associate will be in touch.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm text-rw-bone/70">
            Discord username <span className="text-rw-red">*</span>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="yourname#0000"
              className="rounded-lg border border-rw-bone/15 bg-rw-charcoal/50 px-4 py-2.5 text-rw-bone outline-none placeholder:text-rw-bone/30 focus:border-rw-red/60"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-rw-bone/70">
            Message <span className="text-rw-bone/40">(optional)</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Volume, product, and preferred terms."
              className="resize-none rounded-lg border border-rw-bone/15 bg-rw-charcoal/50 px-4 py-2.5 text-rw-bone outline-none placeholder:text-rw-bone/30 focus:border-rw-red/60"
            />
          </label>
          <button
            type="submit"
            disabled={!username.trim() || submitting}
            className="mt-1 self-start rounded-lg bg-rw-red px-6 py-2.5 font-semibold text-rw-bone transition-[transform,filter] duration-150 hover:brightness-110 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? 'Logging…' : 'Submit inquiry'}
          </button>
        </form>
      )}
    </Section>
  );
}
