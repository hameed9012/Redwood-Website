export type Tone = 'ok' | 'deny' | 'err';

const PREFIX: Record<Tone, string> = { ok: '✔', deny: '⛔', err: '⚠' };

/** A single company-voice line with a tone prefix. */
export function line(tone: Tone, text: string): string {
  return `${PREFIX[tone]} ${text}`;
}

export const HANDBOOK = [
  '**Redwood Peak — Employee Handbook**',
  '',
  '1. Arrive on time. Sign in. Sign out. The log is not optional.',
  '2. Wear your identity above the waist and visible at all times.',
  '3. Company vehicles are for company routes. Odometers are read.',
  '4. Refer all outside inquiries to your associate. Do not improvise.',
  '5. If you are asked what we transport, the answer is industrial solvent.',
  '6. Your movements are recorded. This is for your protection.',
  '7. What is written down is written carefully. What is not written down did not happen.',
  '',
  '_Thank you for your cooperation._',
].join('\n');
