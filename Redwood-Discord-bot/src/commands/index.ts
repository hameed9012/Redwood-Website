import type { Command } from './types';
import { help } from './help';
import { rosterCommands } from './roster';
import { rosterAdminCommands } from './rosterAdmin';
import { securityCommands } from './security';
import { speechCommands } from './say';
import { identityCommands } from './identity';
import { shiftCommands } from './shift';

export const commands: Command[] = [help, ...rosterCommands, ...rosterAdminCommands, ...securityCommands, ...speechCommands, ...identityCommands, ...shiftCommands];

export const commandMap = new Map(commands.map((c) => [c.data.name, c]));
