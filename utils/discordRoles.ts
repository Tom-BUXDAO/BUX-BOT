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

    // Update member roles with exactly the roles they should have
    await rest.patch(Routes.guildMember(GUILD_ID!, discordId), {
      body: {
        roles: newRoles
      }
    });

    // Calculate added and removed for display
    const added = newRoles.filter(role => !currentRoles.includes(role));
    const removed = currentRoles.filter(role => !newRoles.includes(role));

    // Log changes
    added.forEach(role => {
      console.log(`Successfully added role ${role} to ${discordId}`);
    });

    removed.forEach(role => {
      console.log(`Successfully removed role ${role} from ${discordId}`);
    });

    return {
      added,
      removed,
      previousRoles: currentRoles,
      newRoles: newRoles
    };

  } catch (error) {
    console.error('Error updating Discord roles:', error);
    throw error;
  }
} 