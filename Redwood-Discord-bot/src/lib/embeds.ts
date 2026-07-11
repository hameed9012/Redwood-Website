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
