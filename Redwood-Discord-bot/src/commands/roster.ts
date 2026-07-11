import { SlashCommandBuilder, type ChatInputCommandInteraction, type GuildMember } from 'discord.js';
import type { Command } from './types';
import { line } from '../lib/voice';
import { RANKS, DIVISIONS, POSITIONS, RANK_LABEL, DIVISION_LABEL, POSITION_LABEL, nextRank, prevRank, isRank, isDivision, isPosition, type Division, type Position } from '../lib/ranks';
import { getMember } from '../db/members';
import { applyRosterChange } from '../roster/apply';
import { whoisEmbed } from '../lib/embeds';

async function targetMember(interaction: ChatInputCommandInteraction): Promise<GuildMember | null> {
  const user = interaction.options.getUser('user', true);
  return interaction.guild!.members.fetch(user.id).catch(() => null);
}

async function moveRank(interaction: ChatInputCommandInteraction, dir: 'promote' | 'demote') {
  const gm = await targetMember(interaction);
  if (!gm) return void interaction.editReply({ content: line('err', 'That member is not in the server.') });
  const m = await getMember(gm.id);
  if (!m || m.status !== 'active') return void interaction.editReply({ content: line('deny', 'That member is not on the roster.') });
  const target = dir === 'promote' ? nextRank(m.rank) : prevRank(m.rank);
  if (!target) return void interaction.editReply({ content: line('deny', `Cannot ${dir} past ${RANK_LABEL[m.rank]}.`) });
  await applyRosterChange(interaction.guild!, gm, { ...m, rank: target }, interaction.user.id, dir, target);
  await interaction.editReply({ content: line('ok', `**${m.employeeName}** is now ${RANK_LABEL[target]}.`) });
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
    if (!gm) return void interaction.editReply({ content: line('err', 'That member is not in the server.') });
    const m = await getMember(gm.id);
    if (!m || m.status !== 'active') return void interaction.editReply({ content: line('deny', 'That member is not on the roster.') });
    const rank = interaction.options.getString('rank', true);
    if (!isRank(rank)) return void interaction.editReply({ content: line('err', 'Unknown rank.') });
    await applyRosterChange(interaction.guild!, gm, { ...m, rank }, interaction.user.id, 'setrank', rank);
    await interaction.editReply({ content: line('ok', `**${m.employeeName}** is now ${RANK_LABEL[rank]}.`) });
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
    if (!gm) return void interaction.editReply({ content: line('err', 'That member is not in the server.') });
    const m = await getMember(gm.id);
    if (!m || m.status !== 'active') return void interaction.editReply({ content: line('deny', 'That member is not on the roster.') });
    const action = interaction.options.getString('action', true);
    const div = interaction.options.getString('division', true);
    if (!isDivision(div)) return void interaction.editReply({ content: line('err', 'Unknown division.') });
    const set = new Set<Division>(m.divisions);
    if (action === 'add') set.add(div); else set.delete(div);
    await applyRosterChange(interaction.guild!, gm, { ...m, divisions: [...set] }, interaction.user.id, `division_${action}`, div);
    await interaction.editReply({ content: line('ok', `**${m.employeeName}** ${action === 'add' ? 'joined' : 'left'} ${DIVISION_LABEL[div]}.`) });
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
    if (!gm) return void interaction.editReply({ content: line('err', 'That member is not in the server.') });
    const m = await getMember(gm.id);
    if (!m || m.status !== 'active') return void interaction.editReply({ content: line('deny', 'That member is not on the roster.') });
    const action = interaction.options.getString('action', true);
    const pos = interaction.options.getString('position', true);
    if (!isPosition(pos)) return void interaction.editReply({ content: line('err', 'Unknown position.') });
    const set = new Set<Position>(m.positions);
    if (action === 'add') set.add(pos); else set.delete(pos);
    await applyRosterChange(interaction.guild!, gm, { ...m, positions: [...set] }, interaction.user.id, `position_${action}`, pos);
    await interaction.editReply({ content: line('ok', `**${m.employeeName}** ${action === 'add' ? 'given' : 'removed from'} ${POSITION_LABEL[pos]}.`) });
  },
};

const dismiss: Command = {
  highCommandOnly: true,
  data: new SlashCommandBuilder().setName('dismiss').setDescription('Dismiss a member (strip standing).')
    .addUserOption((o) => o.setName('user').setDescription('The member').setRequired(true))
    .addStringOption((o) => o.setName('note').setDescription('Reason (optional)')) as SlashCommandBuilder,
  async execute(interaction) {
    const gm = await targetMember(interaction);
    if (!gm) return void interaction.editReply({ content: line('err', 'That member is not in the server.') });
    const m = await getMember(gm.id);
    if (!m || m.status !== 'active') return void interaction.editReply({ content: line('deny', 'That member is not on the roster.') });
    const note = interaction.options.getString('note') ?? undefined;
    await applyRosterChange(interaction.guild!, gm, { ...m, status: 'dismissed' }, interaction.user.id, 'dismiss', note);
    await interaction.editReply({ content: line('ok', `**${m.employeeName}** has been dismissed.`) });
  },
};

const whois: Command = {
  highCommandOnly: false,
  data: new SlashCommandBuilder().setName('whois').setDescription("Show a member's file.")
    .addUserOption((o) => o.setName('user').setDescription('The member').setRequired(true)) as SlashCommandBuilder,
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const m = await getMember(user.id);
    if (!m) return void interaction.editReply({ content: line('err', 'No file on that member.') });
    await interaction.editReply({ embeds: [whoisEmbed(m)] });
  },
};

export const rosterCommands: Command[] = [promote, demote, setrank, division, position, dismiss, whois];
