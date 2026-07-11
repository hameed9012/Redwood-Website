import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { Command } from './types';
import { line } from '../lib/voice';
import { getMember } from '../db/members';
import { getActiveIdentity } from '../db/identities';
import { addReputation } from '../db/reputation';
import { rankOrder } from '../lib/ranks';

async function issuerIsSupervisorPlus(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const issuer = await getMember(interaction.user.id);
  return !!issuer && issuer.status === 'active' && rankOrder(issuer.rank) >= rankOrder('supervisor');
}

function repCommand(name: 'commend' | 'writeup', kind: 'commendation' | 'writeup', verb: string): Command {
  return {
    highCommandOnly: false,
    data: new SlashCommandBuilder().setName(name).setDescription(name === 'commend' ? 'Commend a member for good work.' : 'File a write-up against a member.')
      .addUserOption((o) => o.setName('member').setDescription('The member').setRequired(true))
      .addStringOption((o) => o.setName('reason').setDescription('What for').setRequired(true)) as SlashCommandBuilder,
    async execute(interaction) {
      if (!(await issuerIsSupervisorPlus(interaction))) {
        return void interaction.editReply({ content: line('deny', 'Only supervisors and above may do that.') });
      }
      const user = interaction.options.getUser('member', true);
      const m = await getMember(user.id);
      if (!m || m.status !== 'active') return void interaction.editReply({ content: line('deny', 'That member is not on the roster.') });
      const id = await getActiveIdentity(user.id);
      if (!id) return void interaction.editReply({ content: line('err', 'That member has no active identity.') });
      const reason = interaction.options.getString('reason', true);
      await addReputation(id.id, m.discordId, kind, reason, interaction.user.id);
      await interaction.editReply({ content: line('ok', `${verb} **${m.employeeName}**: ${reason}`) });
    },
  };
}

export const reputationCommands: Command[] = [
  repCommand('commend', 'commendation', 'Commended'),
  repCommand('writeup', 'writeup', 'Wrote up'),
];
