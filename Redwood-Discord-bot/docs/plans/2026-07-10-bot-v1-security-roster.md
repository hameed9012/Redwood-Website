# Redwood Peak Bot v1 ("Security & Roster") — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first slice of the Redwood Peak Discord bot — the org's rank/division/position roster with a live auto-updating roster message, role-sync, clearance-gated roles, a security suite, and the company persona.

**Architecture:** discord.js v14 + TypeScript. Every command/event is a thin Discord adapter over a **pure logic module** (ranks, roster-tree renderer, permission checks, security heuristics), so the decision/rendering logic is fully unit-tested with vitest while the Discord/Supabase I/O is smoke-tested live by the user. Shared Supabase (service-role) is the source of truth for the roster. All roster mutations go through one `applyRosterChange` helper that enforces a role-sync invariant, writes the DB, logs an audit row, and redraws the live roster message.

**Tech Stack:** TypeScript (Node ≥ 20), discord.js v14, @supabase/supabase-js, dotenv, vitest.

**Spec:** `Redwood-Discord-bot/docs/specs/2026-07-10-bot-v1-security-roster-design.md`

**All paths below are relative to `Redwood-Discord-bot/`.** Run all commands from inside that folder.

**Environment note:** a Discord gateway can't run in the build environment. Tasks that create pure logic are TDD'd and verified with `npx vitest run`. Tasks that create Discord/Supabase I/O are verified with `npx tsc --noEmit` (compiles) and are smoke-tested by the user on their Ubuntu server. Commit after every task.

---

### Task 1: Scaffold the project

**Files:**
- Create: `Redwood-Discord-bot/package.json`
- Create: `Redwood-Discord-bot/tsconfig.json`
- Create: `Redwood-Discord-bot/vitest.config.ts`
- Create: `Redwood-Discord-bot/.gitignore`
- Create: `Redwood-Discord-bot/.env.example`
- Create: `Redwood-Discord-bot/src/index.ts` (temporary stub)

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "redwood-peak-bot",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=20" },
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx src/index.ts",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "discord.js": "^14.16.0",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "tsx": "^4.16.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": false,
    "sourceMap": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 4: Create `.gitignore`**

```gitignore
node_modules/
dist/
.env
*.log
```

- [ ] **Step 5: Create `.env.example`**

```dotenv
# Discord
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
GUILD_ID=

# Supabase (service-role key — server-side only, never in a browser)
SUPABASE_URL=
SUPABASE_SERVICE_KEY=

# Rank roles
ROLE_RANK_TRAINEE=
ROLE_RANK_EMPLOYEE=
ROLE_RANK_SUPERVISOR=
ROLE_RANK_HIGH_COMMAND=

# Division roles
ROLE_DIV_SECURITY=
ROLE_DIV_RESEARCH=
ROLE_DIV_INTELLIGENCE=

# Position roles
ROLE_POS_TRAINEE_INSTRUCTOR=
ROLE_POS_INTERNAL_AFFAIRS=
ROLE_POS_REPRESENTATIVE=
ROLE_POS_MEDIA_RELATIONS=

# Channels
CHANNEL_SECURITY=
CHANNEL_HIGH_COMMAND=

# Security
DEADMAN_INTERVAL_HOURS=48
```

- [ ] **Step 6: Create temporary `src/index.ts`**

```ts
console.log('Redwood Peak bot — scaffold');
```

- [ ] **Step 7: Install dependencies**

Run: `npm install`
Expected: dependencies install, `node_modules/` created.

- [ ] **Step 8: Verify build + test harness**

Run: `npm run typecheck && npx vitest run --passWithNoTests`
Expected: tsc exits 0; vitest reports no test files, passes.

- [ ] **Step 9: Commit**

```bash
git add Redwood-Discord-bot/package.json Redwood-Discord-bot/package-lock.json Redwood-Discord-bot/tsconfig.json Redwood-Discord-bot/vitest.config.ts Redwood-Discord-bot/.gitignore Redwood-Discord-bot/.env.example Redwood-Discord-bot/src/index.ts
git commit -m "chore(bot): scaffold TS + discord.js + supabase + vitest"
```

---

### Task 2: Ranks, divisions, positions (pure logic)

**Files:**
- Create: `src/lib/ranks.ts`
- Test: `src/lib/ranks.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/ranks.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import {
  RANKS, RANK_LABEL, rankOrder, nextRank, prevRank,
  isRank, isDivision, isPosition,
  DIVISIONS, POSITIONS,
} from './ranks';

describe('ranks', () => {
  it('orders trainee < employee < supervisor < high-command', () => {
    expect(rankOrder('trainee')).toBeLessThan(rankOrder('employee'));
    expect(rankOrder('employee')).toBeLessThan(rankOrder('supervisor'));
    expect(rankOrder('supervisor')).toBeLessThan(rankOrder('high-command'));
  });

  it('nextRank / prevRank walk the ladder and clamp at the ends', () => {
    expect(nextRank('trainee')).toBe('employee');
    expect(nextRank('high-command')).toBeNull();
    expect(prevRank('employee')).toBe('trainee');
    expect(prevRank('trainee')).toBeNull();
  });

  it('has a label for every rank/division/position', () => {
    for (const r of RANKS) expect(RANK_LABEL[r]).toBeTruthy();
    expect(RANK_LABEL['high-command']).toBe('High Command');
    expect(DIVISIONS).toContain('research');
    expect(POSITIONS).toContain('internal-affairs');
  });

  it('type guards accept valid values and reject junk', () => {
    expect(isRank('supervisor')).toBe(true);
    expect(isRank('ceo')).toBe(false);
    expect(isDivision('security')).toBe(true);
    expect(isDivision('marketing')).toBe(false);
    expect(isPosition('media-relations')).toBe(true);
    expect(isPosition('janitor')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/ranks.test.ts`
Expected: FAIL — cannot find module `./ranks`.

- [ ] **Step 3: Write the implementation**

`src/lib/ranks.ts`:
```ts
export const RANKS = ['trainee', 'employee', 'supervisor', 'high-command'] as const;
export type Rank = (typeof RANKS)[number];

export const DIVISIONS = ['security', 'research', 'intelligence'] as const;
export type Division = (typeof DIVISIONS)[number];

export const POSITIONS = [
  'trainee-instructor',
  'internal-affairs',
  'representative',
  'media-relations',
] as const;
export type Position = (typeof POSITIONS)[number];

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

export function rankOrder(r: Rank): number {
  return RANKS.indexOf(r);
}

export function nextRank(r: Rank): Rank | null {
  const i = RANKS.indexOf(r);
  return i < RANKS.length - 1 ? RANKS[i + 1] : null;
}

export function prevRank(r: Rank): Rank | null {
  const i = RANKS.indexOf(r);
  return i > 0 ? RANKS[i - 1] : null;
}

export const isRank = (v: unknown): v is Rank => typeof v === 'string' && (RANKS as readonly string[]).includes(v);
export const isDivision = (v: unknown): v is Division => typeof v === 'string' && (DIVISIONS as readonly string[]).includes(v);
export const isPosition = (v: unknown): v is Position => typeof v === 'string' && (POSITIONS as readonly string[]).includes(v);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/ranks.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/ranks.ts src/lib/ranks.test.ts
git commit -m "feat(bot): ranks/divisions/positions pure logic + tests"
```

---

### Task 3: The Member type

**Files:**
- Create: `src/lib/member.ts`

- [ ] **Step 1: Create the shared Member type**

