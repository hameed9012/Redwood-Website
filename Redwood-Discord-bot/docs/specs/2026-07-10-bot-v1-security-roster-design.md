# Redwood Peak Bot — v1 "Security & Roster" — Design Spec

**Date:** 2026-07-10
**Status:** Approved (pending spec review) — first buildable slice of the bot.
**Source:** `Redwood-Discord-bot/BRAINSTORM.md` (ideas #8, #10, #12, plus roster).
**Decisions locked:** TypeScript + discord.js v14 · shared Supabase (service-role, server-side) · hosted on the
user's own Ubuntu server (systemd) · member *verification* is external (Bloxlink) so this bot has **no
onboarding gate** · the roster is a **live auto-updating message**, grouped by rank.

---

## 1. Scope

v1 is the smallest coherent slice: **be the org's rank/division/position system, keep it displayed live, and
secure the server.** The bot is the *source of truth* for who's in the org and their standing, written to
shared Supabase so the website and every later slice build on it.

**In v1:**
- **Persona + `/help` handbook** — the company voice layer every reply speaks through.
- **Roster & standing** — High Command sets each member's **rank**, **divisions**, and **positions** (below);
  changes drive Discord roles + nickname, write to Supabase with an audit trail, and redraw the live roster.
- **The live roster message** — one bot-owned message in a channel that **redraws itself as a tree, grouped
  by rank**, on every change. Nobody edits it by hand.
- **Clearance-gated channels** — every rank/division/position is a Discord role the bot keeps in lockstep with
  the DB; channel visibility is standard Discord role-permissions (configured once). Robust, not a fragile
  overwrite engine.
- **Security suite** — anti-raid (join-rate → auto-lockdown), anti-spam (message-rate + mass-mention),
  suspicious-join/alt **alerts** (account-age flag; alert-only since verification is external), `/lockdown`,
  and the **dead-man's switch** (High Command resets it or a non-destructive purge *alert* fires).

**Deferred (later slices, foundation laid here):** identity packets/SSNs, serial + plate registry, `/lookup`
+ police-database, orders/ledger/budgets, directives, Internal Affairs *cases*, and wiring the **website** to
*read* the roster (v1 only *writes* it; the site's 3 tiers get reconciled to these 4 ranks then).

**Non-goals:** member verification (Bloxlink), music/tickets, auto-removing a rogue admin (v1 detects + alerts
mass "nuke" actions; automated counter-action is a tunable follow-up).

---

## 2. The org structure (the model)
Three independent axes, each backed by its own Discord role:

- **Rank** — exactly one, ordered ladder: `trainee < employee < supervisor < high-command`.
- **Divisions** — **zero or more**: `security`, `research`, `intelligence`.
- **Positions** — **zero or more**: `trainee-instructor`, `internal-affairs`, `representative`, `media-relations`.

So a member is e.g. *Employee, in Research + Intelligence, holding Internal Affairs*. (Note: the org's entry
rank is **Trainee**, not "recruit"; the website's older 3-tier naming is reconciled in a later slice.)

---

## 3. Architecture & stack
- **discord.js v14**, **TypeScript**, Node ≥ 20. Slash commands + buttons/modals.
- **Interaction ↔ logic split:** every command/event is a thin Discord adapter over a **pure logic module**
  (rank math, permission checks, the roster tree renderer, anti-raid/spam heuristics, dead-man evaluation).
  The pure modules are unit-tested; the Discord I/O is smoke-tested live. This is the key testability decision
  — we can't run a gateway in CI.
- **Shared Supabase** via `@supabase/supabase-js` with the **service-role key** (server-side only — never in a
  browser bundle, never committed).
- **Config:** secrets + Discord IDs in `.env` (on the Ubuntu box); mutable state (lockdown, dead-man deadline,
  the roster message id) + tunable thresholds in DB.

### Project structure
```
Redwood-Discord-bot/
  src/
    index.ts                 # boot: client, load commands+events, register slash cmds, login, redraw roster
    lib/
      config.ts              # env + role/channel IDs, validated at startup
      supabase.ts            # service-role client
      voice.ts               # persona strings + embed/reply helpers (in-voice)
      ranks.ts               # Rank/Division/Position unions, order, ↔ roleId maps, next/prev, validation
      permissions.ts         # isHighCommand(member), requireRank(...)
      rosterTree.ts          # PURE: members[] -> grouped-by-rank tree string (unit-tested)
    commands/
      help.ts
      roster/  hire.ts  promote.ts  demote.ts  setrank.ts  dismiss.ts
               division.ts  position.ts  whois.ts  roster-setup.ts  sync-roles.ts
      security/ lockdown.ts  deadman.ts  security-config.ts
    events/
      ready.ts
      guildMemberAdd.ts       # alt/suspicious-join alert + raid counter
      messageCreate.ts        # spam heuristic
      guildAuditLogEntryCreate.ts  # nuke-style mass-action detection
    security/
      antiRaid.ts  spam.ts  altCheck.ts  deadman.ts   # PURE logic + small handlers
    roster/
      render.ts               # edits the live roster message (calls rosterTree.ts)
    db/
      schema.sql              # tables + RLS
      members.ts  events.ts  rosterConfig.ts  securityConfig.ts   # typed repositories
  test/                       # *.test.ts (vitest) for the pure modules
  .env.example  package.json  tsconfig.json  vitest.config.ts
  DEPLOY.md   redwood-bot.service
```

---

## 4. Data model (shared Supabase)
New tables, `service_role`-only (RLS enabled, **no anon policies** — the browser never touches these):

- **`members`** — `discord_id text pk`, `employee_name text`, `rank text check in
  (trainee,employee,supervisor,high-command)`, `divisions text[] default '{}'`, `positions text[] default '{}'`,
  `status text check in (active,dismissed) default 'active'`, `joined_at timestamptz`, `updated_at timestamptz`.
- **`roster_events`** — `id uuid pk`, `actor_discord_id text`, `target_discord_id text`, `action text`
  (`hire|promote|demote|setrank|division_add|division_remove|position_add|position_remove|dismiss`),
  `detail text null`, `at timestamptz default now()`. The audit trail (seed of the Leadership Audit Trail).
- **`roster_config`** — `guild_id text pk`, `channel_id text`, `message_id text null` (the live roster message).
- **`security_config`** — `guild_id text pk`, `lockdown boolean default false`, `deadman_deadline timestamptz null`,
  `raid_join_threshold int`, `raid_window_seconds int`, `spam_msg_threshold int`, `spam_window_seconds int`,
  `min_account_age_days int`.

`db/schema.sql` ships ready to paste into the Supabase SQL editor (same pattern as the website's
`supabase/schema.sql`).

---

## 5. Features in detail

### 5.1 Persona + `/help`
`voice.ts` centralizes the company voice — `ok/deny/err` helpers building consistent in-voice embeds
("Regrettably, that action is above your clearance."). `/help` renders the **Employee Handbook**: a short code
of conduct that reads normal at the top and turns faintly unsettling at the end. Every command replies via
`voice.*`.

### 5.2 Roster & standing (High Command only)
All gated by `requireRank('high-command')`. Every mutation: updates Discord roles, upserts `members`, logs a
`roster_events` row, and **redraws the live roster message**.
- **`/hire <@user> <rank> [employee_name]`** — sets the rank role, sets nickname to the employee name
  (defaults to current nick), creates the member, logs `hire`. Refuses if already active.
- **`/promote <@user>` / `/demote <@user>`** — one step along `trainee↔employee↔supervisor↔high-command`;
  swaps the rank role.
- **`/setrank <@user> <rank>`** — jump to a specific rank.
- **`/division <add|remove> <@user> <division>`** — toggle one of the member's divisions (multiple allowed);
  toggles that division role.
- **`/position <add|remove> <@user> <position>`** — toggle one of the member's positions (multiple allowed);
  toggles that position role.
- **`/dismiss <@user> [note]`** — remove all rank/division/position roles, set `status=dismissed`, log.
  (Strips standing; doesn't kick.)
- **`/whois <@user>`** — a member's file: employee name, rank, divisions, positions, status, hired date, last
  change. (Light; the cross-referencing `/lookup` is a later slice.)
- **`/sync-roles [@user]`** — re-apply Discord roles from the DB (fixes manual drift), then redraw the roster.

**Role sync invariant:** after any command, the member's Discord roles exactly equal {their one rank role} ∪
{their division roles} ∪ {their position roles} — nothing more, nothing less. This keeps roles, the DB, and
channel access from ever drifting.

### 5.3 The live roster message
`/roster-setup [#channel]` posts a bot-owned message and stores its `channel_id`/`message_id` in
`roster_config`. From then on, `roster/render.ts` edits that message on every roster change and on startup —
so it's always current with zero manual upkeep. `lib/rosterTree.ts` is a **pure** renderer: given the members
list it returns the tree, **grouped by rank** (High Command → Supervisor → Employee → Trainee), each member a
line under their rank with divisions + positions tagged, e.g.:
```
REDWOOD PEAK · ROSTER

High Command
 └─ Marla Vane — Security, Intelligence  [Internal Affairs]
Supervisor
 └─ D. Rourke — Research  [Trainee Instructor]
Employee
 └─ S. Okafor — Security
Trainee
 └─ (none)
```
Because the renderer is pure, its exact formatting is unit-tested against fixture rosters.

### 5.4 Clearance-gated channels
No dynamic per-channel overwrite engine. The bot owns the **rank + division + position roles**; admins
configure channel permissions against those roles once (documented in DEPLOY.md; an optional `/setup` can
create the roles). Because every roster command enforces the role-sync invariant (5.2), channel access follows
automatically and reconciles via `/sync-roles`. Degrades gracefully if the bot is offline.

### 5.5 Security suite
- **Anti-raid** (`security/antiRaid.ts`, pure evaluator): sliding-window join counter; exceeding
  `raid_join_threshold` within `raid_window_seconds` → auto-enable lockdown + alert High Command. Evaluator
  (timestamps → decision) is pure + tested; the handler feeds it join events.
- **Anti-spam** (`security/spam.ts`, pure): per-user message-rate + mass-mention over a window → timeout +
  alert. Heuristic tested with synthetic streams.
- **Alt / suspicious-join** (`security/altCheck.ts`, pure): on `guildMemberAdd`, account age <
  `min_account_age_days` → flag to the security channel. **Alert only** (Bloxlink verifies).
- **`/lockdown <on|off>`**: flips `security_config.lockdown`, denies `@everyone` SEND in configured channels
  (or raises verification level), announces in-voice; survives restarts (DB).
- **Dead-man's switch** (`security/deadman.ts`): `/deadman reset` sets `deadman_deadline = now + interval`. A
  periodic boot-time check fires a **purge alert** — dramatic, non-destructive, High-Command channel only — if
  the deadline lapses. The lapse check is pure + tested; the alert is the only effect.

---

## 6. Config (`.env`)
`DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `GUILD_ID`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`; role IDs
`ROLE_RANK_TRAINEE/EMPLOYEE/SUPERVISOR/HIGH_COMMAND`, `ROLE_DIV_SECURITY/RESEARCH/INTELLIGENCE`,
`ROLE_POS_TRAINEE_INSTRUCTOR/INTERNAL_AFFAIRS/REPRESENTATIVE/MEDIA_RELATIONS`; channel IDs
`CHANNEL_SECURITY`, `CHANNEL_HIGH_COMMAND`; `DEADMAN_INTERVAL_HOURS`. `.env.example` documents them; `config.ts`
validates presence at startup and exits clearly if any are missing. **Nothing secret is committed.**

## 7. Deployment (Ubuntu server)
- `npm ci && npm run build` → `node dist/index.js`; on boot it registers guild slash commands, logs in, and
  redraws the roster.
- Ship `redwood-bot.service` (systemd: `Restart=always`, `EnvironmentFile=/etc/redwood-bot.env`, non-root user)
  + `DEPLOY.md`: create the Discord application + bot token, enable the **Server Members** + **Message Content**
  privileged intents, invite with the right scopes/permissions, run `schema.sql` in Supabase, fill the env
  file, create the roles + copy their IDs, `systemctl enable --now`.
- The **Discord application + token is the one thing only the user can create** — DEPLOY.md walks it step by step.

## 8. Testing
- **Vitest** on the pure modules: `ranks` (order, ↔role, next/prev, validation), `permissions`, `rosterTree`
  (grouped-by-rank rendering against fixtures), `antiRaid`, `spam`, `deadman`, and roster-transition validity
  (hire/promote/demote/division/position rules). Target: the decision + rendering logic is fully covered.
- **Not unit-tested:** live discord.js gateway I/O + Supabase network calls (mocked at the repo boundary).
  Verifying the wired bot = clean `tsc` build + the user smoke-testing on the Ubuntu box with a token.
- Done-gate: `tsc --noEmit` clean + `vitest run` green.

## 9. Seams for later slices
- `members`/`roster_events` are what the website's Personnel page + tier system will read (first task of the
  "two-way sync" slice, where the site's 3 tiers reconcile to these 4 ranks), and what identities, `/lookup`,
  orders, and IA extend. `roster_events` seeds the Leadership Audit Trail.
- `voice.ts`, `ranks.ts`, `permissions.ts`, the pure-renderer pattern, and the interaction↔logic split are the
  conventions every later command follows.
