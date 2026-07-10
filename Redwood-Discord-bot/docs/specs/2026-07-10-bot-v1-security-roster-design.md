# Redwood Peak Bot — v1 "Security & Roster" — Design Spec

**Date:** 2026-07-10
**Status:** Approved (pending spec review) — first buildable slice of the bot.
**Source:** `Redwood-Discord-bot/BRAINSTORM.md` (ideas #8, #10, #12, plus roster).
**Decisions locked:** TypeScript + discord.js v14 · shared Supabase (service-role, server-side) · hosted on
the user's own Ubuntu server (systemd) · member *verification* is handled by an external Roblox-link bot
(Bloxlink), so this bot does **no onboarding gate**.

---

## 1. Scope

v1 is the smallest coherent slice: **be the org's roster + clearance system, and secure the server.**
The bot is the *source of truth* for who's in the org and at what rank, written to shared Supabase so the
website (and every later slice) can build on it.

**In v1:**
- **Persona + `/help` handbook** — the company voice layer every reply speaks through.
- **Roster & Ranks** — High Command hires/promotes/demotes/transfers/dismisses; three ranks mapped to the
  website tiers (`recruit → employee → high-command`); rank changes drive Discord roles + nickname and write
  to Supabase, with an audit trail.
- **Clearance-gated channels** — achieved by the bot keeping each member's *clearance roles* correct for
  their rank; channel visibility is standard Discord role-permissions (configured once), so it's robust and
  not a fragile per-channel-overwrite engine.
- **Security suite** — anti-raid (join-rate lockdown), anti-spam (message-rate + mass-mention), suspicious-
  join/alt **alerts** (account-age flag; alert-only since verification is external), `/lockdown`, and the
  **dead-man's switch** (High Command resets it or a purge *alert* — non-destructive — fires).

**Deferred (later slices, but v1 lays their foundation):** identity packets/SSNs, serial + plate registry,
`/lookup` + police-database, orders/ledger/budgets, directives, Internal Affairs, and wiring the **website**
to *read* the roster/tiers table (v1 only *writes* it).

**Non-goals:** member verification (Bloxlink), music, tickets (later), auto-removing a rogue admin
(v1 detects + alerts nuke-style mass actions; automated counter-action is a tunable follow-up).

---

## 2. Architecture & stack
- **discord.js v14**, **TypeScript**, Node ≥ 20. Slash commands + buttons/modals.
- **Interaction ↔ logic split:** every command/event is a thin Discord adapter that calls a **pure logic
  module** (rank math, permission checks, anti-raid/spam heuristics, dead-man evaluation). The pure modules
  are unit-tested; the Discord I/O is smoke-tested live. This is the key testability decision (we can't run a
  gateway in CI).
- **Shared Supabase** via `@supabase/supabase-js` with the **service-role key** (server-side only — never in
  the browser bundle, never committed). The bot reads/writes new tables; the website reads them later.
- **Config:** secrets + Discord IDs in `.env` (supplied on the Ubuntu box); tunable thresholds + mutable
  state (lockdown on/off, dead-man deadline) in the `security_config` table.

### Project structure
```
Redwood-Discord-bot/
  src/
    index.ts                 # boot: client, load commands+events, register slash cmds, login
    lib/
      config.ts              # env + role/channel IDs, validated at startup
      supabase.ts            # service-role client
      voice.ts               # persona strings + helpers (embeds, error/ok replies in-voice)
      tiers.ts               # Tier union, order, rank↔roleId map, hasAtLeast, next/prev  (mirrors site shape)
      permissions.ts         # isHighCommand(member), requireTier(...)
    commands/
      help.ts
      roster/  hire.ts  promote.ts  demote.ts  transfer.ts  dismiss.ts  roster.ts  whois.ts
      security/ lockdown.ts  deadman.ts  security-config.ts
    events/
      ready.ts
      guildMemberAdd.ts       # alt/suspicious-join flag + raid counter
      messageCreate.ts        # spam heuristic
      guildAuditLogEntryCreate.ts  # nuke-style mass-action detection
    security/
      antiRaid.ts  spam.ts  altCheck.ts  deadman.ts   # PURE logic + small handlers
    db/
      schema.sql              # tables + RLS
      members.ts  events.ts  securityConfig.ts        # typed repositories
  test/                       # *.test.ts (vitest) for the pure modules
  .env.example  package.json  tsconfig.json  vitest.config.ts
  DEPLOY.md   redwood-bot.service
```

---

## 3. Data model (shared Supabase)
New tables, `service_role`-only (RLS enabled, **no anon policies** — the browser must never touch these):

- **`members`** — `discord_id (pk, text)`, `employee_name text`, `tier text check in (recruit,employee,high-command)`,
  `status text check in (active,dismissed)`, `joined_at timestamptz`, `updated_at timestamptz`.
- **`roster_events`** — `id uuid pk`, `actor_discord_id text`, `target_discord_id text`,
  `action text (hire|promote|demote|transfer|dismiss)`, `from_tier text null`, `to_tier text null`,
  `note text null`, `at timestamptz default now()`. The audit trail (foundation for the Leadership Audit Trail).
- **`security_config`** — `guild_id text pk`, `lockdown boolean default false`, `deadman_deadline timestamptz null`,
  `raid_join_threshold int`, `raid_window_seconds int`, `spam_msg_threshold int`, `spam_window_seconds int`,
  `min_account_age_days int`.

`db/schema.sql` ships ready to paste into the Supabase SQL editor (same pattern as the website's
`supabase/schema.sql`). Tier strings are **identical** to the website's `Tier` type so the two systems agree.

---

## 4. Features in detail

### 4.1 Persona + `/help`
A `voice.ts` module centralizes the company voice: helpers `ok(msg)`, `deny(msg)`, `err(msg)` that build
consistent in-voice embeds ("Regrettably, that action is above your clearance."). `/help` renders the
**Employee Handbook** — a short code of conduct that reads normal at the top and turns faintly unsettling at
the end. Every command uses `voice.*` for replies so tone is uniform.

### 4.2 Roster & Ranks (High Command only)
Tiers `recruit < employee < high-command`, each bound to a configured Discord **clearance role** (IDs in env).
Commands, all gated by `requireTier('high-command')`:
- **`/hire <@user> <rank> [employee_name]`** — sets the clearance role(s), sets nickname to the employee name
  (defaults to current nick if omitted), upserts `members`, logs a `hire` event. Refuses if already active.
- **`/promote <@user>` / `/demote <@user>`** — move one step; swap roles; update row; log.
- **`/transfer <@user> <rank>`** — set to a specific rank; swap roles; update; log.
- **`/dismiss <@user> [note]`** — remove clearance roles, set `status=dismissed`, log. (Doesn't kick — just
  strips standing.)
- **`/roster [rank]`** — list active members grouped by rank (reads `members`).
- **`/whois <@user>`** — a member's file: employee name, rank, status, hired date, last change. (Light; the
  full cross-referencing `/lookup` is a later slice.)

