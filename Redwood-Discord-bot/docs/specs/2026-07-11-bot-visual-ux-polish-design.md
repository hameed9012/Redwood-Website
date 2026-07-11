# Redwood Peak Bot — Visual + UX Polish Pass

**Date:** 2026-07-11
**Status:** Approved design
**Type:** Presentation-layer only — no new features, no data-model changes.

## Goal

Make the bot's command output look professional and on-brand using Discord **embeds** for content, and make the bot genuinely usable by non-technical members (a real in-Discord `/help`, plain-language command descriptions, friendly errors). The deadpan company persona stays intact throughout.

## Design principles

- **Content is a card; an action is a line.** Outputs worth *reading* (a file, a packet, a summary, the roster) become branded embeds. Outputs that just say "done" stay as snappy one-line replies through the existing `line(tone, text)` helper.
- **Tone colors, brand-tinted.** Every embed carries a left-bar color by tone: **info** = brand red `#c1272d` (default/signature), **success** = muted green `#4c8055`, **warning** = amber `#c9922f`, **denied/error** = deep red `#7a1518`. Brand palette (from the site): red `#c1272d`, red-deep `#7a1518`, charcoal `#141414`, bone `#f5f5f4`, black `#0a0a0a`.
- **Persona intact.** Titles, descriptions, and copy keep the over-polite, faintly-threatening voice.

## Architecture

One new module, `src/lib/embeds.ts`, holds all embed construction. Commands import a builder and reply with `{ embeds: [e] }` (or `{ embeds, components }` for `/help`). The existing `src/lib/voice.ts` `line()` helper is unchanged and still used for one-liners and every error/denial. No new dependencies — `EmbedBuilder` and the button/component builders ship with discord.js v14.

Replies remain ephemeral + deferred (unchanged from the current central handler). Identity cards must stay ephemeral because they carry the SSN/cover. The live roster message is the one public, persistent embed.

### `src/lib/embeds.ts` exports

- `type Tone = 'info' | 'success' | 'warning' | 'denied'` and `TONE_COLOR: Record<Tone, number>` (the four hex values above as `0x` numbers).
- `baseEmbed(tone: Tone, section: string): EmbedBuilder` — sets the color, a footer of `Redwood Peak · <section>`, and a timestamp. All content builders start here.
- Content builders (pure — data in, `EmbedBuilder` out):
  - `identityEmbed(member: Member, identity: Identity, title: string): EmbedBuilder` — the packet card: title + `employeeName · rankLabel` description, fields Employee, Legal name (cover), Date of birth, SSN, ID number, Blood type, Next of kin, Issued (SSN and ID in monospace via backticks). Tone info.
  - `whoisEmbed(member: Member): EmbedBuilder` — member file: fields Rank, Divisions, Positions, Hired, Status. Tone info; tone `denied` styling if dismissed.
  - `shiftSummaryEmbed(durationLabel: string, incidentCount: number, movements: string): EmbedBuilder` — close-out card. Tone success.
  - `shiftStatusEmbed(onDuty: boolean, durationLabel?: string, incidentCount?: number): EmbedBuilder` — compact on/off-duty card. Tone info.
  - `lockdownEmbed(on: boolean): EmbedBuilder` — `on` → warning tone, "The site is sealed. Unregistered personnel are denied."; `off` → info tone, "The site is open."
  - `rosterEmbed(members: Member[]): EmbedBuilder` — roster grouped by rank (High Command → Trainee) as one field per non-empty rank, each value listing `EmployeeName — Div, Div [Pos, Pos]` lines. Tone info. Replaces the code-block renderer.
  - `helpEmbed(): EmbedBuilder` — the command guide (fields per category, below).
  - `helpComponents(): ActionRowBuilder<ButtonBuilder>` — a single Link button, label "The full handbook →", url = `HANDBOOK_URL` from `voice.ts`. Link buttons need no interaction handler.

## Per-command output

**Embeds:**
| Command | Embed | Tone |
|---|---|---|
| `/identity view` | identity packet | info |
| `/identity create` | identity packet, title "Identity issued" | success |
| `/identity rotate` | identity packet, title "New papers filed" | success |
| `/whois` | member file | info (denied if dismissed) |
| `/shift end` | shift summary | success |
| `/shift status` | on/off-duty | info |
| `/lockdown` | state card | warning (on) / info (off) |
| roster live message | roster grouped by rank | info |
| `/help` | command guide + link button | info |

**One-liners (unchanged `line()`):** `/promote`, `/demote`, `/setrank`, `/division`, `/position`, `/dismiss`, `/shift start`, `/shift log`, `/shift party`, `/shift report`, `/say`, `/sync-roles`, `/roster-setup` (its confirmation; the posted message is the embed), `/deadman`. **All errors and denials everywhere** stay `⛔/⚠` one-liners, including the central clearance and permission-hint messages.

## `/help` content

Title in-voice (e.g. "Redwood Peak — Field Manual"). Fields by category, plain-English descriptions, 🔒 marks High-Command-only groups/commands. Shown to everyone (marks indicate what needs clearance):

- **Identity** 🔒 — `/identity create` onboard someone and issue their cover · `rotate` fresh papers · `view` pull a packet
- **Shifts** — `/shift start` clock on · `log` record an incident · `party` add people to it · `end` close out and account for your movements · `report` file a dossier · `status` your duty state
- **Roster** 🔒 — `/promote` · `/demote` · `/setrank` · `/division` · `/position` · `/dismiss` · `/whois` · `/roster-setup` · `/sync-roles`
- **Security** 🔒 — `/lockdown` seal or open the site · `/deadman` reset the switch
- **General** — `/help` this guide · `/say` 🔒 speak as the company

Plus the link button to the full handbook doc.

## Command descriptions

Tidy every slash command's `.setDescription(...)` into plain, non-jargon language (it is the first thing a non-technical member reads in the command picker). Keep a light persona touch but lead with clarity. No option/subcommand renames — names stay stable so nothing breaks; only the human-readable descriptions change.

## Testing

- **Unit (vitest):** `embeds.test.ts` exercises the builders via `EmbedBuilder.toJSON()` — assert tone color, title, field names/values, and footer for `identityEmbed`, `whoisEmbed`, `shiftSummaryEmbed`, `lockdownEmbed` (both states), and `rosterEmbed` (grouping + empty ranks). This *adds* coverage.
- **tsc-verified:** every command file's wiring (`{ embeds: [...] }`), the roster render swap, `/help` components.
- **Live smoke test (user):** run each command, confirm the cards render and `/help`'s button opens the doc.

## Cleanup

`rosterEmbed` supersedes the code-block text renderer `renderRoster` in `src/lib/rosterTree.ts`; remove `renderRoster` and its test once `redrawRoster` and `/roster-setup` no longer call it. (Keep the file only if something else still imports it — verify with `tsc`/grep.)

## Out of scope

No new features, commands, options, or tables. No interactive `/help` menu (link button only). No autocomplete. No changes to the deferral/ephemeral behavior. The deferred roadmap (`/lookup`, registries, burn, orders/ledger, carousel) is untouched.
