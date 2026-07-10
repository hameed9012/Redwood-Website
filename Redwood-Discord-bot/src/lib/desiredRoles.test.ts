import { describe, it, expect } from 'vitest';
import { desiredRoleIds } from './desiredRoles';
import { buildConfig } from './config';

const cfg = buildConfig({
  DISCORD_TOKEN: 't', DISCORD_CLIENT_ID: 'c', GUILD_ID: 'g', SUPABASE_URL: 'u', SUPABASE_SERVICE_KEY: 'k',
  ROLE_RANK_TRAINEE: 'r1', ROLE_RANK_EMPLOYEE: 'r2', ROLE_RANK_SUPERVISOR: 'r3', ROLE_RANK_HIGH_COMMAND: 'r4',
  ROLE_DIV_SECURITY: 'd1', ROLE_DIV_RESEARCH: 'd2', ROLE_DIV_INTELLIGENCE: 'd3',
  ROLE_POS_TRAINEE_INSTRUCTOR: 'p1', ROLE_POS_INTERNAL_AFFAIRS: 'p2', ROLE_POS_REPRESENTATIVE: 'p3', ROLE_POS_MEDIA_RELATIONS: 'p4',
  CHANNEL_SECURITY: 's', CHANNEL_HIGH_COMMAND: 'h',
});

describe('desiredRoleIds', () => {
  it('is exactly the rank + division + position roles for a member', () => {
    const ids = desiredRoleIds({
      discordId: '1', employeeName: 'X', rank: 'supervisor',
      divisions: ['security', 'research'], positions: ['internal-affairs'],
      status: 'active', joinedAt: '', updatedAt: '',
    }, cfg);
    expect(new Set(ids)).toEqual(new Set(['r3', 'd1', 'd2', 'p2']));
  });

  it('is just the rank role for a bare member', () => {
    const ids = desiredRoleIds({
      discordId: '1', employeeName: 'X', rank: 'trainee', divisions: [], positions: [],
      status: 'active', joinedAt: '', updatedAt: '',
    }, cfg);
    expect(ids).toEqual(['r1']);
  });
});
