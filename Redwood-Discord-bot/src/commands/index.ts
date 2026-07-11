import type { Command } from './types';
import { help } from './help';
import { rosterCommands } from './roster';
import { rosterAdminCommands } from './rosterAdmin';
import { securityCommands } from './security';
import { speechCommands } from './say';
import { identityCommands } from './identity';
import { shiftCommands } from './shift';
import { lookupCommands } from './lookup';

export const commands: Command[] = [help, ...rosterCommands, ...rosterAdminCommands, ...securityCommands, ...speechCommands, ...identityCommands, ...shiftCommands, ...lookupCommands];

export const commandMap = new Map(commands.map((c) => [c.data.name, c]));
