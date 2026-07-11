export type Rank = 'trainee' | 'employee' | 'supervisor' | 'high-command';
export type Division = 'security' | 'research' | 'intelligence';
export type Position = 'trainee-instructor' | 'internal-affairs' | 'representative' | 'media-relations';

export const RANKS: readonly Rank[] = ['trainee', 'employee', 'supervisor', 'high-command'];

export const RANK_LABEL: Record<Rank, string> = {
  trainee: 'Trainee',
  employee: 'Employee',
  supervisor: 'Supervisor',
  'high-command': 'High Command',
};

export const DIVISION_LABEL: Record<Division, string> = {
  security: 'Security Division',
  research: 'Research Division',
  intelligence: 'Intelligence Division',
};

export const POSITION_LABEL: Record<Position, string> = {
  'trainee-instructor': 'Trainee Instructor',
  'internal-affairs': 'Internal Affairs',
  representative: 'Representative',
  'media-relations': 'Media Relations',
};
