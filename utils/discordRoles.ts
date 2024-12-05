import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import type { RoleUpdate } from '@/types/verification';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN!);

export async function updateDiscordRoles(discordId: string, newRoles: string[]): Promise<RoleUpdate> {
  try {
    // Get current member data
    const member = await rest.get(
      Routes.guildMember(GUILD_ID!, discordId)
    ) as { roles: string[] };

    const currentRoles = member.roles;
    console.log('Current roles:', currentRoles);
    console.log('New roles to assign:', newRoles);

    // Add roles one by one
    for (const role of newRoles) {
      if (!currentRoles.includes(role)) {
        try {
          await rest.put(
            Routes.guildMemberRole(GUILD_ID!, discordId, role)
          );
          console.log(`Successfully added role ${role} to ${discordId}`);
        } catch (error) {
          console.error(`Failed to add role ${role}:`, error);
        }
      }
    }

    // Remove roles one by one
    for (const role of currentRoles) {
      if (!newRoles.includes(role)) {
        try {
          await rest.delete(
            Routes.guildMemberRole(GUILD_ID!, discordId, role)
          );
          console.log(`Successfully removed role ${role} from ${discordId}`);
        } catch (error) {
          console.error(`Failed to remove role ${role}:`, error);
        }
      }
    }

    // Get final roles after changes
    const updatedMember = await rest.get(
      Routes.guildMember(GUILD_ID!, discordId)
    ) as { roles: string[] };

    const added = newRoles.filter(role => !currentRoles.includes(role));
    const removed = currentRoles.filter(role => !newRoles.includes(role));

    return {
      added,
      removed,
      previousRoles: currentRoles,
      newRoles: updatedMember.roles
    };

  } catch (error) {
    console.error('Error updating Discord roles:', error);
    throw error;
  }
} 