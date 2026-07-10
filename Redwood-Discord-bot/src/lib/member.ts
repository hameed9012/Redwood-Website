import type { Rank, Division, Position } from './ranks';

export interface Member {
  discordId: string;
  employeeName: string;
  rank: Rank;
  divisions: Division[];
  positions: Position[];
  status: 'active' | 'dismissed';
  joinedAt: string; // ISO
  updatedAt: string; // ISO
}
