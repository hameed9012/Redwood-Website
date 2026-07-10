export function shiftDurationMinutes(startedAt: string, endedAt: string): number {
  const ms = Date.parse(endedAt) - Date.parse(startedAt);
  return ms > 0 ? Math.floor(ms / 60000) : 0;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
