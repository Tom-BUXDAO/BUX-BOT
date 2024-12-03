import { Client, GuildMember, GatewayIntentBits } from 'discord.js';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const RATE_LIMIT_DELAY = 1000; // 1 second between role operations

// Create a singleton client with proper intents
let client: Client | null = null;

async function getClient(): Promise<Client> {
  if (!client) {
    client = new Client({ 
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages
      ],
      rest: {
        timeout: 60000,
        retries: 3
      }
    });

    await client.login(DISCORD_BOT_TOKEN);
  }

  if (!client.isReady()) {
    await new Promise<void>((resolve) => {
      client!.once('ready', () => resolve());
    });
  }

  return client;
}

export async function updateDiscordRoles(discordId: string, assignedRoles: string[]) {
  try {
    const client = await getClient();
    const guild = await client.guilds.fetch(GUILD_ID!);
    const member = await guild.members.fetch(discordId);

    // Get current Discord roles
    const currentRoles = member.roles.cache
      .filter(role => assignedRoles.includes(role.id))
      .map(role => role.id);

    // Determine which roles to add and remove
    const rolesToAdd = assignedRoles.filter(role => !currentRoles.includes(role));
    const rolesToRemove = currentRoles.filter(role => !assignedRoles.includes(role));

    console.log('Current roles:', currentRoles);
    console.log('New roles to assign:', assignedRoles);
    console.log('Roles to add:', rolesToAdd);
    console.log('Roles to remove:', rolesToRemove);

    // Add new roles
    for (const roleId of rolesToAdd) {
      try {
        await member.roles.add(roleId);
        console.log(`Added role ${roleId} to ${discordId}`);
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      } catch (error) {
        console.error(`Error adding role ${roleId}:`, error);
      }
    }

    // Remove old roles
    for (const roleId of rolesToRemove) {
      try {
        await member.roles.remove(roleId);
        console.log(`Removed role ${roleId} from ${discordId}`);
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      } catch (error) {
        console.error(`Error removing role ${roleId}:`, error);
      }
    }

    return {
      added: rolesToAdd,
      removed: rolesToRemove,
      previousRoles: currentRoles,
      newRoles: assignedRoles
    };
  } catch (error) {
    console.error('Error updating Discord roles:', error);
    throw error;
  }
} 