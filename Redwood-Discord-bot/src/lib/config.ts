import type { Rank, Division, Position } from './ranks';

export class ConfigError extends Error {}

const REQUIRED = [
  'DISCORD_TOKEN', 'DISCORD_CLIENT_ID', 'GUILD_ID',
  'SUPABASE_URL', 'SUPABASE_SERVICE_KEY',
  'ROLE_RANK_TRAINEE', 'ROLE_RANK_EMPLOYEE', 'ROLE_RANK_SUPERVISOR', 'ROLE_RANK_HIGH_COMMAND',
  'ROLE_DIV_SECURITY', 'ROLE_DIV_RESEARCH', 'ROLE_DIV_INTELLIGENCE',
  'ROLE_POS_TRAINEE_INSTRUCTOR', 'ROLE_POS_INTERNAL_AFFAIRS', 'ROLE_POS_REPRESENTATIVE', 'ROLE_POS_MEDIA_RELATIONS',
  'CHANNEL_SECURITY', 'CHANNEL_HIGH_COMMAND',
] as const;

export interface BotConfig {
  discordToken: string;
  discordClientId: string;
  guildId: string;
  supabaseUrl: string;
  supabaseServiceKey: string;
  roleForRank: Record<Rank, string>;
  roleForDivision: Record<Division, string>;
  roleForPosition: Record<Position, string>;
  channelSecurity: string;
  channelHighCommand: string;
  deadmanIntervalHours: number;
}

export function buildConfig(env: Record<string, string | undefined>): BotConfig {
  const missing = REQUIRED.filter((k) => !env[k]);
  if (missing.length) {
    throw new ConfigError(`Missing required env vars: ${missing.join(', ')}`);
  }
  return {
    discordToken: env.DISCORD_TOKEN!,
    discordClientId: env.DISCORD_CLIENT_ID!,
    guildId: env.GUILD_ID!,
    supabaseUrl: env.SUPABASE_URL!,
    supabaseServiceKey: env.SUPABASE_SERVICE_KEY!,
    roleForRank: {
      trainee: env.ROLE_RANK_TRAINEE!,
      employee: env.ROLE_RANK_EMPLOYEE!,
      supervisor: env.ROLE_RANK_SUPERVISOR!,
      'high-command': env.ROLE_RANK_HIGH_COMMAND!,
    },
    roleForDivision: {
      security: env.ROLE_DIV_SECURITY!,
      research: env.ROLE_DIV_RESEARCH!,
      intelligence: env.ROLE_DIV_INTELLIGENCE!,
    },
    roleForPosition: {
      'trainee-instructor': env.ROLE_POS_TRAINEE_INSTRUCTOR!,
      'internal-affairs': env.ROLE_POS_INTERNAL_AFFAIRS!,
      representative: env.ROLE_POS_REPRESENTATIVE!,
      'media-relations': env.ROLE_POS_MEDIA_RELATIONS!,
    },
    channelSecurity: env.CHANNEL_SECURITY!,
    channelHighCommand: env.CHANNEL_HIGH_COMMAND!,
    deadmanIntervalHours: Number(env.DEADMAN_INTERVAL_HOURS ?? '48'),
  };
}

let cached: BotConfig | null = null;
/** Loads .env once (call after dotenv.config()). */
export function config(): BotConfig {
  if (!cached) cached = buildConfig(process.env);
  return cached;
}
