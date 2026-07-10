import { describe, it, expect } from 'vitest';
import { buildConfig, ConfigError } from './config';

const full: Record<string, string> = {
  DISCORD_TOKEN: 't', DISCORD_CLIENT_ID: 'c', GUILD_ID: 'g',
  SUPABASE_URL: 'u', SUPABASE_SERVICE_KEY: 'k',
  ROLE_RANK_TRAINEE: '1', ROLE_RANK_EMPLOYEE: '2', ROLE_RANK_SUPERVISOR: '3', ROLE_RANK_HIGH_COMMAND: '4',
  ROLE_DIV_SECURITY: '5', ROLE_DIV_RESEARCH: '6', ROLE_DIV_INTELLIGENCE: '7',
  ROLE_POS_TRAINEE_INSTRUCTOR: '8', ROLE_POS_INTERNAL_AFFAIRS: '9', ROLE_POS_REPRESENTATIVE: '10', ROLE_POS_MEDIA_RELATIONS: '11',
  CHANNEL_SECURITY: 's', CHANNEL_HIGH_COMMAND: 'h', DEADMAN_INTERVAL_HOURS: '48',
};

describe('buildConfig', () => {
  it('maps env into a typed config with role lookups', () => {
    const cfg = buildConfig(full);
    expect(cfg.roleForRank['high-command']).toBe('4');
    expect(cfg.roleForDivision['research']).toBe('6');
    expect(cfg.roleForPosition['internal-affairs']).toBe('9');
    expect(cfg.deadmanIntervalHours).toBe(48);
  });

  it('throws ConfigError listing every missing key', () => {
    expect(() => buildConfig({ ...full, DISCORD_TOKEN: '', GUILD_ID: '' })).toThrow(ConfigError);
    try {
      buildConfig({ ...full, DISCORD_TOKEN: '', GUILD_ID: '' });
    } catch (e) {
      expect((e as Error).message).toContain('DISCORD_TOKEN');
      expect((e as Error).message).toContain('GUILD_ID');
    }
  });

  it('defaults DEADMAN_INTERVAL_HOURS to 48 when absent', () => {
    const { DEADMAN_INTERVAL_HOURS, ...rest } = full;
    expect(buildConfig(rest).deadmanIntervalHours).toBe(48);
  });
});
