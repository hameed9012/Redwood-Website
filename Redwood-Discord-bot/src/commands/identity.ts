import { SlashCommandBuilder, type ChatInputCommandInteraction, type GuildMember } from 'discord.js';
import type { Command } from './types';
import { line } from '../lib/voice';
import { RANKS, RANK_LABEL, isRank } from '../lib/ranks';
import type { Rank } from '../lib/ranks';
import type { Member } from '../lib/member';
import { getMember } from '../db/members';
import { getActiveIdentity, issueIdentity } from '../db/identities';
import { burnActiveIdentity } from '../db/reputation';
import { generateIdentity, guessGender } from '../lib/identityGen';
import { applyRosterChange } from '../roster/apply';
import { identityEmbed } from '../lib/embeds';

async function targetMember(interaction: ChatInputCommandInteraction): Promise<GuildMember | null> {
  const user = interaction.options.getUser('user', true);
  return interaction.guild!.members.fetch(user.id).catch(() => null);
}

function newMember(discordId: string, employeeName: string, rank: Rank): Member {
  const now = new Date().toISOString();
  return { discordId, employeeName, rank, divisions: [], positions: [], status: 'active', joinedAt: now, updatedAt: now };
}

const identity: Command = {
  highCommandOnly: true,
  data: new SlashCommandBuilder().setName('identity').setDescription('Create and manage member identities.')
    .addSubcommand((s) => s.setName('create').setDescription('Onboard a member and issue their cover identity.')
      .addUserOption((o) => o.setName('user').setDescription('The member').setRequired(true))
      .addStringOption((o) => o.setName('name').setDescription('Their roleplay name (from their application)').setRequired(true))
      .addStringOption((o) => o.setName('rank').setDescription('Starting rank').setRequired(true)
        .addChoices(...RANKS.map((r) => ({ name: RANK_LABEL[r], value: r })))))
    .addSubcommand((s) => s.setName('rotate').setDescription('Issue a member fresh papers (keeps their name).')
      .addUserOption((o) => o.setName('user').setDescription('The member').setRequired(true)))
    .addSubcommand((s) => s.setName('view').setDescription("Show a member's current identity packet.")
      .addUserOption((o) => o.setName('user').setDescription('The member').setRequired(true)))
    .addSubcommand((s) => s.setName('burn').setDescription("Burn a member's cover and issue fresh papers.")
      .addUserOption((o) => o.setName('user').setDescription('The member').setRequired(true))
      .addStringOption((o) => o.setName('reason').setDescription('Why it is compromised').setRequired(true))) as SlashCommandBuilder,
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'create') return create(interaction);
    if (sub === 'rotate') return rotate(interaction);
    if (sub === 'burn') return burn(interaction);
    return view(interaction);
  },
};

async function create(interaction: ChatInputCommandInteraction) {
  const gm = await targetMember(interaction);
  if (!gm) return void interaction.editReply({ content: line('err', 'That member is not in the server.') });
  const existing = await getMember(gm.id);
  if (existing?.status === 'active') {
    return void interaction.editReply({ content: line('deny', 'Already on the roster. Use `/identity rotate` for new papers.') });
  }
  const rank = interaction.options.getString('rank', true);
  if (!isRank(rank)) return void interaction.editReply({ content: line('err', 'Unknown rank.') });
  const employeeName = interaction.options.getString('name', true);

  const cover = generateIdentity(guessGender(employeeName));
  const m = newMember(gm.id, employeeName, rank);
  await applyRosterChange(interaction.guild!, gm, m, interaction.user.id, 'identity_create', rank);
  const issued = await issueIdentity(gm.id, cover);
  await interaction.editReply({ embeds: [identityEmbed(m, issued, 'Identity issued', 'success')] });
}

async function rotate(interaction: ChatInputCommandInteraction) {
  const gm = await targetMember(interaction);
  if (!gm) return void interaction.editReply({ content: line('err', 'That member is not in the server.') });
  const m = await getMember(gm.id);
  if (!m || m.status !== 'active') return void interaction.editReply({ content: line('deny', 'That member is not on the roster.') });
  const cover = generateIdentity(guessGender(m.employeeName));
  const issued = await issueIdentity(gm.id, cover);
  await interaction.editReply({ embeds: [identityEmbed(m, issued, 'New papers filed', 'success')] });
}

async function view(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user', true);
  const m = await getMember(user.id);
  const id = await getActiveIdentity(user.id);
  if (!m || !id) return void interaction.editReply({ content: line('err', 'No active identity on file for that member.') });
  await interaction.editReply({ embeds: [identityEmbed(m, id, 'Identity packet')] });
}

async function burn(interaction: ChatInputCommandInteraction) {
  const gm = await targetMember(interaction);
  if (!gm) return void interaction.editReply({ content: line('err', 'That member is not in the server.') });
  const m = await getMember(gm.id);
  if (!m || m.status !== 'active') return void interaction.editReply({ content: line('deny', 'That member is not on the roster.') });
  await burnActiveIdentity(gm.id);
  const cover = generateIdentity(guessGender(m.employeeName));
  const issued = await issueIdentity(gm.id, cover);
  await interaction.editReply({ embeds: [identityEmbed(m, issued, 'Cover burned — new papers filed', 'success')] });
}

export const identityCommands: Command[] = [identity];
