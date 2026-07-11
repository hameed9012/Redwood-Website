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
