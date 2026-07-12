/** Strip $, commas, and whitespace; accept whole positive dollars only. */
export function parseDonation(amountStr: string): { ok: true; amount: number } | { ok: false; error: string } {
  const cleaned = amountStr.replace(/[$,\s]/g, '');
  if (!/^\d+$/.test(cleaned)) return { ok: false, error: 'That is not a whole-dollar amount. Round numbers only.' };
  const amount = Number(cleaned);
  if (amount <= 0) return { ok: false, error: 'A donation has to be more than nothing.' };
  return { ok: true, amount };
}
