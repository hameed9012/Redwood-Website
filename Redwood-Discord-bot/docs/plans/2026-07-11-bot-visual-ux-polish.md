# Redwood Peak Bot — Visual + UX Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the bot's plain-text content output with tone-colored Discord embeds (identity packet, /whois, shift summaries, /lockdown, the live roster, /help), keep `line()` one-liners for confirmations and errors, and tidy every command description — persona intact, no new features.

**Architecture:** One new pure module `src/lib/embeds.ts` builds every `EmbedBuilder`; commands import a builder and reply `{ embeds: [...] }`. Builders are unit-tested via `EmbedBuilder.toJSON()`; command wiring is `tsc`-verified and smoke-tested live (no Discord gateway in CI).

**Tech Stack:** discord.js v14 (`EmbedBuilder`, `ActionRowBuilder`, `ButtonBuilder`, `ButtonStyle`), TypeScript/CommonJS (module node16), vitest, Node 20.

**Conventions (follow exactly):**
- Run everything from the bot dir: Bash with `cd "/c/Users/Hameed/work/RedwoodPeak/Redwood-Discord-bot" && <cmd>`.
- Full gate before each commit: `npx tsc --noEmit && npx vitest run --no-file-parallelism`.
- Tests single-threaded: `npx vitest run <file> --no-file-parallelism`.
- All command replies are already `deferReply`-ed centrally, so commands use `interaction.editReply(...)` — never `.reply(...)`.
- Brand colors: info `0xc1272d`, success `0x4c8055`, warning `0xc9922f`, denied `0x7a1518`.

---

## File structure

**New**
- `src/lib/embeds.ts` — all embed builders + the help link-button row
- `src/lib/embeds.test.ts` — unit tests via `toJSON()`

**Modified**
- `src/commands/identity.ts` — view/create/rotate reply with `identityEmbed`
- `src/commands/roster.ts` — `/whois` replies with `whoisEmbed`
- `src/commands/shift.ts` — `/shift end` + `/shift status` reply with embeds
- `src/commands/security.ts` — `/lockdown` replies with `lockdownEmbed`
- `src/commands/help.ts` — replies with `helpEmbed` + `helpComponents`
- `src/roster/render.ts` — `redrawRoster` edits an embed
- `src/commands/rosterAdmin.ts` — `/roster-setup` posts an embed
- Command `.setDescription(...)` copy across `help/roster/rosterAdmin/security/say/identity/shift`

**Removed**
- `src/lib/rosterTree.ts` + `src/lib/rosterTree.test.ts` — the code-block renderer, superseded by `rosterEmbed`

---

## Task 1: Embed foundation + identity packet card

**Files:**
- Create: `src/lib/embeds.ts`
- Test: `src/lib/embeds.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { identityEmbed, TONE_COLOR } from './embeds';
import type { Member } from './member';
import type { Identity } from './identity';

const member: Member = {
  discordId: '1', employeeName: 'Adam Marcuz', rank: 'employee',
  divisions: ['security'], positions: [], status: 'active',
  joinedAt: '2026-07-11T00:00:00Z', updatedAt: '2026-07-11T00:00:00Z',
};
const identity: Identity = {
  id: 'i1', discordId: '1', legalName: 'David Whitaker', dob: '1994-03-12',
  ssn: '462-88-1174', idNumber: 'D48120394', bloodType: 'A-',
  nextOfKin: 'Karen Lopez — spouse', issuedAt: '2026-07-11T06:26:00Z',
  status: 'active', retiredAt: null,
};

describe('identityEmbed', () => {
  it('renders the cover fields with the info color and Personnel footer', () => {
    const j = identityEmbed(member, identity, 'Identity packet').toJSON();
    expect(j.color).toBe(TONE_COLOR.info);
    expect(j.title).toBe('Identity packet');
    expect(j.description).toContain('Adam Marcuz');
    const names = (j.fields ?? []).map((f) => f.name);
    expect(names).toEqual(expect.arrayContaining(['Employee', 'Legal name (cover)', 'SSN', 'ID number', 'Issued']));
    expect((j.fields ?? []).find((f) => f.name === 'SSN')!.value).toContain('462-88-1174');
    expect(j.footer!.text).toBe('Redwood Peak · Personnel');
  });

  it('accepts a tone override (success for create/rotate)', () => {
    expect(identityEmbed(member, identity, 'Identity issued', 'success').toJSON().color).toBe(TONE_COLOR.success);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/embeds.test.ts --no-file-parallelism`
