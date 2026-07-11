import { SlashCommandBuilder, MessageFlags, type ChatInputCommandInteraction, type GuildMember } from 'discord.js';
import type { Command } from './types';
import { line } from '../lib/voice';
import { RANKS, RANK_LABEL, isRank } from '../lib/ranks';
import type { Rank } from '../lib/ranks';
import type { Member } from '../lib/member';
import { getMember } from '../db/members';
import { getActiveIdentity, issueIdentity } from '../db/identities';
import { generateEmployeeName, generateIdentity } from '../lib/identityGen';
import { applyRosterChange } from '../roster/apply';

const EPH = { flags: MessageFlags.Ephemeral } as const;

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
  data: new SlashCommandBuilder().setName('identity').setDescription('Identity packets.')
    .addSubcommand((s) => s.setName('create').setDescription('Onboard a member with a fresh identity.')
      .addUserOption((o) => o.setName('user').setDescription('The member').setRequired(true))
      .addStringOption((o) => o.setName('rank').setDescription('Starting rank').setRequired(true)
        .addChoices(...RANKS.map((r) => ({ name: RANK_LABEL[r], value: r })))))
    .addSubcommand((s) => s.setName('rotate').setDescription('Issue new papers, keep the employee name.')
      .addUserOption((o) => o.setName('user').setDescription('The member').setRequired(true)))
    .addSubcommand((s) => s.setName('view').setDescription("Show a member's current packet.")
      .addUserOption((o) => o.setName('user').setDescription('The member').setRequired(true))) as SlashCommandBuilder,
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'create') return void create(interaction);
    if (sub === 'rotate') return void rotate(interaction);
    return void view(interaction);
  },
};

async function create(interaction: ChatInputCommandInteraction) {
  const gm = await targetMember(interaction);
  if (!gm) return void interaction.reply({ content: line('err', 'That member is not in the server.'), ...EPH });
  const existing = await getMember(gm.id);
  if (existing?.status === 'active') {
    return void interaction.reply({ content: line('deny', 'Already on the roster. Use `/identity rotate` for new papers.'), ...EPH });
  }
  const rank = interaction.options.getString('rank', true);
  if (!isRank(rank)) return void interaction.reply({ content: line('err', 'Unknown rank.'), ...EPH });

  const employeeName = generateEmployeeName();
  const cover = generateIdentity();
  await applyRosterChange(interaction.guild!, gm, newMember(gm.id, employeeName, rank), interaction.user.id, 'identity_create', rank);
  await issueIdentity(gm.id, cover);
  await interaction.reply({
    content: line('ok', `Onboarded **${employeeName}** as ${RANK_LABEL[rank]}. Cover issued under **${cover.legalName}**. Welcome to Redwood Peak.`),
    ...EPH,
  });
}

async function rotate(interaction: ChatInputCommandInteraction) {
  const gm = await targetMember(interaction);
  if (!gm) return void interaction.reply({ content: line('err', 'That member is not in the server.'), ...EPH });
  const m = await getMember(gm.id);
  if (!m || m.status !== 'active') return void interaction.reply({ content: line('deny', 'That member is not on the roster.'), ...EPH });
  const cover = generateIdentity();
  await issueIdentity(gm.id, cover);
  await interaction.reply({ content: line('ok', `New papers for **${m.employeeName}** — now **${cover.legalName}**. The old cover is retired.`), ...EPH });
}

async function view(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user', true);
  const m = await getMember(user.id);
  const id = await getActiveIdentity(user.id);
  if (!m || !id) return void interaction.reply({ content: line('err', 'No active identity on file for that member.'), ...EPH });
  await interaction.reply({
    content: [
      '```',
      'REDWOOD PEAK — IDENTITY PACKET',
      `Employee     : ${m.employeeName}`,
      `Legal name   : ${id.legalName}`,
      `DOB          : ${id.dob}`,
      `SSN          : ${id.ssn}`,
      `ID number    : ${id.idNumber}`,
      `Blood type   : ${id.bloodType}`,
      `Next of kin  : ${id.nextOfKin}`,
      `Issued       : ${id.issuedAt.slice(0, 10)}`,
      '```',
    ].join('\n'),
    ...EPH,
  });
}

export const identityCommands: Command[] = [identity];
