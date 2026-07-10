import type { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder, SlashCommandOptionsOnlyBuilder } from 'discord.js';

export interface Command {
  data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | SlashCommandOptionsOnlyBuilder;
  /** true = only high-command may run it (checked centrally before execute). */
  highCommandOnly: boolean;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
}