`src/lib/member.ts`:
```ts
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
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/lib/member.ts
git commit -m "feat(bot): Member type"
```

---

### Task 4: Roster tree renderer (pure logic — the live message body)

**Files:**
- Create: `src/lib/rosterTree.ts`
- Test: `src/lib/rosterTree.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/rosterTree.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { renderRoster } from './rosterTree';
import type { Member } from './member';

const m = (over: Partial<Member>): Member => ({
  discordId: '1', employeeName: 'X', rank: 'employee', divisions: [], positions: [],
  status: 'active', joinedAt: '', updatedAt: '', ...over,
});

describe('renderRoster', () => {
  it('groups active members by rank, high-command first', () => {
    const out = renderRoster([
      m({ employeeName: 'Marla Vane', rank: 'high-command', divisions: ['security', 'intelligence'], positions: ['internal-affairs'] }),
      m({ employeeName: 'S. Okafor', rank: 'employee', divisions: ['security'] }),
      m({ employeeName: 'D. Rourke', rank: 'supervisor', divisions: ['research'], positions: ['trainee-instructor'] }),
    ]);
    const hc = out.indexOf('High Command');
    const sup = out.indexOf('Supervisor');
    const emp = out.indexOf('Employee');
    const tra = out.indexOf('Trainee');
    expect(hc).toBeGreaterThan(-1);
    expect(hc).toBeLessThan(sup);
    expect(sup).toBeLessThan(emp);
    expect(emp).toBeLessThan(tra);
    expect(out).toContain('Marla Vane — Security Division, Intelligence Division  [Internal Affairs]');
    expect(out).toContain('D. Rourke — Research Division  [Trainee Instructor]');
    expect(out).toContain('S. Okafor — Security Division');
  });

  it('shows (none) for an empty rank and omits dismissed members', () => {
    const out = renderRoster([m({ employeeName: 'Ghost', status: 'dismissed', rank: 'employee' })]);
    expect(out).toContain('Trainee\n └─ (none)');
    expect(out).not.toContain('Ghost');
  });

  it('renders a member with no divisions/positions as just the name', () => {
    const out = renderRoster([m({ employeeName: 'Plain', rank: 'trainee' })]);
    expect(out).toContain('└─ Plain');
    expect(out).not.toContain('Plain —');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/rosterTree.test.ts`
Expected: FAIL — cannot find module `./rosterTree`.

- [ ] **Step 3: Write the implementation**

`src/lib/rosterTree.ts`:
```ts
import { RANKS, RANK_LABEL, DIVISION_LABEL, POSITION_LABEL, type Rank } from './ranks';
import type { Member } from './member';

function memberLine(member: Member): string {
  const divs = member.divisions.map((d) => DIVISION_LABEL[d]);
  const pos = member.positions.map((p) => POSITION_LABEL[p]);
  let line = member.employeeName;
  if (divs.length) line += ` — ${divs.join(', ')}`;
  if (pos.length) line += `  [${pos.join(', ')}]`;
  return ` └─ ${line}`;
}

/** Pure: the roster body, grouped by rank (High Command first). Dismissed members omitted. */
export function renderRoster(members: Member[]): string {
  const active = members.filter((m) => m.status === 'active');
  const ranksTopDown: Rank[] = [...RANKS].reverse();

  const blocks = ranksTopDown.map((rank) => {
    const inRank = active
      .filter((m) => m.rank === rank)
      .sort((a, b) => a.employeeName.localeCompare(b.employeeName));
    const body = inRank.length ? inRank.map(memberLine).join('\n') : ' └─ (none)';
    return `${RANK_LABEL[rank]}\n${body}`;
  });

  return `REDWOOD PEAK · ROSTER\n\n${blocks.join('\n')}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/rosterTree.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/rosterTree.ts src/lib/rosterTree.test.ts
git commit -m "feat(bot): roster-tree renderer (grouped by rank) + tests"
```

---

### Task 5: Config loader + validator

**Files:**
- Create: `src/lib/config.ts`
- Test: `src/lib/config.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/config.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/config.test.ts`
Expected: FAIL — cannot find module `./config`.

- [ ] **Step 3: Write the implementation**

`src/lib/config.ts`:
```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/config.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/config.ts src/lib/config.test.ts
git commit -m "feat(bot): env config loader + validation"
```

---

### Task 6: Permissions (pure logic)

**Files:**
- Create: `src/lib/permissions.ts`
- Test: `src/lib/permissions.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/permissions.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { hasHighCommandRole } from './permissions';