Expected: FAIL — `./embeds` has no exports.

- [ ] **Step 3: Create `src/lib/embeds.ts`**

```ts
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import type { Member } from './member';
import type { Identity } from './identity';
import { RANKS, RANK_LABEL, DIVISION_LABEL, POSITION_LABEL, type Rank } from './ranks';
import { HANDBOOK_URL } from './voice';

export type Tone = 'info' | 'success' | 'warning' | 'denied';

export const TONE_COLOR: Record<Tone, number> = {
  info: 0xc1272d,
  success: 0x4c8055,
  warning: 0xc9922f,
  denied: 0x7a1518,
};

/** Every content embed starts here: tone color, footer, timestamp. */
export function baseEmbed(tone: Tone, section: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(TONE_COLOR[tone])
    .setFooter({ text: `Redwood Peak · ${section}` })
    .setTimestamp(new Date());
}

/** The identity packet card. `tone` is info for view, success for create/rotate. */
export function identityEmbed(member: Member, identity: Identity, title: string, tone: Tone = 'info'): EmbedBuilder {
  return baseEmbed(tone, 'Personnel')
    .setTitle(title)
    .setDescription(`${member.employeeName} · ${RANK_LABEL[member.rank]}`)
    .addFields(
      { name: 'Employee', value: member.employeeName, inline: true },
      { name: 'Legal name (cover)', value: identity.legalName, inline: true },
      { name: 'Date of birth', value: identity.dob, inline: true },
      { name: 'SSN', value: `\`${identity.ssn}\``, inline: true },
      { name: 'ID number', value: `\`${identity.idNumber}\``, inline: true },
      { name: 'Blood type', value: identity.bloodType, inline: true },
      { name: 'Next of kin', value: identity.nextOfKin, inline: true },
      { name: 'Issued', value: identity.issuedAt.slice(0, 10), inline: true },
    );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/embeds.test.ts --no-file-parallelism`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/embeds.ts src/lib/embeds.test.ts
git commit -m "feat(bot): embed foundation + identity packet card"
```

---

## Task 2: `/whois` card + roster card

**Files:**
- Modify: `src/lib/embeds.ts`
- Modify: `src/lib/embeds.test.ts`

- [ ] **Step 1: Append the failing tests**

Add inside `src/lib/embeds.test.ts` (new imports `whoisEmbed`, `rosterEmbed`):

```ts
import { whoisEmbed, rosterEmbed } from './embeds';

describe('whoisEmbed', () => {
  it('active member is info, has rank/divisions/positions fields', () => {
    const j = whoisEmbed(member).toJSON();
    expect(j.color).toBe(TONE_COLOR.info);
    expect(j.title).toBe('Adam Marcuz');
    const names = (j.fields ?? []).map((f) => f.name);
    expect(names).toEqual(expect.arrayContaining(['Rank', 'Divisions', 'Positions', 'Hired', 'Status']));
  });

  it('dismissed member is denied tone and marked', () => {
    const j = whoisEmbed({ ...member, status: 'dismissed' }).toJSON();
    expect(j.color).toBe(TONE_COLOR.denied);
    expect(j.title).toContain('dismissed');
  });
});

describe('rosterEmbed', () => {
  it('one field per rank, high-command first, empty ranks show a dash', () => {
    const hc: Member = { ...member, employeeName: 'Cara Vance', rank: 'high-command' };
    const j = rosterEmbed([member, hc]).toJSON();
    const names = (j.fields ?? []).map((f) => f.name);
    expect(names[0]).toBe('High Command');
    expect(names).toEqual(['High Command', 'Supervisor', 'Employee', 'Trainee']);
    expect((j.fields ?? []).find((f) => f.name === 'Supervisor')!.value).toBe('—');
    expect((j.fields ?? []).find((f) => f.name === 'Employee')!.value).toContain('Adam Marcuz');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/embeds.test.ts --no-file-parallelism`
