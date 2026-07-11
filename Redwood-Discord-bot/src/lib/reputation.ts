export interface ReputationLite {
  discordId: string;
  kind: 'commendation' | 'writeup';
  reason: string;
  createdAt: string;
}

export interface Standing {
  commendations: number;
  writeups: number;
  recent: string[];
}

export function summarizeReputation(rows: ReputationLite[]): Standing {
  const sorted = [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return {
    commendations: rows.filter((r) => r.kind === 'commendation').length,
    writeups: rows.filter((r) => r.kind === 'writeup').length,
    recent: sorted.slice(0, 3).map((r) => `${r.kind === 'commendation' ? '✔' : '⚠'} ${r.reason}`),
  };
}