describe('hasHighCommandRole', () => {
  const hcRoleId = '4';
  it('true when the member holds the high-command role', () => {
    expect(hasHighCommandRole(['1', '4', '6'], hcRoleId)).toBe(true);
  });
  it('false when they do not', () => {
    expect(hasHighCommandRole(['1', '2'], hcRoleId)).toBe(false);
  });
  it('false for an empty role set', () => {
    expect(hasHighCommandRole([], hcRoleId)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/permissions.test.ts`
Expected: FAIL — cannot find module `./permissions`.

- [ ] **Step 3: Write the implementation**

`src/lib/permissions.ts`:
```ts
/** Pure membership check: does this list of role IDs include the high-command role? */
export function hasHighCommandRole(memberRoleIds: string[], highCommandRoleId: string): boolean {
  return memberRoleIds.includes(highCommandRoleId);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/permissions.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/permissions.ts src/lib/permissions.test.ts
git commit -m "feat(bot): high-command permission check"
```

---

### Task 7: The company voice (persona)

**Files:**
- Create: `src/lib/voice.ts`
- Test: `src/lib/voice.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/voice.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { line, HANDBOOK } from './voice';

describe('voice', () => {
  it('formats a company line with the prefix', () => {
    expect(line('ok', 'It is done.')).toBe('✔ It is done.');
    expect(line('deny', 'Above your clearance.')).toBe('⛔ Above your clearance.');
    expect(line('err', 'Something failed.')).toBe('⚠ Something failed.');
  });

  it('ships a non-empty handbook', () => {
    expect(HANDBOOK.length).toBeGreaterThan(50);
    expect(HANDBOOK).toContain('Redwood Peak');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/voice.test.ts`
Expected: FAIL — cannot find module `./voice`.

- [ ] **Step 3: Write the implementation**

`src/lib/voice.ts`:
```ts
export type Tone = 'ok' | 'deny' | 'err';

const PREFIX: Record<Tone, string> = { ok: '✔', deny: '⛔', err: '⚠' };

/** A single company-voice line with a tone prefix. */
export function line(tone: Tone, text: string): string {
  return `${PREFIX[tone]} ${text}`;
}

export const HANDBOOK = [
  '**Redwood Peak — Employee Handbook**',
  '',
  '1. Arrive on time. Sign in. Sign out. The log is not optional.',
  '2. Wear your identity above the waist and visible at all times.',
  '3. Company vehicles are for company routes. Odometers are read.',
  '4. Refer all outside inquiries to your associate. Do not improvise.',
  '5. If you are asked what we transport, the answer is industrial solvent.',
  '6. Your movements are recorded. This is for your protection.',
  '7. What is written down is written carefully. What is not written down did not happen.',
  '',
  '_Thank you for your cooperation._',
].join('\n');
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/voice.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/voice.ts src/lib/voice.test.ts
git commit -m "feat(bot): company voice + employee handbook"
```

---

### Task 8: Security heuristics (pure logic)

**Files:**
- Create: `src/security/heuristics.ts`
- Test: `src/security/heuristics.test.ts`

- [ ] **Step 1: Write the failing test**

`src/security/heuristics.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { isRaid, isSpam, isSuspiciousAccount, isDeadmanLapsed } from './heuristics';

describe('security heuristics', () => {
  it('isRaid: too many joins in the window', () => {
    const now = 10_000;
    const joins = [9800, 9850, 9900, 9950]; // 4 in the last 500ms
    expect(isRaid(joins, now, { threshold: 3, windowSeconds: 1 })).toBe(true);
    expect(isRaid([9800], now, { threshold: 3, windowSeconds: 1 })).toBe(false);
  });

  it('isRaid: ignores joins older than the window', () => {
    const now = 100_000;
    const joins = [1000, 2000, 3000, 99_900]; // only 1 recent
    expect(isRaid(joins, now, { threshold: 3, windowSeconds: 1 })).toBe(false);
  });

  it('isSpam: message rate over the window', () => {
    const now = 10_000;
    const stamps = [9700, 9800, 9900, 9950, 9990];
    expect(isSpam(stamps, now, { threshold: 5, windowSeconds: 1 })).toBe(true);
    expect(isSpam(stamps.slice(0, 3), now, { threshold: 5, windowSeconds: 1 })).toBe(false);
  });

  it('isSuspiciousAccount: newer than the minimum age', () => {
    const now = Date.now();
    const day = 86_400_000;
    expect(isSuspiciousAccount(now - 2 * day, now, 7)).toBe(true);
    expect(isSuspiciousAccount(now - 30 * day, now, 7)).toBe(false);
  });

  it('isDeadmanLapsed: deadline in the past', () => {
    expect(isDeadmanLapsed(1000, 2000)).toBe(true);
    expect(isDeadmanLapsed(3000, 2000)).toBe(false);
    expect(isDeadmanLapsed(null, 2000)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/security/heuristics.test.ts`
Expected: FAIL — cannot find module `./heuristics`.

- [ ] **Step 3: Write the implementation**

`src/security/heuristics.ts`:
```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/security/heuristics.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/security/heuristics.ts src/security/heuristics.test.ts
git commit -m "feat(bot): security heuristics (raid/spam/alt/deadman) + tests"
```

---

### Task 9: Database schema + repositories

**Files:**
- Create: `db/schema.sql`
- Create: `src/lib/supabase.ts`
- Create: `src/db/members.ts`
- Create: `src/db/events.ts`
- Create: `src/db/config.ts`

- [ ] **Step 1: Create `db/schema.sql`**

```sql
-- Redwood Peak bot v1 — run once in the Supabase SQL editor.
create extension if not exists "pgcrypto";

create table if not exists public.members (
  discord_id    text primary key,
  employee_name text not null,
  rank          text not null check (rank in ('trainee','employee','supervisor','high-command')),
  divisions     text[] not null default '{}',
  positions     text[] not null default '{}',
  status        text not null default 'active' check (status in ('active','dismissed')),
  joined_at     timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.roster_events (
  id                uuid primary key default gen_random_uuid(),
  actor_discord_id  text not null,
  target_discord_id text not null,
  action            text not null,
  detail            text,
  at                timestamptz not null default now()
);

create table if not exists public.roster_config (
  guild_id   text primary key,
  channel_id text,
  message_id text
);

create table if not exists public.security_config (
  guild_id             text primary key,
  lockdown             boolean not null default false,
  deadman_deadline     timestamptz,
  raid_join_threshold  int not null default 5,
  raid_window_seconds  int not null default 10,
  spam_msg_threshold   int not null default 6,
  spam_window_seconds  int not null default 5,
  min_account_age_days int not null default 7
);

-- Bot uses the SERVICE ROLE key (bypasses RLS). Enable RLS with NO anon policies
-- so the public/browser key can never read or write these tables.
alter table public.members         enable row level security;
alter table public.roster_events   enable row level security;
alter table public.roster_config   enable row level security;
alter table public.security_config enable row level security;
```

- [ ] **Step 2: Create the Supabase client `src/lib/supabase.ts`**

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from './config';

let client: SupabaseClient | null = null;

/** Service-role Supabase client. Server-side only — never expose this key to a browser. */
export function db(): SupabaseClient {
  if (!client) {
    const cfg = config();
    client = createClient(cfg.supabaseUrl, cfg.supabaseServiceKey, {
      auth: { persistSession: false },
    });
  }
  return client;
}
```

- [ ] **Step 3: Create `src/db/members.ts`**

```ts
import { db } from '../lib/supabase';
import type { Member } from '../lib/member';
import type { Rank, Division, Position } from '../lib/ranks';

interface Row {
  discord_id: string;
  employee_name: string;
  rank: Rank;
  divisions: Division[];
  positions: Position[];
  status: 'active' | 'dismissed';
  joined_at: string;
  updated_at: string;
}

const toMember = (r: Row): Member => ({
  discordId: r.discord_id,
  employeeName: r.employee_name,
  rank: r.rank,
  divisions: r.divisions ?? [],
  positions: r.positions ?? [],
  status: r.status,
  joinedAt: r.joined_at,
  updatedAt: r.updated_at,
});

export async function getMember(discordId: string): Promise<Member | null> {
  const { data, error } = await db().from('members').select('*').eq('discord_id', discordId).maybeSingle();
  if (error) throw error;
  return data ? toMember(data as Row) : null;
}

export async function listActiveMembers(): Promise<Member[]> {
  const { data, error } = await db().from('members').select('*').eq('status', 'active');
  if (error) throw error;
  return (data as Row[]).map(toMember);
}

export async function upsertMember(m: Member): Promise<void> {
  const { error } = await db().from('members').upsert({
    discord_id: m.discordId,
    employee_name: m.employeeName,
    rank: m.rank,
    divisions: m.divisions,
    positions: m.positions,
    status: m.status,
    joined_at: m.joinedAt,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
```

- [ ] **Step 4: Create `src/db/events.ts`**

```ts
import { db } from '../lib/supabase';

export async function logRosterEvent(
  actorDiscordId: string,
  targetDiscordId: string,
  action: string,
  detail?: string,
): Promise<void> {
  const { error } = await db().from('roster_events').insert({
    actor_discord_id: actorDiscordId,
    target_discord_id: targetDiscordId,
    action,
    detail: detail ?? null,
  });
  if (error) throw error;
}
```

- [ ] **Step 5: Create `src/db/config.ts`**

```ts
import { db } from '../lib/supabase';

export interface RosterConfig { channelId: string | null; messageId: string | null; }

export async function getRosterConfig(guildId: string): Promise<RosterConfig> {
  const { data, error } = await db().from('roster_config').select('*').eq('guild_id', guildId).maybeSingle();
  if (error) throw error;
  return { channelId: data?.channel_id ?? null, messageId: data?.message_id ?? null };
}

export async function setRosterConfig(guildId: string, channelId: string, messageId: string): Promise<void> {
  const { error } = await db().from('roster_config').upsert({ guild_id: guildId, channel_id: channelId, message_id: messageId });
  if (error) throw error;
}

export interface SecurityConfig {
  lockdown: boolean;
  deadmanDeadline: string | null;
  raidJoinThreshold: number;
  raidWindowSeconds: number;
  spamMsgThreshold: number;
  spamWindowSeconds: number;
  minAccountAgeDays: number;
}

const DEFAULT_SECURITY: Omit<SecurityConfig, 'lockdown' | 'deadmanDeadline'> = {
  raidJoinThreshold: 5, raidWindowSeconds: 10, spamMsgThreshold: 6, spamWindowSeconds: 5, minAccountAgeDays: 7,
};

export async function getSecurityConfig(guildId: string): Promise<SecurityConfig> {
  const { data, error } = await db().from('security_config').select('*').eq('guild_id', guildId).maybeSingle();
  if (error) throw error;
  if (!data) return { lockdown: false, deadmanDeadline: null, ...DEFAULT_SECURITY };
  return {
    lockdown: data.lockdown,
    deadmanDeadline: data.deadman_deadline,
    raidJoinThreshold: data.raid_join_threshold,
    raidWindowSeconds: data.raid_window_seconds,
    spamMsgThreshold: data.spam_msg_threshold,
    spamWindowSeconds: data.spam_window_seconds,
    minAccountAgeDays: data.min_account_age_days,
  };
}

export async function setLockdown(guildId: string, on: boolean): Promise<void> {
  const { error } = await db().from('security_config').upsert({ guild_id: guildId, lockdown: on });
  if (error) throw error;
}

export async function setDeadmanDeadline(guildId: string, deadlineIso: string): Promise<void> {
  const { error } = await db().from('security_config').upsert({ guild_id: guildId, deadman_deadline: deadlineIso });
  if (error) throw error;
}
```

- [ ] **Step 6: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 7: Commit**

```bash
git add db/schema.sql src/lib/supabase.ts src/db/
git commit -m "feat(bot): supabase schema + member/event/config repositories"
```

---

### Task 10: Desired-roles helper + roster render (I/O)

**Files:**
- Create: `src/lib/desiredRoles.ts`
- Test: `src/lib/desiredRoles.test.ts`
- Create: `src/roster/render.ts`

- [ ] **Step 1: Write the failing test (pure part)**

`src/lib/desiredRoles.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/desiredRoles.test.ts`
Expected: FAIL — cannot find module `./desiredRoles`.

- [ ] **Step 3: Write `src/lib/desiredRoles.ts`**

```ts
import type { Member } from './member';
import type { BotConfig } from './config';

/** Pure: the exact set of bot-managed role IDs a member should have (rank + divisions + positions). */
export function desiredRoleIds(member: Member, cfg: BotConfig): string[] {
  return [
    cfg.roleForRank[member.rank],
    ...member.divisions.map((d) => cfg.roleForDivision[d]),
    ...member.positions.map((p) => cfg.roleForPosition[p]),
  ];
}

/** All role IDs the bot manages (every rank + division + position). Used to know what to strip. */
export function allManagedRoleIds(cfg: BotConfig): string[] {
  return [
    ...Object.values(cfg.roleForRank),
    ...Object.values(cfg.roleForDivision),
    ...Object.values(cfg.roleForPosition),
  ];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/desiredRoles.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Write `src/roster/render.ts` (I/O — renders the live roster message)**

```ts
import type { Guild } from 'discord.js';
import { renderRoster } from '../lib/rosterTree';
import { listActiveMembers } from '../db/members';
import { getRosterConfig } from '../db/config';

/** Rebuild the live roster message from the DB. No-op if roster hasn't been set up. */
export async function redrawRoster(guild: Guild): Promise<void> {
  const cfg = await getRosterConfig(guild.id);
  if (!cfg.channelId || !cfg.messageId) return;
  const channel = await guild.channels.fetch(cfg.channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;
  const message = await channel.messages.fetch(cfg.messageId).catch(() => null);
  if (!message) return;
  const body = renderRoster(await listActiveMembers());
  await message.edit('```\n' + body + '\n```');
}
```

- [ ] **Step 6: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 7: Commit**

```bash
git add src/lib/desiredRoles.ts src/lib/desiredRoles.test.ts src/roster/render.ts
git commit -m "feat(bot): desired-roles helper + live roster render"
```

---

### Task 11: The roster-change engine (the role-sync invariant)

**Files:**
- Create: `src/roster/apply.ts`

- [ ] **Step 1: Write `src/roster/apply.ts`**

```ts
import type { Guild, GuildMember } from 'discord.js';
import type { Member } from '../lib/member';
import { config } from '../lib/config';
import { desiredRoleIds, allManagedRoleIds } from '../lib/desiredRoles';
import { upsertMember } from '../db/members';
import { logRosterEvent } from '../db/events';
import { redrawRoster } from './render';

/**
 * The single path every roster mutation goes through. Given the member's NEXT
 * state, it: (1) sets the Discord roles to exactly {rank} ∪ {divisions} ∪
 * {positions} (the role-sync invariant), (2) sets the nickname to the employee
 * name, (3) upserts the DB, (4) logs an audit row, (5) redraws the live roster.
 */
export async function applyRosterChange(
  guild: Guild,
  target: GuildMember,
  next: Member,
  actorDiscordId: string,
  action: string,
  detail?: string,
): Promise<void> {
  const cfg = config();

  if (next.status === 'active') {
    const desired = new Set(desiredRoleIds(next, cfg));
    const managed = allManagedRoleIds(cfg);
    // Add desired managed roles the member lacks; remove managed roles not desired.
    const toAdd = [...desired].filter((id) => !target.roles.cache.has(id));
    const toRemove = managed.filter((id) => !desired.has(id) && target.roles.cache.has(id));
    if (toAdd.length) await target.roles.add(toAdd);
    if (toRemove.length) await target.roles.remove(toRemove);
    await target.setNickname(next.employeeName).catch(() => {}); // may fail on owner/higher roles
  } else {
    // dismissed — strip all managed roles
    const managed = allManagedRoleIds(cfg).filter((id) => target.roles.cache.has(id));
    if (managed.length) await target.roles.remove(managed);
  }

  await upsertMember(next);
  await logRosterEvent(actorDiscordId, next.discordId, action, detail);
  await redrawRoster(guild);
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/roster/apply.ts
git commit -m "feat(bot): applyRosterChange engine (role-sync invariant)"
```

---

### Task 12: The command framework + `/help`

**Files:**
- Create: `src/commands/types.ts`
- Create: `src/commands/index.ts` (command registry)
- Create: `src/commands/help.ts`

- [ ] **Step 1: Create `src/commands/types.ts`**

```ts
import type { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder, SlashCommandOptionsOnlyBuilder } from 'discord.js';

export interface Command {
  data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | SlashCommandOptionsOnlyBuilder;
  /** true = only high-command may run it (checked centrally before execute). */
  highCommandOnly: boolean;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
}
```

- [ ] **Step 2: Create `src/commands/help.ts`**

```ts
import { SlashCommandBuilder } from 'discord.js';
import type { Command } from './types';
import { HANDBOOK } from '../lib/voice';

export const help: Command = {
  data: new SlashCommandBuilder().setName('help').setDescription('The Redwood Peak employee handbook.'),
  highCommandOnly: false,
  async execute(interaction) {
    await interaction.reply({ content: HANDBOOK, ephemeral: true });
  },
};
```

- [ ] **Step 3: Create `src/commands/index.ts` (registry — grows as commands are added)**

```ts
import type { Command } from './types';
import { help } from './help';

export const commands: Command[] = [help];

export const commandMap = new Map(commands.map((c) => [c.data.name, c]));
```

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/commands/types.ts src/commands/index.ts src/commands/help.ts
git commit -m "feat(bot): command framework + /help handbook"
```

---

### Task 13: Roster commands

**Files:**
- Create: `src/commands/roster.ts`
- Modify: `src/commands/index.ts`

- [ ] **Step 1: Create `src/commands/roster.ts`**

This file defines every roster command. Each parses args, loads/derives the next `Member`, and calls `applyRosterChange`. Reply lines use `voice.line`.

```ts
import { SlashCommandBuilder, type ChatInputCommandInteraction, type GuildMember } from 'discord.js';
import type { Command } from './types';
import { line } from '../lib/voice';
import { RANKS, DIVISIONS, POSITIONS, RANK_LABEL, DIVISION_LABEL, POSITION_LABEL, nextRank, prevRank, isRank, isDivision, isPosition, type Rank, type Division, type Position } from '../lib/ranks';
import type { Member } from '../lib/member';
import { getMember } from '../db/members';
import { applyRosterChange } from '../roster/apply';

async function targetMember(interaction: ChatInputCommandInteraction): Promise<GuildMember | null> {
  const user = interaction.options.getUser('user', true);
  return interaction.guild!.members.fetch(user.id).catch(() => null);
}

function newMember(discordId: string, employeeName: string, rank: Rank): Member {
  const now = new Date().toISOString();
  return { discordId, employeeName, rank, divisions: [], positions: [], status: 'active', joinedAt: now, updatedAt: now };
}

const hire: Command = {
  highCommandOnly: true,
  data: new SlashCommandBuilder().setName('hire').setDescription('Hire a member at a rank.')
    .addUserOption((o) => o.setName('user').setDescription('The member').setRequired(true))
    .addStringOption((o) => o.setName('rank').setDescription('Starting rank').setRequired(true)
      .addChoices(...RANKS.map((r) => ({ name: RANK_LABEL[r], value: r }))))
    .addStringOption((o) => o.setName('employee_name').setDescription('Employee name (defaults to current nickname)')) as SlashCommandBuilder,
  async execute(interaction) {
    const gm = await targetMember(interaction);
    if (!gm) return void interaction.reply({ content: line('err', 'That member is not in the server.'), ephemeral: true });
    const existing = await getMember(gm.id);
    if (existing?.status === 'active') return void interaction.reply({ content: line('deny', 'That member is already on the roster.'), ephemeral: true });
    const rank = interaction.options.getString('rank', true);
    if (!isRank(rank)) return void interaction.reply({ content: line('err', 'Unknown rank.'), ephemeral: true });
    const name = interaction.options.getString('employee_name') ?? gm.displayName;
    await applyRosterChange(interaction.guild!, gm, newMember(gm.id, name, rank), interaction.user.id, 'hire', rank);
    await interaction.reply({ content: line('ok', `Hired **${name}** as ${RANK_LABEL[rank]}. Welcome to Redwood Peak.`), ephemeral: true });
  },
};

async function moveRank(interaction: ChatInputCommandInteraction, dir: 'promote' | 'demote') {
  const gm = await targetMember(interaction);
  if (!gm) return void interaction.reply({ content: line('err', 'That member is not in the server.'), ephemeral: true });
  const m = await getMember(gm.id);
  if (!m || m.status !== 'active') return void interaction.reply({ content: line('deny', 'That member is not on the roster.'), ephemeral: true });
  const target = dir === 'promote' ? nextRank(m.rank) : prevRank(m.rank);
  if (!target) return void interaction.reply({ content: line('deny', `Cannot ${dir} past ${RANK_LABEL[m.rank]}.`), ephemeral: true });
  await applyRosterChange(interaction.guild!, gm, { ...m, rank: target }, interaction.user.id, dir, target);
  await interaction.reply({ content: line('ok', `**${m.employeeName}** is now ${RANK_LABEL[target]}.`), ephemeral: true });
}

const promote: Command = {
  highCommandOnly: true,
  data: new SlashCommandBuilder().setName('promote').setDescription('Promote a member one rank.')
    .addUserOption((o) => o.setName('user').setDescription('The member').setRequired(true)) as SlashCommandBuilder,
  execute: (i) => moveRank(i, 'promote'),
};

const demote: Command = {
  highCommandOnly: true,
  data: new SlashCommandBuilder().setName('demote').setDescription('Demote a member one rank.')
    .addUserOption((o) => o.setName('user').setDescription('The member').setRequired(true)) as SlashCommandBuilder,
  execute: (i) => moveRank(i, 'demote'),
};

const setrank: Command = {
  highCommandOnly: true,
  data: new SlashCommandBuilder().setName('setrank').setDescription('Set a member to a specific rank.')
    .addUserOption((o) => o.setName('user').setDescription('The member').setRequired(true))
    .addStringOption((o) => o.setName('rank').setDescription('Rank').setRequired(true)
      .addChoices(...RANKS.map((r) => ({ name: RANK_LABEL[r], value: r })))) as SlashCommandBuilder,
  async execute(interaction) {
    const gm = await targetMember(interaction);
    if (!gm) return void interaction.reply({ content: line('err', 'That member is not in the server.'), ephemeral: true });
    const m = await getMember(gm.id);
    if (!m || m.status !== 'active') return void interaction.reply({ content: line('deny', 'That member is not on the roster.'), ephemeral: true });
    const rank = interaction.options.getString('rank', true);
    if (!isRank(rank)) return void interaction.reply({ content: line('err', 'Unknown rank.'), ephemeral: true });
    await applyRosterChange(interaction.guild!, gm, { ...m, rank }, interaction.user.id, 'setrank', rank);
    await interaction.reply({ content: line('ok', `**${m.employeeName}** is now ${RANK_LABEL[rank]}.`), ephemeral: true });
  },
};

const division: Command = {
  highCommandOnly: true,
  data: new SlashCommandBuilder().setName('division').setDescription('Add or remove a division for a member.')
    .addStringOption((o) => o.setName('action').setDescription('add or remove').setRequired(true)
      .addChoices({ name: 'add', value: 'add' }, { name: 'remove', value: 'remove' }))
    .addUserOption((o) => o.setName('user').setDescription('The member').setRequired(true))
    .addStringOption((o) => o.setName('division').setDescription('Division').setRequired(true)
      .addChoices(...DIVISIONS.map((d) => ({ name: DIVISION_LABEL[d], value: d })))) as SlashCommandBuilder,
  async execute(interaction) {
    const gm = await targetMember(interaction);
    if (!gm) return void interaction.reply({ content: line('err', 'That member is not in the server.'), ephemeral: true });
    const m = await getMember(gm.id);
    if (!m || m.status !== 'active') return void interaction.reply({ content: line('deny', 'That member is not on the roster.'), ephemeral: true });
    const action = interaction.options.getString('action', true);
    const div = interaction.options.getString('division', true);
    if (!isDivision(div)) return void interaction.reply({ content: line('err', 'Unknown division.'), ephemeral: true });
    const set = new Set<Division>(m.divisions);
    if (action === 'add') set.add(div); else set.delete(div);
    await applyRosterChange(interaction.guild!, gm, { ...m, divisions: [...set] }, interaction.user.id, `division_${action}`, div);
    await interaction.reply({ content: line('ok', `**${m.employeeName}** ${action === 'add' ? 'joined' : 'left'} ${DIVISION_LABEL[div]}.`), ephemeral: true });
  },
};

const position: Command = {
  highCommandOnly: true,
  data: new SlashCommandBuilder().setName('position').setDescription('Add or remove a position for a member.')
    .addStringOption((o) => o.setName('action').setDescription('add or remove').setRequired(true)
      .addChoices({ name: 'add', value: 'add' }, { name: 'remove', value: 'remove' }))
    .addUserOption((o) => o.setName('user').setDescription('The member').setRequired(true))
    .addStringOption((o) => o.setName('position').setDescription('Position').setRequired(true)
      .addChoices(...POSITIONS.map((p) => ({ name: POSITION_LABEL[p], value: p })))) as SlashCommandBuilder,
  async execute(interaction) {
    const gm = await targetMember(interaction);
    if (!gm) return void interaction.reply({ content: line('err', 'That member is not in the server.'), ephemeral: true });
    const m = await getMember(gm.id);
    if (!m || m.status !== 'active') return void interaction.reply({ content: line('deny', 'That member is not on the roster.'), ephemeral: true });
    const action = interaction.options.getString('action', true);
    const pos = interaction.options.getString('position', true);
    if (!isPosition(pos)) return void interaction.reply({ content: line('err', 'Unknown position.'), ephemeral: true });
    const set = new Set<Position>(m.positions);
    if (action === 'add') set.add(pos); else set.delete(pos);
    await applyRosterChange(interaction.guild!, gm, { ...m, positions: [...set] }, interaction.user.id, `position_${action}`, pos);
    await interaction.reply({ content: line('ok', `**${m.employeeName}** ${action === 'add' ? 'given' : 'removed from'} ${POSITION_LABEL[pos]}.`), ephemeral: true });
  },
};

const dismiss: Command = {
  highCommandOnly: true,
  data: new SlashCommandBuilder().setName('dismiss').setDescription('Dismiss a member (strip standing).')
    .addUserOption((o) => o.setName('user').setDescription('The member').setRequired(true))
    .addStringOption((o) => o.setName('note').setDescription('Reason (optional)')) as SlashCommandBuilder,
  async execute(interaction) {
    const gm = await targetMember(interaction);
    if (!gm) return void interaction.reply({ content: line('err', 'That member is not in the server.'), ephemeral: true });
    const m = await getMember(gm.id);
    if (!m || m.status !== 'active') return void interaction.reply({ content: line('deny', 'That member is not on the roster.'), ephemeral: true });
    const note = interaction.options.getString('note') ?? undefined;
    await applyRosterChange(interaction.guild!, gm, { ...m, status: 'dismissed' }, interaction.user.id, 'dismiss', note);
    await interaction.reply({ content: line('ok', `**${m.employeeName}** has been dismissed.`), ephemeral: true });
  },
};

const whois: Command = {
  highCommandOnly: false,
  data: new SlashCommandBuilder().setName('whois').setDescription('Show a member\'s file.')
    .addUserOption((o) => o.setName('user').setDescription('The member').setRequired(true)) as SlashCommandBuilder,
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const m = await getMember(user.id);
    if (!m) return void interaction.reply({ content: line('err', 'No file on that member.'), ephemeral: true });
    const divs = m.divisions.map((d) => DIVISION_LABEL[d]).join(', ') || '—';
    const pos = m.positions.map((p) => POSITION_LABEL[p]).join(', ') || '—';
    await interaction.reply({
      content: [
        `**${m.employeeName}** — ${RANK_LABEL[m.rank]}${m.status === 'dismissed' ? ' (dismissed)' : ''}`,
        `Divisions: ${divs}`,
        `Positions: ${pos}`,
        `Hired: ${m.joinedAt.slice(0, 10)}`,
      ].join('\n'),
      ephemeral: true,
    });
  },
};

export const rosterCommands: Command[] = [hire, promote, demote, setrank, division, position, dismiss, whois];
```

- [ ] **Step 2: Register them in `src/commands/index.ts`**

```ts
import type { Command } from './types';
import { help } from './help';
import { rosterCommands } from './roster';

export const commands: Command[] = [help, ...rosterCommands];

export const commandMap = new Map(commands.map((c) => [c.data.name, c]));
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/commands/roster.ts src/commands/index.ts
git commit -m "feat(bot): roster commands (hire/promote/demote/setrank/division/position/dismiss/whois)"
```

---

### Task 14: `/roster-setup` and `/sync-roles`

**Files:**
- Create: `src/commands/rosterAdmin.ts`
- Modify: `src/commands/index.ts`

- [ ] **Step 1: Create `src/commands/rosterAdmin.ts`**

```ts
import { SlashCommandBuilder, ChannelType } from 'discord.js';
import type { Command } from './types';
import { line } from '../lib/voice';
import { renderRoster } from '../lib/rosterTree';
import { listActiveMembers, getMember } from '../db/members';
import { setRosterConfig } from '../db/config';
import { config } from '../lib/config';
import { desiredRoleIds, allManagedRoleIds } from '../lib/desiredRoles';
import { redrawRoster } from '../roster/render';

const rosterSetup: Command = {
  highCommandOnly: true,
  data: new SlashCommandBuilder().setName('roster-setup').setDescription('Post the live roster message in a channel.')
    .addChannelOption((o) => o.setName('channel').setDescription('Channel for the roster').addChannelTypes(ChannelType.GuildText).setRequired(true)) as SlashCommandBuilder,
  async execute(interaction) {
    const channel = interaction.options.getChannel('channel', true);
    if (channel.type !== ChannelType.GuildText) return void interaction.reply({ content: line('err', 'Pick a text channel.'), ephemeral: true });
    const body = renderRoster(await listActiveMembers());
    const msg = await channel.send('```\n' + body + '\n```');
    await setRosterConfig(interaction.guild!.id, channel.id, msg.id);
    await interaction.reply({ content: line('ok', `Roster posted in <#${channel.id}>. It will keep itself current.`), ephemeral: true });
  },
};

const syncRoles: Command = {
  highCommandOnly: true,
  data: new SlashCommandBuilder().setName('sync-roles').setDescription('Re-apply Discord roles from the roster for a member.')
    .addUserOption((o) => o.setName('user').setDescription('The member').setRequired(true)) as SlashCommandBuilder,
  async execute(interaction) {
    const cfg = config();
    const user = interaction.options.getUser('user', true);
    const m = await getMember(user.id);
    const gm = await interaction.guild!.members.fetch(user.id).catch(() => null);
    if (!m || m.status !== 'active' || !gm) return void interaction.reply({ content: line('err', 'No active file for that member.'), ephemeral: true });
    const desired = new Set(desiredRoleIds(m, cfg));
    const managed = allManagedRoleIds(cfg);
    const toAdd = [...desired].filter((id) => !gm.roles.cache.has(id));
    const toRemove = managed.filter((id) => !desired.has(id) && gm.roles.cache.has(id));
    if (toAdd.length) await gm.roles.add(toAdd);
    if (toRemove.length) await gm.roles.remove(toRemove);
    await redrawRoster(interaction.guild!);
    await interaction.reply({ content: line('ok', `Re-synced roles for **${m.employeeName}**.`), ephemeral: true });
  },
};

export const rosterAdminCommands: Command[] = [rosterSetup, syncRoles];
```

- [ ] **Step 2: Register in `src/commands/index.ts`**

```ts
import type { Command } from './types';
import { help } from './help';
import { rosterCommands } from './roster';
import { rosterAdminCommands } from './rosterAdmin';

export const commands: Command[] = [help, ...rosterCommands, ...rosterAdminCommands];

export const commandMap = new Map(commands.map((c) => [c.data.name, c]));
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/commands/rosterAdmin.ts src/commands/index.ts
git commit -m "feat(bot): /roster-setup + /sync-roles"
```

---

### Task 15: Security commands (`/lockdown`, `/deadman`)

**Files:**
- Create: `src/commands/security.ts`
- Modify: `src/commands/index.ts`

- [ ] **Step 1: Create `src/commands/security.ts`**

```ts
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command } from './types';
import { line } from '../lib/voice';
import { config } from '../lib/config';
import { setLockdown, setDeadmanDeadline } from '../db/config';

const lockdown: Command = {
  highCommandOnly: true,
  data: new SlashCommandBuilder().setName('lockdown').setDescription('Seal or unseal the site.')
    .addStringOption((o) => o.setName('state').setDescription('on or off').setRequired(true)
      .addChoices({ name: 'on', value: 'on' }, { name: 'off', value: 'off' })) as SlashCommandBuilder,
  async execute(interaction) {
    const on = interaction.options.getString('state', true) === 'on';
    const everyone = interaction.guild!.roles.everyone;
    for (const [, channel] of await interaction.guild!.channels.fetch()) {
      if (channel && channel.isTextBased() && 'permissionOverwrites' in channel) {
        await channel.permissionOverwrites.edit(everyone, { SendMessages: on ? false : null }).catch(() => {});
      }
    }
    await setLockdown(interaction.guild!.id, on);
    await interaction.reply({ content: line('ok', on ? 'The site is sealed. Unregistered personnel are denied.' : 'The site is open.'), ephemeral: false });
  },
};

const deadman: Command = {
  highCommandOnly: true,
  data: new SlashCommandBuilder().setName('deadman').setDescription('Reset the dead-man\'s switch.')
    .addSubcommand((s) => s.setName('reset').setDescription('Reset the timer.')) as SlashCommandBuilder,
  async execute(interaction) {
    const cfg = config();
    const deadline = new Date(Date.now() + cfg.deadmanIntervalHours * 3_600_000).toISOString();
    await setDeadmanDeadline(interaction.guild!.id, deadline);
    await interaction.reply({ content: line('ok', `Acknowledged. The switch is reset for ${cfg.deadmanIntervalHours}h.`), ephemeral: true });
  },
};

export const securityCommands: Command[] = [lockdown, deadman];
```

- [ ] **Step 2: Register in `src/commands/index.ts`**

```ts
import type { Command } from './types';
import { help } from './help';
import { rosterCommands } from './roster';
import { rosterAdminCommands } from './rosterAdmin';
import { securityCommands } from './security';

export const commands: Command[] = [help, ...rosterCommands, ...rosterAdminCommands, ...securityCommands];

export const commandMap = new Map(commands.map((c) => [c.data.name, c]));
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/commands/security.ts src/commands/index.ts
git commit -m "feat(bot): /lockdown + /deadman commands"
```

---

### Task 16: Events (joins, spam, mass-action) + in-memory trackers

**Files:**
- Create: `src/events/trackers.ts`
- Create: `src/events/guildMemberAdd.ts`
- Create: `src/events/messageCreate.ts`
- Create: `src/events/guildAuditLogEntryCreate.ts`

- [ ] **Step 1: Create `src/events/trackers.ts`**

```ts
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
```

- [ ] **Step 2: Create `src/events/guildMemberAdd.ts`**

```ts
import { Events, type GuildMember, type TextChannel } from 'discord.js';
import { config } from '../lib/config';
import { getSecurityConfig, setLockdown } from '../db/config';
import { isRaid, isSuspiciousAccount } from '../security/heuristics';
import { joinTimes, pushJoin } from './trackers';
import { line } from '../lib/voice';

export const name = Events.GuildMemberAdd;
export async function execute(member: GuildMember): Promise<void> {
  const cfg = config();
  const now = Date.now();
  pushJoin(now);
  const sec = await getSecurityConfig(member.guild.id);

  const securityChannel = await member.guild.channels.fetch(cfg.channelSecurity).catch(() => null);
  const alert = (msg: string) => {
    if (securityChannel && securityChannel.isTextBased()) (securityChannel as TextChannel).send(msg).catch(() => {});
  };

  if (isSuspiciousAccount(member.user.createdTimestamp, now, sec.minAccountAgeDays)) {
    alert(line('err', `Suspicious personnel at the perimeter: <@${member.id}> — account age below ${sec.minAccountAgeDays}d.`));
  }
  if (isRaid(joinTimes, now, { threshold: sec.raidJoinThreshold, windowSeconds: sec.raidWindowSeconds })) {
    await setLockdown(member.guild.id, true);
    alert(line('err', 'Raid detected. Lockdown initiated automatically.'));
  }
}
```

- [ ] **Step 3: Create `src/events/messageCreate.ts`**

```ts
import { Events, type Message, type TextChannel } from 'discord.js';
import { config } from '../lib/config';
import { getSecurityConfig } from '../db/config';
import { isSpam } from '../security/heuristics';
import { pushMessage } from './trackers';
import { line } from '../lib/voice';

export const name = Events.MessageCreate;
export async function execute(message: Message): Promise<void> {
  if (message.author.bot || !message.guild) return;
  const cfg = config();
  const now = Date.now();
  const stamps = pushMessage(message.author.id, now);
  const sec = await getSecurityConfig(message.guild.id);

  const massMention = message.mentions.users.size >= 5;
  if (massMention || isSpam(stamps, now, { threshold: sec.spamMsgThreshold, windowSeconds: sec.spamWindowSeconds })) {
    await message.member?.timeout(60_000, 'spam').catch(() => {});
    const securityChannel = await message.guild.channels.fetch(cfg.channelSecurity).catch(() => null);
    if (securityChannel && securityChannel.isTextBased()) {
      (securityChannel as TextChannel).send(line('err', `Flooding detected from <@${message.author.id}>. Timed out.`)).catch(() => {});
    }
  }
}
```

- [ ] **Step 4: Create `src/events/guildAuditLogEntryCreate.ts`**

```ts
import { Events, AuditLogEvent, type GuildAuditLogsEntry, type Guild, type TextChannel } from 'discord.js';
import { config } from '../lib/config';
import { line } from '../lib/voice';

const WATCHED = new Set<number>([
  AuditLogEvent.ChannelDelete,
  AuditLogEvent.RoleDelete,
  AuditLogEvent.MemberBanAdd,
  AuditLogEvent.MemberKick,
]);

export const name = Events.GuildAuditLogEntryCreate;
export async function execute(entry: GuildAuditLogsEntry, guild: Guild): Promise<void> {
  if (!WATCHED.has(entry.action)) return;
  const cfg = config();
  const hc = await guild.channels.fetch(cfg.channelHighCommand).catch(() => null);
  if (hc && hc.isTextBased()) {
    (hc as TextChannel).send(line('err', `Mass-action alert: <@${entry.executorId}> performed \`${AuditLogEvent[entry.action]}\`. Review advised.`)).catch(() => {});
  }
}
```

- [ ] **Step 5: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/events/
git commit -m "feat(bot): security events — raid/alt joins, spam, mass-action alerts"
```

---

### Task 17: Boot — client, command registration, interaction routing, dead-man loop

**Files:**
- Create: `src/lib/deadmanLoop.ts`
- Replace: `src/index.ts`

- [ ] **Step 1: Create `src/lib/deadmanLoop.ts`**

```ts
import type { Client, TextChannel } from 'discord.js';
import { config } from './config';
import { getSecurityConfig } from '../db/config';
import { isDeadmanLapsed } from '../security/heuristics';
import { line } from './voice';

/** Every 15 min, if the dead-man deadline has lapsed, fire a one-time purge ALERT (non-destructive). */
export function startDeadmanLoop(client: Client): void {
  let alerted = false;
  setInterval(async () => {
    const cfg = config();
    const guild = client.guilds.cache.get(cfg.guildId);
    if (!guild) return;
    const sec = await getSecurityConfig(guild.id).catch(() => null);
    if (!sec) return;
    const deadlineMs = sec.deadmanDeadline ? Date.parse(sec.deadmanDeadline) : null;
    if (isDeadmanLapsed(deadlineMs, Date.now())) {
      if (!alerted) {
        alerted = true;
        const hc = await guild.channels.fetch(cfg.channelHighCommand).catch(() => null);
        if (hc && hc.isTextBased()) {
          (hc as TextChannel).send(line('err', 'The dead-man\'s switch has lapsed. No one reset it. Reconsider.')).catch(() => {});
        }
      }
    } else {
      alerted = false;
    }
  }, 15 * 60_000);
}
```

- [ ] **Step 2: Replace `src/index.ts`**

```ts
import 'dotenv/config';
import { Client, GatewayIntentBits, REST, Routes, Events, MessageFlags } from 'discord.js';
import { config } from './lib/config';
import { commands, commandMap } from './commands/index';
import { hasHighCommandRole } from './lib/permissions';
import { line } from './lib/voice';
import { startDeadmanLoop } from './lib/deadmanLoop';
import { redrawRoster } from './roster/render';
import * as memberAdd from './events/guildMemberAdd';
import * as messageCreate from './events/messageCreate';
import * as auditLog from './events/guildAuditLogEntryCreate';

const cfg = config(); // validates env; throws with a clear message if misconfigured

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
  ],
});

async function registerCommands(): Promise<void> {
  const rest = new REST().setToken(cfg.discordToken);
  await rest.put(Routes.applicationGuildCommands(cfg.discordClientId, cfg.guildId), {
    body: commands.map((c) => c.data.toJSON()),
  });
}

client.once(Events.ClientReady, async (c) => {
  console.log(`Redwood Peak bot online as ${c.user.tag}`);
  const guild = c.guilds.cache.get(cfg.guildId);
  if (guild) await redrawRoster(guild).catch(() => {});
  startDeadmanLoop(c);
});

client.on(memberAdd.name, memberAdd.execute);
client.on(messageCreate.name, messageCreate.execute);
client.on(auditLog.name, auditLog.execute);

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() || !interaction.guild) return;
  const command = commandMap.get(interaction.commandName);
  if (!command) return;
  if (command.highCommandOnly) {
    const roleIds = [...(interaction.member?.roles as any)?.cache?.keys?.() ?? []];
    if (!hasHighCommandRole(roleIds, cfg.roleForRank['high-command'])) {
      await interaction.reply({ content: line('deny', 'That action is above your clearance.'), flags: MessageFlags.Ephemeral });
      return;
    }
  }
  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    const msg = { content: line('err', 'Something went wrong. It has been noted.'), flags: MessageFlags.Ephemeral };
    if (interaction.replied || interaction.deferred) await interaction.followUp(msg).catch(() => {});
    else await interaction.reply(msg).catch(() => {});
  }
});

registerCommands()
  .then(() => client.login(cfg.discordToken))
  .catch((e) => { console.error('Startup failed:', e); process.exit(1); });
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: exits 0. If the `interaction.member.roles.cache.keys()` cast complains, it's covered by the `any` cast; leave it — it's smoke-tested live.

- [ ] **Step 4: Full test + build gate**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all unit tests PASS; tsc exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/lib/deadmanLoop.ts src/index.ts
git commit -m "feat(bot): boot — client, slash-command registration, interaction routing, dead-man loop"
```

---

### Task 18: Deployment artifacts

**Files:**
- Create: `redwood-bot.service`
- Create: `DEPLOY.md`

- [ ] **Step 1: Create `redwood-bot.service`**

```ini
[Unit]
Description=Redwood Peak Discord Bot
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=redwood
WorkingDirectory=/opt/redwood-bot
EnvironmentFile=/etc/redwood-bot.env
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

- [ ] **Step 2: Create `DEPLOY.md`**

````markdown
# Deploying the Redwood Peak bot (Ubuntu)

## 1. Create the Discord application (only you can do this)
1. https://discord.com/developers/applications → **New Application** → name it.
2. **Bot** tab → **Reset Token** → copy it → this is `DISCORD_TOKEN`. Keep it secret.
3. **Bot** tab → enable **Server Members Intent** and **Message Content Intent**.
4. **General Information** → copy **Application ID** → `DISCORD_CLIENT_ID`.
5. **OAuth2 → URL Generator** → scopes `bot` + `applications.commands`; bot permissions:
   Manage Roles, Manage Channels, Kick/Ban, Moderate Members, Manage Nicknames, Send Messages,
   Read Message History. Open the URL, invite it to your server.
6. **Put the bot's role ABOVE** every rank/division/position role in Server Settings → Roles
   (it can only manage roles below itself).

## 2. Supabase
Run `db/schema.sql` in your project's SQL editor. Copy the project URL (`SUPABASE_URL`) and the
**service_role** key (Settings → API → `SUPABASE_SERVICE_KEY`). The service key bypasses RLS — it lives
only on the server, never in a browser.

## 3. The roles + channels
Create the Discord roles for the 4 ranks, 3 divisions, and 4 positions. Copy each role's ID
(Developer Mode → right-click → Copy ID) into the matching `ROLE_*` var. Copy the security + high-command
channel IDs into `CHANNEL_SECURITY` / `CHANNEL_HIGH_COMMAND`. Configure channel permissions against the
rank/division/position roles (this is your clearance gating).

## 4. Server setup
```bash
sudo useradd -r -m -d /opt/redwood-bot redwood
sudo git clone <your-repo> /opt/redwood-bot        # or copy the Redwood-Discord-bot/ folder here
cd /opt/redwood-bot
sudo -u redwood npm ci
sudo -u redwood npm run build
sudo cp .env.example /etc/redwood-bot.env && sudo nano /etc/redwood-bot.env   # fill everything in
sudo cp redwood-bot.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now redwood-bot
sudo systemctl status redwood-bot
journalctl -u redwood-bot -f      # watch logs
```

## 5. First run in Discord
- `/roster-setup #roster` — posts the live roster message.
- `/hire @someone employee` — hire your first member; watch the roster message update itself.
- `/help` — read the handbook.
````

- [ ] **Step 3: Commit**

```bash
git add redwood-bot.service DEPLOY.md
git commit -m "docs(bot): systemd unit + Ubuntu deploy guide"
```

---

## Self-review (completed)
- **Spec coverage:** persona+/help (T7, T12), ranks/divisions/positions (T2), roster commands + role-sync invariant (T11, T13, T14), live roster message grouped by rank (T4, T10, T14), clearance-gated roles (role management in T11/T13, documented in DEPLOY), security suite — raid/spam/alt/lockdown/dead-man (T8, T15, T16, T17), Supabase model + RLS (T9), deployment (T18). All covered.
- **Types consistent:** `Member`, `Rank/Division/Position`, `BotConfig`, `Command` used identically across tasks; repo function names (`getMember`, `listActiveMembers`, `upsertMember`, `logRosterEvent`, `redrawRoster`, `applyRosterChange`, `desiredRoleIds`, `allManagedRoleIds`) match their definitions and call sites.
- **No placeholders:** every code step is complete.
- **Deferred (not in this plan, by design):** website reading the roster; identities/serials/lookup/orders/directives/IA.