**Role sync:** setting a rank always assigns exactly the one correct clearance role and removes the other two,
so Discord roles and the Supabase tier can never drift apart from a roster action. A `/sync-roles` maintenance
command re-applies roles from the DB if they're ever edited manually.

### 4.3 Clearance-gated channels
No dynamic per-channel overwrite engine. The bot owns the **three clearance roles**; admins configure channel
permissions against those roles once (documented in DEPLOY.md, optionally scaffolded by a `/setup` command
that creates the roles). Because rank changes always fix a member's clearance role, channel access follows
automatically and reconciles via `/sync-roles`. Robust, and it degrades gracefully if the bot is offline.

### 4.4 Security suite
- **Anti-raid** (`security/antiRaid.ts`, pure evaluator): a sliding-window join counter; if joins exceed
  `raid_join_threshold` within `raid_window_seconds`, auto-enable lockdown and alert High Command. The
  *evaluator* (counts → decision) is pure + unit-tested; the event handler feeds it join timestamps.
- **Anti-spam** (`security/spam.ts`, pure): per-user message-rate + mass-mention detection over a window →
  timeout the user + alert. Pure heuristic tested with synthetic message streams.
- **Alt / suspicious-join** (`security/altCheck.ts`, pure): on `guildMemberAdd`, if account age <
  `min_account_age_days`, post a flag to the security channel. **Alert only** — Bloxlink does verification.
- **`/lockdown <on|off>`** (High Command): flips `security_config.lockdown`, denies `@everyone` SEND in the
  configured channels (or raises verification level), announces in-voice. State survives restarts (DB).
- **Dead-man's switch** (`security/deadman.ts`): `/deadman reset` sets `deadman_deadline = now + interval`.
  A periodic check (setInterval on boot) fires a **purge alert** — dramatic, non-destructive, High-Command
  channel only — if the deadline lapses. The lapse evaluation is pure + tested; the alert is the only effect.

---

## 5. Config (`.env`)
`DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `GUILD_ID`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`,
`ROLE_RECRUIT`, `ROLE_EMPLOYEE`, `ROLE_HIGH_COMMAND`, `CHANNEL_SECURITY`, `CHANNEL_HIGH_COMMAND`,
`DEADMAN_INTERVAL_HOURS`. `.env.example` documents them; `config.ts` validates presence at startup and
exits with a clear message if any are missing. **Nothing secret is committed.**

## 6. Deployment (Ubuntu server)
- `npm ci && npm run build` → `node dist/index.js`. On boot the bot **registers guild slash commands** and
  logs in.
- Ship `redwood-bot.service` (systemd unit: `Restart=always`, `EnvironmentFile=/etc/redwood-bot.env`, runs as
  a non-root user) and a `DEPLOY.md` with exact steps: create the Discord application + bot token in the
  Developer Portal, enable the **Server Members** + **Message Content** privileged intents, invite with the
  right scopes/permissions, run `schema.sql` in Supabase, fill the env file, `systemctl enable --now`.
- The **Discord application + token is the one thing only the user can create** — DEPLOY.md walks it click-by-click.

## 7. Testing
- **Vitest** unit tests on the pure modules: `tiers` (order, rank↔role, next/prev, hasAtLeast),
  `permissions`, `antiRaid` (raid evaluator), `spam` (heuristic), `deadman` (lapse check), and the roster
  transition logic (hire/promote/demote validity). Target: the decision logic is fully covered.
- **Not unit-tested:** live discord.js gateway I/O and Supabase network calls (mocked at the repo boundary).
  Verification of the wired bot = a clean `tsc` build + the user smoke-testing on the Ubuntu box with a token.
- CI-ish gate before "done": `tsc --noEmit` clean + `vitest run` green.

## 8. Seams for later slices
- `members`/`roster_events` are the base the website's Personnel page + tier system will read (first task of
  the "two-way sync" slice), and that identity packets, `/lookup`, orders, and IA all extend.
- `roster_events` is the seed of the **Leadership Audit Trail**.
- `voice.ts`, `tiers.ts`, `permissions.ts`, and the interaction↔logic split are the conventions every later
  command follows.
