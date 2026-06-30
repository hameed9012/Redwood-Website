/** Single source of truth for the Redwood Peak palette (spec §3). */
export const TOKENS = {
  black: '#0a0a0a',
  charcoal: '#141414',
  red: '#c1272d',
  redDeep: '#7a1518',
  bone: '#f5f5f4',
} as const;

export type TokenName = keyof typeof TOKENS;