Expected: FAIL — `whoisEmbed`/`rosterEmbed` not exported.

- [ ] **Step 3: Add the builders to `src/lib/embeds.ts`**

```ts
export function whoisEmbed(member: Member): EmbedBuilder {
  const dismissed = member.status === 'dismissed';
  const divs = member.divisions.map((d) => DIVISION_LABEL[d]).join(', ') || '—';
  const pos = member.positions.map((p) => POSITION_LABEL[p]).join(', ') || '—';
  return baseEmbed(dismissed ? 'denied' : 'info', 'Personnel')
    .setTitle(`${member.employeeName}${dismissed ? ' (dismissed)' : ''}`)
    .addFields(
      { name: 'Rank', value: RANK_LABEL[member.rank], inline: true },
      { name: 'Divisions', value: divs, inline: true },
      { name: 'Positions', value: pos, inline: true },
      { name: 'Hired', value: member.joinedAt.slice(0, 10), inline: true },
      { name: 'Status', value: dismissed ? 'Dismissed' : 'Active', inline: true },
    );
}

export function rosterEmbed(members: Member[]): EmbedBuilder {
  const active = members.filter((m) => m.status === 'active');
  const ranksTopDown: Rank[] = [...RANKS].reverse();
  const e = baseEmbed('info', 'Roster').setTitle('Redwood Peak · Roster');
  for (const rank of ranksTopDown) {
    const inRank = active
      .filter((m) => m.rank === rank)
      .sort((a, b) => a.employeeName.localeCompare(b.employeeName));
    const value = inRank.length
      ? inRank.map((m) => {
          const divs = m.divisions.map((d) => DIVISION_LABEL[d]);
          const pos = m.positions.map((p) => POSITION_LABEL[p]);
          let l = m.employeeName;
          if (divs.length) l += ` — ${divs.join(', ')}`;
          if (pos.length) l += ` [${pos.join(', ')}]`;
          return l;
        }).join('\n').slice(0, 1024)
      : '—';
    e.addFields({ name: RANK_LABEL[rank], value });
  }
  return e;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/embeds.test.ts --no-file-parallelism`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/embeds.ts src/lib/embeds.test.ts
git commit -m "feat(bot): whois card + roster card"
```

---

## Task 3: Shift + lockdown state cards

**Files:**
- Modify: `src/lib/embeds.ts`
- Modify: `src/lib/embeds.test.ts`

- [ ] **Step 1: Append the failing tests**

Add to `src/lib/embeds.test.ts` (imports `shiftSummaryEmbed`, `shiftStatusEmbed`, `lockdownEmbed`):

```ts
import { shiftSummaryEmbed, shiftStatusEmbed, lockdownEmbed } from './embeds';

