export interface Window {
  threshold: number;
  windowSeconds: number;
}

/** True if joins within the window meet/exceed the threshold. `joinsMs` are epoch-ms timestamps. */
export function isRaid(joinsMs: number[], nowMs: number, w: Window): boolean {
  const cutoff = nowMs - w.windowSeconds * 1000;
  return joinsMs.filter((t) => t >= cutoff).length >= w.threshold;
}

/** True if a user's message timestamps within the window meet/exceed the threshold. */
export function isSpam(messagesMs: number[], nowMs: number, w: Window): boolean {
  const cutoff = nowMs - w.windowSeconds * 1000;
  return messagesMs.filter((t) => t >= cutoff).length >= w.threshold;
}

/** True if the account is younger than `minAgeDays`. */
export function isSuspiciousAccount(accountCreatedMs: number, nowMs: number, minAgeDays: number): boolean {
  return nowMs - accountCreatedMs < minAgeDays * 86_400_000;
}

/** True if the dead-man deadline (epoch-ms, or null if unset) is in the past. */
export function isDeadmanLapsed(deadlineMs: number | null, nowMs: number): boolean {
  return deadlineMs !== null && deadlineMs < nowMs;
}
