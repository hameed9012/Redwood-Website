/** In-memory sliding-window timestamp buffers (reset on restart — that's fine for raid/spam windows). */
export const joinTimes: number[] = [];
export const messageTimes = new Map<string, number[]>();

export function pushJoin(nowMs: number, keepMs = 60_000): void {
  joinTimes.push(nowMs);
  const cutoff = nowMs - keepMs;
  while (joinTimes.length && joinTimes[0] < cutoff) joinTimes.shift();
}

export function pushMessage(userId: string, nowMs: number, keepMs = 30_000): number[] {
  const arr = messageTimes.get(userId) ?? [];
  arr.push(nowMs);
  const cutoff = nowMs - keepMs;
  while (arr.length && arr[0] < cutoff) arr.shift();
  messageTimes.set(userId, arr);
  return arr;
}