describe('shift + lockdown cards', () => {
  it('shift summary is success with duration/incidents/movements', () => {
    const j = shiftSummaryEmbed('1h 30m', 2, 'Docks, Overpass').toJSON();
    expect(j.color).toBe(TONE_COLOR.success);
    const names = (j.fields ?? []).map((f) => f.name);
    expect(names).toEqual(expect.arrayContaining(['Duration', 'Incidents filed', 'Movements']));
    expect((j.fields ?? []).find((f) => f.name === 'Duration')!.value).toBe('1h 30m');
  });

  it('shift status reflects on/off duty', () => {
    expect(shiftStatusEmbed(false).toJSON().title).toBe('Off duty');
    expect(shiftStatusEmbed(true, '20m', 1).toJSON().title).toBe('On duty');
  });

  it('lockdown on is warning, off is info', () => {
    expect(lockdownEmbed(true).toJSON().color).toBe(TONE_COLOR.warning);
    expect(lockdownEmbed(true).toJSON().description).toContain('sealed');
    expect(lockdownEmbed(false).toJSON().color).toBe(TONE_COLOR.info);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/embeds.test.ts --no-file-parallelism`
Expected: FAIL — builders not exported.

- [ ] **Step 3: Add the builders to `src/lib/embeds.ts`**

```ts
export function shiftSummaryEmbed(durationLabel: string, incidentCount: number, movements: string): EmbedBuilder {
  return baseEmbed('success', 'Shifts')
    .setTitle('Shift closed')
    .setDescription('Your movements have been recorded.')
    .addFields(
      { name: 'Duration', value: durationLabel, inline: true },
      { name: 'Incidents filed', value: String(incidentCount), inline: true },
      { name: 'Movements', value: movements.slice(0, 1024) || '—' },
    );
}

export function shiftStatusEmbed(onDuty: boolean, durationLabel?: string, incidentCount?: number): EmbedBuilder {
  if (!onDuty) return baseEmbed('info', 'Shifts').setTitle('Off duty');
  return baseEmbed('info', 'Shifts')
    .setTitle('On duty')
    .addFields(
      { name: 'Elapsed', value: durationLabel ?? '—', inline: true },
      { name: 'Incidents logged', value: String(incidentCount ?? 0), inline: true },
    );
}

export function lockdownEmbed(on: boolean): EmbedBuilder {
  return on
    ? baseEmbed('warning', 'Security').setTitle('Site sealed').setDescription('The site is sealed. Unregistered personnel are denied.')
    : baseEmbed('info', 'Security').setTitle('Site open').setDescription('The site is open.');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/embeds.test.ts --no-file-parallelism`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/embeds.ts src/lib/embeds.test.ts
git commit -m "feat(bot): shift + lockdown state cards"
```

---

## Task 4: `/help` card + handbook button

**Files:**
- Modify: `src/lib/embeds.ts`
- Modify: `src/lib/embeds.test.ts`

- [ ] **Step 1: Append the failing test**

Add to `src/lib/embeds.test.ts` (imports `helpEmbed`, `helpComponents`):

```ts
import { helpEmbed, helpComponents } from './embeds';

describe('help', () => {
  it('lists the command categories', () => {
    const names = (helpEmbed().toJSON().fields ?? []).map((f) => f.name);
    expect(names.some((n) => n.includes('Identity'))).toBe(true);
    expect(names.some((n) => n.includes('Shifts'))).toBe(true);
    expect(names.some((n) => n.includes('Security'))).toBe(true);
  });

  it('has a single link button to the handbook', () => {
    const row = helpComponents().toJSON();
    expect(row.components).toHaveLength(1);
    expect((row.components[0] as { style: number }).style).toBe(5); // ButtonStyle.Link
    expect((row.components[0] as { url?: string }).url).toContain('docs.google.com');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/embeds.test.ts --no-file-parallelism`
Expected: FAIL — `helpEmbed`/`helpComponents` not exported.

- [ ] **Step 3: Add to `src/lib/embeds.ts`**

```ts
export function helpEmbed(): EmbedBuilder {
  return baseEmbed('info', 'Field Manual')
    .setTitle('Redwood Peak — Field Manual')
    .setDescription('Everything you can do here. 🔒 marks High-Command-only.')
    .addFields(
      { name: '🔒 Identity', value: '`/identity create` — onboard someone and issue their cover\n`/identity rotate` — issue fresh papers\n`/identity view` — pull a member’s packet' },
      { name: 'Shifts', value: '`/shift start` — clock on\n`/shift log` — record an incident\n`/shift party` — add people to that incident\n`/shift end` — close out and account for your movements\n`/shift report` — file a witness dossier\n`/shift status` — your current duty state' },
      { name: '🔒 Roster', value: '`/promote` · `/demote` · `/setrank` · `/division` · `/position` · `/dismiss` · `/whois` · `/roster-setup` · `/sync-roles`' },
      { name: '🔒 Security', value: '`/lockdown` — seal or open the site\n`/deadman` — reset the dead-man’s switch' },
      { name: 'General', value: '`/help` — this guide\n`/say` 🔒 — speak as the company' },
    );
}

export function helpComponents(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('The full handbook →').setURL(HANDBOOK_URL),
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/embeds.test.ts --no-file-parallelism`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/embeds.ts src/lib/embeds.test.ts
git commit -m "feat(bot): help card + handbook link button"
```

---

## Task 5: Wire `/identity` to the packet card

**Files:**
- Modify: `src/commands/identity.ts`

- [ ] **Step 1: Import the builder**

Add to the imports at the top of `src/commands/identity.ts`:

```ts
import { identityEmbed } from '../lib/embeds';
```

- [ ] **Step 2: `create` — capture the member + issued identity and reply with the card**

Replace the body from `const cover = ...` through the final `editReply` in `create(...)` with:

```ts
  const cover = generateIdentity(guessGender(employeeName));
  const m = newMember(gm.id, employeeName, rank);
  await applyRosterChange(interaction.guild!, gm, m, interaction.user.id, 'identity_create', rank);
  const issued = await issueIdentity(gm.id, cover);
  await interaction.editReply({ embeds: [identityEmbed(m, issued, 'Identity issued', 'success')] });
```

- [ ] **Step 3: `rotate` — reply with the card**

Replace the last two lines of `rotate(...)` (`const cover = ...` and the `editReply`) with:

```ts
  const cover = generateIdentity(guessGender(m.employeeName));
  const issued = await issueIdentity(gm.id, cover);
  await interaction.editReply({ embeds: [identityEmbed(m, issued, 'New papers filed', 'success')] });
```

- [ ] **Step 4: `view` — reply with the card**

Replace the final `editReply({ content: [ ... ].join('\n') })` in `view(...)` with:

```ts
  await interaction.editReply({ embeds: [identityEmbed(m, id, 'Identity packet')] });
```

- [ ] **Step 5: Verify + commit**

Run: `npx tsc --noEmit`
Expected: exits 0.

```bash
git add src/commands/identity.ts
git commit -m "feat(bot): /identity replies with the packet card"
```

---

## Task 6: Wire `/whois` to the member card

**Files:**
- Modify: `src/commands/roster.ts`

- [ ] **Step 1: Import + replace the reply**

Add `import { whoisEmbed } from '../lib/embeds';` to the top. In the `whois` command's `execute`, replace the final `editReply({ content: [ ... ].join('\n') })` (and the now-unused `divs`/`pos` locals it built) with:

```ts
    const m = await getMember(user.id);
    if (!m) return void interaction.editReply({ content: line('err', 'No file on that member.') });
    await interaction.editReply({ embeds: [whoisEmbed(m)] });
```

- [ ] **Step 2: Verify + commit**

Run: `npx tsc --noEmit`
Expected: exits 0. If `DIVISION_LABEL`/`POSITION_LABEL` are now unused in `roster.ts`, remove them from its import (let tsc tell you).

```bash
git add src/commands/roster.ts
git commit -m "feat(bot): /whois replies with the member card"
```

---

## Task 7: Wire `/shift end` + `/shift status`

**Files:**
- Modify: `src/commands/shift.ts`

- [ ] **Step 1: Import**

Add `import { shiftSummaryEmbed, shiftStatusEmbed } from '../lib/embeds';` to the top of `src/commands/shift.ts`.

- [ ] **Step 2: `end` — reply with the summary card**

Replace the final `editReply({ content: line('ok', ...) })` in `end(...)` with:

```ts
  await interaction.editReply({ embeds: [shiftSummaryEmbed(formatDuration(mins), n, movements)] });
```

- [ ] **Step 3: `status` — reply with the status card**

Replace the two `editReply` calls in `status(...)` so it reads:

```ts
async function status(interaction: ChatInputCommandInteraction) {
  const m = await requireRoster(interaction);
  if (!m) return;
  const shiftRow = await getOpenShift(m.discordId);
  if (!shiftRow) return void interaction.editReply({ embeds: [shiftStatusEmbed(false)] });
  const mins = shiftDurationMinutes(shiftRow.startedAt, new Date().toISOString());
  const n = await countIncidents(shiftRow.id);
  await interaction.editReply({ embeds: [shiftStatusEmbed(true, formatDuration(mins), n)] });
}
```

- [ ] **Step 4: Verify + commit**

Run: `npx tsc --noEmit`
Expected: exits 0.

```bash
git add src/commands/shift.ts
git commit -m "feat(bot): /shift end + status reply with cards"
```

---

## Task 8: Wire `/lockdown`

**Files:**
- Modify: `src/commands/security.ts`

- [ ] **Step 1: Import + replace the reply**

Add `import { lockdownEmbed } from '../lib/embeds';` to the top. In `lockdown`'s `execute`, replace the final `editReply({ content: line('ok', ...) })` with:

```ts
    await setLockdown(interaction.guild!.id, on);
    await interaction.editReply({ embeds: [lockdownEmbed(on)] });
```

- [ ] **Step 2: Verify + commit**

Run: `npx tsc --noEmit`
Expected: exits 0. If `line` is now unused in `security.ts`, remove it from the import.

```bash
git add src/commands/security.ts
git commit -m "feat(bot): /lockdown replies with the state card"
```

---

## Task 9: Wire `/help`

**Files:**
- Modify: `src/commands/help.ts`

- [ ] **Step 1: Replace the whole file**

```ts
import { SlashCommandBuilder } from 'discord.js';
import type { Command } from './types';
import { helpEmbed, helpComponents } from '../lib/embeds';

export const help: Command = {
  data: new SlashCommandBuilder().setName('help').setDescription('What you can do here, and how.'),
  highCommandOnly: false,
  async execute(interaction) {
    await interaction.editReply({ embeds: [helpEmbed()], components: [helpComponents()] });
  },
};
```

- [ ] **Step 2: Verify + commit**

Run: `npx tsc --noEmit`
Expected: exits 0.

```bash
git add src/commands/help.ts
git commit -m "feat(bot): /help is a categorized card with a handbook button"
```

---

## Task 10: Roster as an embed; remove the code-block renderer

**Files:**
- Modify: `src/roster/render.ts`
- Modify: `src/commands/rosterAdmin.ts`
- Delete: `src/lib/rosterTree.ts`, `src/lib/rosterTree.test.ts`

- [ ] **Step 1: `src/roster/render.ts` — edit an embed**

Replace the file with:

```ts
import type { Guild } from 'discord.js';
import { rosterEmbed } from '../lib/embeds';
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
  await message.edit({ content: '', embeds: [rosterEmbed(await listActiveMembers())] });
}
```

- [ ] **Step 2: `src/commands/rosterAdmin.ts` — post an embed**

In `rosterSetup`'s `execute`, change the import `import { renderRoster } from '../lib/rosterTree';` to `import { rosterEmbed } from '../lib/embeds';`, and replace:

```ts
    const body = renderRoster(await listActiveMembers());
    const msg = await channel.send('```\n' + body + '\n```');
```

with:

```ts
    const msg = await channel.send({ embeds: [rosterEmbed(await listActiveMembers())] });
```

- [ ] **Step 3: Delete the superseded renderer**

```bash
git rm src/lib/rosterTree.ts src/lib/rosterTree.test.ts
```

- [ ] **Step 4: Full gate**

Run: `npx tsc --noEmit && npx vitest run --no-file-parallelism`
Expected: tsc exits 0 (no remaining `renderRoster` importers); all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/roster/render.ts src/commands/rosterAdmin.ts src/lib/rosterTree.ts src/lib/rosterTree.test.ts
git commit -m "feat(bot): live roster is an embed; drop the code-block renderer"
```

---

## Task 11: Tidy command descriptions

**Files:**
- Modify: `src/commands/roster.ts`, `src/commands/rosterAdmin.ts`, `src/commands/security.ts`, `src/commands/say.ts`, `src/commands/identity.ts`, `src/commands/shift.ts`

Update each `.setDescription(...)` to the plain-language text below (names/options unchanged). Only the description strings change.

- [ ] **Step 1: `roster.ts`**

```
promote      → 'Move a member up one rank.'
demote       → 'Move a member down one rank.'
setrank      → "Set a member's rank directly."
division     → 'Add or remove a member from a division.'
position     → 'Give or take away a member position.'
dismiss      → 'Remove a member from the company.'
whois        → "Look up a member's file."
```

- [ ] **Step 2: `rosterAdmin.ts`**

```
roster-setup → 'Post the live roster in a channel (it updates itself).'
sync-roles   → "Re-apply a member's Discord roles from the roster."
```

- [ ] **Step 3: `security.ts`**

```
lockdown     → 'Seal or open the server.'
deadman      → "Reset the dead-man's switch."
```

- [ ] **Step 4: `say.ts`**

```
say          → 'Send a message as Redwood Peak.'
```

- [ ] **Step 5: `identity.ts`** (group + subcommands)

```
identity (group)  → 'Create and manage member identities.'
create            → 'Onboard a member and issue their cover identity.'
rotate            → 'Issue a member fresh papers (keeps their name).'
view              → "Show a member's current identity packet."
```

- [ ] **Step 6: `shift.ts`** (group + subcommands)

```
shift (group) → 'Log your on-duty time and activity.'
start         → 'Go on duty.'
log           → 'Record an incident from this shift.'
party         → 'Add another person to your latest incident.'
end           → 'Close out your shift.'
report        → 'File a witness dossier for this shift.'
status        → 'Check your current duty status.'
```

- [ ] **Step 7: Full gate + commit**

Run: `npx tsc --noEmit && npx vitest run --no-file-parallelism`
Expected: tsc exits 0; all tests pass.

```bash
git add src/commands/
git commit -m "polish(bot): plain-language command descriptions"
```

---

## Self-review (completed)

- **Spec coverage:** embed foundation + tones → Task 1; identity card → Tasks 1/5; whois card → Tasks 2/6; roster card → Tasks 2/10; shift summary+status → Tasks 3/7; lockdown card → Tasks 3/8; help card + link button → Tasks 4/9; description tidy → Task 11; remove `renderRoster` → Task 10. All spec sections covered.
- **Type consistency:** builders take `Member` (from `./member`) and `Identity` (from `./identity`) exactly as defined; `Tone`/`TONE_COLOR` used identically across tasks; `identityEmbed(member, identity, title, tone?)` signature matches every call site (view omits tone → info; create/rotate pass `'success'`); `rosterEmbed(members)`, `whoisEmbed(member)`, `shiftSummaryEmbed(durationLabel, count, movements)`, `shiftStatusEmbed(onDuty, durationLabel?, count?)`, `lockdownEmbed(on)` all match their wiring calls.
- **No placeholders:** every code step is complete.
- **Out of scope (untouched):** no new commands/features; `line()` unchanged for one-liners and errors; deferral/ephemeral behavior unchanged.
```
