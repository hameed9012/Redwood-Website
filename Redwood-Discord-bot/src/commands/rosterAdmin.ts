import { SlashCommandBuilder, ChannelType } from 'discord.js';
import type { Command } from './types';
import { line } from '../lib/voice';
import { rosterEmbed } from '../lib/embeds';
import { listActiveMembers, getMember } from '../db/members';
import { setRosterConfig } from '../db/config';
import { config } from '../lib/config';
import { desiredRoleIds, allManagedRoleIds } from '../lib/desiredRoles';
import { redrawRoster } from '../roster/render';

const rosterSetup: Command = {
  highCommandOnly: true,
  data: new SlashCommandBuilder().setName('roster-setup').setDescription('Post the live roster message in a channel.')
    .addChannelOption((o) => o.setName('channel').setDescription('Channel for the roster').addChannelTypes(ChannelType.GuildText).setRequired(true)) as SlashCommandBuilder,
  async execute(interaction) {
    const picked = interaction.options.getChannel('channel', true);
    const channel = await interaction.guild!.channels.fetch(picked.id).catch(() => null);
    if (!channel || channel.type !== ChannelType.GuildText) return void interaction.editReply({ content: line('err', 'Pick a text channel.') });
    const msg = await channel.send({ embeds: [rosterEmbed(await listActiveMembers())] });
    await setRosterConfig(interaction.guild!.id, channel.id, msg.id);
    await interaction.editReply({ content: line('ok', `Roster posted in <#${channel.id}>. It will keep itself current.`) });
  },
};

const syncRoles: Command = {
  highCommandOnly: true,
  data: new SlashCommandBuilder().setName('sync-roles').setDescription('Re-apply Discord roles from the roster for a member.')
    .addUserOption((o) => o.setName('user').setDescription('The member').setRequired(true)) as SlashCommandBuilder,
  async execute(interaction) {
    const cfg = config();
    const user = interaction.options.getUser('user', true);
    const m = await getMember(user.id);
    const gm = await interaction.guild!.members.fetch(user.id).catch(() => null);
    if (!m || m.status !== 'active' || !gm) return void interaction.editReply({ content: line('err', 'No active file for that member.') });
    const desired = new Set(desiredRoleIds(m, cfg));
    const managed = allManagedRoleIds(cfg);
    const toAdd = [...desired].filter((id) => !gm.roles.cache.has(id));
    const toRemove = managed.filter((id) => !desired.has(id) && gm.roles.cache.has(id));
    if (toAdd.length) await gm.roles.add(toAdd);
    if (toRemove.length) await gm.roles.remove(toRemove);
    await redrawRoster(interaction.guild!);
    await interaction.editReply({ content: line('ok', `Re-synced roles for **${m.employeeName}**.`) });
  },
};

export const rosterAdminCommands: Command[] = [rosterSetup, syncRoles];
