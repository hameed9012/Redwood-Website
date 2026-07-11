import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import type { Member } from './member';
import type { Identity } from './identity';
import { RANKS, RANK_LABEL, DIVISION_LABEL, POSITION_LABEL, type Rank } from './ranks';
import { HANDBOOK_URL } from './voice';
import type { LookupResult, IncidentLine } from './lookup';
import type { Standing } from './reputation';
import type { CarouselSlide } from '../db/carousel';
import { formatMoney, type LedgerEntry, type BookBalance } from './ledger';

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

function standingValue(s: Standing): string {
  const head = `✔ ${s.commendations} commendation${s.commendations === 1 ? '' : 's'} · ⚠ ${s.writeups} write-up${s.writeups === 1 ? '' : 's'}`;
  return s.recent.length ? `${head}\n${s.recent.join('\n')}` : head;
}

export function whoisEmbed(member: Member, standing?: Standing): EmbedBuilder {
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
      ...(standing ? [{ name: 'Standing', value: standingValue(standing) }] : []),
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

const REDACTED = '▓▓▓▓';

function incidentsValue(lines: IncidentLine[]): string {
  if (lines.length === 0) return 'None on record.';
  return lines.slice(0, 10).map((l) => `• ${l.summary} — ${l.location} (${l.date}, logged by ${l.loggedBy})`).join('\n').slice(0, 1024);
}

export function lookupEmbed(result: LookupResult): EmbedBuilder {
  if (result.kind === 'not-found') {
    return baseEmbed('denied', 'Records').setTitle('No record').setDescription('Nothing on file matches that.');
  }
  if (result.kind === 'disambiguation') {
    return baseEmbed('warning', 'Records')
      .setTitle('Several matches')
      .setDescription('Be more specific:')
      .addFields({ name: 'Matches', value: result.matches.map((m) => `• ${m.label} (${m.kind})`).join('\n') });
  }
  if (result.kind === 'outsider-dossier') {
    return baseEmbed('info', 'Records')
      .setTitle(`Outsider · ${result.label}`)
      .setDescription(`Role: ${result.role}${result.notOnFile ? ' · not on file' : ''}`)
      .addFields(
        { name: 'Appearances', value: incidentsValue(result.incidents) },
        { name: 'Also seen with', value: result.alsoSeen.length ? result.alsoSeen.slice(0, 20).join(', ') : '—' },
      );
  }
  if (result.kind === 'registration') {
    return baseEmbed(result.status === 'flagged' ? 'warning' : 'info', 'Records')
      .setTitle(`${result.itemType === 'firearm' ? 'Firearm' : 'Vehicle'} · ${result.label}`)
      .setDescription(result.detail)
      .addFields(
        { name: 'Status', value: result.status === 'flagged' ? `⚠ Flagged${result.flagNote ? ` — ${result.flagNote}` : ''}` : 'Clean', inline: true },
        { name: 'Issued', value: result.issued, inline: true },
        { name: 'Registered to', value: result.owner ?? REDACTED },
      );
  }
  const e = baseEmbed('info', 'Personnel')
    .setTitle(`${result.employeeName}${result.dismissed ? ' (dismissed)' : ''}`)
    .setDescription(RANK_LABEL[result.rank])
    .addFields(
      { name: 'Legal name (cover)', value: result.cover ? result.cover.legalName : REDACTED, inline: true },
      { name: 'SSN', value: result.cover ? `\`${result.cover.ssn}\`` : REDACTED, inline: true },
      { name: 'Past identities', value: result.pastIdentities === null ? REDACTED : (result.pastIdentities.length ? result.pastIdentities.join(', ') : '—') },
      { name: 'Registered gear', value: result.registeredGear === null ? REDACTED : (result.registeredGear.length ? result.registeredGear.join('\n') : '—') },
      { name: 'Standing', value: standingValue(result.standing) },
      { name: 'Incidents', value: incidentsValue(result.incidents) },
    );
  return e;
}

export function registrationEmbed(itemType: 'firearm' | 'vehicle', label: string, detail: string, ownerCover: string): EmbedBuilder {
  return baseEmbed('success', 'Records')
    .setTitle(`${itemType === 'firearm' ? 'Serial issued' : 'Vehicle registered'} · ${label}`)
    .addFields(
      { name: itemType === 'firearm' ? 'Firearm' : 'Vehicle', value: detail, inline: true },
      { name: 'Registered to', value: ownerCover, inline: true },
    );
}

export function carouselListEmbed(slides: CarouselSlide[]): EmbedBuilder {
  const e = baseEmbed('info', 'Media').setTitle('Carousel slides');
  if (slides.length === 0) return e.setDescription('No slides — the site is showing the built-in ones.');
  return e.setDescription(slides.map((s, i) => `**${i + 1}. ${s.title}** — ${s.body.slice(0, 80)}`).join('\n'));
}

export function ledgerEmbed(balances: { white: BookBalance; black: BookBalance }, recent: LedgerEntry[]): EmbedBuilder {
  const bookLine = (b: BookBalance) => `Balance ${formatMoney(b.balance)}\nIn ${formatMoney(b.inflow)} · Out ${formatMoney(b.outflow)}`;
  const e = baseEmbed('info', 'Ledger')
    .setTitle('The books')
    .addFields(
      { name: 'White (clean)', value: bookLine(balances.white), inline: true },
      { name: 'Black (off the books)', value: bookLine(balances.black), inline: true },
    );
  if (recent.length) {
    e.addFields({ name: 'Recent', value: recent.slice(0, 8).map((r) => `${r.direction === 'inflow' ? '+' : '−'}${formatMoney(r.amount)} ${r.book} — ${r.reason}`).join('\n').slice(0, 1024) });
  }
  return e;
}
