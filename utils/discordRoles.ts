import { Client, GuildMember, GatewayIntentBits, Role } from 'discord.js';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID || '';
const RATE_LIMIT_DELAY = 1000;

// Create a singleton client with proper intents
let client: Client | null = null;
let clientInitPromise: Promise<Client> | null = null;

async function getClient(): Promise<Client> {
  if (clientInitPromise) {
    return clientInitPromise;
  }

  clientInitPromise = new Promise(async (resolve, reject) => {
    try {
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
          const timeout = setTimeout(() => {
            reject(new Error('Discord client ready timeout'));
          }, 30000);

          client!.once('ready', () => {
            clearTimeout(timeout);
            resolve();
          });
        });
      }

      resolve(client);
    } catch (error) {
      clientInitPromise = null;
      reject(error);
    }
  });

  return clientInitPromise;
}

export async function updateDiscordRoles(discordId: string, newRoles: string[]) {
  try {
    if (!GUILD_ID) {
      throw new Error('DISCORD_GUILD_ID is not configured');
    }

    const discord = await getClient();
    const guild = await discord.guilds.fetch(GUILD_ID);
    const member = await guild.members.fetch(discordId);

    const currentRoles = member.roles.cache;
    const managedRoleIds = Object.values(process.env)
      .filter(id => id && typeof id === 'string' && id.match(/^\d{17,19}$/))
      .map(id => id as string);

    // Remove managed roles first
    const rolesToRemove = currentRoles.filter(role => managedRoleIds.includes(role.id));
    for (const role of rolesToRemove.values()) {
      try {
        await member.roles.remove(role);
        console.log(`Successfully removed role ${role.id} (${role.name}) from ${discordId}`);
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      } catch (error) {
        console.error(`Error removing role ${role.id}:`, error);
      }
    }

    // Add new roles in chunks
    const rolesToAdd = newRoles.filter(roleId => !currentRoles.has(roleId));
    for (let i = 0; i < rolesToAdd.length; i++) {
      try {
        await member.roles.add(rolesToAdd[i]);
        console.log(`Successfully added role ${rolesToAdd[i]} to ${discordId}`);
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      } catch (error) {
        console.error(`Error adding role ${rolesToAdd[i]}:`, error);
      }
    }

    // Get final role names for return value
    const finalMember = await guild.members.fetch(discordId);
    const roleNames = finalMember.roles.cache.map(role => role.name);

    return {
      added: rolesToAdd.map(id => guild.roles.cache.get(id)?.name || id),
      removed: rolesToRemove.map(role => role.name),
      previousRoles: currentRoles.map(role => role.name),
      newRoles: roleNames
    };

  } catch (error) {
    console.error('Error updating Discord roles:', error);
    throw error;
  }
} 